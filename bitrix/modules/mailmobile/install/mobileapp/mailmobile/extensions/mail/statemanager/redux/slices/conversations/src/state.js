/**
 * @module mail/statemanager/redux/slices/conversations/src/state
 */
jn.define('mail/statemanager/redux/slices/conversations/src/state', (require, exports, module) => {
	/**
	 * The module is dependency free on purpose: the slice, its selectors and the unit suite of
	 * ALG-01 all consume the very transitions defined here.
	 */
	const ConversationPageMode = Object.freeze({
		FIRST: 'first',
		NEXT: 'next',
		SYNC: 'sync',
	});

	const GridItemType = Object.freeze({
		MESSAGE: 'message',
		DRAFT: 'draft',
		CONVERSATION: 'conversation',
	});

	const ConversationItemKind = Object.freeze({
		MESSAGE: 'message',
		DRAFT: 'draft',
	});

	const DRAFT_ID_PREFIX = 'd:';
	const MESSAGE_CHILD_ID_PREFIX = 'm:';
	const DRAFT_DIRECTION_OUTGOING = 2;

	/**
	 * @return {ConversationsSliceState}
	 */
	const createConversationState = () => ({
		ids: [],
		entities: {},
		contextKey: null,
		grouped: false,
		nextCursor: null,
		settings: {},
		expandedIds: [],
		childIdsByConversation: {},
		cursorByConversation: {},
		loadingByConversation: {},
		errorByConversation: {},
		incompleteByConversation: {},
		retryAvailableByConversation: {},
		remainingCountByConversation: {},
		childRecordsByConversation: {},
	});

	const stableCopy = (value) => {
		if (Array.isArray(value))
		{
			return value.map(stableCopy);
		}

		if (value && typeof value === 'object')
		{
			return Object.keys(value)
				.sort()
				.reduce((result, key) => {
					result[key] = stableCopy(value[key]);

					return result;
				}, {});
		}

		return value;
	};

	/**
	 * Identity of the grid page the conversation state belongs to: a change of any part of it
	 * invalidates loaded summaries, children and expanded rows.
	 *
	 * @param {ConversationContext} context
	 * @return {string}
	 */
	const buildConversationContextKey = (context = {}) => JSON.stringify(stableCopy({
		mailboxId: context.mailboxId ?? null,
		folderPath: context.folderPath ?? null,
		virtualFolderKey: context.virtualFolderKey ?? null,
		filterParams: context.filterParams ?? {},
		sort: context.sort ?? {},
		grouped: Boolean(context.grouped),
		settings: {
			enabled: Boolean(context.settings?.enabled),
			featureAvailable: Boolean(context.settings?.featureAvailable),
		},
	}));

	const resolveConversationMailboxId = (...candidates) => {
		for (const candidate of candidates)
		{
			const mailboxId = Number(candidate);
			if (Number.isFinite(mailboxId) && mailboxId > 0)
			{
				return Math.floor(mailboxId);
			}
		}

		return null;
	};

	/**
	 * @param {number|string} draftId
	 * @return {string}
	 */
	const toDraftGridId = (draftId) => `${DRAFT_ID_PREFIX}${draftId}`;

	/**
	 * Whether the row is addressed as a draft of a conversation page and not as a message.
	 *
	 * @param {number|string} gridId
	 * @return {boolean}
	 */
	const isDraftGridId = (gridId) => String(gridId ?? '').startsWith(DRAFT_ID_PREFIX);

	/**
	 * Numeric draft id behind a grid row id, both in the `d:{draftId}` and in the legacy plain form.
	 *
	 * @param {number|string} gridId
	 * @return {number|null}
	 */
	const parseDraftGridId = (gridId) => {
		const rawId = String(gridId ?? '');
		const draftId = Number(rawId.startsWith(DRAFT_ID_PREFIX) ? rawId.slice(DRAFT_ID_PREFIX.length) : rawId);

		return Number.isFinite(draftId) && draftId > 0 ? draftId : null;
	};

	const resetConversationRuntime = (state) => {
		state.expandedIds = [];
		state.childIdsByConversation = {};
		state.cursorByConversation = {};
		state.loadingByConversation = {};
		state.errorByConversation = {};
		state.incompleteByConversation = {};
		state.retryAvailableByConversation = {};
		state.remainingCountByConversation = {};
		state.childRecordsByConversation = {};
	};

	const clearConversations = (state) => {
		state.ids = [];
		state.entities = {};
		state.nextCursor = null;
		resetConversationRuntime(state);
	};

	const unique = (ids) => [...new Set(ids)];

	const getConversationId = (summary) => String(summary?.conversationId ?? summary?.id ?? '');
	const hasConversationVersionChanged = (previous, next) => Boolean(
		previous?.version
		&& next?.version
		&& previous.version !== next.version
	);

	const clearConversationChildren = (state, conversationId) => {
		const id = String(conversationId);
		state.childIdsByConversation[id] = [];
		state.cursorByConversation[id] = null;
		state.loadingByConversation[id] = false;
		state.errorByConversation[id] = null;
		state.incompleteByConversation[id] = false;
		state.retryAvailableByConversation[id] = false;
		state.remainingCountByConversation[id] = 0;
		state.childRecordsByConversation[id] = {};
	};

	const upsertSummary = (state, summary) => {
		const id = getConversationId(summary);
		if (id === '')
		{
			return;
		}

		const previous = state.entities[id];
		state.entities[id] = { ...previous, ...summary, id };
		if (!state.ids.includes(id))
		{
			state.ids.push(id);
		}
	};

	/**
	 * The draft row model of the plain drafts list: a draft is drawn from the row itself and never
	 * goes into the numeric message storage.
	 *
	 * @param {GridDraftView} draft
	 * @return {DraftRowModel}
	 */
	const adaptDraftToMessage = (draft = {}) => {
		const updatedAtTimestamp = Math.floor(Date.parse(draft.updatedAt) / 1000);

		return {
			id: draft.id,
			revision: draft.revision,
			isDraft: true,
			direction: DRAFT_DIRECTION_OUTGOING,
			to: (draft.recipients ?? []).map((recipient) => ({ customData: recipient })),
			from: draft.sender ? [{ customData: draft.sender }] : [],
			subject: draft.subject,
			abbreviatedText: draft.bodyPreview,
			date: Number.isFinite(updatedAtTimestamp) ? updatedAtTimestamp : 0,
			isRead: true,
			withAttachments: Number(draft.attachmentCount) > 0,
		};
	};

	/**
	 * The same draft row model addressed by the DTO-01 row id, so that a draft never shadows the
	 * message with the same numeric id.
	 *
	 * @param {GridItem} item
	 * @return {DraftRowModel}
	 */
	const adaptGridDraftItem = (item) => {
		const draft = item?.draft ?? {};

		return {
			...adaptDraftToMessage(draft),
			id: item?.id ?? toDraftGridId(draft.id),
			draftId: Number(draft.id),
		};
	};

	/**
	 * Splits a server page into the owners of its rows. An unknown row type of a newer server is
	 * dropped instead of reaching the message model as an undefined row.
	 *
	 * @param {GridItem[]} items
	 * @param {boolean} grouped
	 * @return {RoutedGridItems}
	 */
	const routeGridItems = (items = [], grouped = false) => {
		const routed = { messages: [], drafts: [], conversations: [] };

		items.forEach((item) => {
			if (!grouped)
			{
				routed.messages.push(item);

				return;
			}

			switch (item?.type)
			{
				case GridItemType.MESSAGE:
					if (item.message)
					{
						routed.messages.push(item.message);
					}
					break;

				case GridItemType.DRAFT:
					if (item.draft)
					{
						routed.drafts.push(adaptGridDraftItem(item));
					}
					break;

				case GridItemType.CONVERSATION:
					routed.conversations.push(item);
					break;

				default:
					break;
			}
		});

		return routed;
	};

	/**
	 * The row of the list for a single server item, together with the owner that draws it.
	 *
	 * @param {GridItem} item
	 * @param {boolean} grouped
	 * @return {{kind: string, row: object}|null} null for a row type this client does not know
	 */
	const routeGridItem = (item, grouped = false) => {
		const routed = routeGridItems([item], grouped);

		if (routed.conversations.length > 0)
		{
			return { kind: GridItemType.CONVERSATION, row: routed.conversations[0] };
		}

		if (routed.drafts.length > 0)
		{
			return { kind: GridItemType.DRAFT, row: routed.drafts[0] };
		}

		if (routed.messages.length > 0)
		{
			return { kind: GridItemType.MESSAGE, row: routed.messages[0] };
		}

		return null;
	};

	/**
	 * What a page of the grid means for the owners of its rows: messages for the numeric storage
	 * and, unless the page came from the cache, the response of the conversation list itself. A
	 * cached page describes no grid context of its own, so conversations keep the state of the
	 * server response they were built from.
	 *
	 * @param {ConversationListPayload & {isCache?: boolean}} response
	 * @return {{
	 *     messages: ServerMailMessage[],
	 *     drafts: DraftRowModel[],
	 *     conversationList: ConversationListPayload|null
	 * }}
	 */
	const planListResponse = ({
		contextKey = null,
		grouped = false,
		items = [],
		nextCursor = null,
		settings = {},
		isCache = false,
	} = {}) => {
		const routed = routeGridItems(items, grouped);

		return {
			messages: routed.messages,
			drafts: routed.drafts,
			conversationList: isCache
				? null
				: {
					contextKey,
					grouped,
					items,
					nextCursor,
					settings,
				},
		};
	};

	/**
	 * Whether the grid asks the server for conversations. The authority is the setting of the
	 * feature: the grouping of the previous response says nothing in drafts mode, where the plain
	 * list of drafts never reports it.
	 *
	 * @param {ConversationSettings} settings
	 * @return {boolean}
	 */
	const isConversationListEnabled = (settings = {}) => (
		settings.featureAvailable === true && settings.enabled !== false
	);

	/**
	 * A conversation page ends with its cursor, a plain page with a partial block of rows.
	 *
	 * @param {{grouped?: boolean, nextCursor?: string|null}} response
	 * @param {number} loadedCount rows the list has after the response
	 * @param {number} pageSize
	 * @return {boolean}
	 */
	const isGridPageFullyLoaded = (response, loadedCount, pageSize) => {
		if (response?.grouped !== true)
		{
			return loadedCount < pageSize;
		}

		return (response.nextCursor ?? null) === null;
	};

	/**
	 * Cursor of the next page: only a loaded conversation page is walked by the server cursor, and
	 * the first page always starts without one.
	 *
	 * @param {{blockPage?: number, grouped?: boolean, nextCursor?: string|null}} params
	 * @return {string|null}
	 */
	const resolveGridPageCursor = ({ blockPage = 1, grouped = false, nextCursor = null } = {}) => (
		blockPage > 1 && grouped ? (nextCursor ?? null) : null
	);

	/**
	 * ALG-01 onListResponse.
	 *
	 * @param {ConversationsSliceState} state
	 * @param {ConversationListPayload} payload
	 * @return {RoutedGridItems}
	 */
	const applyListResponse = (state, {
		contextKey,
		grouped = false,
		items = [],
		nextCursor = null,
		settings = {},
	} = {}) => {
		const routed = routeGridItems(items, grouped);
		const contextChanged = state.contextKey !== contextKey;

		if (contextChanged || !grouped)
		{
			clearConversations(state);
		}

		state.contextKey = contextKey ?? null;
		state.grouped = Boolean(grouped);
		state.nextCursor = nextCursor ?? null;
		state.settings = { ...settings };

		if (grouped)
		{
			routed.conversations.forEach((item) => {
				const id = getConversationId(item);
				if (hasConversationVersionChanged(state.entities[id], item))
				{
					clearConversationChildren(state, id);
				}

				upsertSummary(state, item);
			});
		}

		return routed;
	};

	/**
	 * Splits a DTO-02 page into child row ids and the payloads their existing owners expect.
	 *
	 * @param {ConversationItem[]} items
	 * @return {RoutedConversationItems}
	 */
	/**
	 * Display record of a nested row the expanded view draws: the actual folder or type, the search
	 * marker and the numeric target of the open handler travel with the child id.
	 *
	 * @param {ConversationItem} item
	 * @param {string} childId
	 * @param {DraftRowModel|null} draft
	 * @return {ConversationChildRecord}
	 */
	const toChildRecord = (item, childId, draft = null) => ({
		id: childId,
		kind: item.kind === ConversationItemKind.DRAFT ? ConversationItemKind.DRAFT : ConversationItemKind.MESSAGE,
		messageId: item.kind === ConversationItemKind.DRAFT ? 0 : Number(item.messageId),
		draftId: item.kind === ConversationItemKind.DRAFT ? Number(item.draftId) : 0,
		folder: item.folder ?? null,
		matched: item.matched === true,
		draft,
	});

	const routeConversationItems = (items = []) => {
		const result = {
			childIds: [],
			messageIds: [],
			draftIds: [],
			messages: [],
			drafts: [],
			records: {},
		};

		items.forEach((item) => {
			if (item?.kind === ConversationItemKind.MESSAGE && Number(item.messageId) > 0)
			{
				const messageId = Number(item.messageId);
				const childId = String(item.id || `${MESSAGE_CHILD_ID_PREFIX}${messageId}`);
				result.childIds.push(childId);
				result.messageIds.push(messageId);
				result.records[childId] = toChildRecord(item, childId);
				if (item.message)
				{
					result.messages.push(item.message);
				}

				return;
			}

			if (item?.kind === ConversationItemKind.DRAFT && Number(item.draftId) > 0)
			{
				const draftId = Number(item.draftId);
				const childId = String(item.id || toDraftGridId(draftId));
				const draftModel = item.draft ? adaptGridDraftItem(item) : null;
				result.childIds.push(childId);
				result.draftIds.push(draftId);
				if (draftModel)
				{
					result.drafts.push(draftModel);
				}
				result.records[childId] = toChildRecord(item, childId, draftModel);
			}
		});

		return result;
	};

	const setConversationLoading = (state, conversationId, loading = true) => {
		const id = String(conversationId);
		state.loadingByConversation[id] = Boolean(loading);
		if (loading)
		{
			state.errorByConversation[id] = null;
		}
	};

	/**
	 * ALG-01 onExpand and onLoadMore.
	 *
	 * @param {ConversationsSliceState} state
	 * @param {ConversationPagePayload} payload
	 * @return {RoutedConversationItems}
	 */
	const applyConversationPage = (state, {
		conversationId,
		items = [],
		nextCursor = null,
		incomplete = false,
		retryAvailable = false,
		remainingCount,
		version = null,
		mode = ConversationPageMode.FIRST,
	} = {}) => {
		const id = String(conversationId);
		const summaryVersion = state.entities[id]?.version ?? null;
		if (version && summaryVersion && version !== summaryVersion)
		{
			applyVersionMismatch(state, { conversationId: id });

			return routeConversationItems([]);
		}

		const routed = routeConversationItems(items);
		const currentIds = state.childIdsByConversation[id] ?? [];
		const preserveSyncPagination = mode === ConversationPageMode.SYNC && currentIds.length > 0;
		const currentCursor = state.cursorByConversation[id] ?? null;
		const currentRemainingCount = state.remainingCountByConversation[id] ?? 0;

		state.childRecordsByConversation[id] = {
			...(state.childRecordsByConversation[id] ?? {}),
			...routed.records,
		};

		if (mode === ConversationPageMode.NEXT)
		{
			state.childIdsByConversation[id] = unique([...currentIds, ...routed.childIds]);
		}
		else if (mode === ConversationPageMode.SYNC)
		{
			state.childIdsByConversation[id] = unique([...routed.childIds, ...currentIds]);
		}
		else
		{
			state.childIdsByConversation[id] = unique(routed.childIds);
			if (!state.expandedIds.includes(id))
			{
				state.expandedIds.push(id);
			}
		}

		state.cursorByConversation[id] = preserveSyncPagination ? currentCursor : (nextCursor ?? null);
		state.loadingByConversation[id] = false;
		state.errorByConversation[id] = null;
		state.incompleteByConversation[id] = Boolean(incomplete);
		state.retryAvailableByConversation[id] = Boolean(retryAvailable);

		if (preserveSyncPagination)
		{
			state.remainingCountByConversation[id] = currentRemainingCount;
		}
		else if (remainingCount !== undefined)
		{
			const remaining = Number(remainingCount);
			state.remainingCountByConversation[id] = Number.isFinite(remaining) && remaining > 0
				? Math.floor(remaining)
				: 0;
		}

		return routed;
	};

	/**
	 * @param {ConversationsSliceState} state
	 * @param {ConversationFailurePayload} payload
	 */
	const applyConversationFailure = (state, {
		conversationId,
		error,
		retryAvailable = true,
	} = {}) => {
		const id = String(conversationId);
		state.loadingByConversation[id] = false;
		state.errorByConversation[id] = error ?? null;
		state.retryAvailableByConversation[id] = Boolean(retryAvailable);
	};

	/**
	 * ALG-01 onVersionMismatch.
	 *
	 * @param {ConversationsSliceState} state
	 * @param {ConversationVersionPayload} payload
	 */
	const applyVersionMismatch = (state, { conversationId, summary } = {}) => {
		const id = String(conversationId);
		clearConversationChildren(state, id);
		if (summary)
		{
			upsertSummary(state, summary);
		}
	};

	/**
	 * ALG-01 onMailboxSync.
	 *
	 * @param {ConversationsSliceState} state
	 * @param {ConversationSyncPayload} params
	 * @return {RoutedConversationItems}
	 */
	const applyMailboxSync = (state, params = {}) => {
		if (params.summary)
		{
			const id = getConversationId(params.summary);
			const wasExpanded = state.expandedIds.includes(id);
			if (hasConversationVersionChanged(state.entities[id], params.summary))
			{
				clearConversationChildren(state, id);
			}

			upsertSummary(state, params.summary);
			if (wasExpanded && !state.expandedIds.includes(id))
			{
				state.expandedIds.push(id);
			}
		}

		return applyConversationPage(state, { ...params, mode: ConversationPageMode.SYNC });
	};

	/**
	 * @param {ConversationsSliceState} state
	 * @param {string} conversationId
	 * @return {boolean} whether the row had children to show at all
	 */
	const toggleConversation = (state, conversationId) => {
		const id = String(conversationId);
		if ((state.childIdsByConversation[id] ?? []).length === 0)
		{
			return false;
		}

		state.expandedIds = state.expandedIds.includes(id)
			? state.expandedIds.filter((expandedId) => expandedId !== id)
			: [...state.expandedIds, id]
		;

		return true;
	};

	/**
	 * Reducers of the conversations slice. They are declared here so that the very functions the
	 * slice runs are the ones covered by the unit suite of ALG-01.
	 *
	 * @return {ConversationReducers}
	 */
	const createConversationReducers = () => ({
		conversationListReceived: (state, { payload }) => {
			applyListResponse(state, payload);
		},
		conversationsCleared: () => createConversationState(),
		conversationLoadingChanged: (state, { payload }) => {
			setConversationLoading(state, payload.conversationId, payload.loading);
		},
		conversationPageReceived: (state, { payload }) => {
			applyConversationPage(state, payload);
		},
		conversationPageFailed: (state, { payload }) => {
			applyConversationFailure(state, payload);
		},
		conversationVersionMismatched: (state, { payload }) => {
			applyVersionMismatch(state, payload);
		},
		conversationMailboxSynchronized: (state, { payload }) => {
			applyMailboxSync(state, payload);
		},
		conversationToggled: (state, { payload }) => {
			toggleConversation(state, payload.conversationId);
		},
	});

	/**
	 * Selectors of the conversations slice over the state shape defined above. The slice keeps no
	 * entity adapter: its transitions have to stay free of dependencies, so the collection of
	 * summaries is maintained here and read back by these very selectors.
	 *
	 * @param {function(object): ConversationsSliceState} getSliceState
	 * @return {ConversationSelectors}
	 */
	const createConversationSelectors = (getSliceState) => {
		const selectIds = (state) => getSliceState(state).ids;
		const selectEntities = (state) => getSliceState(state).entities;
		const selectById = (state, conversationId) => getSliceState(state).entities[String(conversationId)] ?? null;
		const selectAll = (state) => {
			const { ids, entities } = getSliceState(state);

			return ids.map((id) => entities[id]).filter(Boolean);
		};
		const selectByConversation = (key, fallback) => (state, conversationId) => (
			getSliceState(state)[key][String(conversationId)] ?? fallback
		);

		return {
			selectAll,
			selectById,
			selectEntities,
			selectIds,
			selectTotal: (state) => getSliceState(state).ids.length,
			selectContextKey: (state) => getSliceState(state).contextKey,
			selectIsGrouped: (state) => getSliceState(state).grouped,
			selectNextCursor: (state) => getSliceState(state).nextCursor,
			selectSettings: (state) => getSliceState(state).settings,
			selectExpandedIds: (state) => getSliceState(state).expandedIds,
			selectIsConversationExpanded: (state, conversationId) => (
				getSliceState(state).expandedIds.includes(String(conversationId))
			),
			selectConversationChildren: selectByConversation('childIdsByConversation', []),
			selectConversationChildRecords: selectByConversation('childRecordsByConversation', {}),
			selectConversationCursor: selectByConversation('cursorByConversation', null),
			selectConversationRemainingCount: selectByConversation('remainingCountByConversation', 0),
			selectConversationChildRecord: (state, conversationId, childId) => (
				(getSliceState(state).childRecordsByConversation[String(conversationId)] ?? {})[String(childId)] ?? null
			),
			selectConversationError: selectByConversation('errorByConversation', null),
			selectConversationLoading: (state, conversationId) => Boolean(
				getSliceState(state).loadingByConversation[String(conversationId)],
			),
			selectConversationIncomplete: (state, conversationId) => Boolean(
				getSliceState(state).incompleteByConversation[String(conversationId)],
			),
			selectConversationRetryAvailable: (state, conversationId) => Boolean(
				getSliceState(state).retryAvailableByConversation[String(conversationId)],
			),
		};
	};

	module.exports = {
		ConversationItemKind,
		ConversationPageMode,
		GridItemType,
		adaptDraftToMessage,
		adaptGridDraftItem,
		applyConversationFailure,
		applyConversationPage,
		applyListResponse,
		applyMailboxSync,
		applyVersionMismatch,
		buildConversationContextKey,
		clearConversations,
		createConversationReducers,
		createConversationSelectors,
		createConversationState,
		isConversationListEnabled,
		isDraftGridId,
		isGridPageFullyLoaded,
		parseDraftGridId,
		planListResponse,
		resolveConversationMailboxId,
		resolveGridPageCursor,
		routeConversationItems,
		routeGridItem,
		routeGridItems,
		setConversationLoading,
		toDraftGridId,
		toggleConversation,
		upsertSummary,
	};
});
