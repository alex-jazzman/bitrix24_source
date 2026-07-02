/**
 * @module im/messenger/controller/recent/service/server-load/folder
 */
jn.define('im/messenger/controller/recent/service/server-load/folder', (require, exports, module) => {
	/* global ChatMessengerCommon */
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');
	const { MessengerInitRestMethod } = require('im/messenger/const');
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
		onInit()
		{
			super.onInit();
			this.folderId = Number(this.props.folderId);
		}

		/**
		 * @return {string}
		 */
		getInitRequestMethod()
		{
			return MessengerInitRestMethod.folderRecentList;
		}

		getInitRequestOptions()
		{
			return {
				folderId: this.folderId,
			};
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {object} initResult
		 * @return {Promise<void>}
		 */
		async handleInitResult(mode, initResult)
		{
			this.logger.log('handleInitResult:', mode, initResult);

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

			try
			{
				await this.processResult(recentData, true);
				this.setPaginationState(recentData);
			}
			catch (error)
			{
				this.logger.error('handleInitResult: processResult catch:', error);
			}
		}

		async loadFirstPage()
		{
			const recentData = await this.#loadPage();
			await this.processResult(recentData, true);
			this.setPaginationState(recentData);
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

			const recentData = await this.#loadPage(currentLastItem);
			await this.processResult(recentData);
			const newLastItem = ServerLoadUtils.getLastItem(recentData.items, this.logger);

			this.hideLoaderByNextPageResult(recentData);

			return {
				hasMore: recentData.hasMore,
				lastItem: newLastItem,
			};
		}

		/**
		 * @param {RecentItemData|null} [lastItem]
		 * @return {Promise<imV2RecentChatsResult>}
		 */
		async #loadPage(lastItem = null)
		{
			const response = await FolderService.getRecentTail(this.#getRequestOptions(lastItem));
			const recentData = this.#normalizeResponse(response);

			this.logger.log('loadPage result:', recentData);

			return recentData;
		}

		/**
		 * @param {RecentItemData|null} lastItem
		 * @return {object}
		 */
		#getRequestOptions(lastItem)
		{
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

			return options;
		}

		/**
		 * Folder.Recent.tail returns v2-shape: recentItems + adjacent chats/users/messages.
		 * The parent ChatServerLoadService produces legacy v1-shape (item.chat/user/message),
		 * so we override — otherwise dialoguesModel won't pull the recipients in and
		 * recentModel/getByChatIdList won't match private chats from the folder after a restart.
		 *
		 * @override
		 * @param {object} recentData
		 * @return {{users: Array, dialogues: Array, recent: Array, copilot: object}}
		 */
		prepareDataForModels(recentData)
		{
			const messagesAutoDeleteConfigs = ServerLoadUtils.prepareAutoDeleteConfigs(
				recentData.messagesAutoDeleteConfigs,
			);

			const users = Type.isArray(recentData.users)
				? uniqBy(recentData.users, 'id')
				: [];

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

			const sourceItems = Type.isArray(recentData.recentItems)
				? recentData.recentItems
				: (Type.isArray(recentData.items) ? recentData.items : [])
			;

			const recent = sourceItems.map((recentItem) => {
				const message = allMessages.find((msg) => recentItem.messageId === msg.id);
				const itemMessage = message
					? { ...message, text: ChatMessengerCommon.purifyText(message.text, message.params) }
					: {}
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
				recent,
				copilot: recentData.copilot ?? { chats: [], users: [], collection: [] },
			};
		}

		/**
		 * @param {object} recentData
		 * @param {boolean} [firstPage]
		 * @return {Promise<void>}
		 * @override
		 */
		async processResult(recentData, firstPage = false)
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
