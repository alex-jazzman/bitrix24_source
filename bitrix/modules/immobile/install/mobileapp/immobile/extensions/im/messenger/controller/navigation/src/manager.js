/**
 * @module im/messenger/controller/navigation/manager
 */
jn.define('im/messenger/controller/navigation/manager', (require, exports, module) => {
	const { Uuid } = require('utils/uuid');
	const {
		NavigationTabId,
		NonSelectableNavigationTabId,
		EventType,
	} = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { NestedTabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { Notification } = require('im/messenger/lib/ui/notification');

	const { TabSwitcher } = require('im/messenger/controller/navigation/tab-switcher');
	const { NavigationHelper } = require('im/messenger/controller/navigation/helper');
	const { NavigationApiHandler } = require('im/messenger/controller/navigation/api-handler');
	const { FolderTabsController } = require('im/messenger/controller/navigation/folder-tabs-controller');
	const { NestedTabSwitcher } = require('im/messenger/controller/navigation/src/nested/tab-switcher');
	const { NestedNavigationOpener } = require('im/messenger/controller/navigation/src/nested/opener');
	const { NestedNavigationContext } = require('im/messenger/controller/navigation/src/nested/context');
	const { AsyncQueue, withTimeout } = require('im/messenger/lib/utils');
	const { NestedMutationHandler } = require('im/messenger/controller/navigation/src/nested/mutation-handler');
	const {
		ProjectsTariffRestrictionFilter,
	} = require('im/messenger/controller/navigation/src/nested/open-filter/projects-tariff-restriction');

	const logger = getLoggerWithContext('navigation--manager', 'NavigationManager');

	/**
	 * @implements Unsubscribable
	 * @class NavigationManager
	 *
	 * Manages all navigation contexts: the global tab widget and any number
	 * of nested (collab) tab widgets. Analogous to MessengerHeaderManager.
	 */
	class NavigationManager
	{
		/** @type {TabSwitcher|null} */
		#globalTabSwitcher = null;
		/** @type {NestedNavigationContext[]} */
		#nestedContexts = [];
		#opener = new NestedNavigationOpener();
		#openQueue = new AsyncQueue();
		/** @type {NavigationApiHandler|null} */
		#apiHandler = null;
		/** @type {FolderTabsController|null} */
		#folderTabsController = null;
		/** @type {BaseNestedNavigationOpenFilter[]} */
		#openFilters = [
			new ProjectsTariffRestrictionFilter(),
		];

		/**
		 * Initializes the global tab switcher for the main tabs widget.
		 * Called once during app startup (after view is loaded).
		 * @param {object} widget — window.tabs
		 */
		initGlobalController(widget)
		{
			this.#globalTabSwitcher = new TabSwitcher(widget, {
				onTabChanged: (currentTabId, previousTabId) => this.#handleGlobalTabChanged(currentTabId, previousTabId),
				onNonSelectableTabTap: (tabId) => this.#handleNonSelectableTabTap(tabId),
			});
			this.#apiHandler = new NavigationApiHandler({
				setActiveTab: (tabId, options) => this.setActiveTab(tabId, options),
				closeAllWidgets: () => this.closeAllWidgets(),
				isTopNestedNavigationForChat: (chatId) => this.isTopNestedNavigationForChat(chatId),
				openNestedNavigation: (chatId) => this.openNestedNavigation(chatId),
			});

			if (Feature.isChatFoldersAvailable)
			{
				this.#folderTabsController = new FolderTabsController(this.#globalTabSwitcher);
				void this.#folderTabsController.init();
			}
		}

		/**
		 * @return {Promise<string>}
		 */
		async getActiveTab()
		{
			return this.#globalTabSwitcher.getActiveTab();
		}

		/**
		 * @param {string} tabId
		 * @param {TabOptions} options
		 * @returns {Promise<SelectionTabResult>}
		 */
		async setActiveTab(tabId, options = {})
		{
			return this.#globalTabSwitcher.setActiveTab(tabId, options);
		}

		async closeAllWidgets()
		{
			return PageManager.getNavigator().popTo('im.tabs');
		}

		/**
		 * @return {NestedNavigationContext|undefined}
		 */
		get #topNestedContext()
		{
			return this.#nestedContexts[this.#nestedContexts.length - 1];
		}

		/**
		 * Returns whether a nested navigation is currently open.
		 * @return {boolean}
		 */
		hasNestedNavigation()
		{
			return this.#nestedContexts.length > 0;
		}

		/**
		 * Returns the active tab of the topmost nested navigation, or null.
		 * @return {string|null}
		 */
		getNestedActiveTab()
		{
			return this.#topNestedContext?.switcher?.getActiveTab() ?? null;
		}

		/**
		 * Programmatically switches the active tab of the topmost nested navigation.
		 * @param {string} tabId
		 */
		setNestedActiveTab(tabId)
		{
			this.#topNestedContext?.switcher?.setActiveTab(tabId);
		}

		/**
		 * Returns the NestedTabCounters of the topmost nested navigation, or null.
		 * @return {NestedTabCounters|null}
		 */
		getActiveNestedTabCounters()
		{
			return this.#topNestedContext?.tabCounters ?? null;
		}

		/**
		 * Returns whether the topmost nested navigation belongs to the given parent chat.
		 * @param {number} chatId
		 * @return {boolean}
		 */
		isTopNestedNavigationForChat(chatId)
		{
			return Number(this.#topNestedContext?.chatId) === Number(chatId);
		}

		/**
		 * Opens nested tab navigation for the given parent chat.
		 * @param {number} chatId — chatId of the parent chat (parentChatId of nested chats)
		 * @returns {Promise<object>} widget instance
		 */
		async openNestedNavigation(chatId)
		{
			return this.#openQueue.enqueue(() => this.#openNestedNavigation(chatId));
		}

		async #openNestedNavigation(chatId)
		{
			if (Number(this.#topNestedContext?.chatId) === Number(chatId))
			{
				logger.warn('openNestedNavigation: already open for chatId', chatId);

				return this.#topNestedContext.widget;
			}

			if (!await this.#applyOpenFilters({ chatId }))
			{
				return null;
			}

			const recentManager = serviceLocator.get('recent-manager');

			const context = new NestedNavigationContext({
				chatId,
				sessionId: Uuid.getV4(),
				previousSessionId: recentManager.currentNestedSessionId,
				previousRecentId: recentManager.currentNestedSessionId === null
					? recentManager.currentListId
					: recentManager.currentNestedRecentId,
				widget: null,
			});

			try
			{
				const { widget } = await withTimeout(this.#opener.open(chatId), 2000);
				context.widget = widget;
			}
			catch (error)
			{
				logger.error('openNestedNavigation: open tabs widget error', error);

				return this.#topNestedContext?.widget;
			}

			recentManager.initControllerForWidget(
				NavigationTabId.collabDefault,
				context.widget,
				context.chatId,
				context.sessionId,
			);

			const dialogId = `chat${context.chatId}`;
			context.headerController = serviceLocator.get('messenger-header-manager')
				.registerNestedController(context.widget, dialogId);
			context.headerController.redrawRightButtonsIfNeeded(NavigationTabId.collabDefault);

			context.mutationHandler = new NestedMutationHandler(dialogId, context.headerController);

			context.switcher = new NestedTabSwitcher({
				widget: context.widget,
				initialTabId: NavigationTabId.collabDefault,
				onTabChanged: (tabId, isFirstInit) => this.#handleNestedTabChanged(context, tabId, isFirstInit),
				onDestroy: (initializedTabs) => this.#handleNestedDestroyed(context, initializedTabs),
			});

			context.tabCounters = new NestedTabCounters(context.widget, context.chatId);

			this.#nestedContexts.push(context);

			return context.widget;
		}

		/**
		 * @param {NestedNavigationOpenFilterContext} context
		 * @return {Promise<boolean>}
		 */
		async #applyOpenFilters(context)
		{
			// Sequential with early exit. Filters enforce business policy and may have
			// side effects, so subsequent filters never run after a block or a failure.
			// A filter that throws is treated as a block: state is unknown, policy could
			// be bypassed otherwise. Surface a generic error toast.
			for (const filter of this.#openFilters)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					const allowed = await filter.allow(context);
					if (!allowed)
					{
						return false;
					}
				}
				catch (error)
				{
					logger.error('applyOpenFilters: filter threw, blocking open', error);
					Notification.showErrorToast();

					return false;
				}
			}

			return true;
		}

		/**
		 * @return {Promise<void>}
		 */
		async makeMessengerTabActive()
		{
			return NavigationHelper.makeMessengerTabActive();
		}

		/**
		 * @return {Promise<boolean>}
		 */
		async isMessengerTabActive()
		{
			return NavigationHelper.isMessengerTabActive();
		}

		/**
		 * @param {NestedNavigationContext} context
		 * @param {string} tabId
		 * @param {boolean} isFirstInit
		 */
		#handleNestedTabChanged(context, tabId, isFirstInit)
		{
			const recentManager = serviceLocator.get('recent-manager');
			if (isFirstInit)
			{
				recentManager.initControllerForWidget(tabId, context.widget, context.chatId, context.sessionId);
			}
			else
			{
				recentManager.resumeNestedController(tabId, context.sessionId, context.chatId);
			}

			context.headerController?.redrawRightButtonsIfNeeded(tabId);
		}

		/**
		 * @param {NestedNavigationContext} context
		 * @param {Set<string>} initializedTabs
		 */
		#handleNestedDestroyed(context, initializedTabs)
		{
			const headerManager = serviceLocator.get('messenger-header-manager');
			headerManager.unregisterController(context.headerController);

			const recentManager = serviceLocator.get('recent-manager');

			recentManager.destroyNestedControllers(
				[...initializedTabs],
				context.sessionId,
			);
			recentManager.restorePreviousRecent(context.previousRecentId, context.previousSessionId);

			const index = this.#nestedContexts.indexOf(context);
			if (index !== -1)
			{
				this.#nestedContexts.splice(index, 1);
			}

			if (this.#topNestedContext)
			{
				this.#topNestedContext.headerController?.redrawTitleIfNeeded();
				const activeTab = this.#topNestedContext.switcher?.getActiveTab();
				if (activeTab)
				{
					this.#topNestedContext.headerController?.redrawRightButtonsIfNeeded(activeTab);
				}
			}
			else
			{
				headerManager.redrawGlobalTitle();
				headerManager.redrawRightButtonsIfNeeded(recentManager.currentListId);
			}

			context.destroy();
		}

		/**
		 * @param {string} tabId
		 */
		async #handleNonSelectableTabTap(tabId)
		{
			if (tabId === NonSelectableNavigationTabId.folderList)
			{
				this.#folderTabsController?.handleFolderListTap();
			}
		}

		/**
		 * @param {string} currentTabId
		 * @param {string} previousTabId
		 */
		#handleGlobalTabChanged(currentTabId, previousTabId)
		{
			serviceLocator.get('recent-manager').setActiveRecent(currentTabId);
			serviceLocator.get('messenger-header-manager').redrawRightButtonsIfNeeded(currentTabId);
			BX.postComponentEvent(EventType.navigation.tabChanged, [{ currentTabId, previousTabId }]);
		}

		unsubscribeEvents()
		{
			this.#globalTabSwitcher?.unsubscribeEvents();
			this.#apiHandler?.unsubscribeEvents();
			this.#folderTabsController?.destroy();

			const headerManager = serviceLocator.get('messenger-header-manager');
			for (const context of this.#nestedContexts)
			{
				headerManager.unregisterController(context.headerController);
				context.destroy();
			}

			this.#nestedContexts = [];
		}
	}

	module.exports = { NavigationManager };
});
