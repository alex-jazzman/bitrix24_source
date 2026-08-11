/**
 * @module im/messenger/lib/popup-menu/recent-actions/nested-recent-actions-menu
 */
jn.define('im/messenger/lib/popup-menu/recent-actions/nested-recent-actions-menu', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Type } = require('type');
	const { PopupMenu } = require('ui-system/popups/popup-menu');

	const { Loc } = require('im/messenger/loc');
	const { RecentFilterId, RecentMenuSection } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('popup-menu--nested-recent-actions', 'NestedRecentActionsMenu');

	const NestedActionId = Object.freeze({
		filterAll: 'nested-filter-all',
		filterUnread: 'nested-filter-unread',
		taskList: 'nested-task-list',
		feed: 'nested-feed',
		files: 'nested-files',
		calendar: 'nested-calendar',
		readAll: 'nested-read-all',
	});

	/**
	 * @class NestedRecentActionsMenu
	 * @description Popup menu with filter and action items for a nested navigation tab
	 */
	class NestedRecentActionsMenu
	{
		/** @type {Set<string>} */
		#sections;
		/** @type {AdditionalItem[]} */
		#additionalItems;
		/** @type {AdditionalSection[]} */
		#additionalSections;
		/** @type {string|null} */
		#targetId;
		/** @type {Map<string, Function>} */
		#additionalCallbackMap;
		/** @type {string} */
		#cacheId;

		/**
		 * @param {RecentActionsMenuOptions} [options]
		 */
		constructor(options = {})
		{
			this.#sections = new Set(options.sections ?? Object.values(RecentMenuSection));
			this.#targetId = options.targetId ?? null;
			this.#additionalItems = options.additionalItems ?? [];
			this.#additionalSections = options.additionalSections ?? [];
			this.#additionalCallbackMap = new Map(
				this.#additionalItems.map((item) => [item.id, item.callback]),
			);
			this.#cacheId = options.cacheId ?? 'im-messenger-nested-recent-actions-menu';
		}

		/**
		 * Returns whether the menu has at least one visible core item for the given sections.
		 *
		 * @returns {boolean}
		 */
		static hasVisibleItems()
		{
			return true;
		}

		/**
		 * Builds and displays the popup menu anchored to the target element.
		 *
		 * @returns {Promise<void>}
		 */
		async show()
		{
			try
			{
				serviceLocator.get('navigation-manager')?.getActiveNestedTabCounters()?.update();

				const items = await this.#buildItems();
				if (items.length === 0)
				{
					logger.log('show: no items to display, skip');

					return;
				}

				const sections = this.#buildSections(items);

				// PopupMenu.create({ cacheId }) caches the JS instance, keeping native target/callback
				// binding alive across taps. Bypasses DS setActions/show — it accumulates sections
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
		 * @returns {Promise<PopupMenuItem[]>}
		 */
		async #buildItems()
		{
			const allCoreItems = [
				this.#createFilterAllItem(),
				this.#createFilterUnreadItem(),
				this.#createTaskListItem(),
				this.#createFeedItem(),
				this.#createFilesItem(),
				this.#createCalendarItem(),
				this.#createReadAllItem(),
			];

			const visibleCoreItems = allCoreItems.filter((item) => this.#sections.has(item.sectionCode));
			const additionalItems = await this.#resolveAdditionalItems();

			return [...visibleCoreItems, ...additionalItems];
		}

		/**
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
		 * @returns {RecentController|null}
		 */
		#getNestedRecent()
		{
			return serviceLocator.get('recent-manager')?.getActiveNestedRecent() ?? null;
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createFilterAllItem()
		{
			return {
				id: NestedActionId.filterAll,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FILTER_ALL'),
				sectionCode: RecentMenuSection.filter,
				checked: this.#getNestedRecent()?.getCurrentFilterId() === RecentFilterId.all,
			};
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createFilterUnreadItem()
		{
			const recent = this.#getNestedRecent();
			const isChecked = recent?.getCurrentFilterId() === RecentFilterId.unread;

			const item = {
				id: NestedActionId.filterUnread,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_FILTER_UNREAD'),
				sectionCode: RecentMenuSection.filter,
				checked: isChecked,
			};

			if (!isChecked && recent)
			{
				const counterLabel = serviceLocator.get('navigation-manager')
					?.getActiveNestedTabCounters()
					?.getCounterLabel(recent.id) ?? '';
				if (counterLabel)
				{
					item.counterValue = counterLabel;
				}
			}

			return item;
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createTaskListItem()
		{
			return {
				id: NestedActionId.taskList,
				title: Loc.getMessage('IMMOBILE_MESSENGER_NESTED_RECENT_ACTIONS_MENU_TASK_LIST'),
				iconName: Icon.TASK.getIconName(),
				sectionCode: RecentMenuSection.project,
			};
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createFeedItem()
		{
			return {
				id: NestedActionId.feed,
				title: Loc.getMessage('IMMOBILE_MESSENGER_NESTED_RECENT_ACTIONS_MENU_FEED'),
				iconName: Icon.NEWSFEED.getIconName(),
				sectionCode: RecentMenuSection.project,
			};
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createFilesItem()
		{
			return {
				id: NestedActionId.files,
				title: Loc.getMessage('IMMOBILE_MESSENGER_NESTED_RECENT_ACTIONS_MENU_FILES'),
				iconName: Icon.ATTACH.getIconName(),
				sectionCode: RecentMenuSection.project,
			};
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createCalendarItem()
		{
			return {
				id: NestedActionId.calendar,
				title: Loc.getMessage('IMMOBILE_MESSENGER_NESTED_RECENT_ACTIONS_MENU_CALENDAR'),
				iconName: Icon.CALENDAR_WITH_SLOTS.getIconName(),
				sectionCode: RecentMenuSection.project,
			};
		}

		/**
		 * @returns {PopupMenuItem}
		 */
		#createReadAllItem()
		{
			return {
				id: NestedActionId.readAll,
				title: Loc.getMessage('IMMOBILE_MESSENGER_RECENT_ACTIONS_MENU_READ_ALL'),
				iconName: Icon.CHATS_WITH_CHECK.getIconName(),
				sectionCode: RecentMenuSection.general,
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
				{ id: RecentMenuSection.filter },
				{ id: RecentMenuSection.project },
				{ id: RecentMenuSection.general },
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

			switch (item.id)
			{
				case NestedActionId.filterAll:
				case NestedActionId.filterUnread:
				{
					const recent = this.#getNestedRecent();
					if (!recent)
					{
						logger.warn('handleItemSelected: nested recent not found, filter not applied', item.id);
						break;
					}

					const filterId = item.id === NestedActionId.filterAll
						? RecentFilterId.all
						: RecentFilterId.unread;
					void recent.applyFilter(filterId);
					break;
				}

				case NestedActionId.readAll:
					Notification.showComingSoon();
					break;

				case NestedActionId.taskList:
					void this.#openProjectTasks();
					break;

				case NestedActionId.feed:
					void this.#openProjectFeed();
					break;

				case NestedActionId.files:
					void this.#openProjectFiles();
					break;

				case NestedActionId.calendar:
					void this.#openProjectCalendar();
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

		/**
		 * @return {string|null}
		 */
		#getProjectId()
		{
			const recentManager = serviceLocator.get('recent-manager');
			const parentChatId = recentManager.getActiveNestedRecent()?.getParentChatId();

			if (!parentChatId)
			{
				return null;
			}

			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getByChatId'](parentChatId);

			return Type.isStringFilled(dialog?.entityId) ? dialog.entityId : null;
		}

		async #openProjectTasks()
		{
			const projectId = this.#getProjectId();
			if (Type.isNull(projectId))
			{
				Notification.showErrorToast();

				return;
			}

			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');
				void ProjectOpener.openTasks({ projectId: projectId });
			}
			catch (error)
			{
				logger.error('openProjectTasks: failed', error);
				Notification.showErrorToast();
			}
		}

		async #openProjectFeed()
		{
			const projectId = this.#getProjectId();
			if (Type.isNull(projectId))
			{
				Notification.showErrorToast();

				return;
			}

			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');
				void ProjectOpener.openNews({ projectId: projectId });
			}
			catch (error)
			{
				logger.error('openProjectFeed: failed', error);
				Notification.showErrorToast();
			}
		}

		async #openProjectFiles()
		{
			const projectId = this.#getProjectId();
			if (Type.isNull(projectId))
			{
				Notification.showErrorToast();

				return;
			}

			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');
				void ProjectOpener.openDisk({ projectId: projectId });
			}
			catch (error)
			{
				logger.error('openProjectFiles: failed', error);
				Notification.showErrorToast();
			}
		}

		async #openProjectCalendar()
		{
			const projectId = this.#getProjectId();
			if (Type.isNull(projectId))
			{
				Notification.showErrorToast();

				return;
			}

			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');
				void ProjectOpener.openCalendar({ projectId: projectId });
			}
			catch (error)
			{
				logger.error('openProjectFiles: failed', error);
				Notification.showErrorToast();
			}
		}
	}

	module.exports = { NestedRecentActionsMenu };
});
