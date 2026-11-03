import {
	type ComponentApiFailure,
	type ComponentApiIgnored,
	type ComponentApiOutcome,
	type LogItemPayload,
	type LogItemResult,
	type LogPayload,
	type LogResult,
	type TrustedComponentContent,
} from '../../infrastructure/service/component-api/component-api';

export type ThreadSide = 'before' | 'after';
export type ThreadLoadStatus = 'idle' | 'loading' | 'error';
export type ThreadDetailsStatus = 'empty' | 'loading' | 'ready' | 'error';

export type ThreadPair = {
	readonly id: number,
	readonly rowKey: string,
	readonly detailsKey: string,
};

export type ThreadItemState = {
	readonly pair: ThreadPair,
	readonly side: ThreadSide,
	expanded: boolean,
	detailsStatus: ThreadDetailsStatus,
	error: ComponentApiFailure | null,
	canRetry: boolean,
};

export type ThreadSideState = {
	readonly code: ThreadSide,
	hasMore: boolean,
	loadedCount: number,
	status: ThreadLoadStatus,
	error: ComponentApiFailure | null,
	canRetry: boolean,
	items: ThreadItemState[],
};

export type ThreadState = {
	readonly currentId: number,
	readonly pageSize: number,
	readonly before: ThreadSideState,
	readonly after: ThreadSideState,
	readonly hiddenIds: ReadonlySet<number>,
	readonly deletedIds: ReadonlySet<number>,
};

export type ThreadApi = {
	log(payload: LogPayload): Promise<ComponentApiOutcome<LogResult>>,
	logItem(payload: LogItemPayload): Promise<ComponentApiOutcome<LogItemResult>>,
};

export type ThreadLifecycle = {
	registerCleanup(action: () => void): () => void,
};

export type ThreadChangeListener = (state: Readonly<ThreadState>) => void;

export type ThreadOptions = {
	readonly currentId: number,
	readonly pageSize: number,
	readonly before: Readonly<{
		hasMore: boolean,
		loadedCount: number,
	}>,
	readonly after: Readonly<{
		hasMore: boolean,
		loadedCount: number,
	}>,
	readonly api: ThreadApi,
	readonly mailUfMessageToken?: string,
	readonly lifecycle?: ThreadLifecycle,
	readonly onChange?: ThreadChangeListener,
};

export type ThreadLoadSuccess = {
	status: 'success',
	side: ThreadSide,
	content: TrustedComponentContent,
	count: number,
};

export type ThreadLoadResult = ThreadLoadSuccess | ComponentApiFailure | ComponentApiIgnored | {
	status: 'busy' | 'exhausted',
	side: ThreadSide,
};

export type ThreadItemLoadSuccess = {
	status: 'success',
	id: number,
	content: TrustedComponentContent,
};

export type ThreadItemLoadResult = ThreadItemLoadSuccess | ComponentApiFailure | ComponentApiIgnored | {
	status: 'busy' | 'missing' | 'filtered',
	id: number,
};

export type ThreadCommitResult = {
	readonly side: ThreadSide,
	readonly insertedIds: readonly number[],
	readonly ignoredIds: readonly number[],
	readonly scrollAnchorDelta: number,
};

export type ThreadChronologyEntry =
	| { readonly kind: 'message', readonly item: ThreadItemState }
	| { readonly kind: 'current', readonly id: number };

export class Thread
{
	#api: ThreadApi;
	#mailUfMessageToken?: string;
	#state: ThreadState;
	#items = new Map<number, ThreadItemState>();
	#hiddenIds = new Set<number>();
	#deletedIds = new Set<number>();
	#onChange?: ThreadChangeListener;
	#destroyed = false;

	constructor(options: ThreadOptions)
	{
		this.#api = options.api;
		this.#mailUfMessageToken = options.mailUfMessageToken;
		this.#onChange = options.onChange;
		this.#state = {
			currentId: options.currentId,
			pageSize: options.pageSize,
			before: this.#createSide('before', options.before),
			after: this.#createSide('after', options.after),
			hiddenIds: this.#hiddenIds,
			deletedIds: this.#deletedIds,
		};
		options.lifecycle?.registerCleanup(() => this.destroy());
	}

	getState(): Readonly<ThreadState>
	{
		return this.#state;
	}

	getSnapshot(): ThreadState
	{
		return {
			currentId: this.#state.currentId,
			pageSize: this.#state.pageSize,
			before: this.#cloneSide(this.#state.before),
			after: this.#cloneSide(this.#state.after),
			hiddenIds: new Set(this.#hiddenIds),
			deletedIds: new Set(this.#deletedIds),
		};
	}

	getChronology(): readonly ThreadChronologyEntry[]
	{
		return [
			...this.#state.before.items.map((item) => ({ kind: 'message' as const, item })),
			{ kind: 'current', id: this.#state.currentId },
			...this.#state.after.items.map((item) => ({ kind: 'message' as const, item })),
		];
	}

	seed(side: ThreadSide, pairsInDisplayOrder: readonly ThreadPair[]): ThreadCommitResult
	{
		return this.#commit(side, pairsInDisplayOrder, false, 0, 0);
	}

	commitServerPage(
		side: ThreadSide,
		pairsInServerResponseOrder: readonly ThreadPair[],
		anchorBefore: number,
		anchorAfter: number,
	): ThreadCommitResult
	{
		return this.#commit(side, pairsInServerResponseOrder, true, anchorBefore, anchorAfter);
	}

	async loadSide(side: ThreadSide): Promise<ThreadLoadResult>
	{
		const state = this.#getSide(side);
		if (this.#destroyed)
		{
			return { status: 'ignored', generation: 0 };
		}

		if (state.status === 'loading')
		{
			return { status: 'busy', side };
		}

		if (!state.hasMore)
		{
			return { status: 'exhausted', side };
		}

		state.status = 'loading';
		state.error = null;
		state.canRetry = false;
		this.#notify();
		const outcome = await this.#api.log({
			id: this.#state.currentId,
			log: `${side === 'before' ? 'b' : 'a'}${state.loadedCount}`,
			size: this.#state.pageSize,
			...(this.#mailUfMessageToken ? { mail_uf_message_token: this.#mailUfMessageToken } : {}),
		});

		if (outcome.status === 'ignored' || this.#destroyed)
		{
			return outcome.status === 'ignored' ? outcome : { status: 'ignored', generation: 0 };
		}

		if (outcome.status === 'error')
		{
			state.status = 'error';
			state.error = outcome;
			state.canRetry = true;
			this.#notify();

			return outcome;
		}

		state.status = 'idle';
		state.loadedCount += outcome.data.count;
		state.hasMore = outcome.data.count >= this.#state.pageSize;
		this.#notify();

		return {
			status: 'success',
			side,
			content: outcome.data.content,
			count: outcome.data.count,
		};
	}

	retrySide(side: ThreadSide): Promise<ThreadLoadResult>
	{
		return this.loadSide(side);
	}

	async loadItem(id: number): Promise<ThreadItemLoadResult>
	{
		const item = this.#items.get(id);
		if (!item)
		{
			return { status: 'missing', id };
		}

		if (this.#isFiltered(id))
		{
			return { status: 'filtered', id };
		}

		if (item.detailsStatus === 'loading')
		{
			return { status: 'busy', id };
		}

		item.expanded = true;
		item.detailsStatus = 'loading';
		item.error = null;
		item.canRetry = false;
		this.#notify();
		const outcome = await this.#api.logItem({
			id,
			...(this.#mailUfMessageToken ? { mail_uf_message_token: this.#mailUfMessageToken } : {}),
		});

		if (outcome.status === 'ignored' || this.#destroyed)
		{
			return outcome.status === 'ignored' ? outcome : { status: 'ignored', generation: 0 };
		}

		const currentItem = this.#items.get(id);
		if (!currentItem || this.#isFiltered(id))
		{
			return { status: 'filtered', id };
		}

		if (outcome.status === 'error')
		{
			currentItem.detailsStatus = 'error';
			currentItem.error = outcome;
			currentItem.canRetry = true;
			this.#notify();

			return outcome;
		}

		currentItem.detailsStatus = 'ready';
		currentItem.error = null;
		currentItem.canRetry = false;
		this.#notify();

		return {
			status: 'success',
			id,
			content: outcome.data.content,
		};
	}

	retryItem(id: number): Promise<ThreadItemLoadResult>
	{
		return this.loadItem(id);
	}

	markItemLoadFailed(id: number, error: ComponentApiFailure): boolean
	{
		const item = this.#items.get(id);
		if (this.#destroyed || !item || this.#isFiltered(id))
		{
			return false;
		}

		item.expanded = true;
		item.detailsStatus = 'error';
		item.error = error;
		item.canRetry = true;
		this.#notify();

		return true;
	}

	toggleItem(id: number): 'expanded' | 'collapsed' | 'load' | 'missing'
	{
		const item = this.#items.get(id);
		if (!item)
		{
			return 'missing';
		}

		if (item.expanded)
		{
			item.expanded = false;
			this.#notify();

			return 'collapsed';
		}

		item.expanded = true;
		this.#notify();

		return item.detailsStatus === 'ready' ? 'expanded' : 'load';
	}

	markHidden(id: number): void
	{
		this.#hiddenIds.add(id);
		this.#removeItem(id);
		this.#notify();
	}

	markDeleted(id: number): void
	{
		this.#deletedIds.add(id);
		this.#removeItem(id);
		this.#notify();
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#onChange = undefined;
	}

	#createSide(
		code: ThreadSide,
		bootstrap: Readonly<{ hasMore: boolean, loadedCount: number }>,
	): ThreadSideState
	{
		return {
			code,
			hasMore: bootstrap.hasMore,
			loadedCount: bootstrap.loadedCount,
			status: 'idle',
			error: null,
			canRetry: false,
			items: [],
		};
	}

	#commit(
		side: ThreadSide,
		pairs: readonly ThreadPair[],
		reverseServerPage: boolean,
		anchorBefore: number,
		anchorAfter: number,
	): ThreadCommitResult
	{
		const orderedPairs = reverseServerPage ? [...pairs].reverse() : [...pairs];
		const insertedItems: ThreadItemState[] = [];
		const ignoredIds: number[] = [];
		orderedPairs.forEach((pair) => {
			if (pair.id === this.#state.currentId || this.#items.has(pair.id) || this.#isFiltered(pair.id))
			{
				ignoredIds.push(pair.id);

				return;
			}

			const item: ThreadItemState = {
				pair,
				side,
				expanded: false,
				detailsStatus: 'empty',
				error: null,
				canRetry: false,
			};
			this.#items.set(pair.id, item);
			insertedItems.push(item);
		});

		const state = this.#getSide(side);
		if (side === 'before' && reverseServerPage)
		{
			state.items.unshift(...insertedItems);
		}
		else
		{
			state.items.push(...insertedItems);
		}
		this.#notify();

		return {
			side,
			insertedIds: insertedItems.map((item) => item.pair.id),
			ignoredIds,
			scrollAnchorDelta: anchorAfter - anchorBefore,
		};
	}

	#getSide(side: ThreadSide): ThreadSideState
	{
		return side === 'before' ? this.#state.before : this.#state.after;
	}

	#isFiltered(id: number): boolean
	{
		return this.#hiddenIds.has(id) || this.#deletedIds.has(id);
	}

	#removeItem(id: number): void
	{
		const item = this.#items.get(id);
		if (!item)
		{
			return;
		}

		const side = this.#getSide(item.side);
		side.items = side.items.filter((candidate) => candidate.pair.id !== id);
		this.#items.delete(id);
	}

	#cloneSide(side: ThreadSideState): ThreadSideState
	{
		return {
			code: side.code,
			hasMore: side.hasMore,
			loadedCount: side.loadedCount,
			status: side.status,
			error: side.error,
			canRetry: side.canRetry,
			items: side.items.map((item) => ({
				pair: { ...item.pair },
				side: item.side,
				expanded: item.expanded,
				detailsStatus: item.detailsStatus,
				error: item.error,
				canRetry: item.canRetry,
			})),
		};
	}

	#notify(): void
	{
		this.#onChange?.(this.getSnapshot());
	}
}
