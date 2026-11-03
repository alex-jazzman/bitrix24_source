/**
 * @module im/messenger/controller/recent/service/server-load/folder
 */
jn.define('im/messenger/controller/recent/service/server-load/folder', (require, exports, module) => {
	/* global ChatMessengerCommon */
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { MessengerInitRestMethod, DialogType, RecentFilterId } = require('im/messenger/const');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { FolderService } = require('im/messenger/provider/services/folder');
	const ChatServerLoadService = require('im/messenger/controller/recent/service/server-load/chat');
	const { PaginationState } = require('im/messenger/controller/recent/service/pagination/lib/state');
	const { ServerLoadUtils } = require('im/messenger/controller/recent/service/server-load/lib/utils');

	/**
	 * @implements {IServerLoadService}
	 * @class FolderServerLoadService
	 */
	class FolderServerLoadService extends ChatServerLoadService
	{
		/**
		 * The mode the init/refresh request was shaped in. Read once, next to the options of that
		 * request, because its result comes back much later and the funnel may be switched in between.
		 *
		 * @type {?FilterId}
		 */
		#initRequestedMode = null;

		onInit()
		{
			super.onInit();
			this.folderId = Number(this.props.folderId);
		}

		/**
		 * The server answers a request carrying a non-positive folder id with an empty list of its
		 * own accord (Tab::getFolderRecentList), so such a request is not built at all. The value of
		 * the id is checked and not the availability of folders: a guard tied to the same condition
		 * as its caller would disappear together with that condition.
		 *
		 * @return {boolean}
		 */
		#hasRequestableFolderId()
		{
			return Type.isNumber(this.folderId) && this.folderId > 0;
		}

		/**
		 * @return {?string} null leaves the method out of the request set of the startup
		 */
		getInitRequestMethod()
		{
			if (!this.#hasRequestableFolderId())
			{
				this.logger.log('getInitRequestMethod: no request, the folder id is not positive', this.folderId);

				return null;
			}

			return MessengerInitRestMethod.folderRecentList;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {ServerLoadRequestContext} [context]
		 * @return {object}
		 */
		getInitRequestOptions(mode, { currentFilterId } = {})
		{
			// the mode is not remembered either: a request that never goes out gets no result whose
			// mode would have to be recalled
			if (!this.#hasRequestableFolderId())
			{
				this.logger.log('getInitRequestOptions: no request, the folder id is not positive', this.folderId);

				return {};
			}

			this.#initRequestedMode = Type.isStringFilled(currentFilterId) ? currentFilterId : RecentFilterId.all;

			const options = {
				folderId: this.folderId,
			};

			if (currentFilterId === RecentFilterId.unread)
			{
				options.filter = { unread: 'Y' };
			}

			return options;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {object} initResult
		 * @return {Promise<void>}
		 */
		async handleInitResult(mode, initResult)
		{
			this.logger.log('handleInitResult:', mode, initResult);

			// the list of this folder was never asked for, so its absence from the response is no error
			if (!this.#hasRequestableFolderId())
			{
				this.logger.log('handleInitResult: nothing was requested, the folder id is not positive', this.folderId);

				return;
			}

			const folderRecentList = initResult?.folderRecentList;
			const hasRecentItems = Type.isArray(folderRecentList?.items)
				|| Type.isArray(folderRecentList?.recentItems)
			;
			if (!hasRecentItems)
			{
				const errorMsg = `handleInitResult: invalid initResult structure for mode "${mode}"`;
				this.logger.error(errorMsg, initResult);

				return;
			}

			const recentData = this.#normalizeResponse(folderRecentList);
			const requestedMode = this.#takeInitRequestedMode();

			try
			{
				await this.processResult(recentData, true, requestedMode);

				// The cursor is one for the tab, so a page the server filtered by the previous mode
				// may not become the first page of the current one: the next page would then be
				// asked for from a depth of a differently filtered sequence. The page itself stays
				// in the model - its chats are valid rows - only the cursor is left as it was.
				// A tab holding no cursor yet is the exception: an approximate one beats a list
				// unable to page at all.
				if (requestedMode === this.#getCurrentMode() || !this.#hasServerCursor())
				{
					this.setPaginationState(recentData);
				}
				else
				{
					this.logger.log('handleInitResult: the page belongs to another mode, cursor kept', requestedMode);
				}
			}
			catch (error)
			{
				this.logger.error('handleInitResult: processResult catch:', error);
			}
		}

		/**
		 * The mode of the init request, consumed once: a result already handled must not lend its
		 * mode to a later one that was never shaped through getInitRequestOptions. Without a mode
		 * remembered the tab falls back to the mode it is in, the behaviour there was before.
		 *
		 * @return {FilterId}
		 */
		#takeInitRequestedMode()
		{
			const requestedMode = this.#initRequestedMode;
			this.#initRequestedMode = null;

			return Type.isStringFilled(requestedMode) ? requestedMode : this.#getCurrentMode();
		}

		/**
		 * @return {boolean}
		 */
		#hasServerCursor()
		{
			return Boolean(this.paginationService?.getLastItem(PaginationState.SERVER_SOURCE));
		}

		async loadFirstPage()
		{
			const page = await this.#loadPage();
			if (!page)
			{
				return;
			}

			await this.processResult(page.recentData, true, page.requestedMode);
			this.setPaginationState(page.recentData);
		}

		async loadNextPage()
		{
			this.logger.log('loadNextPage');

			const currentLastItem = this.paginationService?.getLastItem(PaginationState.SERVER_SOURCE);
			if (!currentLastItem)
			{
				this.logger.error('loadNextPage currentLastItem is invalid, load aborted', currentLastItem);
				throw new Error('loadNextPage currentLastItem is invalid, load aborted');
			}

			const page = await this.#loadPage(currentLastItem);
			if (!page)
			{
				// a refusal is not a failure of the source: the list keeps the rows and the cursor it
				// already has, and the pagination stops asking instead of going into the error state.
				// The loader row goes the way it goes on the ordinary path of a last page: a list
				// that asks for nothing more would keep it on the screen forever.
				this.renderService?.hideLoader();

				return { hasMore: false, lastItem: currentLastItem };
			}

			const { recentData, requestedMode } = page;
			await this.processResult(recentData, false, requestedMode);
			const newLastItem = ServerLoadUtils.getLastItem(recentData.items, this.logger);

			this.hideLoaderByNextPageResult(recentData);

			return {
				hasMore: recentData.hasMore,
				lastItem: newLastItem,
			};
		}

		/**
		 * A page of the tail together with the mode it was requested in. The mode is taken once, next
		 * to the options of the request, and travels with the page: the user may switch the funnel
		 * while the request is in flight, and the page belongs to the mode the server filtered it by.
		 *
		 * @param {RecentItemData|null} [lastItem]
		 * @return {Promise<?{recentData: imV2RecentChatsResult, requestedMode: FilterId}>} null when no request was built
		 */
		async #loadPage(lastItem = null)
		{
			const requestedMode = this.#getCurrentMode();
			const options = this.#getRequestOptions(lastItem, requestedMode);
			if (!options)
			{
				return null;
			}

			const response = await FolderService.getRecentTail(options);
			const recentData = this.#normalizeResponse(response);

			this.logger.log('loadPage result:', recentData);

			return { recentData, requestedMode };
		}

		/**
		 * The mode the tab is in. A tab declaring no filter service of its own, or one whose service
		 * names no mode, knows a single mode - the one every list is in until a filter is applied.
		 *
		 * @return {FilterId}
		 */
		#getCurrentMode()
		{
			const mode = this.filterService?.getCurrentFilterId();

			return Type.isStringFilled(mode) ? mode : RecentFilterId.all;
		}

		/**
		 * @param {RecentItemData|null} lastItem
		 * @param {FilterId} requestedMode
		 * @return {?object} null when no request is to be built
		 */
		#getRequestOptions(lastItem, requestedMode)
		{
			if (!this.#hasRequestableFolderId())
			{
				this.logger.log('getRequestOptions: no request, the folder id is not positive', this.folderId);

				return null;
			}

			const options = {
				folderId: this.folderId,
				limit: 50,
			};

			if (lastItem)
			{
				const lastMessageDate = lastItem.dateLastActivity
					?? lastItem.date_last_activity
					?? lastItem.lastActivityDate
					?? lastItem.message?.date
				;
				options.lastMessageDate = lastMessageDate instanceof Date
					? lastMessageDate.toISOString()
					: lastMessageDate
				;
			}

			if (requestedMode === RecentFilterId.unread)
			{
				options.unread = 'Y';
			}

			return options;
		}

		/**
		 * Folder.Recent.tail returns v2-shape: recentItems + adjacent chats/users/messages.
		 * The parent ChatServerLoadService produces legacy v1-shape (item.chat/user/message),
		 * so we override — otherwise dialoguesModel won't pull the recipients in and
		 * recentModel/getByChatIdList won't match private chats from the folder after a restart.
		 *
		 * The dialogues built for the rows without a chat are kept apart from the chats of the
		 * response: they go to the store as one batch, while the chats keep the per-item seed the
		 * rest of the messenger listens to.
		 *
		 * @override
		 * @param {object} recentData
		 * @return {{users: Array, dialogues: Array, dialoguesWithoutChat: Array, recent: Array, copilot: object}}
		 */
		prepareDataForModels(recentData)
		{
			const messagesAutoDeleteConfigs = ServerLoadUtils.prepareAutoDeleteConfigs(
				recentData.messagesAutoDeleteConfigs,
			);

			const users = Type.isArray(recentData.users)
				? uniqBy(recentData.users, 'id')
				: [];

			const sourceItems = Type.isArray(recentData.recentItems)
				? recentData.recentItems
				: (Type.isArray(recentData.items) ? recentData.items : [])
			;

			const dialogues = [];
			if (Type.isArray(recentData.chats))
			{
				recentData.chats.forEach((chatItem) => {
					const chat = { ...chatItem };
					if (messagesAutoDeleteConfigs[chatItem.id])
					{
						chat.messagesAutoDeleteDelay = messagesAutoDeleteConfigs[chatItem.id].delay;
					}
					dialogues.push(chat);
				});
			}

			const allMessages = [];
			if (Type.isArray(recentData.messages))
			{
				allMessages.push(...recentData.messages);
			}
			if (Type.isArray(recentData.additionalMessages))
			{
				allMessages.push(...recentData.additionalMessages);
			}

			const recent = sourceItems.map((recentItem) => {
				const message = allMessages.find((msg) => recentItem.messageId === msg.id);
				// a row with no message keeps the date of the row itself: an empty message would be
				// cast to the launch time and sort the row by a scale of its own
				const itemMessage = message
					? { ...message, text: ChatMessengerCommon.purifyText(message.text, message.params) }
					: { date: recentItem.dateLastActivity }
				;

				return ServerLoadUtils.prepareRecentItem({
					...recentItem,
					liked: false,
					message: itemMessage,
				});
			});

			return {
				users,
				dialogues,
				dialoguesWithoutChat: this.buildDialoguesWithoutChat(sourceItems, users),
				recent,
				copilot: recentData.copilot ?? { chats: [], users: [], collection: [] },
			};
		}

		/**
		 * A row of a colleague the reader has never talked to carries no entry in `chats`, so its
		 * dialogue is built from the profile of the same response, the way the legacy list path does
		 * it. Without the dialogue the row is dropped on the way to the local database, which joins
		 * recent rows with dialogues.
		 *
		 * chatId is left out on purpose: it defaults to 0 for a new record, while an existing entry
		 * keeps the real chat it already has instead of being overwritten with a zero.
		 *
		 * @param {Array<RecentItemData>} recentItems
		 * @param {Array<object>} users
		 * @return {Array<DialoguesModelState>}
		 */
		buildDialoguesWithoutChat(recentItems, users)
		{
			// a personal folder and a feed with the colleague stream off carry no such row at all,
			// so the common case pays one pass over the page and nothing else
			const rowsWithoutChat = recentItems.filter((recentItem) => {
				const chatId = Number(recentItem.chatId) || 0;

				return recentItem.type === DialogType.user && chatId <= 0;
			});

			if (rowsWithoutChat.length === 0)
			{
				return [];
			}

			const usersById = new Map(users.map((user) => [Number(user.id), user]));

			return rowsWithoutChat
				.map((recentItem) => usersById.get(Number(recentItem.dialogId)))
				.filter(Boolean)
				.map((user) => ({
					dialogId: String(user.id),
					type: DialogType.private,
					name: user.name,
					avatar: user.avatar,
					color: user.color,
					permissions: ChatPermission.getActionGroupsByChatType(DialogType.user),
				}))
			;
		}

		/**
		 * The mode the page was requested in is reported with the page instead of being read here:
		 * the funnel may be switched while the request is in flight. This loader seeds one section
		 * and keeps no window of its own, so it only carries the argument on to the override of the
		 * composite tab.
		 *
		 * @param {object} recentData
		 * @param {boolean} [firstPage]
		 * @param {?FilterId} [requestedMode]
		 * @return {Promise<void>}
		 * @override
		 */
		async processResult(recentData, firstPage = false, requestedMode = null)
		{
			if (!recentData || !Type.isArray(recentData.items))
			{
				this.logger.error('processResult: invalid recentData structure', recentData);

				return;
			}

			const modelData = this.prepareDataForModels(recentData);

			try
			{
				await Promise.all([
					this.store.dispatch('usersModel/set', modelData.users),
					this.store.dispatch('dialoguesModel/set', modelData.dialogues),
					this.store.dispatch('dialoguesModel/setCollection', modelData.dialoguesWithoutChat),
					this.store.dispatch('dialoguesModel/copilotModel/setCollection', modelData.copilot),
				]);

				await this.store.dispatch('recentModel/set', {
					actionName: firstPage ? 'setFolderFirstPage' : 'setFolder',
					itemList: modelData.recent,
				});

				this.showLoaderByRestResult(recentData);
			}
			catch (error)
			{
				this.logger.error('processResult: dispatch failed', error);
			}
		}

		/**
		 * @param {imV2RecentChatsResult} result
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

		/**
		 * @param {object} data
		 * @return {object}
		 */
		#normalizeResponse(data)
		{
			const recentData = data?.recent ?? data?.recentList ?? data;

			return {
				...recentData,
				items: recentData?.items ?? recentData?.recentItems ?? [],
				hasMore: recentData?.hasMore ?? recentData?.hasMorePages ?? recentData?.hasNextPage ?? false,
			};
		}
	}

	module.exports = FolderServerLoadService;
});
