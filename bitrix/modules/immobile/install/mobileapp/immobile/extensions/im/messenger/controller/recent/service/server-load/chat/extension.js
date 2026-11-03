/**
 * @module im/messenger/controller/recent/service/server-load/chat
 */
jn.define('im/messenger/controller/recent/service/server-load/chat', (require, exports, module) => {
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');

	const { MessengerInitRestMethod, DialogType, NavigationTabId, RecentFilterId } = require('im/messenger/const');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { RecentRest } = require('im/messenger/provider/rest');
	const { ShareDialogCache } = require('im/messenger/cache');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { PaginationState } = require('im/messenger/controller/recent/service/pagination/lib/state');
	const { ServerLoadUtils } = require('im/messenger/controller/recent/service/server-load/lib/utils');

	// The module default stays off, and that is what bounds the write radius: the forward selector and
	// the chat selector for an attachment build this service directly, on the section of the main list,
	// with no filter service and no request context - flipping this constant would enable the pass
	// there too. The chats tab enables it through `convergenceEnabled` in its config props instead.
	// Before this constant may be turned on, two things still have to hold: the refresh handler is
	// guaranteed to process the response of its own request, and the journal of the pass has been read
	// on an account with open lines, task chats and hidden dialog types - there an absent element means
	// "invisible for this slice", not "gone".
	const IS_CONVERGENCE_ENABLED = false;

	// The tab lists none of these types and the server page carries none of them either, so their
	// rows are never candidates. Mirrors the database filter of the chats tab config.
	const CONVERGENCE_EXCEPT_DIALOG_TYPES = [DialogType.lines, DialogType.comment, DialogType.tasksTask];

	// With boundary = null the stale set can be the whole section, so the journal keeps only a head
	// of it; its size travels in the `removed` field of the same record.
	const CONVERGENCE_LOG_STALE_IDS_LIMIT = 20;

	/**
	 * @implements {IServerLoadService}
	 * @class ChatServerLoadService
	 */
	class ChatServerLoadService extends BaseRecentService
	{
		/**
		 * Context each init request went out with, keyed by the response that request produced.
		 * Convergence keys off it, so it belongs to the response and not to the service: two first-page
		 * requests overlap as soon as the filter is switched twice, and nothing serializes, dedupes or
		 * cancels them, so the response of the first lands after the options of the second are built.
		 *
		 * @type {WeakMap<object, ServerLoadRequestContext>}
		 */
		#requestContextByInitResult = new WeakMap();

		/**
		 * @param {RecentLocator} recentLocator
		 * @param {string} serviceId
		 * @param {any} props
		 */
		constructor(recentLocator, serviceId, props)
		{
			super(recentLocator, serviceId, props);

			this.shareDialogCache = new ShareDialogCache();
		}

		onInit()
		{
			this.logger.log('onInit');

			/** @type {IFilterService} */
			this.filterService = this.recentLocator.has('filter')
				? this.recentLocator.get('filter')
				: null;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return string
		 */
		getInitRequestMethod(mode)
		{
			this.logger.log(`getInitRequestMethod mode:${mode} methods:`, MessengerInitRestMethod.chatsList);

			return MessengerInitRestMethod.chatsList;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {ServerLoadRequestContext} [context]
		 * @return {object}
		 */
		getInitRequestOptions(mode, { currentFilterId } = {})
		{
			return currentFilterId === RecentFilterId.unread ? { unreadOnly: 'Y' } : {};
		}

		/**
		 * Ties the context of a request to the very response it produced, so the convergence
		 * precondition reads the filter of the page it is given and never the filter of the request
		 * built last. Called by the owner of the request right before it hands the response over; not
		 * part of `IServerLoadService`, because only this service keys off the context.
		 *
		 * @param {immobileTabChatsLoadResultV2} initResult
		 * @param {ServerLoadRequestContext|null} context
		 */
		bindInitResultContext(initResult, context)
		{
			if (Type.isPlainObject(initResult) && Type.isPlainObject(context))
			{
				this.#requestContextByInitResult.set(initResult, context);
			}
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @returns {IPaginationService|null}
		 */
		get paginationService()
		{
			return this.recentLocator.get('pagination') ?? null;
		}

		/**
		 * @returns {IRenderService|null}
		 */
		get renderService()
		{
			return this.recentLocator.get('render') ?? null;
		}

		/**
		 * @return {boolean}
		 */
		get isConvergenceEnabled()
		{
			return this.props.convergenceEnabled ?? IS_CONVERGENCE_ENABLED;
		}

		/**
		 * @return {Promise<LoadNextPageResult>}
		 */
		async loadNextPage()
		{
			this.logger.log('loadNextPage');

			const currentLastItem = this.paginationService?.getLastItem(PaginationState.SERVER_SOURCE);
			if (!currentLastItem)
			{
				this.logger.error('loadNextPage currentLastItem is invalid, load aborted', currentLastItem);
				throw new Error('loadNextPage currentLastItem is invalid, load aborted');
			}

			const restOptions = this.getRestListOptions(currentLastItem);
			const resultRequestData = await this.createRequest(restOptions);
			await this.processResult(resultRequestData);
			const newLastItem = ServerLoadUtils.getLastItem(resultRequestData.items, this.logger);

			this.hideLoaderByNextPageResult(resultRequestData);

			return {
				hasMore: resultRequestData.hasMore,
				lastItem: newLastItem,
			};
		}

		/**
		 * @param {immobileTabChatsLoadResultChatsList|imV2RecentChatsResult} result
		 */
		showLoaderByRestResult(result)
		{
			if (result.hasMorePages || result.hasMore)
			{
				this.renderService?.showLoader();
			}
		}

		/**
		 * @param {imV2RecentChatsResult} result
		 */
		hideLoaderByNextPageResult(result)
		{
			if (!result.hasMorePages && !result.hasMore)
			{
				this.renderService?.hideLoader();
			}
		}

		/**
		 * @param {RecentItemData} lastItem
		 * @return {RecentListRestOptions}
		 */
		getRestListOptions(lastItem)
		{
			const lastActivityDate = lastItem.date_last_activity ?? lastItem.message.date;
			const enabledFilter = {};

			if (this.filterService?.hasSelectedFilter())
			{
				enabledFilter[this.filterService.getCurrentFilterId()] = true;
			}

			return {
				skipOpenlines: true,
				onlyCopilot: false,
				withCounters: false,
				lastActivityDate,
				...enabledFilter,
			};
		}

		/**
		 * @param {RecentListRestOptions} restOptions
		 * @return {imV2RecentChatsResult}
		 */
		async createRequest(restOptions)
		{
			try
			{
				this.logger.log('createRequest the remaining rest options are formed, request...', restOptions);
				const resultRequest = await RecentRest.getList(restOptions);
				this.logger.log('createRequest result data:', resultRequest.data());

				return resultRequest.data();
			}
			catch (error)
			{
				this.logger.error(error);

				return Promise.reject(error);
			}
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {immobileTabChatsLoadResultV2} initResult
		 * @return {Promise<void>}
		 */
		async handleInitResult(mode, initResult)
		{
			this.logger.log('handleInitResult:', mode, initResult);

			if (!initResult || !Type.isPlainObject(initResult) || !Type.isArray(initResult.chatsList?.items))
			{
				const errorMsg = `handleInitResult: invalid initResult structure for mode "${mode}"`;
				this.logger.error(errorMsg, initResult);

				return;
			}

			try
			{
				const requestContext = this.#requestContextByInitResult.get(initResult) ?? null;

				await this.processResult(initResult.chatsList, true, requestContext);
				this.setPaginationState(initResult.chatsList);
			}
			catch (error)
			{
				this.logger.error('handleInitResult: processResult catch:', error);
			}
		}

		/**
		 * @param {immobileTabChatsLoadResultChatsList|imV2RecentChatsResult} recentData
		 * @param {boolean} [firstPage]
		 * @param {ServerLoadRequestContext|null} [requestContext] context the page was requested with
		 * @return {Promise<void>}
		 */
		async processResult(recentData, firstPage = false, requestContext = null)
		{
			if (!recentData || !Type.isArray(recentData.items))
			{
				const errorMsg = 'processResult: invalid recentData structure';
				this.logger.error(errorMsg, recentData);

				return;
			}

			const modelData = this.prepareDataForModels(recentData);

			try
			{
				const dispatches = [
					this.store.dispatch('usersModel/set', modelData.users),
					this.store.dispatch('dialoguesModel/set', modelData.dialogues),
					this.store.dispatch('dialoguesModel/copilotModel/setCollection', modelData.copilot),
				];

				// Use set (DB write) so the source chat resolves on cold start; it does not mark
				// wasCompletelySync, so opening that chat still triggers a full server load.
				if (modelData.nestedDialogues.length > 0)
				{
					dispatches.push(
						this.store.dispatch('dialoguesModel/set', modelData.nestedDialogues),
					);
				}

				await Promise.all(dispatches);

				const recentAction = firstPage ? 'recentModel/setFirstPageByRecentSection' : 'recentModel/setChat';
				await this.store.dispatch(
					recentAction,
					{
						recentSection: this.recentLocator.get('recentSection'),
						itemList: modelData.recent,
						parentChatId: this.recentLocator.get('parentChatId'),
					},
				);

				const section = this.recentLocator.get('recentSection');
				const dialogIds = modelData.recent.map((item) => String(item.id));
				// The response asserts membership in this tab's section only: the sections a dialog has
				// on nested levels and in folders come from sync and pull, so they must survive here.
				await serviceLocator.get('core').getRepository().recent
					.ensureSectionForDialogIds(dialogIds, section);

				this.#saveShareDialogCache();
				this.showLoaderByRestResult(recentData);

				if (firstPage)
				{
					await this.#convergeLocalStateWithServerPage(recentData, section, requestContext);
				}
			}
			catch (error)
			{
				this.logger.error('processResult: dispatch failed', error);
			}
		}

		/**
		 * Brings the local rows of the responding slice to the state of the first-page response: rows
		 * the window covers and the response misses are deleted, rows present in the response get its
		 * pinned flag, and rows the response misses lose theirs. Runs only when the switch is on.
		 *
		 * @param {immobileTabChatsLoadResultChatsList|imV2RecentChatsResult} recentData
		 * @param {string} section
		 * @param {ServerLoadRequestContext|null} requestContext
		 * @return {Promise<void>}
		 */
		async #convergeLocalStateWithServerPage(recentData, section, requestContext)
		{
			if (!this.isConvergenceEnabled)
			{
				this.logger.info('recent-convergence', {
					section,
					parentChatId: this.recentLocator.get('parentChatId') ?? null,
					skipped: 'the convergence is disabled',
				});

				return;
			}

			const filteredPageReason = this.#getFilteredPageReason(requestContext);
			if (filteredPageReason)
			{
				this.logger.info('recent-convergence', {
					section,
					parentChatId: this.recentLocator.get('parentChatId') ?? null,
					skipped: filteredPageReason,
				});

				return;
			}

			if (!Type.isArrayFilled(recentData.items))
			{
				return;
			}

			try
			{
				const hasMorePages = Boolean(recentData.hasMorePages || recentData.hasMore);
				const boundary = hasMorePages ? this.#resolveCursorActivityDate(recentData.items) : null;
				if (hasMorePages && !boundary)
				{
					this.logger.warn('convergeLocalStateWithServerPage: a page with a tail carries no cursor date');

					return;
				}

				const parentChatId = this.recentLocator.get('parentChatId') ?? null;
				const repository = serviceLocator.get('core').getRepository().recent;
				// the read is narrowed to the rows a verdict can be reached about: with a tail the page
				// says nothing about the section beyond its window, so the whole section is read only
				// when the server confirmed there is no next page
				const rows = await repository.getSectionRowStates({
					section,
					parentChatId,
					exceptDialogTypes: CONVERGENCE_EXCEPT_DIALOG_TYPES,
					boundary,
					dialogIds: recentData.items.map((item) => String(item.id)),
				});

				const { staleIds, pinnedIds, unpinnedIds } = this.#splitSectionRows(rows, recentData.items, boundary);

				this.logger.info('recent-convergence', {
					section,
					parentChatId,
					boundary: boundary?.toISOString() ?? null,
					rows: rows.length,
					removed: staleIds.length,
					staleIds: staleIds.slice(0, CONVERGENCE_LOG_STALE_IDS_LIMIT),
					pinned: pinnedIds.length,
					unpinned: unpinnedIds.length,
					convergenceEnabled: this.isConvergenceEnabled,
				});

				await Promise.all([
					repository.setPinnedByIds(pinnedIds, true),
					repository.setPinnedByIds(unpinnedIds, false),
				]);

				await repository.deleteByIds(staleIds);
			}
			catch (error)
			{
				this.logger.error('convergeLocalStateWithServerPage failed', error);
			}
		}

		/**
		 * Convergence reads the local slice with no filter applied, so it may only be run against a
		 * response that covers that whole slice. A filtered page is not such a response: the unread
		 * filter drops every read chat, pinned ones included, and their absence would be read as "no
		 * longer pinned" and as a deletion candidate. A page asserts nothing about what it never listed.
		 *
		 * @param {ServerLoadRequestContext|null} requestContext
		 * @return {string|null} why the page is filtered, null when it covers the slice
		 */
		#getFilteredPageReason(requestContext)
		{
			const requestFilterId = requestContext?.currentFilterId;
			if (Type.isStringFilled(requestFilterId) && requestFilterId !== RecentFilterId.all)
			{
				return `the page was requested with the filter ${requestFilterId}`;
			}

			// the request may have gone out unfiltered and the filter been applied while it flew
			if (this.filterService?.hasSelectedFilter())
			{
				return 'a filter is applied to the tab';
			}

			return null;
		}

		/**
		 * The window boundary is the cursor of the next page: the activity date of the last item in
		 * server order, the very one `getRestListOptions` sends back. Not the minimum of the response
		 * dates - the page comes sorted pinned first, so a pinned chat with old activity would drop
		 * the boundary below the cursor and pull rows of the next page into the window.
		 *
		 * @param {Array<RecentItemData>} items
		 * @return {Date|null}
		 */
		#resolveCursorActivityDate(items)
		{
			const cursorItem = ServerLoadUtils.getLastItem(items, this.logger);

			return DateHelper.cast(cursorItem?.date_last_activity ?? cursorItem?.message?.date, null);
		}

		/**
		 * @param {Array<{id: string, pinned: boolean, lastActivityDate: Date|null}>} rows
		 * @param {Array<RecentItemData>} items
		 * @param {Date|null} boundary
		 * @return {{staleIds: Array<string>, pinnedIds: Array<string>, unpinnedIds: Array<string>}}
		 */
		#splitSectionRows(rows, items, boundary)
		{
			const serverIds = new Set();
			const serverPinnedById = new Map();
			items.forEach((item) => {
				const dialogId = String(item.id);
				serverIds.add(dialogId);

				if (Type.isBoolean(item.pinned))
				{
					serverPinnedById.set(dialogId, item.pinned);
				}
			});

			const staleIds = [];
			const pinnedIds = [];
			const unpinnedIds = [];

			rows.forEach(({ id, pinned, lastActivityDate }) => {
				if (!serverIds.has(id))
				{
					// Every pinned chat is in the first page, so absence from the response asserts
					// "no longer pinned" - but not "gone": the row may have moved to the next page by
					// date, and only the window decides whether it still exists.
					if (pinned)
					{
						unpinnedIds.push(id);
					}

					if (this.#isInsideWindow(lastActivityDate, boundary))
					{
						staleIds.push(id);
					}

					return;
				}

				if (!serverPinnedById.has(id) || serverPinnedById.get(id) === pinned)
				{
					return;
				}

				if (serverPinnedById.get(id))
				{
					pinnedIds.push(id);
				}
				else
				{
					unpinnedIds.push(id);
				}
			});

			return { staleIds, pinnedIds, unpinnedIds };
		}

		/**
		 * A row exactly on the boundary stays outside the window: equality is read in favour of
		 * keeping the row.
		 *
		 * @param {Date|null} lastActivityDate
		 * @param {Date|null} boundary null covers the whole section
		 * @return {boolean}
		 */
		#isInsideWindow(lastActivityDate, boundary)
		{
			if (!boundary)
			{
				return true;
			}

			return Boolean(lastActivityDate) && lastActivityDate.getTime() > boundary.getTime();
		}

		/**
		 * @param {immobileTabChatLoadResultRecentList|imV2RecentChatsResult} recentData
		 * @return {object}
		 */
		prepareDataForModels(recentData)
		{
			const messagesAutoDeleteConfigs = ServerLoadUtils.prepareAutoDeleteConfigs(
				recentData.messagesAutoDeleteConfigs,
			);
			const copilotChatsInitial = ServerLoadUtils.prepareCopilotChats(recentData.copilot?.chats);

			let users = [];
			const dialogues = [];
			const nestedDialogues = [];
			const recent = [];
			const copilotChats = { ...copilotChatsInitial };

			recentData.items.forEach((item) => {
				const result = this.processRecentItem(
					item,
					messagesAutoDeleteConfigs,
					copilotChats,
				);

				if (result.user)
				{
					users.push(result.user);
				}

				dialogues.push(result.dialogue);

				if (result.nestedChatDialogue)
				{
					nestedDialogues.push(result.nestedChatDialogue);
				}

				recent.push(result.recentItem);

				if (result.updateCopilotChat)
				{
					copilotChats[item.id] = item;
				}
			});

			const copilot = ServerLoadUtils.buildCopilotResults({
				copilotChats,
				recentData,
			});

			users = uniqBy(users, 'id');

			return {
				users,
				dialogues,
				nestedDialogues,
				recent,
				copilot,
			};
		}

		/**
		 * @param {RecentItemData} item
		 * @param {Object} messagesAutoDeleteConfigs
		 * @param {Record<string,boolean>} copilotChats
		 * @return {{user,dialogue,nestedChatDialogue,recentItem,updateCopilotChat}}
		 */
		processRecentItem(item, messagesAutoDeleteConfigs, copilotChats)
		{
			let user = null;
			let updateCopilotChat = false;

			if (item.user && item.user.id > 0)
			{
				user = item.user;
			}

			const dialogue = this.buildDialogueItem(item, messagesAutoDeleteConfigs);
			const nestedChatDialogue = this.buildNestedChatDialogueItem(item);

			const recentItem = ServerLoadUtils.prepareRecentItem(item);

			if (copilotChats[item.id])
			{
				updateCopilotChat = true;
			}

			return {
				user,
				dialogue,
				nestedChatDialogue,
				recentItem,
				updateCopilotChat,
			};
		}

		/**
		 * Builds a dialogue item for the inline nestedChat source chat; returns null when the row carries none.
		 *
		 * @param {RecentItemData} item
		 * @return {DialoguesModelState|null}
		 */
		buildNestedChatDialogueItem(item)
		{
			if (!Type.isPlainObject(item.nestedChat) || !(item.nestedChat.id > 0))
			{
				return null;
			}

			const nc = item.nestedChat;

			// Emit extranet and parentChatId only when present: a default fallback would overwrite
			// an existing dialoguesModel entry's real value via mergeImmutable.
			const result = {
				dialogId: nc.dialogId ?? `chat${nc.id}`,
				chatId: nc.id,
				name: nc.name,
				type: nc.type,
				avatar: nc.avatar,
				color: nc.color,
				entityType: nc.entityType ?? '',
			};

			if (!Type.isUndefined(nc.extranet))
			{
				result.extranet = nc.extranet;
			}

			if (!Type.isUndefined(nc.parentChatId))
			{
				result.parentChatId = nc.parentChatId;
			}

			return result;
		}

		/**
		 * @param {RecentItemData} item
		 * @param {Object} messagesAutoDeleteConfigs
		 * @return {DialoguesModelState}
		 */
		buildDialogueItem(item, messagesAutoDeleteConfigs)
		{
			let dialogItem = {};

			if (item.chat)
			{
				dialogItem = {
					...item.chat,
					dialogId: item.id,
				};
				if (item.message)
				{
					dialogItem.lastMessageId = item.message.id;
				}
			}

			const isUserDialog = item.type === DialogType.user || item.type === DialogType.private;
			if (isUserDialog && item.user)
			{
				dialogItem = {
					dialogId: item.user.id,
					avatar: item.user.avatar,
					color: item.user.color,
					name: item.user.name,
					type: DialogType.private,
					permissions: ChatPermission.getActionGroupsByChatType(DialogType.user),
				};

				if (!Type.isUndefined(item.chat?.text_field_enabled)
					|| !Type.isUndefined(item.chat?.background_id)
				)
				{
					dialogItem.textFieldEnabled = item.chat.text_field_enabled;
					dialogItem.backgroundId = item.chat.background_id;
				}

				if (!Type.isUndefined(item.chat.mute_list))
				{
					dialogItem.mute_list = item.chat.mute_list;
				}

				if (item.message)
				{
					dialogItem.lastMessageId = item.message.id;
				}

				if (item.chat_id > 0)
				{
					dialogItem.chatId = item.chat_id;
				}
			}

			if (item.last_id)
			{
				dialogItem.last_id = item.last_id;
			}

			if (messagesAutoDeleteConfigs[item.chat_id])
			{
				dialogItem.messagesAutoDeleteDelay = messagesAutoDeleteConfigs[item.chat_id].delay;
			}

			return dialogItem;
		}

		setLastItem(lastItem)
		{}

		/**
		 * @param {immobileTabChatsLoadResultChatsList} initResultList
		 */
		setPaginationState(initResultList)
		{
			const lastItem = ServerLoadUtils.getLastItem(initResultList.items, this.logger);

			this.paginationService?.setFirstPageData(
				PaginationState.SERVER_SOURCE,
				{
					hasMore: initResultList.hasMore,
					nextPage: 2,
					lastItem,
				},
			);
		}

		#saveShareDialogCache()
		{
			this.shareDialogCache.saveRecentItemListThrottled();
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		unsubscribeEvents()
		{
			this.logger.log('unsubscribeEvents');
		}
	}

	module.exports = ChatServerLoadService;
});
