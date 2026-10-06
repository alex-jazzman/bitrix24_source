import { ajax, Type } from 'main.core';

import { type TabConfig } from './catalog';
import { CatalogState, type CatalogStateValue } from './components/popup-state-dropdown';

export type CatalogItem = {
	id: number,
	title: string,
	description: string | null,
	isDescriptionDefault: boolean,
	iconUrl: string | null,
	editUrl: string | null,
	viewUrl: string | null,
	externalId: string | null,
	color: string | null,
	counter: number | null,
	isPinned: boolean,
	isHidden: boolean,
	isMine: boolean,
	isPublished: boolean,
	isNew: boolean,
	// set on the client when the item is opened from the catalog; the badge reads it, the
	// New slice does not
	isOpened?: boolean,
	canShare: boolean,
	ownerId: number,
	ownerName: string | null,
	kind: string,
	chatId: number | null,
};

type ActionOptions = {
	data: { [string]: any },
	navigation?: {
		page: number,
		size: number,
	},
};

export class TabController
{
	#config: TabConfig;
	#pageSize: number;
	#items: Array<CatalogItem> = [];
	#offset: number = 0;
	#hasMore: boolean = true;
	#loaded: boolean = false;
	#loading: boolean = false;
	#failed: boolean = false;
	#generation: number = 0;
	#query: string = '';
	#state: CatalogStateValue = CatalogState.Active;
	#viewSession: number | null = null;
	#newAppsCount: number | null = null;
	#openedIds: Set<number> = new Set();

	constructor(config: TabConfig, pageSize: number)
	{
		this.#config = config;
		this.#pageSize = pageSize;
	}

	isStub(): boolean
	{
		return this.#config.action === null;
	}

	getConfig(): TabConfig
	{
		return this.#config;
	}

	resortForPin(itemId: number): void
	{
		const idx = this.#items.findIndex((row) => row.id === itemId);
		if (idx < 0)
		{
			return;
		}

		const [picked] = this.#items.splice(idx, 1);

		if (picked.isPinned)
		{
			this.#items.unshift(picked);

			return;
		}

		const firstUnpinned = this.#items.findIndex((row) => !row.isPinned);
		if (firstUnpinned < 0)
		{
			this.#items.push(picked);

			return;
		}

		this.#items.splice(firstUnpinned, 0, picked);
	}

	isLoading(): boolean
	{
		return this.#loading;
	}

	isLoaded(): boolean
	{
		return this.#loaded;
	}

	hasFailed(): boolean
	{
		return this.#failed;
	}

	countNewItems(): number
	{
		return this.#items.filter((item) => item.isNew).length;
	}

	/**
	 * The New slice is a subset of the Active listing: when everything the server counted is
	 * already loaded, switching to it is a filter change and not another round to the server.
	 * Paging is over by definition: there is nothing new left beyond what is in hand.
	 */
	switchToLoadedNewSlice(): void
	{
		this.#state = CatalogState.New;
		this.#hasMore = false;
	}

	getItems(): Array<CatalogItem>
	{
		return this.#items.filter((item) => this.#matchesState(item));
	}

	getState(): CatalogStateValue
	{
		return this.#state;
	}

	setState(state: CatalogStateValue): void
	{
		// The view session belongs to the whole catalog session, not to a load cycle or to a
		// slice: dropping it here would restart the session on the way back to New and put
		// the apps just shown in another slice into it.
		this.#state = state;
	}

	getNewAppsCount(): number | null
	{
		return this.#newAppsCount;
	}

	reset(): void
	{
		this.#reset();
	}

	/**
	 * The badge of an opened app must stay off for the rest of the catalog session, but the
	 * item itself does not survive it: a slice change resets the list and a refresh replaces
	 * it with server copies, and the server keeps reporting the app as new until the session
	 * ends. So the ids live on the controller and outlive both.
	 */
	markOpened(itemId: number): void
	{
		if (!Number.isInteger(itemId) || itemId <= 0)
		{
			return;
		}

		this.#openedIds.add(itemId);

		const item = this.#items.find((row) => row.id === itemId);
		if (item)
		{
			item.isOpened = true;
		}
	}

	/**
	 * The catalog session is over. Everything the session owns goes with it: the view
	 * session, so the next opening asks the server for a fresh one instead of holding the
	 * apps it has already shown in the New slice, and the loaded list with its query, so
	 * the next opening loads the list anew instead of rendering what is left in memory.
	 */
	endViewSession(): void
	{
		this.#viewSession = null;
		this.#query = '';
		this.#openedIds.clear();
		this.#reset();
	}

	#matchesState(item: CatalogItem): boolean
	{
		if (this.#state === CatalogState.Hidden)
		{
			return item.isHidden;
		}

		if (this.#state === CatalogState.All)
		{
			return true;
		}

		if (this.#state === CatalogState.New)
		{
			return item.isNew;
		}

		return !item.isHidden;
	}

	hasQuery(): boolean
	{
		return this.#query !== '';
	}

	shouldLoadMore(): boolean
	{
		if (this.isStub() || this.#loading)
		{
			return false;
		}

		return !this.#loaded || this.#hasMore;
	}

	// whether the listing in hand is the whole thing, regardless of a load being in flight
	hasMorePages(): boolean
	{
		return this.#hasMore;
	}

	setQuery(query: string): void
	{
		if (query === this.#query)
		{
			return;
		}
		this.#query = query;
		this.#reset();
	}

	async loadNext(): Promise<void>
	{
		if (this.isStub() || this.#loading || (this.#loaded && !this.#hasMore))
		{
			return;
		}

		this.#loading = true;
		this.#failed = false;
		const generation = this.#generation;
		try
		{
			const actionOptions = this.#config.paginated === false
				? { data: this.#buildData() }
				: this.#buildPagedActionOptions();

			const sentSession = actionOptions.data?.viewSession ?? null;
			const response = await ajax.runAction(this.#config.action, actionOptions);

			if (generation !== this.#generation)
			{
				return;
			}

			this.#rememberViewSession(response?.data?.viewSession, sentSession);
			this.#rememberNewAppsCount(response?.data?.newAppsCount);

			const rawItems = response?.data?.items ?? [];
			const newItems = rawItems.map((raw: any) => this.#mapItem(raw));

			this.#appendPage(newItems);

			if (this.#config.paginated === false)
			{
				this.#hasMore = false;
			}
			else
			{
				this.#offset = this.#resolveNextOffset(response?.data?.pagination, newItems.length);
				this.#hasMore = this.#resolveHasMore(response?.data?.pagination, newItems.length);
			}

			this.#loaded = true;
		}
		catch (error)
		{
			if (generation === this.#generation)
			{
				this.#failed = true;
			}

			throw error;
		}
		finally
		{
			if (generation === this.#generation)
			{
				this.#loading = false;
			}
		}
	}

	async refresh(): Promise<boolean>
	{
		if (this.isStub())
		{
			return false;
		}

		const generation = ++this.#generation;
		this.#loading = true;
		this.#failed = false;
		try
		{
			const size = Math.max(this.#getPageSize(), this.#items.length);
			const actionOptions = this.#config.paginated === false
				? { data: this.#buildData() }
				: { data: this.#buildData(), navigation: { page: 1, size } };

			const sentSession = actionOptions.data?.viewSession ?? null;
			const response = await ajax.runAction(this.#config.action, actionOptions);

			if (generation !== this.#generation)
			{
				return false;
			}

			this.#rememberViewSession(response?.data?.viewSession, sentSession);
			this.#rememberNewAppsCount(response?.data?.newAppsCount);

			const rawItems = response?.data?.items ?? [];
			this.#items = this.#dedupePage(rawItems.map((raw: any) => this.#mapItem(raw)));

			if (this.#config.paginated === false)
			{
				this.#offset = 0;
				this.#hasMore = false;
			}
			else
			{
				// the server has served rawItems.length rows: paging moves by what it sent,
				// not by what is left after the duplicates are dropped
				this.#offset = this.#resolveNextOffset(response?.data?.pagination, rawItems.length);
				this.#hasMore = this.#resolveHasMore(response?.data?.pagination, rawItems.length);
			}

			this.#loaded = true;

			return true;
		}
		catch (error)
		{
			if (generation === this.#generation)
			{
				this.#failed = true;
			}

			console.error('[vibecodeconnector.catalog] failed to refresh tab', this.#config.id, error);

			return false;
		}
		finally
		{
			if (generation === this.#generation)
			{
				this.#loading = false;
			}
		}
	}

	/**
	 * Opening an app moves it in the server order, so a page loaded afterwards can bring an
	 * item the previous pages already had. The fresh copy wins - it carries the current pin,
	 * counter and novelty, but keeps its place in the list and the flags the client owns.
	 */
	#appendPage(newItems: Array<CatalogItem>): void
	{
		const positions = new Map();

		this.#items.forEach((item, index) => {
			// an item without an id is an anomaly of the response, not a duplicate of another
			if (item.id > 0)
			{
				positions.set(item.id, index);
			}
		});

		const appended = [];
		const appendedIds = new Set();

		for (const item of newItems)
		{
			if (item.id > 0 && appendedIds.has(item.id))
			{
				continue;
			}

			const position = item.id > 0 ? positions.get(item.id) : undefined;

			if (position === undefined)
			{
				appended.push(item);

				if (item.id > 0)
				{
					appendedIds.add(item.id);
				}

				continue;
			}

			const loaded = this.#items[position];

			this.#items[position] = { ...item, isOpened: loaded.isOpened === true ? true : item.isOpened };
		}

		this.#items = [...this.#items, ...appended];
	}

	#dedupePage(items: Array<CatalogItem>): Array<CatalogItem>
	{
		const seen = new Set();

		// an item without an id is an anomaly of the response, not a duplicate of another
		return items.filter((item) => {
			if (item.id <= 0 || !seen.has(item.id))
			{
				seen.add(item.id);

				return true;
			}

			return false;
		});
	}

	#reset(): void
	{
		this.#failed = false;
		this.#items = [];
		this.#offset = 0;
		this.#hasMore = true;
		this.#loaded = false;
		this.#loading = false;
		this.#generation += 1;
	}

	#rememberViewSession(value: mixed, sentSession: number | null): void
	{
		if (!Number.isInteger(value) || value <= 0)
		{
			return;
		}

		// A stamp we sent has been judged by the server: answering with another one means
		// ours is no longer accepted, so its value wins. An unsolicited stamp only fills an
		// empty slot - the listing that starts the session carries one whatever slice it
		// serves, while a later slice must not restart the session under the user.
		if (sentSession !== null || this.#viewSession === null)
		{
			this.#viewSession = value;
		}
	}

	#rememberNewAppsCount(value: mixed): void
	{
		if (Number.isInteger(value) && value >= 0)
		{
			this.#newAppsCount = value;
		}
	}

	#buildData(): { [string]: any }
	{
		const data = { ...this.#config.extraData, state: this.#state };
		if (this.#query !== '')
		{
			data.q = this.#query;
		}

		if (this.#state === CatalogState.New && this.#viewSession !== null)
		{
			data.viewSession = this.#viewSession;
		}

		return data;
	}

	#buildPagedActionOptions(): ActionOptions
	{
		const pageSize = this.#getPageSize();

		return {
			data: this.#buildData(),
			navigation: {
				page: Math.floor(this.#offset / pageSize) + 1,
				size: pageSize,
			},
		};
	}

	#resolveNextOffset(pagination: mixed, loadedItemsCount: number): number
	{
		if (!Type.isPlainObject(pagination))
		{
			return this.#offset + loadedItemsCount;
		}

		const responseOffset = this.#normalizeInteger(pagination.offset);

		return responseOffset + loadedItemsCount;
	}

	#resolveHasMore(pagination: mixed, loadedItemsCount: number): boolean
	{
		if (Type.isPlainObject(pagination) && Type.isBoolean(pagination.hasNext))
		{
			return pagination.hasNext;
		}

		return loadedItemsCount >= this.#getPageSize();
	}

	#normalizeInteger(value: mixed): number
	{
		if (Type.isNumber(value))
		{
			return Math.max(0, value);
		}

		if (Type.isString(value))
		{
			const parsed = Number.parseInt(value, 10);

			return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
		}

		return 0;
	}

	#getPageSize(): number
	{
		return Math.max(1, this.#pageSize);
	}

	#mapItem(raw: any): CatalogItem
	{
		const id = Type.isNumber(raw?.id) ? raw.id : Number.parseInt(raw?.id, 10) || 0;

		return {
			id,
			isOpened: this.#openedIds.has(id),
			title: Type.isString(raw?.title) ? raw.title : '',
			description: Type.isString(raw?.description) ? raw.description : null,
			isDescriptionDefault: Boolean(raw?.isDescriptionDefault),
			iconUrl: Type.isString(raw?.iconUrl) ? raw.iconUrl : null,
			editUrl: this.#normalizeUrl(raw?.editUrl ?? raw?.EDIT_URL),
			viewUrl: this.#normalizeUrl(raw?.viewUrl ?? raw?.VIEW_URL),
			externalId: Type.isString(raw?.externalId) ? raw.externalId : null,
			color: this.#normalizeColor(raw?.color ?? raw?.COLOR),
			counter: Type.isNumber(raw?.counter) ? raw.counter : null,
			isPinned: Boolean(raw?.isPinned),
			isHidden: Boolean(raw?.isHidden),
			isMine: Boolean(raw?.isMine),
			isPublished: Boolean(raw?.isPublished),
			isNew: Boolean(raw?.isNew),
			canShare: Type.isBoolean(raw?.canShare) ? raw.canShare : false,
			ownerId: Type.isNumber(raw?.ownerId) ? raw.ownerId : Number.parseInt(raw?.ownerId, 10) || 0,
			ownerName: Type.isStringFilled(raw?.ownerName) ? raw.ownerName : null,
			kind: Type.isString(raw?.kind) ? raw.kind : '',
			chatId: this.#normalizeChatId(raw?.chatId),
		};
	}

	#normalizeChatId(value: mixed): number | null
	{
		if (Type.isNumber(value) && value > 0)
		{
			return value;
		}

		if (Type.isString(value))
		{
			const parsed = Number.parseInt(value, 10);

			return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
		}

		return null;
	}

	#normalizeColor(value: mixed): string | null
	{
		if (!Type.isString(value))
		{
			return null;
		}

		return /^#[\dA-Fa-f]{6}$/.test(value) ? value : null;
	}

	#normalizeUrl(value: mixed): string | null
	{
		if (!Type.isString(value))
		{
			return null;
		}

		const normalized = value.trim();
		if (normalized === '')
		{
			return null;
		}

		if (normalized.startsWith('//'))
		{
			return null;
		}

		if (!/^[A-Za-z][\d+.A-Za-z-]*:/.test(normalized))
		{
			return normalized.startsWith('/') ? normalized : null;
		}

		try
		{
			const url = new URL(normalized);

			return ['http:', 'https:'].includes(url.protocol) ? normalized : null;
		}
		catch
		{
			return null;
		}
	}
}
