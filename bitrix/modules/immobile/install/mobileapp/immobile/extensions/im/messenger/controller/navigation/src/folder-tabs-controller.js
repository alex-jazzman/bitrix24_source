/**
 * @module im/messenger/controller/navigation/folder-tabs-controller
 */
jn.define('im/messenger/controller/navigation/folder-tabs-controller', (require, exports, module) => {
	const { Type } = require('type');
	const { MemoryStorage } = require('native/memorystore');
	const { Icon } = require('ui-system/blocks/icon');
	const { NavigationTabId, NonSelectableNavigationTabId, NavigationTabByFolderCode, Analytics } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { withTimeout } = require('im/messenger/lib/utils');
	const { FolderListView } = require('im/messenger/controller/folder/list');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const logger = getLoggerWithContext('navigation--folder-tabs-controller', 'FolderTabsController');
	const FOLDER_TABS_CONTROLLER_STORAGE_NAME = 'immobileFolderTabsController';
	const FOLDER_LIST_TAB_ADDED_STORAGE_KEY = 'folderListTabAdded';

	/**
	 * @class FolderTabsController
	 *
	 * Owns folder-tab specific logic in the global tabs widget. Subscribes to
	 * `folderModel/*` mutations and applies them to the supplied TabSwitcher
	 * (add / update / remove / move). Handles non-selectable folder-list tab tap.
	 */
	class FolderTabsController
	{
		/** @type {TabSwitcher} */
		#tabSwitcher = null;
		#folderModelSubscribed = false;
		#folderListTabAdded = false;
		#storage = new MemoryStorage(FOLDER_TABS_CONTROLLER_STORAGE_NAME);
		/** @type {Set<string>} */
		#personalFolderTabIds = new Set();

		/**
		 * @param {TabSwitcher} tabSwitcher  global TabSwitcher from NavigationManager
		 */
		constructor(tabSwitcher)
		{
			this.#tabSwitcher = tabSwitcher;
		}

		/**
		 * Initial sync with the store: seed personal folder tabs already rendered
		 * by the widget, append the non-selectable '...'-tab and subscribe to the
		 * folder model.
		 *
		 * @return {Promise<void>}
		 */
		async init()
		{
			await this.#initFolderTabs();
			this.#subscribeFolderModel();
		}

		async handleFolderListTap()
		{
			const opened = await FolderListView.open();
			if (opened)
			{
				AnalyticsService.getInstance().sendOpenFolderList(Analytics.SubSection.folderList);
			}
		}

		/**
		 * Full teardown — unsubscribe from store mutations and clear trackers.
		 */
		destroy()
		{
			this.#unsubscribeFolderModel();
			this.#personalFolderTabIds.clear();
			this.#folderListTabAdded = false;
		}

		async #initFolderTabs()
		{
			const folders = serviceLocator.get('core').getStore().getters['folderModel/getPersonalFolders']();

			// Personal folder tabs are already rendered by the widget — backend
			// includes them in the initial payload (see ImMobile NavigationTab
			// Manager::buildSortedItems for FolderProvider folders). Seed the
			// trackers so subsequent mutations route through updateItem/moveItems
			// instead of producing native duplicates via addItems.
			const items = folders.map((folder) => this.#createFolderTabItem(folder));
			logger.log('initFolderTabs seed personal folder tabs', items.map((item) => item.id));
			items.forEach((item) => this.#personalFolderTabIds.add(item.id));
			this.#tabSwitcher.seed(items);

			await this.#addFolderListTab();
		}

		async #addFolderListTab()
		{
			if (this.#isFolderListTabAdded())
			{
				this.#folderListTabAdded = true;
				logger.log('addFolderListTab skip existing tab');

				return;
			}

			// Native Android widget drops addItems calls without an explicit index;
			// position after every tab already rendered by the initial widget payload
			// (see ImMobile\NavigationTab\Manager::buildSortedItems — system + personal).
			const availableTabs = MessengerParams.get('AVAILABLE_TABS', {});
			const index = Object.keys(availableTabs).length;

			await this.#tabSwitcher.addItems([{
				id: NonSelectableNavigationTabId.folderList,
				title: '',
				icon: Icon.MORE.getIconName(),
				selectable: false,
			}], index);

			this.#folderListTabAdded = true;
			await this.#storage.set(FOLDER_LIST_TAB_ADDED_STORAGE_KEY, true);
		}

		/**
		 * MemoryStorage is used because tabs.nestedWidgets() does not return
		 * the runtime-added "..." tab after reload().
		 * @return {boolean}
		 */
		#isFolderListTabAdded()
		{
			return this.#folderListTabAdded || this.#storage.getSync(FOLDER_LIST_TAB_ADDED_STORAGE_KEY) === true;
		}

		#subscribeFolderModel()
		{
			if (this.#folderModelSubscribed)
			{
				return;
			}

			serviceLocator.get('core').getStoreManager()
				.on('folderModel/add', this.#handleFolderAdded)
				.on('folderModel/delete', this.#handleFolderDeleted)
				.on('folderModel/sort', this.#handleFoldersSorted)
				.on('folderModel/update', this.#handleFolderUpdated)
				.on('folderModel/setState', this.#handleFoldersSetState)
			;

			this.#folderModelSubscribed = true;
		}

		#unsubscribeFolderModel()
		{
			if (!this.#folderModelSubscribed)
			{
				return;
			}

			serviceLocator.get('core').getStoreManager()
				.off('folderModel/add', this.#handleFolderAdded)
				.off('folderModel/delete', this.#handleFolderDeleted)
				.off('folderModel/sort', this.#handleFoldersSorted)
				.off('folderModel/update', this.#handleFolderUpdated)
				.off('folderModel/setState', this.#handleFoldersSetState)
			;

			this.#folderModelSubscribed = false;
		}

		#handleFolderAdded = ({ payload }) => {
			const folder = payload?.data?.folder;
			logger.log('handleFolderAdded payload', payload);

			if (!this.#isPersonalFolder(folder))
			{
				return;
			}

			void this.#addOrUpdateFolderTab(folder, payload?.actionName === 'add');
		};

		async #addOrUpdateFolderTab(folder, shouldSwitch)
		{
			const tabItem = this.#createFolderTabItem(folder);
			if (this.#personalFolderTabIds.has(tabItem.id))
			{
				logger.log('addOrUpdateFolderTab update existing tab', tabItem.id, tabItem);
				// Await — setActiveTab below uses a separate queue.
				await this.#tabSwitcher.updateItem(tabItem.id, tabItem);
			}
			else
			{
				const index = this.#getFolderTabPosition(folder.id);
				logger.log('addOrUpdateFolderTab add tab', tabItem.id, {
					index,
					tabItem,
				});
				this.#personalFolderTabIds.add(tabItem.id);
				await this.#tabSwitcher.addItems([tabItem], index);
			}

			if (shouldSwitch)
			{
				logger.log('addOrUpdateFolderTab switch to created tab', tabItem.id);
				await this.#tabSwitcher.setActiveTab(tabItem.id);
			}
		}

		#handleFolderDeleted = ({ payload }) => {
			const id = payload?.data?.id;
			logger.log('handleFolderDeleted payload', payload);

			if (!Type.isNumber(id))
			{
				return;
			}

			const tabId = String(id);
			if (!this.#personalFolderTabIds.has(tabId))
			{
				return;
			}

			void this.#removeFolderTab(tabId);
		};

		async #removeFolderTab(tabId)
		{
			logger.log('removeFolderTab', tabId);
			this.#personalFolderTabIds.delete(tabId);
			await this.#switchToChatsIfRemovingActiveTab(tabId);

			await this.#tabSwitcher.removeItems([tabId]);
		}

		#handleFoldersSorted = ({ payload }) => {
			const sortedIds = payload?.data?.sortedIds;
			if (!Type.isArray(sortedIds))
			{
				return;
			}

			logger.log('handleFoldersSorted payload', payload);

			// Build moveItems for system + personal in folderModel order. Native
			// widget applies positions to passed ids and keeps untouched tabs
			// (folderList) in their relative spots — they fall into the trailing
			// free positions.
			const folders = serviceLocator.get('core').getStore().getters['folderModel/getList']();
			const items = [];
			folders.forEach((folder, index) => {
				const tabId = this.#getTabIdForFolder(folder);
				if (tabId)
				{
					items.push({ id: tabId, position: index });
				}
			});

			if (items.length > 0)
			{
				logger.log('handleFoldersSorted move items', items);
				void this.#reorderTabsKeepingActive(items);
			}
		};

		#getTabIdForFolder(folder)
		{
			if (folder?.type === 'personal')
			{
				return Type.isNumber(folder.id) ? String(folder.id) : null;
			}

			if (folder?.type === 'system')
			{
				return NavigationTabByFolderCode[folder.code] || null;
			}

			return null;
		}

		// Native `moveItems` resets the active tab — capture it first and
		// re-apply once the reorder is done so the user stays on the folder
		// they were viewing (e.g. after Save in `FolderListView`).
		async #reorderTabsKeepingActive(items)
		{
			const activeTabId = await this.#tabSwitcher.getActiveTab().catch(() => null);
			logger.log('reorderTabsKeepingActive', {
				activeTabId,
				items,
			});
			await this.#tabSwitcher.moveItems(items);
			if (activeTabId)
			{
				// activeTabId is either a system NavigationTabId or a folder-tab id.
				// If it's a folder-tab no longer in #personalFolderTabIds, a parallel
				// folderModel/delete handler has removed it between getActiveTab() and
				// setActiveTab() — fall back to chats so the user is never left
				// without an active tab.
				const isDeletedFolderTab = !NavigationTabId[activeTabId] && !this.#personalFolderTabIds.has(activeTabId);
				const restoredTabId = isDeletedFolderTab ? NavigationTabId.chats : activeTabId;
				await this.#tabSwitcher.setActiveTab(restoredTabId);
			}
		}

		#handleFolderUpdated = ({ payload }) => {
			const id = payload?.data?.id;
			logger.log('handleFolderUpdated payload', payload);

			if (!Type.isNumber(id))
			{
				return;
			}

			const folder = serviceLocator.get('core').getStore().getters['folderModel/getById'](id);
			if (!this.#isPersonalFolder(folder))
			{
				if (this.#personalFolderTabIds.has(String(id)))
				{
					logger.log('handleFolderUpdated remove non-personal tab', id, folder);
					void this.#removeFolderTab(String(id));
				}

				return;
			}

			logger.log('handleFolderUpdated update tab', id, folder);
			void this.#tabSwitcher.updateItem(String(id), this.#createFolderTabItem(folder));
		};

		#handleFoldersSetState = () => {
			logger.log('handleFoldersSetState reconcile');
			void this.#reconcileFolderTabs();
		};

		async #reconcileFolderTabs()
		{
			const folders = serviceLocator.get('core').getStore().getters['folderModel/getPersonalFolders']();
			const nextIds = new Set(folders.map((folder) => String(folder.id)));
			const idsToRemove = [...this.#personalFolderTabIds].filter((id) => !nextIds.has(id));
			logger.log('reconcileFolderTabs', {
				currentIds: [...this.#personalFolderTabIds],
				nextIds: [...nextIds],
				idsToRemove,
			});

			if (idsToRemove.length > 0)
			{
				const activeTab = await this.#tabSwitcher.getActiveTab().catch(() => null);
				if (activeTab && idsToRemove.includes(activeTab))
				{
					await this.#switchToChatsIfRemovingActiveTab(activeTab);
				}

				logger.log('reconcileFolderTabs remove items', idsToRemove);
				idsToRemove.forEach((id) => this.#personalFolderTabIds.delete(id));
				await this.#tabSwitcher.removeItems(idsToRemove);
			}

			for (const folder of folders)
			{
				const item = this.#createFolderTabItem(folder);
				if (this.#personalFolderTabIds.has(item.id))
				{
					logger.log('reconcileFolderTabs update item', item.id, item);
					await this.#tabSwitcher.updateItem(item.id, item);
					continue;
				}

				logger.log('reconcileFolderTabs add item', item.id, item);
				this.#personalFolderTabIds.add(item.id);
				await this.#tabSwitcher.addItems([item], this.#getFolderTabPosition(folder.id));
			}

			const items = this.#getPersonalFolderIds()
				.map((id) => ({
					id: String(id),
					position: this.#getFolderTabPosition(id),
				}))
			;

			if (items.length > 0)
			{
				logger.log('reconcileFolderTabs move items', items);
				await this.#tabSwitcher.moveItems(items);
			}
		}

		async #switchToChatsIfRemovingActiveTab(tabId)
		{
			const activeTab = await this.#tabSwitcher.getActiveTab().catch(() => null);
			if (activeTab !== tabId)
			{
				return;
			}

			logger.log('active folder tab will be removed, switch to chats first', tabId);
			const selectionResult = await this.#tabSwitcher.setActiveTab(NavigationTabId.chats);
			if (selectionResult?.isSuccess?.() === false)
			{
				logger.warn('switchToChatsIfRemovingActiveTab failed', selectionResult.getError?.());

				return;
			}

			// setActiveTab() only schedules native selection. Wait for onTabSelected
			// before removing the old tab, otherwise native may select the shifted next tab.
			await withTimeout(this.#tabSwitcher.getActiveTab(), 2000)
				.then((nextActiveTab) => {
					if (nextActiveTab !== NavigationTabId.chats)
					{
						logger.warn('switchToChatsIfRemovingActiveTab selected unexpected tab', {
							expected: NavigationTabId.chats,
							actual: nextActiveTab,
							removed: tabId,
						});
					}
				})
				.catch((error) => {
					logger.warn('switchToChatsIfRemovingActiveTab selection timed out', error);
				})
			;
		}

		#createFolderTabItem(folder)
		{
			// Mirrors ImMobile\NavigationTab\Tab\BaseRecent::getWidgetData() +
			// Tab\Folder::getWidgetSettings() — JN tabs-widget registers a nested
			// layout by widget.code; without it widget.nestedWidgets()[id] = null
			// and `RecentManager.initControllerForWidget` starts services without ui.
			const id = String(folder.id);

			return {
				id,
				title: folder.title,
				selectable: true,
				widget: {
					name: 'chat.recent',
					code: id,
					settings: {
						useSearch: true,
						preload: false,
						titleParams: {
							useLargeTitleMode: true,
							text: folder.title,
						},
						objectName: id,
					},
				},
				spotlightId: `tab-${id}`,
			};
		}

		#isPersonalFolder(folder)
		{
			return folder?.type === 'personal' && Type.isNumber(folder.id);
		}

		#getFolderTabPosition(folderId)
		{
			const sortedIds = serviceLocator.get('core').getStore().getters['folderModel/getSortedIds']();

			return Math.max(sortedIds.indexOf(folderId), 0);
		}

		#getPersonalFolderIds()
		{
			return serviceLocator.get('core').getStore().getters['folderModel/getPersonalFolders']()
				.map((folder) => folder.id)
			;
		}
	}

	module.exports = { FolderTabsController };
});
