/**
 * @module im/messenger/controller/recent/service/server-load/openlines
 */
jn.define('im/messenger/controller/recent/service/server-load/openlines', (require, exports, module) => {
	/* global ChatMessengerCommon  */
	const { Type } = require('type');
	const { runAction } = require('im/messenger/lib/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const {
		MessengerInitRestMethod,
		OpenlineStatus,
		RestMethod,
	} = require('im/messenger/const');

	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { PaginationState } = require('im/messenger/controller/recent/service/pagination/lib/state');
	const { ServerLoadUtils } = require('im/messenger/controller/recent/service/server-load/lib/utils');

	/**
	 * @implements {IServerLoadService}
	 * @class OpenlinesServerLoadService
	 */
	class OpenlinesServerLoadService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
			this.sortPointer = null;
			this.statusGroup = null;
		}

		/**
		 * @returns {MessengerCoreStore}
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
		 * @return string
		 */
		getInitRequestMethod(mode)
		{
			this.logger.log(`getInitRequestMethod mode:${mode} methods:`, MessengerInitRestMethod.openlinesList);

			return MessengerInitRestMethod.openlinesList;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @param {immobileTabOpenlinesLoadResultV2} initResult
		 * @return {Promise<void>}
		 */
		async handleInitResult(mode, initResult)
		{
			this.logger.warn('handleInitResult', mode, initResult);
			const { openlinesList } = initResult;
			this.hasMore = false;
			this.sortPointer = null;
			this.statusGroup = null;

			await this.#handlePage(openlinesList, true);
			this.setPaginationState();
		}

		setPaginationState()
		{
			if (Type.isNull(this.sortPointer) || Type.isNull(this.statusGroup))
			{
				return;
			}

			if (Type.isNull(this.paginationService))
			{
				return;
			}

			this.paginationService?.setFirstPageData(PaginationState.SERVER_SOURCE, {
				hasMore: this.hasMore,
				lastItem: {
					sortPointer: this.sortPointer,
					statusGroup: this.statusGroup,
				},
			});
		}

		/**
		 * @return {Promise<LoadNextPageResult>}
		 */
		async loadNextPage()
		{
			this.logger.warn('loadNextPage');

			await runAction(RestMethod.imopenlinesV2RecentList, this.#getFilter())
				.then((result) => this.#handlePage(result))
				.catch((error) => {
					this.logger.error('loadNextPage error', error);
				})
			;

			return {
				hasMore: this.hasMore,
				lastItem: {
					sortPointer: this.sortPointer,
					statusGroup: this.statusGroup,
				},
			};
		}

		/**
		 * @param {immobileTabOpenlinesLoadResultOpenlinesList} data
		 * @param {boolean} firstPage
		 */
		async #handlePage(data, firstPage = false)
		{
			this.logger.warn('handlePage', data);

			this.hasMore = data.hasNextPage;

			if (this.hasMore === false)
			{
				this.renderService?.hideLoader();
			}

			if (Type.isArrayFilled(data.recentItems) && Type.isArrayFilled(data.sessions))
			{
				const { sessions, messages } = data;
				const lastSession = sessions[sessions.length - 1];
				this.statusGroup = lastSession.status;

				if (lastSession.status === OpenlineStatus.answered)
				{
					const lastMessage = messages[messages.length - 1];
					this.sortPointer = lastMessage.date;
				}
				else
				{
					this.sortPointer = lastSession.id;
				}
			}

			try
			{
				await this.saveRecentData(data, firstPage);
				this.renderService?.renderInstant();
				if (this.hasMore)
				{
					this.renderService?.showLoader();
				}
			}
			catch (error)
			{
				this.logger.error('handlePage error', error);
			}
		}

		/**
		 * @returns {ajaxConfig}
		 */
		#getFilter()
		{
			const filter = {
				data: {
					limit: 50,
				},
			};

			if (!Type.isNull(this.sortPointer) && !Type.isNull(this.statusGroup))
			{
				filter.data = {
					...filter.data,
					cursor: {
						sortPointer: this.sortPointer,
						statusGroup: this.statusGroup,
					},
				};
			}

			return filter;
		}

		/**
		 * @param {immobileTabOpenlinesLoadResultOpenlinesList} recentData
		 * @param {boolean} firstPage
		 * @return {Promise<void>}
		 * @override
		 */
		async saveRecentData(recentData, firstPage = false)
		{
			const modelData = this.prepareDataForModels(recentData);

			await Promise.all([
				this.store.dispatch('usersModel/set', modelData.users),
				this.store.dispatch('dialoguesModel/set', modelData.dialogues),
				this.store.dispatch('dialoguesModel/openlinesModel/set', modelData.sessions),
				this.store.dispatch('filesModel/set', modelData.files),
				this.store.dispatch('messagesModel/store', modelData.messages),
			]);

			const recentAction = firstPage ? 'recentModel/setFirstPageByTab' : 'recentModel/setOpenline';
			await this.store.dispatch(recentAction, {
				tab: this.recentLocator.get('id'),
				itemList: modelData.recent,
			});
		}

		/**
		 * @param {immobileTabOpenlinesLoadResultOpenlinesList} recentData
		 * @returns {{users,dialogues,files,recent,messages,sessions}}
		 */
		prepareDataForModels(recentData)
		{
			const result = {
				users: recentData.users,
				dialogues: recentData.chats,
				files: recentData.files,
				sessions: recentData.sessions,
				recent: [],
				messages: [...recentData.messages, ...recentData.additionalMessages],
			};

			recentData.recentItems.forEach((recentItem) => {
				const message = recentData.messages.find((recentMessage) => recentItem.messageId === recentMessage.id);

				let itemMessage = {};
				if (message)
				{
					itemMessage = {
						...message,
						text: ChatMessengerCommon.purifyText(message.text, message.params),
					};
				}

				const item = ServerLoadUtils.prepareRecentItem(
					{
						...recentItem,
						id: recentItem.dialogId,
						message: itemMessage,
					},
				);

				result.recent.push(item);
			});

			return result;
		}

		setLastItem(lastItem)
		{
			this.logger.warn('setLastItem', lastItem);
		}
	}

	module.exports = OpenlinesServerLoadService;
});
