/**
 * @module mail/simple-list/items/conversation/src/conversation-loader
 */
jn.define('mail/simple-list/items/conversation/src/conversation-loader', (require, exports, module) => {
	const { ConversationPageMode } = require('mail/statemanager/redux/slices/conversations/src/state');

	/**
	 * Dependency free on purpose: this module carries the orchestration of API-02 expansion and the
	 * pure shaping of its DTO-02 items, and the unit suite covers the logic here. The
	 * side effects of a real expansion - the ajax call, the store dispatches and the redux read back -
	 * arrive as injected ports, so the module requires no native library, redux or ajax of its own.
	 * The only dependency is the dependency-free state module that owns the page mode contract.
	 */
	const CONVERSATION_ITEM_TEST_ID_PREFIX = 'mail-conversation-item';
	const CONVERSATION_LOAD_MORE_TEST_ID_PREFIX = 'mail-conversation-load-more';
	const CONVERSATION_ITEMS_WINDOW_SIZE = 20;

	const CONVERSATION_ITEM_KIND = Object.freeze({
		MESSAGE: 'message',
		DRAFT: 'draft',
	});

	const toPositiveInt = (value) => {
		const number = Number(value);

		return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
	};

	const buildConversationItemsWindow = (
		childIds,
		start = 0,
		limit = CONVERSATION_ITEMS_WINDOW_SIZE,
	) => {
		const ids = Array.isArray(childIds) ? childIds : [];
		const size = toPositiveInt(limit) || CONVERSATION_ITEMS_WINDOW_SIZE;
		const maxStart = Math.max(0, ids.length - size);
		const windowStart = Math.min(toPositiveInt(start), maxStart);
		const visibleIds = ids.slice(windowStart, windowStart + size);
		const hiddenOlderCount = Math.max(0, ids.length - windowStart - visibleIds.length);

		return {
			childIds: visibleIds,
			start: windowStart,
			hiddenNewerCount: windowStart,
			hiddenOlderCount,
			hasNewer: windowStart > 0,
			hasOlder: hiddenOlderCount > 0,
		};
	};

	/**
	 * API-02 request of a conversation page. The expansion is asked for with the very filter the list
	 * row was received with, so the composition version the server computes matches an unchanged
	 * composition and the row is not falsely reported stale.
	 *
	 * @param {{conversationId: string, cursor?: string|null, context?: object, limit?: number}} params
	 * @return {object}
	 */
	const buildConversationItemsRequest = ({ conversationId, cursor = null, context = {}, limit = 0 } = {}) => {
		const request = {
			conversationId: String(conversationId ?? ''),
			mailboxId: toPositiveInt(context.mailboxId),
			filterParams: context.filterParams ?? {},
			cursor: cursor ?? null,
		};

		if (context.virtualFolderKey !== null && context.virtualFolderKey !== undefined)
		{
			request.virtualFolderKey = context.virtualFolderKey;
		}

		if (context.sort)
		{
			request.sort = context.sort;
		}

		const nominalLimit = toPositiveInt(limit);
		if (nominalLimit > 0)
		{
			request.limit = nominalLimit;
		}

		return request;
	};

	/**
	 * DTO-02 response to a {@link ConversationPagePayload}. The server owns the page size, the order
	 * and the cursor, so nothing is trimmed, counted or reordered on the client: the exact remaining
	 * count and the opaque cursor are carried through as the response reports them.
	 *
	 * @param {object} response
	 * @param {{conversationId: string, mode?: string}} params
	 * @return {ConversationPagePayload & {remainingCount: number}}
	 */
	const toConversationPagePayload = (response = {}, { conversationId, mode = ConversationPageMode.FIRST } = {}) => ({
		conversationId: String(conversationId ?? response.conversationId ?? ''),
		items: Array.isArray(response.items) ? response.items : [],
		nextCursor: response.nextCursor ?? null,
		incomplete: response.incomplete === true,
		retryAvailable: response.retryAvailable === true,
		remainingCount: toPositiveInt(response.remainingCount),
		version: response.version ?? null,
		mode,
	});

	/**
	 * Identity of an in-flight page so that concurrent repeats of the same page join one request.
	 *
	 * @param {{conversationId: string, mode: string, cursor?: string|null}} params
	 * @return {string}
	 */
	const coalesceKey = ({ conversationId, mode, cursor = null } = {}) => (
		`${conversationId}|${mode}|${cursor ?? ''}`
	);

	async function runWithConcurrency(items, concurrency, callback)
	{
		let nextIndex = 0;
		let firstError = null;
		const worker = async () => {
			while (nextIndex < items.length)
			{
				const item = items[nextIndex];
				nextIndex += 1;

				try
				{
					await callback(item);
				}
				catch (error)
				{
					firstError ??= error;
				}
			}
		};
		const workerCount = Math.min(Math.max(1, concurrency), items.length);

		await Promise.all(Array.from({ length: workerCount }, worker));
		if (firstError !== null)
		{
			throw firstError;
		}
	}

	/**
	 * A DTO-02 child item to the display model of a nested row: the actual folder or type label, the
	 * numeric target the open handler addresses and the stable testIds.
	 *
	 * @param {ConversationItem} item
	 * @param {ConversationItemLabels} [labels]
	 * @param {{isMultiSelectMode?: boolean, selectedIds?: number[]}} [selection]
	 * @return {ConversationItemViewModel}
	 */
	const buildConversationItemViewModel = (item = {}, labels = {}, selection = {}) => {
		const isDraft = item.kind === CONVERSATION_ITEM_KIND.DRAFT;
		const messageId = isDraft ? 0 : toPositiveInt(item.messageId);
		const draftId = isDraft ? toPositiveInt(item.draftId) : 0;
		const id = String(item.id ?? (isDraft ? `d:${draftId}` : `m:${messageId}`));
		const folderName = typeof item.folder?.name === 'string' ? item.folder.name.trim() : '';
		const folderType = typeof item.folder?.type === 'string' ? item.folder.type.trim() : '';
		const folderPath = typeof item.folder?.path === 'string' ? item.folder.path.trim() : '';
		const typeLabels = labels.folderTypeLabels ?? {};
		const folderNamesByPath = labels.folderNamesByPath ?? {};
		const selectedIds = Array.isArray(selection.selectedIds) ? selection.selectedIds : [];

		return {
			id,
			testId: `${CONVERSATION_ITEM_TEST_ID_PREFIX}-${id}`,
			kind: isDraft ? CONVERSATION_ITEM_KIND.DRAFT : CONVERSATION_ITEM_KIND.MESSAGE,
			isDraft,
			messageId,
			draftId,
			folderLabel: folderNamesByPath[folderPath] ?? typeLabels[folderType] ?? folderName,
			isSelected: selection.isMultiSelectMode === true && selectedIds.includes(messageId),
		};
	};

	/**
	 * Drives the expansion of a single conversation row over API-02. It holds only the runtime a pure
	 * caller cannot: the pages currently in flight and the generation of the mounted grid. Every other
	 * decision is a pure function above, and every side effect is an injected port, so the class is
	 * unit-tested with fakes and drags no product module into the suite.
	 *
	 * Ports:
	 * - `runAction(request)`      performs API-02 and resolves with DTO-02;
	 * - `applyPage(payload)`      hands a loaded page to its redux owners;
	 * - `setLoading(id, loading)` marks the row loading;
	 * - `setFailure(payload)`     keeps the summary and the loaded items and allows a retry;
	 * - `toggleExpanded(id)`      expands or collapses a row whose children are already loaded;
	 * - `getConversationState(id)`reads `{ hasChildren, cursor, loading }` of the row;
	 * - `getRequestContext()`     the filter, mailbox and sort the list row was received with.
	 */
	class ConversationLoader
	{
		constructor({
			runAction,
			applyPage,
			setLoading = () => {},
			setFailure = () => {},
			toggleExpanded = () => {},
			getConversationState = () => ({}),
			getRequestContext = () => ({}),
			normalizeError = (error) => error ?? null,
			limit = 0,
		} = {})
		{
			this.runAction = runAction;
			this.applyPage = applyPage;
			this.setLoading = setLoading;
			this.setFailure = setFailure;
			this.toggleExpanded = toggleExpanded;
			this.getConversationState = getConversationState;
			this.getRequestContext = getRequestContext;
			this.normalizeError = normalizeError;
			this.limit = limit;
			this.pending = new Map();
			this.generation = 0;
			this.destroyed = false;
		}

		/**
		 * A first tap loads the last available items; a row whose children are already loaded is only
		 * expanded or collapsed, so a reopen never reloads the list.
		 */
		toggle = (conversationId) => {
			const id = String(conversationId);
			const state = this.getConversationState(id) ?? {};

			if (state.hasChildren)
			{
				this.toggleExpanded(id);

				return null;
			}

			return this.#load(id, ConversationPageMode.FIRST, null);
		};

		/**
		 * The next portion is walked by the opaque cursor; the end of the list carries no cursor.
		 */
		loadMore = (conversationId) => {
			const id = String(conversationId);
			const state = this.getConversationState(id) ?? {};

			if (state.loading || (state.cursor ?? null) === null)
			{
				return null;
			}

			return this.#load(id, ConversationPageMode.NEXT, state.cursor);
		};

		/**
		 * A retry after an error or an incomplete page re-asks the same portion: the next one when a
		 * cursor is held, the first one otherwise. The loaded items stay in place meanwhile.
		 */
		retry = (conversationId) => {
			const id = String(conversationId);
			const state = this.getConversationState(id) ?? {};
			const cursor = state.cursor ?? null;
			const mode = cursor === null ? ConversationPageMode.FIRST : ConversationPageMode.NEXT;

			return this.#load(id, mode, cursor);
		};

		/**
		 * A changed grid context must orphan every in-flight page before the previous conversations are
		 * cleared. The loader remains usable, so the new context can immediately request the same page.
		 */
		invalidate()
		{
			this.generation += 1;
			const conversationIds = new Set(
				[...this.pending.values()].map(({ conversationId }) => conversationId),
			);
			this.pending.clear();
			conversationIds.forEach((conversationId) => this.setLoading(conversationId, false));
		}

		/**
		 * After the grid is gone a late response must not touch the store.
		 */
		destroy()
		{
			this.destroyed = true;
			this.generation += 1;
			this.pending.clear();
		}

		#load(conversationId, mode, cursor)
		{
			const key = coalesceKey({ conversationId, mode, cursor });
			if (this.pending.has(key))
			{
				return this.pending.get(key).promise;
			}

			const generation = this.generation;
			this.setLoading(conversationId, true);

			const request = buildConversationItemsRequest({
				conversationId,
				cursor,
				context: this.getRequestContext() ?? {},
				limit: this.limit,
			});

			const promise = Promise.resolve()
				.then(() => this.runAction(request))
				.then((response) => {
					if (this.#isStale(generation))
					{
						return;
					}

					this.applyPage(toConversationPagePayload(response ?? {}, { conversationId, mode }));
				})
				.catch((error) => {
					if (this.#isStale(generation))
					{
						return;
					}

					this.setFailure({
						conversationId,
						error: this.normalizeError(error),
						retryAvailable: true,
					});
				})
				.finally(() => {
					if (this.pending.get(key)?.promise === promise)
					{
						this.pending.delete(key);
					}
				});

			this.pending.set(key, { conversationId, promise });

			return promise;
		}

		#isStale(generation)
		{
			return this.destroyed || generation !== this.generation;
		}
	}

	module.exports = {
		CONVERSATION_ITEM_KIND,
		CONVERSATION_ITEM_TEST_ID_PREFIX,
		CONVERSATION_ITEMS_WINDOW_SIZE,
		CONVERSATION_LOAD_MORE_TEST_ID_PREFIX,
		ConversationLoader,
		buildConversationItemsWindow,
		buildConversationItemsRequest,
		buildConversationItemViewModel,
		coalesceKey,
		runWithConcurrency,
		toConversationPagePayload,
	};
});
