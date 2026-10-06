/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_activity_todoNotificationSkipMenu, crm_activity_todoPingSettingsMenu, crm_ai_nameService, crm_kanban_restriction, crm_kanban_sort, main_core, main_core_events, main_popup) {
	'use strict';

	/**
	 * popup menu CSS classes
	 */
	const CHECKED_CLASS = 'menu-popup-item-accept';
	const NOT_CHECKED_CLASS = 'menu-popup-item-none';

	function requireClassOrNull(param, constructor, paramName) {
		if (main_core.Type.isNil(param)) {
			return param;
		}
		return requireClass(param, constructor, paramName);
	}
	function requireClass(param, constructor, paramName) {
		if (param instanceof constructor) {
			return param;
		}
		throw new Error(`Expected ${paramName} be an instance of ${constructor.name}, got ${getType(param)} instead`);
	}
	function requireArrayOfString(param, paramName) {
		if (!main_core.Type.isArray(param)) {
			throw new TypeError(`Expected ${paramName} should be an array of strings, got ${getType(param)} instead`);
		}
		param.forEach((value, index) => {
			if (!main_core.Type.isString(value)) {
				throw new TypeError(`Expected ${paramName} should be an array of strings, instead the element at index ${index} is ${getType(value)}`);
			}
		});
		return param;
	}
	function requireStringOrNull(param, paramName) {
		if (main_core.Type.isStringFilled(param) || main_core.Type.isNil(param)) {
			return param;
		}
		throw new Error(`Expected ${paramName} be either non-empty string or null, got ${getType(param)} instead`);
	}
	function getType(value) {
		if (main_core.Type.isObject(value) && !main_core.Type.isPlainObject(value)) {
			return value?.constructor?.name || 'unknown';
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		return typeof value;
	}

	const aliases = main_core.Extension.getSettings('crm.settings-button-extender').get('createTimeAliases', {});
	const DefaultSort = {};
	for (const entityTypeId in aliases) {
		DefaultSort[entityTypeId] = {
			column: aliases[entityTypeId],
			order: 'desc'
		};
	}
	Object.freeze(DefaultSort);

	class SortController {
		#entityTypeId;
		#grid;
		constructor(entityTypeId, grid) {
			this.#entityTypeId = main_core.Text.toInteger(entityTypeId);
			this.#grid = requireClass(grid, BX.Main.grid, 'grid');
		}
		isLastActivitySortSupported() {
			return this.#isColumnExists('LAST_ACTIVITY_TIME');
		}
		isLastActivitySortEnabled() {
			const options = this.#grid.getUserOptions().getCurrentOptions();
			const column = options.last_sort_by;
			const order = options.last_sort_order;
			return column?.toLowerCase() === 'last_activity_time' && order?.toLowerCase() === 'desc';
		}
		toggleLastActivitySort() {
			if (this.isLastActivitySortEnabled()) {
				this.#disableLastActivitySort();
			} else {
				this.#enableLastActivitySort();
			}
		}
		async #disableLastActivitySort() {
			const sort = DefaultSort[this.#entityTypeId];
			let column;
			if (main_core.Type.isPlainObject(sort) && this.#isColumnExists(sort.column) && this.#isColumnSortable(sort.column)) {
				column = sort.column;
				if (!this.#isColumnShowed(column)) {
					await this.#showColumn(column);
				}
				this.#setSortOrder(column, sort.order);
			} else {
				// fist showed different sortable
				column = this.#getShowedColumnList().find(columnName => {
					return columnName !== 'LAST_ACTIVITY_TIME' && this.#isColumnSortable(columnName);
				});
			}
			this.#grid.sortByColumn(column);
		}
		async #enableLastActivitySort() {
			if (!this.#isColumnShowed('LAST_ACTIVITY_TIME')) {
				await this.#showColumn('LAST_ACTIVITY_TIME');
			}
			this.#setSortOrder('LAST_ACTIVITY_TIME', 'desc');
			this.#grid.sortByColumn('LAST_ACTIVITY_TIME');
		}
		#isColumnExists(column) {
			return this.#grid.getParam('COLUMNS_ALL', {}).hasOwnProperty(column);
		}
		#isColumnShowed(column) {
			return this.#getShowedColumnList().includes(column);
		}
		#isColumnSortable(column) {
			const columnParams = this.#grid.getColumnByName(column);
			return !!(columnParams && columnParams.sort !== false);
		}
		#getShowedColumnList() {
			return this.#grid.getSettingsWindow().getShowedColumns();
		}
		#setSortOrder(column, order) {
			this.#grid.getColumnByName(column).sort_order = order;
		}
		#showColumn(column) {
			return new Promise((resolve, reject) => {
				if (!this.#isColumnExists(column)) {
					reject(new Error(`Column ${column} does not exists`));
					return;
				}
				if (this.#isColumnShowed(column)) {
					reject(new Error(`Column ${column} is showed already`));
					return;
				}
				this.#grid.getSettingsWindow().select(column);
				const showedColumns = this.#getShowedColumnList();
				showedColumns.push(column);
				this.#grid.getSettingsWindow().saveColumns(showedColumns, resolve);
			});
		}
	}

	const EntityType = main_core.Reflection.getClass('BX.CrmEntityType');
	/**
	 * @memberOf BX.Crm
	 */
	class SettingsButtonExtender {
		#entityTypeId;
		#categoryId;
		#pingSettings;
		#rootMenu;
		#targetItemId;
		#expandsBehindThan;
		#kanbanController;
		#restriction;
		#gridController = null;
		#todoSkipMenu;
		#todoPingSettingsMenu;
		#isSetSortRequestRunning = false;
		#smartActivityNotificationSupported = false;
		#isAutomationSliderAvailable = false;
		constructor(params) {
			this.#initializeProperties(params);
			this.#initializeMenus(params);
			this.#bindEvents();
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribeAll(main_core_events.EventEmitter.GLOBAL_TARGET, 'onPopupShow');
		}
		#initializeProperties(params) {
			this.#entityTypeId = main_core.Text.toInteger(params.entityTypeId);
			this.#categoryId = main_core.Type.isInteger(params.categoryId) ? params.categoryId : null;
			this.#pingSettings = main_core.Type.isPlainObject(params.pingSettings) ? params.pingSettings : {};
			this.#expandsBehindThan = requireArrayOfString(params.expandsBehindThan ?? [], 'params.expandsBehindThan');
			this.#smartActivityNotificationSupported = main_core.Text.toBoolean(params.smartActivityNotificationSupported);
			if (EntityType && !EntityType.isDefined(this.#entityTypeId)) {
				throw new Error(`Provided entityTypeId is invalid: ${this.#entityTypeId}`);
			}
			this.#rootMenu = requireClass(params.rootMenu, main_popup.Menu, 'params.rootMenu');
			this.#targetItemId = requireStringOrNull(params.targetItemId, 'params.targetItemId');
			this.#kanbanController = requireClassOrNull(params.controller, crm_kanban_sort.SettingsController, 'params.controller');
			this.#restriction = requireClassOrNull(params.restriction, crm_kanban_restriction.Restriction, 'params.restriction');
			if (main_core.Reflection.getClass('BX.Main.grid') && params.grid) {
				this.#gridController = new SortController(this.#entityTypeId, params.grid);
			}
			this.#isAutomationSliderAvailable = params.isAutomationSliderAvailable === true;
		}
		#initializeMenus(params) {
			this.#todoSkipMenu = new crm_activity_todoNotificationSkipMenu.TodoNotificationSkipMenu({
				entityTypeId: this.#entityTypeId,
				selectedValue: requireStringOrNull(params.todoCreateNotificationSkipPeriod, 'params.todoCreateNotificationSkipPeriod')
			});
			if (Object.keys(this.#pingSettings).length > 0) {
				this.#todoPingSettingsMenu = new crm_activity_todoPingSettingsMenu.TodoPingSettingsMenu({
					entityTypeId: this.#entityTypeId,
					settings: this.#pingSettings
				});
			}
		}
		#bindEvents() {
			const createdMenuItemIds = [];
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onPopupShow', event => {
				const popup = event.getTarget();
				if (popup.getId() !== this.#rootMenu.getId()) {
					return;
				}
				const items = this.#getItems();
				if (items.length <= 0) {
					return;
				}
				while (createdMenuItemIds.length > 0) {
					this.#rootMenu.removeMenuItem(createdMenuItemIds.pop());
				}
				let targetItemId = this.#resolveEarlyTargetId();
				for (const item of items.reverse())
				// new item is *prepended* on top of target item, therefore reverse
				{
					const newItem = this.#rootMenu.addMenuItem(item, targetItemId);
					if (newItem) {
						targetItemId = newItem.getId();
						createdMenuItemIds.push(newItem.getId());
					}
				}
			});
		}
		#getItems() {
			const items = [];
			const pushCrmSettings = this.#getPushCrmSettings();
			if (pushCrmSettings) {
				items.push(pushCrmSettings);
			}
			const coPilotSettings = this.#getCoPilotSettings();
			if (coPilotSettings) {
				items.push(coPilotSettings);
			}
			return items;
		}
		#resolveEarlyTargetId() {
			const items = this.#rootMenu.getMenuItems();
			const earlyItem = items.find(item => this.#expandsBehindThan.includes(item.getId()));
			return earlyItem?.getId() ?? this.#targetItemId;
		}
		#getPushCrmSettings() {
			const pushCrmItems = [];
			if (this.#shouldShowLastActivitySortToggle()) {
				pushCrmItems.push(this.#getLastActivitySortToggle());
			}
			if (this.#shouldShowTodoSkipMenu()) {
				pushCrmItems.push(...this.#todoSkipMenu.getItems());
			}
			if (this.#shouldShowTodoPingSettingsMenu()) {
				pushCrmItems.push(...this.#todoPingSettingsMenu.getItems());
			}
			if (pushCrmItems.length <= 0) {
				return null;
			}
			return {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM'),
				items: pushCrmItems
			};
		}
		#shouldShowLastActivitySortToggle() {
			const shouldShowInKanban = this.#kanbanController?.getCurrentSettings().isTypeSupported(crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME) && this.#restriction?.isSortTypeChangeAvailable();
			return !!(shouldShowInKanban || this.#gridController?.isLastActivitySortSupported());
		}
		#getLastActivitySortToggle() {
			return {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM_TOGGLE_SORT'),
				disabled: this.#isSetSortRequestRunning,
				className: this.#isLastActivitySortEnabled() ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: this.#handleLastActivitySortToggleClick.bind(this)
			};
		}
		#isLastActivitySortEnabled() {
			if (this.#kanbanController) {
				return this.#kanbanController.getCurrentSettings().getCurrentType() === crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME;
			}
			if (this.#gridController) {
				return this.#gridController.isLastActivitySortEnabled();
			}
			return false;
		}
		#handleLastActivitySortToggleClick(event, item) {
			item.getMenuWindow()?.getRootMenuWindow()?.close();
			item.disable();
			if (this.#kanbanController) {
				if (this.#isSetSortRequestRunning) {
					return;
				}
				this.#isSetSortRequestRunning = true;
				const settings = this.#kanbanController.getCurrentSettings();
				const newSortType = settings.getCurrentType() === crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME ? settings.getSupportedTypes().find(sortType => sortType !== crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME) : crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME;
				this.#kanbanController.setCurrentSortType(newSortType).then(() => {}).catch(() => {}).finally(() => {
					this.#isSetSortRequestRunning = false;
					item.enable();
				});
			} else if (this.#gridController) {
				this.#gridController.toggleLastActivitySort();
				item.enable();
			} else {
				throw new Error('Can not handle last activity toggle click');
			}
		}
		#shouldShowTodoSkipMenu() {
			return this.#smartActivityNotificationSupported;
		}
		#shouldShowTodoPingSettingsMenu() {
			return this.#todoPingSettingsMenu && this.#shouldShowLastActivitySortToggle();
		}
		#getCoPilotSettings() {
			if (!this.#isAutomationSliderAvailable) {
				return null;
			}
			return {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_IN_CRM', crm_ai_nameService.NameService.copilotNameReplacement()),
				onclick: this.#openAutomationSlider.bind(this)
			};
		}
		async #openAutomationSlider() {
			this.#rootMenu.close();
			try {
				const {
					SettingsSliderApp
				} = await main_core.Runtime.loadExtension('crm.ai.settings-slider');
				const slider = new SettingsSliderApp(this.#entityTypeId, this.#categoryId);
				slider.open();
			} catch (error) {
				console.error(error);
			}
		}
	}

	exports.SettingsButtonExtender = SettingsButtonExtender;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm.Activity, BX.Crm.Activity, BX.Crm.AI, BX.CRM.Kanban, BX.CRM.Kanban, BX, BX.Event, BX.Main);
//# sourceMappingURL=settings-button-extender.bundle.js.map
