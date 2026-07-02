/**
 * @module im/messenger/controller/recent/service/server-load/nested-list
 */
jn.define('im/messenger/controller/recent/service/server-load/nested-list', (require, exports, module) => {
	/* global ChatMessengerCommon */
	const { Type } = require('type');
	const { uniqBy } = require('utils/array');

	const { MessengerInitRestMethod } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RecentRest } = require('im/messenger/provider/rest');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { PaginationState } = require('im/messenger/controller/recent/service/pagination/lib/state');
	const { ServerLoadUtils } = require('im/messenger/controller/recent/service/server-load/lib/utils');

	const REST_PAGE_TAIL_LIMIT = 50;

	/**
	 * @implements {IServerLoadService}
	 * @class NestedListLoadService
	 */
	class NestedListLoadService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {string}
		 */
		getInitRequestMethod(mode)
		{
			return MessengerInitRestMethod.nestedList;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {object}
		 */
		getInitRequestOptions(mode)
		{
			return {
				filter: {
					parentId: this.recentLocator.get('parentChatId'),
					recentSection: this.props.recentSection,
				},
			};
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
		 * @param {RefreshModeType} mode
		 * @param {object} initResult
		 * @return {Promise<void>}
		 */
		async handleInitResult(mode, initResult)
		{
			this.logger.log('handleInitResult:', mode, initResult);

			if (!initResult || !Type.isPlainObject(initResult) || !Type.isArray(initResult.nestedList?.recentItems))
			{
				const errorMsg = `handleInitResult: invalid initResult structure for mode "${mode}"`;
				this.logger.error(errorMsg, initResult);

				return;
			}

			try
			{
				await this.processResult(initResult.nestedList, true);
				this.setPaginationState(initResult.nestedList);
			}
			catch (error)
			{
				this.logger.error('handleInitResult: processResult catch:', error);
			}
		}

		/**
		 * @param {object} recentData
		 * @param {boolean} [firstPage]
		 * @return {Promise<void>}
		 */
		async processResult(recentData, firstPage = false)
		{
			if (!recentData || !Type.isArray(recentData.recentItems))
			{
				const errorMsg = 'processResult: invalid recentData structure';
				this.logger.error(errorMsg, recentData);

				return;
			}

			const modelData = this.prepareDataForModels(recentData);

			try
			{
				const recentAction = firstPage
					? 'recentModel/setFirstPageByRecentSection'
					: 'recentModel/setByRecentSection'
				;
				await Promise.all([
					this.store.dispatch('usersModel/set', modelData.users),
					this.store.dispatch('messagesModel/store', modelData.messages),
					this.store.dispatch('filesModel/set', modelData.files),
					this.store.dispatch('dialoguesModel/set', modelData.dialogues),
					this.store.dispatch(
						recentAction,
						{
							recentSection: this.recentLocator.get('recentSection'),
							itemList: modelData.recent,
							parentChatId: this.recentLocator.get('parentChatId'),
						},
					),
				]);

				if (recentData.hasNextPage)
				{
					this.renderService?.showLoader();
				}
			}
			catch (error)
			{
				this.logger.error('processResult: dispatch failed', error);
			}
		}

		/**
		 * @param {object} recentData
		 * @return {{users: Array, dialogues: Array, recent: Array, messages: Array, files: Array}}
		 */
		prepareDataForModels(recentData)
		{
			const result = {
				users: [],
				dialogues: [],
				files: [],
				recent: [],
				messages: [],
			};

			if (Type.isArray(recentData.users))
			{
				result.users = uniqBy(recentData.users, 'id');
			}

			if (Type.isArray(recentData.files))
			{
				result.files = recentData.files;
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
			result.messages = allMessages;

			if (Type.isArray(recentData.recentItems))
			{
				recentData.recentItems.forEach((recentItem) => {
					const message = allMessages.find((msg) => recentItem.messageId === msg.id);

					let itemMessage = {};
					if (message)
					{
						itemMessage = {
							...message,
							text: ChatMessengerCommon.purifyText(message.text, message.params),
						};
					}

					const item = ServerLoadUtils.prepareRecentItem({
						...recentItem,
						liked: false,
						message: itemMessage,
					});

					result.recent.push(item);
				});
			}

			const messagesAutoDeleteConfigs = ServerLoadUtils.prepareAutoDeleteConfigs(
				recentData.messagesAutoDeleteConfigs,
			);

			if (Type.isArray(recentData.chats))
			{
				recentData.chats.forEach((chatItem) => {
					const chat = { ...chatItem };

					if (messagesAutoDeleteConfigs[chatItem.id])
					{
						chat.messagesAutoDeleteDelay = messagesAutoDeleteConfigs[chatItem.id].delay;
					}

					result.dialogues.push(chat);
				});
			}

			return result;
		}

		/**
		 * @param {object} initResultList
		 */
		setPaginationState(initResultList)
		{
			const lastItem = this.#getLastItem(initResultList);

			this.paginationService?.setFirstPageData(
				PaginationState.SERVER_SOURCE,
				{
					hasMore: initResultList.hasNextPage ?? false,
					nextPage: 2,
					lastItem,
				},
			);
		}

		/**
		 * @param {object} restResult
		 * @return {{lastMessageDate: string}}
		 */
		#getLastItem(restResult)
		{
			return { lastMessageDate: this.#getLastMessageDate(restResult) };
		}

		/**
		 * @param {object} restResult
		 * @return {string}
		 */
		#getLastMessageDate(restResult)
		{
			const messages = this.#filterPinnedItemsMessages(restResult);
			if (messages.length === 0)
			{
				return '';
			}

			let firstMessageDate = messages[0].date;
			messages.forEach((message) => {
				if (message.date < firstMessageDate)
				{
					firstMessageDate = message.date;
				}
			});

			return firstMessageDate;
		}

		/**
		 * @param {object} restResult
		 * @return {Array}
		 */
		#filterPinnedItemsMessages(restResult)
		{
			const { messages, recentItems } = restResult;

			if (!Type.isArray(messages) || !Type.isArray(recentItems))
			{
				return [];
			}

			return messages.filter((message) => {
				const chatId = message.chat_id;
				const recentItem = recentItems.find((item) => item.chatId === chatId);

				return recentItem?.pinned === false;
			});
		}

		setLastItem(lastItem)
		{}

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

			const restOptions = {
				limit: REST_PAGE_TAIL_LIMIT,
				filter: {
					lastMessageDate: currentLastItem.lastMessageDate,
					parentId: this.recentLocator.get('parentChatId'),
					recentSection: this.props.recentSection,
				},
			};

			const resultRequestData = await this.#createRequest(restOptions);
			await this.processResult(resultRequestData);

			const newLastItem = this.#getLastItem(resultRequestData);

			if (!resultRequestData.hasNextPage)
			{
				this.renderService?.hideLoader();
			}

			return {
				hasMore: resultRequestData.hasNextPage ?? false,
				lastItem: newLastItem,
			};
		}

		/**
		 * @param {object} restOptions
		 * @return {Promise<object>}
		 */
		async #createRequest(restOptions)
		{
			try
			{
				this.logger.log('createRequest', restOptions);
				const result = await RecentRest.getNestedList(restOptions);
				this.logger.log('createRequest result:', result);

				return result;
			}
			catch (error)
			{
				this.logger.error('createRequest error', error);

				return Promise.reject(error);
			}
		}
	}

	module.exports = NestedListLoadService;
});
