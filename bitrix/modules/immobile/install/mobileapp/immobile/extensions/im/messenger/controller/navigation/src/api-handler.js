/**
 * @module im/messenger/controller/navigation/api-handler
 */
jn.define('im/messenger/controller/navigation/api-handler', (require, exports, module) => {
	const {
		EventType,
		DialogType,
	} = require('im/messenger/const');
	const { waitViewLoaded } = require('im/messenger/lib/wait-view-loaded');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { Feature } = require('im/messenger/lib/feature');
	const { NavigationHelper } = require('im/messenger/controller/navigation/helper');
	const { ChatService } = require('im/messenger/provider/services/chat');

	const logger = getLoggerWithContext('navigation--api-handler', 'NavigationApiHandler');

	/**
	 * @implements {Unsubscribable}
	 * @class NavigationApiHandler
	 */
	class NavigationApiHandler
	{
		/** @type {NavigationApi|null} */
		#navigationApi;

		/**
		 * @param {NavigationApi} navigationApi
		 */
		constructor(navigationApi)
		{
			this.#navigationApi = navigationApi;
			this.subscribeEvents();
		}

		subscribeEvents()
		{
			BX.addCustomEvent(EventType.navigation.changeTab, this.#changeTabHandler);
			BX.addCustomEvent(EventType.navigation.closeAll, this.#closeAllHandler);
			BX.addCustomEvent(EventType.navigation.openNestedNavigation, this.#openNestedNavigationHandler);
		}

		unsubscribeEvents()
		{
			BX.removeCustomEvent(EventType.navigation.changeTab, this.#changeTabHandler);
			BX.removeCustomEvent(EventType.navigation.closeAll, this.#closeAllHandler);
			BX.removeCustomEvent(EventType.navigation.openNestedNavigation, this.#openNestedNavigationHandler);
			this.#navigationApi = null;
		}

		/**
		 * @param {string} tabId
		 * @param {TabOptions} options
		 * @return {Promise<void>}
		 */
		#changeTabHandler = async (tabId, options = {}) => {
			if (!NavigationHelper.isTabIdCorrect(tabId))
			{
				return this.#sendIncorrectTabIdError(tabId);
			}

			if (!NavigationHelper.isTabAvailable(tabId))
			{
				return this.#sendTabUnavailableError(tabId);
			}

			await NavigationHelper.makeMessengerTabActive();

			await waitViewLoaded();

			const result = await this.#navigationApi
				.setActiveTab(tabId, options)
			;

			if (result.isSuccess())
			{
				return BX.postComponentEvent(EventType.navigation.changeTabResult, [{
					tabId,
				}]);
			}

			if (result.fromIncorrectTabId())
			{
				return this.#sendIncorrectTabIdError(tabId);
			}

			if (result.fromTabIsNotAvailable())
			{
				return this.#sendIncorrectTabIdError(tabId);
			}

			return BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId,
				errorText: `${result.getError()}: ${tabId}`,
			}]);
		};

		#closeAllHandler = async () => {
			await waitViewLoaded();

			this.#navigationApi
				.closeAllWidgets()
				.then(() => {
					BX.postComponentEvent(EventType.navigation.closeAllComplete, [{ isSuccess: true }]);
				})
				.catch((error) => {
					logger.error('closeAllHandler error:', error);
					BX.postComponentEvent(EventType.navigation.closeAllComplete, [{ isSuccess: false }]);
				})
			;
		};

		/**
		 * @param {number} chatId
		 */
		#openNestedNavigationHandler = async (chatId) => {
			if (!Feature.isNestedChatAvailable)
			{
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: false,
					errorText: 'im.navigation: nested chat feature is not available.',
				}]);

				return;
			}

			let isCollab = false;
			try
			{
				isCollab = await this.#isChatCollab(chatId);
			}
			catch (error)
			{
				logger.error('openNestedNavigationHandler: failed to check collab:', error);
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: false,
					errorText: `im.messenger: failed to load chat ${chatId}.`,
				}]);

				return;
			}

			if (!isCollab)
			{
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: false,
					errorText: `im.navigation: chat ${chatId} is not a collab.`,
				}]);

				return;
			}

			await NavigationHelper.makeMessengerTabActive();
			await waitViewLoaded();

			if (this.#navigationApi.isTopNestedNavigationForChat(chatId))
			{
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: true,
				}]);

				return;
			}

			try
			{
				await this.#navigationApi.openNestedNavigation(chatId);
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: true,
				}]);
			}
			catch
			{
				BX.postComponentEvent(EventType.navigation.openNestedNavigationComplete, [{
					chatId,
					isSuccess: false,
				}]);
			}
		};

		/**
		 * @param {number} chatId
		 * @return {Promise<boolean>}
		 */
		async #isChatCollab(chatId)
		{
			const dialogId = `chat${chatId}`;
			const chatService = new ChatService();
			const dialogModel = await chatService.getDialogByDialogId(dialogId);

			return dialogModel?.type === DialogType.collab;
		}

		#sendIncorrectTabIdError(tabId)
		{
			BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId,
				errorText: `im.messenger: Error changing tab, tab ${tabId} does not exist.`,
			}]);
		}

		#sendTabUnavailableError(tabId)
		{
			BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId,
				errorText: `im.navigation: Error changing tab, tab ${tabId} is disabled.`,
			}]);
		}
	}

	module.exports = { NavigationApiHandler };
});
