type FavoriteDragTarget = {
	id: number,
	placement: 'before' | 'after',
};

type CachedFavoriteRect = {
	id: number,
	top: number,
	bottom: number,
	height: number,
};

// [P3] Manual order of the favorites block, built on the same HTML5 drag events as the knowledge
// base list. Geometry only: the order itself belongs to the store, which owns the list and answers
// to the server (AC-072). Rows are addressed by the id of the favorites row, the same key the
// server uses in affectedPositions.
export class FavoriteDndService
{
	#dragState: Object;
	#store: Object;
	#cachedListElement: HTMLElement | null = null;
	#cachedRects: CachedFavoriteRect[] | null = null;
	#lastScrollTop: number = 0;
	#committed: boolean = false;

	constructor({ dragState, store }: { dragState: Object, store: Object })
	{
		this.#dragState = dragState;
		this.#store = store;
	}

	startDrag(row: Object, event: DragEvent): void
	{
		const id = Number(row?.id);
		if (!Number.isInteger(id) || id <= 0)
		{
			return;
		}

		this.#dragState.favoriteItem = { id };
		this.#dragState.favoriteTarget = null;
		this.#committed = false;
		this.#invalidateRectCache();

		const transfer = event.dataTransfer;
		if (transfer)
		{
			transfer.effectAllowed = 'move';
			transfer.setData('text/plain', String(id));
		}
	}

	onListDragOver(event: DragEvent): void
	{
		if (!this.#isOwnDrag())
		{
			return;
		}

		const listNode = event.currentTarget;
		if (!(listNode instanceof HTMLElement))
		{
			return;
		}

		event.preventDefault();
		if (this.#cachedListElement !== listNode)
		{
			this.#cacheListRects(listNode);
		}

		// The block scrolls inside itself rather than with the panel, so the cached rects go stale with
		// its own scroll position.
		if (listNode.scrollTop !== this.#lastScrollTop)
		{
			this.#lastScrollTop = listNode.scrollTop;
			this.#invalidateRectCache();
			this.#cacheListRects(listNode);
		}

		const target = this.#resolveGapTarget(event);
		if (!target)
		{
			return;
		}

		const current = this.#dragState.favoriteTarget;
		if (
			current
			&& Number(current.id) === Number(target.id)
			&& current.placement === target.placement
		)
		{
			return;
		}

		this.#dragState.favoriteTarget = target;
	}

	onListDrop(event: DragEvent): void
	{
		if (!this.#isOwnDrag())
		{
			return;
		}

		event.preventDefault();
		this.#tryCommitAndClear();
	}

	// A drag that ends anywhere but on the block moves nothing: the block is the only surface with a
	// drop target of its own, so there is no place outside it to commit to.
	endDrag(): void
	{
		this.clearDrag();
	}

	clearDrag(): void
	{
		this.#dragState.favoriteItem = null;
		this.#dragState.favoriteTarget = null;
		this.#invalidateRectCache();
	}

	invalidateDragRectCache(): void
	{
		this.#invalidateRectCache();
	}

	#isOwnDrag(): boolean
	{
		return Boolean(this.#dragState.favoriteItem)
			&& !this.#dragState.docItem
			&& !this.#dragState.collectionItem
		;
	}

	#tryCommitAndClear(): void
	{
		if (this.#committed)
		{
			this.clearDrag();

			return;
		}

		const dragItem = this.#dragState.favoriteItem;
		const target = this.#dragState.favoriteTarget;
		this.clearDrag();

		if (!dragItem || !target || dragItem.id === Number(target.id))
		{
			return;
		}

		this.#committed = true;
		void this.#store.actions.moveFavoriteRow(dragItem.id, Number(target.id), target.placement);
	}

	#cacheListRects(listNode: HTMLElement): void
	{
		if (this.#cachedListElement === listNode)
		{
			return;
		}

		// Top-level rows only (AC-032): the rows of an expanded branch are drawn by the tree and take
		// no part in the order of the block. A row of the block is the only thing .favorite-item ever
		// holds, so this says the same as a child selector without depending on how deep inside the
		// scrolling area the items are wrapped.
		const rowNodes = [...listNode.querySelectorAll('.favorite-item > .favorite-row')];
		this.#cachedRects = rowNodes.map((row) => {
			const rect = row.getBoundingClientRect();

			return {
				id: Number(row.dataset.favoriteRowId),
				top: rect.top,
				bottom: rect.bottom,
				height: rect.height,
			};
		});
		this.#cachedListElement = listNode;
	}

	#invalidateRectCache(): void
	{
		this.#cachedListElement = null;
		this.#cachedRects = null;
	}

	#resolveGapTarget(event: DragEvent): FavoriteDragTarget | null
	{
		const rects = this.#cachedRects;
		if (!rects || rects.length === 0)
		{
			return null;
		}

		const pointerY = event.clientY;

		if (pointerY <= rects[0].top)
		{
			return { id: rects[0].id, placement: 'before' };
		}

		if (pointerY >= rects[rects.length - 1].bottom)
		{
			return { id: rects[rects.length - 1].id, placement: 'after' };
		}

		for (let i = 0; i < rects.length; i++)
		{
			const { id, top, height } = rects[i];
			const midY = top + height / 2;

			if (pointerY < midY)
			{
				if (i === 0)
				{
					return { id, placement: 'before' };
				}

				return { id: rects[i - 1].id, placement: 'after' };
			}

			const nextTop = (i < rects.length - 1) ? rects[i + 1].top : null;
			if (nextTop === null || pointerY < nextTop)
			{
				return { id, placement: 'after' };
			}
		}

		return { id: rects[rects.length - 1].id, placement: 'after' };
	}
}
