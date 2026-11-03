/**
 * @module mail/message-grid/conversation
 */
jn.define('mail/message-grid/conversation', (require, exports, module) => {
	const {
		Conversation,
		ConversationLoader,
		buildConversationItemsRequest,
		refreshConversationRow,
		runWithConcurrency,
		toConversationPagePayload,
	} = require('mail/simple-list/items/conversation');
	const { ListItemType, ListItemsFactory } = require('mail/simple-list/items');
	const {
		ConversationPageMode,
		buildConversationContextKey,
		conversationListReceived,
		conversationLoadingChanged,
		conversationMailboxSynchronized,
		conversationPageFailed,
		conversationPageReceived,
		conversationsCleared,
		conversationToggled,
		conversationVersionMismatched,
		planListResponse,
		resolveGridPageCursor,
		routeConversationItems,
		routeGridItem,
	} = require('mail/statemanager/redux/slices/conversations');
	const {
		selectById,
		selectContextKey,
		selectConversationChildRecord,
		selectConversationChildren,
		selectConversationCursor,
		selectConversationLoading,
		selectExpandedIds,
		selectIds,
		selectIsGrouped,
		selectNextCursor,
	} = require('mail/statemanager/redux/slices/conversations/selector');
	const { mailsUpsertedFromServer } = require('mail/statemanager/redux/slices/messages');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');

	// The server owns the actual page size; this nominal limit is carried unchanged in API-02.
	const CONVERSATION_ITEMS_PAGE_LIMIT = 10;
	const EXPANDED_CONVERSATION_SYNC_CONCURRENCY = 3;

	class MessageGridConversationRuntime
	{
		constructor({ getRequestContext, loadItems, reload, updateItems, getState = () => store.getState() } = {})
		{
			this.getRequestContext = getRequestContext;
			this.loadItems = loadItems;
			this.reload = reload;
			this.updateItems = updateItems;
			this.getState = getState;
			this.rowRevision = 0;
			this.loader = this.#createLoader();

			ListItemsFactory.register(ListItemType.CONVERSATION, Conversation);
		}

		#createLoader()
		{
			return new ConversationLoader({
				limit: CONVERSATION_ITEMS_PAGE_LIMIT,
				runAction: (request) => this.loadItems(request),
				applyPage: (payload) => this.#applyPage(payload),
				setLoading: (conversationId, loading) => store.dispatch(
					conversationLoadingChanged({ conversationId, loading }),
				),
				setFailure: (payload) => store.dispatch(conversationPageFailed(payload)),
				toggleExpanded: (conversationId) => store.dispatch(conversationToggled({ conversationId })),
				getConversationState: (conversationId) => {
					const state = this.getState();

					return {
						hasChildren: selectConversationChildren(state, conversationId).length > 0,
						cursor: selectConversationCursor(state, conversationId),
						loading: selectConversationLoading(state, conversationId),
					};
				},
				getRequestContext: () => this.getRequestContext(),
			});
		}

		buildListPlan(params)
		{
			const plan = planListResponse(params);

			return {
				...plan,
				conversationAction: plan.conversationList === null
					? null
					: conversationListReceived(plan.conversationList),
			};
		}

		buildContextKey(context)
		{
			return buildConversationContextKey(context);
		}

		routeGridItem(item)
		{
			return routeGridItem(item, true);
		}

		isGrouped()
		{
			return selectIsGrouped(this.getState());
		}

		getNextCursor()
		{
			return selectNextCursor(this.getState());
		}

		getExpandedIds()
		{
			return selectExpandedIds(this.getState());
		}

		resolvePageCursor(blockPage)
		{
			return resolveGridPageCursor({
				blockPage,
				grouped: this.isGrouped(),
				nextCursor: this.getNextCursor(),
			});
		}

		filterTopLevelAddedMessages(messages = [])
		{
			const state = this.getState();
			if (!this.isGrouped() || messages.length === 0)
			{
				return messages;
			}

			const childMessageIds = new Set();
			selectIds(state).forEach((conversationId) => {
				selectConversationChildren(state, conversationId).forEach((childId) => {
					const child = selectConversationChildRecord(state, conversationId, childId);
					if (child?.kind === 'message' && Number(child.messageId) > 0)
					{
						childMessageIds.add(Number(child.messageId));
					}
				});
			});

			return messages.filter(({ id }) => !childMessageIds.has(Number(id)));
		}

		async toggle(conversationId)
		{
			await this.loader.toggle(conversationId);

			return refreshConversationRow({
				conversationId,
				revision: ++this.rowRevision,
				getSummary: (id) => selectById(this.getState(), id),
				updateItems: this.updateItems,
			});
		}

		retry(conversationId)
		{
			return this.loader.retry(conversationId);
		}

		loadMore(conversationId)
		{
			return this.loader.loadMore(conversationId);
		}

		#applyPage(payload)
		{
			const conversationId = String(payload?.conversationId ?? '');
			const summary = selectById(this.getState(), conversationId);
			if (payload?.version && summary?.version && payload.version !== summary.version)
			{
				store.dispatch(conversationVersionMismatched({ conversationId }));
				this.reload({ skipUseCache: true });

				return;
			}

			this.#dispatchPage(payload, conversationPageReceived(payload));
		}

		#dispatchPage(payload, conversationAction)
		{
			const routed = routeConversationItems(payload?.items);
			const actions = [];

			if (routed.messages.length > 0)
			{
				actions.push(mailsUpsertedFromServer(routed.messages));
			}

			actions.push(conversationAction);
			store.dispatch(batchActions(actions));
		}

		applyPage(payload)
		{
			this.#dispatchPage(payload, conversationPageReceived(payload));
		}

		applySync(payload)
		{
			this.#dispatchPage(payload, conversationMailboxSynchronized(payload));
		}

		async syncExpanded(conversationIds = [])
		{
			const uniqueIds = [...new Set(conversationIds.map(String))];

			await runWithConcurrency(
				uniqueIds,
				EXPANDED_CONVERSATION_SYNC_CONCURRENCY,
				(conversationId) => this.#syncExpanded(conversationId),
			);
		}

		async #syncExpanded(conversationId)
		{
			const state = this.getState();
			const summary = selectById(state, conversationId);
			if (!summary)
			{
				return;
			}

			const contextKey = selectContextKey(state);
			const request = buildConversationItemsRequest({
				conversationId,
				context: this.getRequestContext(),
				limit: CONVERSATION_ITEMS_PAGE_LIMIT,
			});
			const response = await this.loadItems(request, 'mailbox sync');
			const currentState = this.getState();

			if (selectContextKey(currentState) !== contextKey || !selectById(currentState, conversationId))
			{
				return;
			}

			const payload = {
				...toConversationPagePayload(response, {
					conversationId,
					mode: ConversationPageMode.SYNC,
				}),
				summary: selectById(currentState, conversationId),
			};

			this.#dispatchPage(payload, conversationMailboxSynchronized(payload));
		}

		invalidate({ clear = false } = {})
		{
			this.loader.invalidate();
			if (clear)
			{
				store.dispatch(conversationsCleared());
			}
		}

		destroy()
		{
			this.loader.destroy();
		}
	}

	module.exports = { EXPANDED_CONVERSATION_SYNC_CONCURRENCY, MessageGridConversationRuntime };
});
