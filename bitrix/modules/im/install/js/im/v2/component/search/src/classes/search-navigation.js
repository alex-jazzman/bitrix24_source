import { type SearchResultItem } from 'im.v2.lib.search';

export const NavigationSection = Object.freeze({
	carousel: 'carousel',
	list: 'list',
});

export type NavigationSectionType = $Values<typeof NavigationSection>;

/**
 * Identity of an item of the traversal order is the pair (section, dialogId) and never the dialogId
 * alone: the same interlocutor may be present in the carousel and in the list at once.
 */
export type NavigationDescriptor = {
	section: NavigationSectionType,
	dialogId: string,
};

export type SearchResultsState = {
	showLatestSearchResult: boolean,
	// Composition of the carousel comes from the caller, and it is the only thing the order asks about the
	// carousel: the tiles that are on the screen are exactly the tiles that are here, and a carousel nobody
	// renders arrives as an empty composition. A separate visibility flag next to it would be a second
	// source of the same fact, free to disagree with the markup.
	carouselItems: string[],
	recentItems: SearchResultItem[],
	searchResult: SearchResultItem[],
};

function sameDescriptor(first: NavigationDescriptor, second: NavigationDescriptor): boolean
{
	return first.section === second.section && first.dialogId === second.dialogId;
}

function clamp(value: number, min: number, max: number): number
{
	return Math.min(Math.max(value, min), max);
}

function toCarouselDescriptors(dialogIds: string[]): NavigationDescriptor[]
{
	return dialogIds.map((dialogId: string) => ({ section: NavigationSection.carousel, dialogId }));
}

function toListDescriptors(items: SearchResultItem[]): NavigationDescriptor[]
{
	return items.map(({ dialogId }) => ({ section: NavigationSection.list, dialogId }));
}

/**
 * Traversal order of the search results: the index of a descriptor here is its data-nav-index.
 *
 * The branch is taken by `showLatestSearchResult`, the very value the template branches on, so the
 * order can never disagree with the rendered markup. On a whitespace-only query the user sees the
 * carousel and the recent list while `searchResult` is already empty, and the order follows the markup.
 */
export function buildOrder(state: SearchResultsState): NavigationDescriptor[]
{
	if (!state.showLatestSearchResult)
	{
		return toListDescriptors(state.searchResult);
	}

	return [...toCarouselDescriptors(state.carouselItems), ...toListDescriptors(state.recentItems)];
}

/**
 * Single keyboard cursor over the whole search results: exactly one item is active at any moment, or
 * none at all while the results are empty. The carousel is one row horizontally, the lists are one row
 * per item; the cursor stops at the bounds instead of wrapping around.
 *
 * Knows nothing about keys, Vue or the DOM - it only takes intents.
 */
export class SearchNavigationController
{
	#order: NavigationDescriptor[] = [];
	#activeIndex: ?number = null;
	// Standing on the anchor is where the cursor starts, not where the user put it: only a movement of
	// this visit makes the position a choice of the user's, and only a choice is worth preserving. A
	// choice whose item is gone from the results is not one either, so falling back to the anchor drops
	// this as much as starting over does.
	#isMoved: boolean = false;
	// The remembered tile the cursor left downwards, not a movement bound: clamping moveLeft/moveRight by
	// it would make the carousel impassable to the right (from the very first tile clamp(1, 0, 0) === 0).
	#carouselReturnIndex: number = 0;

	getActive(): ?NavigationDescriptor
	{
		return this.#activeIndex === null ? null : (this.#order[this.#activeIndex] ?? null);
	}

	getActiveIndex(): ?number
	{
		return this.#activeIndex;
	}

	/**
	 * Rebuild of the same query: server results arrived, the store changed. A cursor the user has moved holds
	 * on to its own item so the results do not jump under the user's fingers; a cursor with no item of its own
	 * -- an untouched one, or one whose item is gone from the new order -- takes the anchor, so the index never
	 * points past the array.
	 */
	setOrder(order: NavigationDescriptor[]): void
	{
		const ownItem = this.#isMoved ? this.getActive() : null;

		this.#order = order;

		if (this.#order.length === 0)
		{
			this.#activeIndex = null;
			this.#carouselReturnIndex = 0;

			return;
		}

		const ownItemIndex = this.#indexOfOwnItem(ownItem);

		// The cursor owns a position only while the item it was put on is still in the results: once that
		// item is gone the anchor it falls back to is no choice of the user's, and the next rebuild
		// re-anchors it the way it would an untouched one.
		this.#isMoved = ownItemIndex !== null;
		this.#activeIndex = ownItemIndex ?? this.#getAnchorIndex();
		this.#carouselReturnIndex = this.#clampToCarousel(this.#carouselReturnIndex);
		this.#rememberIfInCarousel();
	}

	/** Query changed or the search was just entered: the cursor starts over from its anchor. */
	reset(): void
	{
		this.#activeIndex = this.#getAnchorIndex();
		this.#carouselReturnIndex = 0;
		this.#isMoved = false;
	}

	moveDown(): void
	{
		if (this.#activeIndex === null)
		{
			return;
		}

		this.#isMoved = true;
		this.#activeIndex = this.#getIndexBelow(this.#activeIndex);
		this.#rememberIfInCarousel();
	}

	moveUp(): void
	{
		if (this.#activeIndex === null)
		{
			return;
		}

		this.#isMoved = true;
		this.#activeIndex = this.#getIndexAbove(this.#activeIndex);
		this.#rememberIfInCarousel();
	}

	moveLeft(): void
	{
		this.#moveAlongCarousel(-1);
	}

	moveRight(): void
	{
		this.#moveAlongCarousel(1);
	}

	moveToStart(): void
	{
		if (this.#activeIndex === null)
		{
			return;
		}

		this.#isMoved = true;
		this.#activeIndex = 0;
		this.#rememberIfInCarousel();
	}

	moveToEnd(): void
	{
		if (this.#activeIndex === null)
		{
			return;
		}

		this.#isMoved = true;
		this.#activeIndex = this.#getLastIndex();
		this.#rememberIfInCarousel();
	}

	// Post-operation of every movement: a tile is only ever reached by moving onto it, so by the time
	// the cursor leaves the carousel downwards the memory already points at the tile it left from.
	#rememberIfInCarousel(): void
	{
		if (this.#activeIndex !== null && this.#isInCarousel(this.#activeIndex))
		{
			this.#carouselReturnIndex = this.#activeIndex;
		}
	}

	#getIndexBelow(index: number): number
	{
		if (this.#isInCarousel(index))
		{
			// The carousel is a single row: down leaves it for the list, and stays put when there is none.
			return this.#getListFirstIndex() ?? index;
		}

		return Math.min(index + 1, this.#getLastIndex());
	}

	#getIndexAbove(index: number): number
	{
		const listFirstIndex = this.#getListFirstIndex();

		if (index === listFirstIndex && this.#hasCarousel())
		{
			return this.#carouselReturnIndex;
		}

		if (this.#isInCarousel(index))
		{
			return index;
		}

		return Math.max(index - 1, listFirstIndex ?? 0);
	}

	#moveAlongCarousel(step: number): void
	{
		if (this.#activeIndex === null || !this.#isInCarousel(this.#activeIndex))
		{
			return;
		}

		this.#isMoved = true;
		this.#activeIndex = this.#clampToCarousel(this.#activeIndex + step);
		this.#rememberIfInCarousel();
	}

	#clampToCarousel(index: number): number
	{
		const carouselLastIndex = this.#getCarouselLastIndex();

		return carouselLastIndex === null ? 0 : clamp(index, 0, carouselLastIndex);
	}

	/**
	 * Where a cursor with no item of its own stands: on the first row of the list, and on the head of the order
	 * only when the results hold no list at all. The mark is drawn on this item and Enter opens this item, so
	 * both answers are taken from here and cannot part ways. The carousel is left one step up: its tiles are
	 * reached by ArrowUp from the row the cursor starts on.
	 */
	#getAnchorIndex(): ?number
	{
		if (this.#order.length === 0)
		{
			return null;
		}

		return this.#getListFirstIndex() ?? 0;
	}

	#indexOfOwnItem(descriptor: ?NavigationDescriptor): ?number
	{
		if (!descriptor)
		{
			return null;
		}

		const index = this.#order.findIndex((item: NavigationDescriptor) => sameDescriptor(item, descriptor));

		return index === -1 ? null : index;
	}

	#isInCarousel(index: number): boolean
	{
		return this.#order[index]?.section === NavigationSection.carousel;
	}

	#hasCarousel(): boolean
	{
		return this.#getCarouselLastIndex() !== null;
	}

	#getCarouselLastIndex(): ?number
	{
		// The carousel always heads the order, so its tiles occupy the indexes 0..tilesCount - 1.
		const tilesCount = this.#order
			.filter((item: NavigationDescriptor) => item.section === NavigationSection.carousel)
			.length;

		return tilesCount === 0 ? null : tilesCount - 1;
	}

	#getListFirstIndex(): ?number
	{
		const index = this.#order.findIndex((item: NavigationDescriptor) => item.section === NavigationSection.list);

		return index === -1 ? null : index;
	}

	#getLastIndex(): number
	{
		return this.#order.length - 1;
	}
}
