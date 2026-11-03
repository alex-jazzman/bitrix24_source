/**
 * @module im/messenger/controller/navigation/api-handler
 */
jn.define('im/messenger/controller/navigation/api-handler', (require, exports, module) => {
	const {
		EventType,
		DialogType,
		NavigationTabId,
	} = require('im/messenger/const');
	const { waitViewLoaded } = require('im/messenger/lib/wait-view-loaded');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { openPlanLimitsWidgetByError } = require('im/messenger/lib/plan-limit');

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
		 * @param {string} requestedTabId
		 * @param {TabOptions} options
		 * @return {Promise<void>}
		 */
		#changeTabHandler = async (requestedTabId, options = {}) => {
			const tabId = this.#resolveTargetTabId(requestedTabId);

			if (!NavigationHelper.isTabIdCorrect(tabId))
			{
				return this.#sendIncorrectTabIdError(requestedTabId, tabId);
			}

			if (!NavigationHelper.isTabAvailable(tabId))
			{
				return this.#sendTabUnavailableError(requestedTabId, tabId);
			}

			await NavigationHelper.makeMessengerTabActive();

			await waitViewLoaded();

			const result = await this.#navigationApi
				.setActiveTab(tabId, options)
			;

			if (result.isSuccess())
			{
				return BX.postComponentEvent(EventType.navigation.changeTabResult, [{
					tabId: requestedTabId,
				}]);
			}

			if (result.fromIncorrectTabId())
			{
				return this.#sendIncorrectTabIdError(requestedTabId, tabId);
			}

			if (result.fromTabIsNotAvailable())
			{
				return this.#sendIncorrectTabIdError(requestedTabId, tabId);
			}

			return BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId: requestedTabId,
				errorText: `${result.getError()}: ${tabId}`,
			}]);
		};

		/**
		 * Regular chats live in the 'all' tab once 'chats' is hidden, same rule as
		 * the web `getRegularChatsLayout()`. Only 'chats' is redirected: the rest of
		 * the family keeps rejecting on an unavailable tab, as the module contract says.
		 *
		 * @param {string} tabId
		 * @return {string}
		 */
		#resolveTargetTabId(tabId)
		{
			const shouldOpenAll = tabId === NavigationTabId.chats
				&& !NavigationHelper.isTabAvailable(NavigationTabId.chats)
				&& NavigationHelper.isTabAvailable(NavigationTabId.all)
			;

			return shouldOpenAll ? NavigationTabId.all : tabId;
		}

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
				await openPlanLimitsWidgetByError(error?.[0] ?? error ?? {});

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

		/**
		 * The reply is keyed by the tab the caller asked for: `im/messenger/api/tab`
		 * matches its pending promise by that id, so a reply keyed by the redirect
		 * target would leave the caller hanging forever.
		 *
		 * @param {string} requestedTabId
		 * @param {string} targetTabId
		 */
		#sendIncorrectTabIdError(requestedTabId, targetTabId)
		{
			BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId: requestedTabId,
				errorText: `im.messenger: Error changing tab, tab ${targetTabId} does not exist.`,
			}]);
		}

		/**
		 * @param {string} requestedTabId
		 * @param {string} targetTabId
		 */
		#sendTabUnavailableError(requestedTabId, targetTabId)
		{
			BX.postComponentEvent(EventType.navigation.changeTabResult, [{
				tabId: requestedTabId,
				errorText: `im.navigation: Error changing tab, tab ${targetTabId} is disabled.`,
			}]);
		}
	}

	module.exports = { NavigationApiHandler };
});
