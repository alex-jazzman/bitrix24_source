/**
 * @module im/messenger/controller/navigation/tab-switcher
 */
jn.define('im/messenger/controller/navigation/tab-switcher', (require, exports, module) => {
	const { EventType, NonSelectableNavigationTabId } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AsyncQueue, withTimeout } = require('im/messenger/lib/utils');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { NavigationHelper } = require('im/messenger/controller/navigation/helper');
	const { SelectionTabResult } = require('im/messenger/controller/navigation/result');
	const {
		RecentActionsMenu,
		RecentActionsMenuSection,
	} = require('im/messenger/lib/popup-menu/recent-actions');

	const logger = getLoggerWithContext('tabs--switcher', 'TabSwitcher');

	/**
	 * @class TabSwitcher
	 */
	class TabSwitcher
	{
		#ui = null;
		/** @type {function(string, string): void} */
		#onTabChanged = null;
		/** @type {Partial<TabOptions>} */
		#activatedTabOptions = {};
		#currentTabId = MessengerParams.get('FIRST_TAB_ID', 'chats');
		#previousTabId;
		#queue = new AsyncQueue();
		// Mutations use a separate queue from setActiveTab — they sync the
		// native widget against the store (bursty pulls), not user navigation.
		#mutationQueue = new AsyncQueue();
		#selectingTabPromise = Promise.resolve({});
		#selectedTabResolver = () => {};

		/** @type {function(string): void|null} */
		#onNonSelectableTabTap = null;

		/**
		 * Cache of last-rendered visual state for each tab (id → snapshot).
		 * Used by `updateItem` to skip native calls when nothing visible changed.
		 * @type {Map<string, {title: string, label: string, counter: number, icon: string, selectable: boolean}>}
		 */
		#renderedTabs = new Map();

		/**
		 * @param {object} ui
		 * @param {object} options
		 * @param {function(string, string): void} options.onTabChanged
		 * @param {function(string): void} [options.onNonSelectableTabTap]
		 */
		constructor(ui, { onTabChanged, onNonSelectableTabTap })
		{
			this.#ui = ui;
			this.#onTabChanged = onTabChanged;
			this.#onNonSelectableTabTap = onNonSelectableTabTap;
			this.#subscribeEvents();
			this.#sendInitialAnalytics();
		}

		/**
		 * @return {Promise<string>}
		 */
		async getActiveTab()
		{
			await this.#selectingTabPromise;

			return this.#currentTabId;
		}

		/**
		 * @param  tabId
		 * @param {TabOptions} options
		 * @returns {Promise<SelectionTabResult>}
		 */
		async setActiveTab(tabId, options = {})
		{
			const { promise, resolve } = createPromiseWithResolvers();

			this.#queue.enqueue(async () => {
				const selectionTabResult = await this.#setActiveTab(tabId, options);

				resolve(selectionTabResult);
			});

			return promise;
		}

		async #setActiveTab(tabId, options = {})
		{
			logger.log('setActiveTab', tabId, options);
			if (!this.#isTabIdCorrect(tabId))
			{
				return SelectionTabResult.createByIncorrectTabId(tabId);
			}

			if (!this.#isTabAvailable(tabId))
			{
				return SelectionTabResult.createByTabIsNotAvailable(tabId);
			}

			// Bound the wait — native `onTabSelected` may never fire (widget destroyed,
			// tab id removed via `#mutationQueue` mid-flight, native silent-ignore).
			// Without a timeout the whole `#queue` would deadlock cascade-style.
			await withTimeout(this.#selectingTabPromise, 2000)
				.catch((error) => logger.warn('setActiveTab: previous selection timed out', error))
			;
			// Force-resolve the previous resolver in case the timeout fired —
			// idempotent if `#tabSelectedHandler` already resolved it.
			this.#selectedTabResolver();

			const { promise, resolve } = createPromiseWithResolvers();
			this.#selectingTabPromise = promise;
			this.#selectedTabResolver = resolve;

			this.#activatedTabOptions = options;

			this.#ui.setActiveItem(tabId);

			return new SelectionTabResult();
		}

		/**
		 * Pre-populate the rendered-tabs cache with items that are already on
		 * screen (e.g. tabs delivered by the initial widget payload from
		 * backend). After seeding, subsequent `addItems` calls for the same
		 * ids are routed to `updateItem` and do not duplicate natively.
		 *
		 * @param {Array<object>} items
		 * @return {void}
		 */
		seed(items)
		{
			for (const item of items)
			{
				if (!item || !item.id)
				{
					continue;
				}

				this.#renderedTabs.set(item.id, this.#extractVisualState(item));
			}
		}

		/**
		 * @param {Array<object>} items
		 * @param {number} [index]
		 * @return {Promise<void>}
		 *
		 * Native `addItems` does NOT deduplicate by id — passing an id that is
		 * already on screen creates a second tab with the same id. We use the
		 * `#renderedTabs` cache as the source of truth and route already-known
		 * ids through `updateItem` instead of letting them duplicate natively.
		 */
		async addItems(items, index)
		{
			return this.#mutationQueue.enqueue(() => this.#addItemsInternal(items, index));
		}

		async #addItemsInternal(items, index)
		{
			const itemsToAdd = [];
			const itemsToUpdate = [];
			const seenIds = new Set();
			for (const item of items)
			{
				if (seenIds.has(item.id))
				{
					continue;
				}
				seenIds.add(item.id);

				if (this.#renderedTabs.has(item.id))
				{
					itemsToUpdate.push(item);
				}
				else
				{
					itemsToAdd.push(item);
				}
			}

			if (itemsToUpdate.length > 0)
			{
				logger.warn(
					'addItems received already-tracked tab id(s); routing to updateItem',
					itemsToUpdate.map((item) => item.id),
				);
				for (const item of itemsToUpdate)
				{
					// Internal call — going through the public wrapper would deadlock on #mutationQueue.
					this.#updateItemInternal(item.id, item);
				}
			}

			if (itemsToAdd.length === 0)
			{
				return;
			}

			itemsToAdd.forEach((item) => {
				this.#renderedTabs.set(item.id, this.#extractVisualState(item));
			});

			await this.#ui.addItems(itemsToAdd, index);

			const emitter = serviceLocator.get('emitter');
			itemsToAdd.forEach((item) => {
				emitter?.emit(EventType.navigation.tabRegistered, [{ tabId: item.id }]);
			});
		}

		/**
		 * @param {Array<string>} ids
		 * @return {Promise<void>}
		 */
		async removeItems(ids)
		{
			return this.#mutationQueue.enqueue(() => this.#removeItemsInternal(ids));
		}

		async #removeItemsInternal(ids)
		{
			ids.forEach((id) => {
				this.#renderedTabs.delete(id);
			});

			return this.#ui.removeItems(ids);
		}

		/**
		 * @param {string} id
		 * @param {object} item
		 * @return {Promise<void>}
		 */
		async updateItem(id, item)
		{
			return this.#mutationQueue.enqueue(() => this.#updateItemInternal(id, item));
		}

		#updateItemInternal(id, item)
		{
			const current = this.#renderedTabs.get(id);
			const next = this.#extractVisualState({
				id,
				...current,
				...item,
			});

			if (current && this.#isEqualVisualState(current, next))
			{
				return;
			}

			this.#renderedTabs.set(id, next);
			this.#ui.updateItem(id, item);
		}

		/**
		 * @param {Array<{id: string, position: number}>} items
		 * @return {Promise<void>}
		 */
		async moveItems(items)
		{
			return this.#mutationQueue.enqueue(() => this.#moveItemsInternal(items));
		}

		async #moveItemsInternal(items)
		{
			return this.#ui.moveItems(items);
		}

		#isTabIdCorrect(tabId)
		{
			return NavigationHelper.isTabIdCorrect(tabId) || this.#renderedTabs.has(tabId);
		}

		#isTabAvailable(tabId)
		{
			if (NavigationHelper.isTabIdCorrect(tabId))
			{
				return NavigationHelper.isTabAvailable(tabId);
			}

			const rendered = this.#renderedTabs.get(tabId);

			return rendered?.selectable === true;
		}

		#extractVisualState(item)
		{
			return {
				title: item.title,
				label: item.label,
				counter: item.counter,
				icon: item.icon,
				selectable: item.selectable,
			};
		}

		#isEqualVisualState(a, b)
		{
			return a.title === b.title
				&& a.label === b.label
				&& a.counter === b.counter
				&& a.icon === b.icon
				&& a.selectable === b.selectable
			;
		}

		/**
		 * @param {object} tab
		 * @param {boolean} changed
		 */
		#tabSelectedHandler = (tab, changed) => {
			this.#selectedTabResolver();

			if (NonSelectableNavigationTabId[tab.id])
			{
				logger.log('onTabSelected select non selectable element', tab.id);

				this.#onNonSelectableTabTap?.(tab.id);

				return;
			}

			if (!changed)
			{
				logger.log('onTabSelected select active element', this.#currentTabId);

				return;
			}

			if (this.#currentTabId === tab.id)
			{
				logger.log('onTabSelected selected tab is equal current, this.currentTab:', this.#currentTabId, tab.id);

				return;
			}

			this.#previousTabId = this.#currentTabId;
			this.#currentTabId = tab.id;

			this.#sendAnalyticsChangeTab();
			this.#activatedTabOptions = {};

			logger.warn('onTabSelected tabs:', {
				current: this.#currentTabId,
				previous: this.#previousTabId,
			}, tab, changed);

			this.#onTabChanged(this.#currentTabId, this.#previousTabId);
		};

		/**
		 * @param {object} tab
		 * @param {boolean} changed
		 */
		#tabLongPressedHandler = (tab, changed) => {
			logger.log('onTabLongPressed', tab);

			const isCurrentTab = this.#currentTabId === tab.id;
			if (!isCurrentTab && !Feature.isChatFoldersAvailable)
			{
				return;
			}

			const menuOptions = {
				targetId: tab.spotlightId,
				showFolderActions: Feature.isChatFoldersAvailable,
				cacheId: 'im-messenger-recent-actions-menu:tab-long-tap',
			};

			if (!isCurrentTab)
			{
				menuOptions.sections = [
					RecentActionsMenuSection.folderActions,
					RecentActionsMenuSection.folderGeneral,
				];
			}

			const menu = new RecentActionsMenu(tab.id, menuOptions);
			void menu.show();
		};

		/**
		 * @param {String} id
		 */
		#rootTabsSelectedHandler = (id) =>	{
			logger.log('onRootTabsSelected id:', id);

			const rootTabChatName = 'chats';
			if (id === rootTabChatName)
			{
				this.#sendAnalyticsChangeTab();
			}
		};

		#subscribeEvents()
		{
			this.#ui.on(EventType.navigation.onTabSelected, this.#tabSelectedHandler);
			this.#ui.on(EventType.navigation.tabLongPressed, this.#tabLongPressedHandler);
			BX.addCustomEvent(EventType.navigation.onRootTabsSelected, this.#rootTabsSelectedHandler);
		}

		unsubscribeEvents()
		{
			// Unblock anything awaiting `#selectingTabPromise` — after this point
			// native callbacks won't arrive.
			this.#selectedTabResolver();

			this.#ui.off(EventType.navigation.onTabSelected, this.#tabSelectedHandler);
			this.#ui.off(EventType.navigation.tabLongPressed, this.#tabLongPressedHandler);
			BX.removeCustomEvent(EventType.navigation.onRootTabsSelected, this.#rootTabsSelectedHandler);
		}

		#sendAnalyticsChangeTab()
		{
			AnalyticsService.getInstance()
				.sendChangeNavigationTab(this.#currentTabId, this.#activatedTabOptions?.analytics)
			;
		}

		#sendInitialAnalytics()
		{
			NavigationHelper.isMessengerTabActive()
				.then((result) => {
					if (result)
					{
						this.#sendAnalyticsChangeTab();
					}
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.sendInitialAnalytics error`, error);
				})
			;
		}
	}

	module.exports = { TabSwitcher };
});
