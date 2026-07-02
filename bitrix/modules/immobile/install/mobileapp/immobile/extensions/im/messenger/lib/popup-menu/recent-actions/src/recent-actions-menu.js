/**
 * @module im/messenger/lib/popup-menu/recent-actions/recent-actions-menu
 */
jn.define('im/messenger/lib/popup-menu/recent-actions/recent-actions-menu', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { PopupMenu } = require('ui-system/popups/popup-menu');

	const { Loc } = require('im/messenger/loc');
	const { RecentFilterId, RecentActionId, NavigationTabId } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { readAllChatsByRecentTab } = require('im/messenger/lib/read-all-chats');
	const { FolderListView } = require('im/messenger/controller/folder/list');
	const { FolderUpdate } = require('im/messenger/controller/folder/update');
	const { deleteFolder, showDeleteSuccessToast } = require('im/messenger/controller/folder/lib/actions');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('popup-menu--recent-actions', 'RecentActionsMenu');

	const SectionId = Object.freeze({
		folderActions: 'folderActions',
		folderGeneral: 'folderGeneral',
		filter: 'filter',
		general: 'general',
	});

	const FolderActionId = Object.freeze({
		folderList: 'folder-list',
		folderSettings: 'folder-settings',
		folderDelete: 'folder-delete',
	});


	/**
	 * @class RecentActionsMenu
	 * @description Popup menu with filter and action items for a recent tab
	 */
	class RecentActionsMenu
	{
		#tabId;
		/** @type {AdditionalItem[]} */
		#additionalItems;
		/** @type {AdditionalSection[]} */
		#additionalSections;
		/** @type {string|null} */
		#targetId;
		/** @type {boolean} */
		#showFolderActions;
		/** @type {Set<string>|null} */
		#sections;
		/** @type {Map<string, Function>} */
		#additionalCallbackMap;
		/** @type {string} */
		#cacheId;

		/**
		 * @param {string} tabId - tab identifier to get the correct recent controller
		 * @param {RecentActionsMenuOptions} [options]
		 */
		constructor(tabId, options = {})
		{
			this.#tabId = tabId;
			this.#targetId = options.targetId ?? null;
			this.#showFolderActions = options.showFolderActions ?? false;
			this.#sections = Type.isArray(options.sections) ? new Set(options.sections) : null;
			this.#additionalItems = options.additionalItems ?? [];
			this.#additionalSections = options.additionalSections ?? [];
			this.#additionalCallbackMap = new Map(
				this.#additionalItems.map((item) => [item.id, item.callback]),
			);
			this.#cacheId = options.cacheId ?? 'im-messenger-recent-actions-menu';
		}

		/**
		 * Returns whether the menu has at least one visible core item
		 * (filters or "read all") for the given tab.
		 *
		 * @param {string} tabId
		 * @returns {boolean}
		 */
		static hasVisibleItems(tabId)
		{
			if (tabId !== NavigationTabId.openlines)
			{
				return true;
			}

			const locator = serviceLocator.get('recent-manager');
			const recent = locator?.getRecentById(tabId);

			return Boolean(Feature.isRecentFilterAvailable && recent?.isSupportedFilter());
		}

		/**
		 * Builds and displays the popup menu anchored to the target element.
		 * Does nothing if no visible items are available.
		 *
		 * @returns {Promise<void>}
		 */
		async show()
		{
			try
			{
				const items = await this.#buildItems();
				if (items.length === 0)
				{
					logger.log('show: no items to display, skip');

					return;
				}

				const sections = this.#buildSections(items);

				// PopupMenu.create({ cacheId }) caches the JS instance, keeping native target/callback
				// binding alive across long-taps. Bypasses DS setActions/show — it accumulates sections
				// across calls without clearing; raw setData replaces the snapshot atomically.
				const nativeMenu = PopupMenu.create({ cacheId: this.#cacheId }).getNativeElement();
				if (this.#targetId)
				{
					nativeMenu.setTarget(this.#targetId);
				}
				nativeMenu.setData(items, sections, (event, item) => {
					if (event === 'onItemSelected')
					{
						this.#handleItemSelected(item);
					}
				});
				nativeMenu.show();
			}
			catch (error)
			{
				logger.error('show: failed to display menu', error);
			}
		}

		/**
		 * @returns {RecentController|null}
		 */
		#getRecent()
		{
			const manager = serviceLocator.get('recent-manager');

			return manager?.getRecentById(this.#tabId) ?? null;
		}

		/**
		 * @returns {Promise<PopupMenuItem[]>}
		 */
		async #buildItems()
		{
			const recent = this.#getRecent();
			const coreItems = [
				this.#createFolderSettingsItem(),
				this.#createFolderDeleteItem(),
				this.#createFolderListItem(),
				this.#createFilterItem(recent, RecentFilterId.all, 'IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FILTER_ALL'),
				this.#createFilterItem(recent, RecentFilterId.unread, 'IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FILTER_UNREAD'),
				this.#createReadAllItem(),
			].filter((item) => !Type.isNull(item));

			const additionalItems = await this.#resolveAdditionalItems();

			return this.#filterItemsBySections([...coreItems, ...additionalItems]);
		}

		/**
		 * @param {PopupMenuItem[]} items
		 * @returns {PopupMenuItem[]}
		 */
		#filterItemsBySections(items)
		{
			if (!this.#sections)
			{
				return items;
			}

			return items.filter((item) => this.#sections.has(item.sectionCode));
		}

		/**
		 * Filters and maps #additionalItems to popup menu format,
		 * respecting each item's shouldShow condition.
		 *
		 * @returns {Promise<PopupMenuItem[]>}
		 */
		async #resolveAdditionalItems()
		{
			const results = await Promise.all(
				this.#additionalItems.map(async (item) => {
					if (Type.isFunction(item.shouldShow))
					{
						const isVisible = await item.shouldShow();
						if (!isVisible)
						{
							return null;
						}
					}

					return {
						id: item.id,
						title: Type.isFunction(item.title) ? item.title() : item.title,
						iconName: item.iconName ?? '',
						sectionCode: item.sectionCode,
						checked: Type.isFunction(item.checked) ? item.checked() : (item.checked ?? false),
					};
				}),
			);

			return results.filter((item) => !Type.isNull(item));
		}

		/**
		 * @returns {boolean}
		 */
		#isPersonalFolder()
		{
			const store = serviceLocator.get('core').getStore();

			return store.getters['folderModel/getById'](Number(this.#tabId))?.type === 'personal';
		}

		/**
		 * @returns {PopupMenuItem|null}
		 */
		#createFolderListItem()
		{
			if (!this.#showFolderActions || !Feature.isChatFoldersAvailable)
			{
				return null;
			}

			return {
				id: FolderActionId.folderList,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FOLDER_LIST'),
				sectionCode: SectionId.folderGeneral,
			};
		}

		/**
		 * @returns {PopupMenuItem|null}
		 */
		#createFolderSettingsItem()
		{
			if (!this.#showFolderActions || !Feature.isChatFoldersAvailable || !this.#isPersonalFolder())
			{
				return null;
			}

			return {
				id: FolderActionId.folderSettings,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FOLDER_SETTINGS'),
				sectionCode: SectionId.folderActions,
			};
		}

		/**
		 * @returns {PopupMenuItem|null}
		 */
		#createFolderDeleteItem()
		{
			if (!this.#showFolderActions || !Feature.isChatFoldersAvailable || !this.#isPersonalFolder())
			{
				return null;
			}

			return {
				id: FolderActionId.folderDelete,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FOLDER_DELETE'),
				iconName: Icon.TRASHCAN.getIconName(),
				sectionCode: SectionId.folderActions,
				styles: {
					title: {
						font: {
							color: Color.accentMainAlert.toHex(),
						},
					},
					icon: {
						color: Color.accentMainAlert.toHex(),
					},
				},
			};
		}

		/**
		 * @param {RecentController|null} recent
		 * @param {string} filterId
		 * @param {string} titleKey
		 * @returns {PopupMenuItem|null}
		 */
		#createFilterItem(recent, filterId, titleKey)
		{
			if (!recent || !(Feature.isRecentFilterAvailable && recent.isSupportedFilter()))
			{
				return null;
			}

			const item = {
				id: filterId,
				title: Loc.getMessage(titleKey),
				sectionCode: SectionId.filter,
				checked: recent.getCurrentFilterId() === filterId,
			};

			if (filterId === RecentFilterId.unread && !item.checked)
			{
				const counterLabel = this.#getTabCounterLabel();
				if (counterLabel)
				{
					item.counterValue = counterLabel;
				}
			}

			return item;
		}

		/**
		 * @returns {string}
		 */
		#getTabCounterLabel()
		{
			const tabCounters = serviceLocator.get('tab-counters');

			return tabCounters?.getCounterLabel(this.#tabId) ?? '';
		}

		/**
		 * @returns {PopupMenuItem|null}
		 */
		#createReadAllItem()
		{
			if (this.#tabId === NavigationTabId.openlines)
			{
				return null;
			}

			const title = this.#tabId === NavigationTabId.task
				? Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_READ_ALL_TASKS')
				: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_READ_ALL');

			return {
				id: RecentActionId.readAll,
				title,
				iconName: Icon.CHATS_WITH_CHECK.getIconName(),
				sectionCode: SectionId.general,
			};
		}

		/**
		 * Returns only sections that have at least one visible item.
		 *
		 * @param {PopupMenuItem[]} items
		 * @returns {PopupMenuSectionItem[]}
		 */
		#buildSections(items)
		{
			/** @type {PopupMenuSectionItem[]} */
			const coreSections = [
				{ id: SectionId.folderActions },
				{ id: SectionId.folderGeneral },
				{ id: SectionId.filter },
				{ id: SectionId.general },
			];

			const allSections = [...coreSections, ...this.#additionalSections];

			const presentSectionCodes = new Set(items.map((item) => item.sectionCode));

			return allSections.filter((section) => presentSectionCodes.has(section.id));
		}

		/**
		 * Dispatches the selected menu item to the appropriate handler.
		 *
		 * @param {PopupMenuItem} item
		 */
		#handleItemSelected(item)
		{
			logger.log('handleItemSelected', item.id);

			const recent = this.#getRecent();

			switch (item.id)
			{
				case FolderActionId.folderList:
					FolderListView.open();
					break;

				case FolderActionId.folderSettings:
					new FolderUpdate({ id: this.#tabId }).open();
					break;

				case FolderActionId.folderDelete:
					deleteFolder({
						folderId: Number(this.#tabId),
					})
						.then((ok) => {
							if (ok)
							{
								showDeleteSuccessToast();
							}
						})
						.catch((error) => {
							logger.error('folder delete error', error);
						})
					;
					break;

				case RecentFilterId.all:
				case RecentFilterId.unread:
					if (recent)
					{
						void recent.applyFilter(item.id);
					}
					break;

				case RecentActionId.readAll:
					void readAllChatsByRecentTab(this.#tabId);
					break;

				default:
				{
					const callback = this.#additionalCallbackMap.get(item.id);
					if (callback)
					{
						void callback();
					}
					else
					{
						logger.warn('handleItemSelected: unknown item', item.id);
					}
				}
			}
		}
	}

	module.exports = { RecentActionsMenu, RecentActionsMenuSection: SectionId };
});
