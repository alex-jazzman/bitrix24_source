/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_activity_todoNotificationSkipMenu, crm_activity_todoPingSettingsMenu, crm_ai_nameService, crm_kanban_restriction, crm_kanban_sort, main_core, main_core_events, main_popup, ui_entitySelector) {
	'use strict';

	class AISettingsService {
		constructor(entityTypeId, categoryId) {
			this.entityTypeId = entityTypeId;
			this.categoryId = categoryId;
		}
		saveAutostartSettings(settings) {
			return main_core.ajax.runAction('crm.settings.ai.saveAutostartSettings', {
				json: {
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId,
					settings
				}
			});
		}
		getAutostartSettings() {
			return main_core.ajax.runAction('crm.settings.ai.getAutostartSettings', {
				json: {
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId
				}
			});
		}
		async saveWithErrorHandling(settings) {
			try {
				const response = await this.saveAutostartSettings(settings);
				return response.data.settings;
			} catch (error) {
				await console.error('Could not save ai settings', error);
				try {
					const response = await this.getAutostartSettings();
					return response.data.settings;
				} catch (fetchError) {
					await console.error('Could not fetch ai settings after error in save', fetchError);
					throw fetchError;
				}
			}
		}
	}

	/**
	 * channels for autostart copilot
	 */
	const CHANNEL_TYPE_CALL = 'call';
	const CHANNEL_TYPE_CHAT = 'chat';

	/**
	 * calls directions
	 */
	const CALL_DIRECTION_INCOMING = 1;
	const CALL_DIRECTION_OUTGOING = 2;

	/**
	 * popup menu CSS classes
	 */
	const CHECKED_CLASS = 'menu-popup-item-accept';
	const NOT_CHECKED_CLASS = 'menu-popup-item-none';

	/**
	 * other constants
	 */
	const COPILOT_LANGUAGE_ID_SAVE_REQUEST_DELAY = 750;
	const COPILOT_LANGUAGE_SELECTOR_POPUP_WIDTH = 300;

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

	/**
	 * @abstract
	 */
	class BaseChannelHandler {
		settings = null;
		extensionSettings = null;
		onActionClick = null;
		constructor(settings, extensionSettings) {
			this.settings = settings;
			this.extensionSettings = extensionSettings;
		}
		getMenuItems(showInfoHelper = null) {
			throw new Error('Method getMenuItems must be implemented');
		}
		handleAction(action) {
			throw new Error('Method handleAction must be implemented');
		}
		isActionActive(action) {
			throw new Error('Method isActionActive must be implemented');
		}
		getAllOperationTypes() {
			return this.extensionSettings.get('allAIOperationTypes').map(id => main_core.Text.toInteger(id));
		}
		getTranscribeOperationType() {
			return main_core.Text.toInteger(this.extensionSettings.get('transcribeAIOperationType'));
		}
		hasAIPackages() {
			return this.extensionSettings.get('isAIHasPackages');
		}
		createActionHandler(action) {
			return (event, menuItem) => {
				if (this.onActionClick) {
					this.onActionClick(event, menuItem, action);
				}
				this.handleAction(action);
			};
		}
		setActionClickHandler(callback) {
			this.onActionClick = callback;
		}
	}

	class CallChannelHandler extends BaseChannelHandler {
		getMenuItems(showInfoHelper = null) {
			return [{
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_FIRST_INCOMING_MSGVER_1'),
				className: this.isActionActive('firstCall') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('firstCall')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_INCOMING'),
				className: this.isActionActive('allCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allCalls')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_OUTGOING'),
				className: this.isActionActive('outgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('outgoingCalls')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_ALL_MSGVER_1'),
				className: this.isActionActive('allIncomingOutgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allIncomingOutgoingCalls')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
				className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('manual')
			}];
		}
		handleAction(action) {
			const operationTypes = this.getAllOperationTypes();
			switch (action) {
				case 'manual':
					this.settings.autostartOperationTypes = this.getAllOperationTypes().filter(typeId => typeId !== this.getTranscribeOperationType());
					break;
				case 'firstCall':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = true;
					this.settings.autostartCallDirections = [CALL_DIRECTION_INCOMING];
					break;
				case 'allCalls':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
					this.settings.autostartCallDirections = [CALL_DIRECTION_INCOMING];
					break;
				case 'outgoingCalls':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
					this.settings.autostartCallDirections = [CALL_DIRECTION_OUTGOING];
					break;
				case 'allIncomingOutgoingCalls':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
					this.settings.autostartCallDirections = [CALL_DIRECTION_INCOMING, CALL_DIRECTION_OUTGOING];
					break;
			}
		}
		isActionActive(action) {
			const isTranscriptionEnabled = this.settings.autostartOperationTypes.includes(this.getTranscribeOperationType());
			const hasPackages = this.hasAIPackages();
			const isOnlyFirst = this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording;
			const directions = this.settings.autostartCallDirections || [];
			const isOnlyIncoming = directions.length === 1 && directions.includes(CALL_DIRECTION_INCOMING);
			const isOnlyOutgoing = directions.length === 1 && directions.includes(CALL_DIRECTION_OUTGOING);
			const isBothDirections = directions.includes(CALL_DIRECTION_INCOMING) && directions.includes(CALL_DIRECTION_OUTGOING);
			switch (action) {
				case 'manual':
					return !isTranscriptionEnabled || !hasPackages;
				case 'firstCall':
					return isTranscriptionEnabled && hasPackages && isOnlyFirst && isOnlyIncoming;
				case 'allCalls':
					return isTranscriptionEnabled && hasPackages && isOnlyIncoming && !isOnlyFirst;
				case 'outgoingCalls':
					return isTranscriptionEnabled && hasPackages && isOnlyOutgoing && !isOnlyFirst;
				case 'allIncomingOutgoingCalls':
					return isTranscriptionEnabled && hasPackages && isBothDirections && !isOnlyFirst;
				default:
					return false;
			}
		}
	}

	class ChatChannelHandler extends BaseChannelHandler {
		getMenuItems(showInfoHelper = null) {
			return [{
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES_PROCESSING_FIRST_CHAT'),
				className: this.isActionActive('firstChat') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('firstChat')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES_PROCESSING_ALL'),
				className: this.isActionActive('allChats') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allChats')
			}, {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
				className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('manual')
			}];
		}
		handleAction(action) {
			const operationTypes = this.getAllOperationTypes();
			switch (action) {
				case 'firstChat':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartOnlyFirstChat = true;
					break;
				case 'allChats':
					this.settings.autostartOperationTypes = operationTypes;
					this.settings.autostartOnlyFirstChat = false;
					break;
				case 'manual':
					this.settings.autostartOperationTypes = [];
					this.settings.autostartOnlyFirstChat = false;
					break;
			}
		}
		isActionActive(action) {
			const hasPackages = this.hasAIPackages();
			const isOnlyFirst = this.settings.autostartOnlyFirstChat;
			const hasOperations = (this.settings.autostartOperationTypes || []).length > 0;
			switch (action) {
				case 'firstChat':
					return hasPackages && hasOperations && isOnlyFirst;
				case 'allChats':
					return hasPackages && hasOperations && !isOnlyFirst;
				case 'manual':
					return !hasOperations || !hasPackages;
				default:
					return false;
			}
		}
	}

	class ChannelHandlerFactory {
		// eslint-disable-next-line max-len
		static create(channelType, settings, extensionSettings) {
			switch (channelType) {
				case CHANNEL_TYPE_CALL:
					return new CallChannelHandler(settings, extensionSettings);
				case CHANNEL_TYPE_CHAT:
					return new ChatChannelHandler(settings, extensionSettings);
				default:
					throw new Error(`Unknown channel type: ${channelType}`);
			}
		}
		static getSupportedChannelTypes() {
			return [CHANNEL_TYPE_CALL, CHANNEL_TYPE_CHAT];
		}
	}

	class SettingsMigrator {
		static migrateToChannelFormat(settings) {
			if (settings && settings.channels) {
				return settings;
			}

			// old format migration to new format
			const result = {
				channels: {}
			};

			// call settings
			if (settings && (settings.autostartOperationTypes || !main_core.Type.isUndefined(settings.autostartCallDirections))) {
				result.channels[CHANNEL_TYPE_CALL] = {
					channelType: CHANNEL_TYPE_CALL,
					autostartOperationTypes: settings.autostartOperationTypes || [],
					// eslint-disable-next-line max-len
					autostartTranscriptionOnlyOnFirstCallWithRecording: Boolean(settings.autostartTranscriptionOnlyOnFirstCallWithRecording),
					autostartCallDirections: settings.autostartCallDirections || [CALL_DIRECTION_INCOMING]
				};
			}

			// chat settings
			if (settings && !main_core.Type.isUndefined(settings.autostartOnlyFirstChat)) {
				result.channels[CHANNEL_TYPE_CHAT] = {
					channelType: CHANNEL_TYPE_CHAT,
					autostartOperationTypes: [],
					// no such setting in old format
					autostartOnlyFirstChat: Boolean(settings.autostartOnlyFirstChat)
				};
			}
			return result;
		}
		static isValidChannelFormat(settings) {
			if (!main_core.Type.isPlainObject(settings)) {
				return false;
			}
			if (!main_core.Type.isPlainObject(settings.channels)) {
				return false;
			}

			// check each channel settings
			for (const [channelType, channelSettings] of Object.entries(settings.channels)) {
				if (!main_core.Type.isPlainObject(channelSettings)) {
					return false;
				}
				if (channelSettings.channelType !== channelType) {
					return false;
				}
				if (!main_core.Type.isArrayFilled(channelSettings.autostartOperationTypes)) {
					return false;
				}
			}
			return true;
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
		#aiAutostartSettings = null;
		#aiCopilotLanguageId = null;
		#isSetAiSettingsRequestRunning = false;
		#extensionSettings = main_core.Extension.getSettings('crm.settings-button-extender');
		#channelHandlers = new Map();
		#aiSettingsService;
		constructor(params) {
			this.#initializeProperties(params);
			this.#initializeMenus(params);
			this.#parseAISettings(params.aiAutostartSettings);
			this.#initializeChannelHandlers();
			this.#bindEvents();
		}
		destroy() {
			this.#channelHandlers.clear();
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
			this.#aiCopilotLanguageId = params.aiCopilotLanguageId;
			this.#aiSettingsService = new AISettingsService(this.#entityTypeId, this.#categoryId);
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
		#parseAISettings(aiSettingsJson) {
			const settingsJson = requireStringOrNull(aiSettingsJson, 'params.aiAutostartSettings');
			if (!main_core.Type.isStringFilled(settingsJson)) {
				return;
			}
			try {
				const rawSettings = JSON.parse(settingsJson);
				if (main_core.Type.isPlainObject(rawSettings)) {
					this.#aiAutostartSettings = SettingsMigrator.migrateToChannelFormat(rawSettings);
				}
			} catch (error) {
				throw new Error('Failed to parse AI settings:', error);
			}
		}
		#initializeChannelHandlers() {
			this.#channelHandlers.clear();
			if (!this.#aiAutostartSettings?.channels) {
				return;
			}
			Object.entries(this.#aiAutostartSettings.channels).forEach(([channelType, settings]) => {
				const handler = ChannelHandlerFactory.create(channelType, settings, this.#extensionSettings);
				if (handler) {
					handler.setActionClickHandler((event, menuItem, action) => {
						this.#handleChannelAction(channelType, action, event, menuItem);
					});
					this.#channelHandlers.set(channelType, handler);
				}
			});
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
			const showInfoHelper = this.#getInfoHelper();
			const menuItems = [];

			// call settings
			const callHandler = this.#channelHandlers.get(CHANNEL_TYPE_CALL);
			if (callHandler) {
				menuItems.push({
					text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS'),
					disabled: this.#isSetAiSettingsRequestRunning,
					items: callHandler.getMenuItems(showInfoHelper)
				});
			}

			// chat settings
			const chatHandler = this.#channelHandlers.get(CHANNEL_TYPE_CHAT);
			if (chatHandler) {
				menuItems.push({
					text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES'),
					disabled: this.#isSetAiSettingsRequestRunning,
					items: chatHandler.getMenuItems(showInfoHelper)
				});
			}
			if (main_core.Type.isStringFilled(this.#aiCopilotLanguageId)) {
				menuItems.push({
					text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_LANGUAGE_MSGVER_1'),
					onclick: this.#getInfoHelper(true) ?? this.#handleCoPilotLanguageSelect.bind(this)
				});
			}
			if (menuItems.length === 0) {
				return null;
			}
			return {
				text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_IN_CRM', crm_ai_nameService.NameService.copilotNameReplacement()),
				disabled: this.#isSetAiSettingsRequestRunning,
				items: menuItems
			};
		}
		#handleChannelAction(channelType, action, event, menuItem) {
			menuItem.getMenuWindow()?.getRootMenuWindow()?.close();
			menuItem.getMenuWindow()?.getParentMenuItem()?.disable();
			if (this.#isSetAiSettingsRequestRunning) {
				return;
			}
			this.#isSetAiSettingsRequestRunning = true;
			setTimeout(() => {
				this.#saveAISettings(menuItem);
			}, 50);
		}
		async #saveAISettings(menuItem) {
			try {
				this.#aiAutostartSettings = await this.#aiSettingsService.saveWithErrorHandling(this.#aiAutostartSettings);
				this.#initializeChannelHandlers();
			} catch {
				// error already handled in service
			} finally {
				menuItem.getMenuWindow()?.getParentMenuItem()?.enable();
				this.#isSetAiSettingsRequestRunning = false;
			}
		}
		#handleCoPilotLanguageSelect(event) {
			const languageSelector = new ui_entitySelector.Dialog({
				targetNode: event.target,
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				context: `COPILOT-LANGUAGE-SELECTOR-${this.#entityTypeId}-${this.#categoryId}`,
				width: COPILOT_LANGUAGE_SELECTOR_POPUP_WIDTH,
				tagSelectorOptions: {
					textBoxWidth: '100%'
				},
				preselectedItems: [['copilot_language', this.#aiCopilotLanguageId]],
				entities: [{
					id: 'copilot_language',
					options: {
						entityTypeId: this.#entityTypeId,
						categoryId: this.#categoryId
					}
				}],
				events: {
					'Item:onSelect': selectEvent => {
						const item = selectEvent.getData().item;
						const languageId = item.id.toLowerCase();
						if (!main_core.Type.isStringFilled(languageId)) {
							throw new Error('Language ID is not defined');
						}
						setTimeout(() => {
							let optionName = `ai_config_${this.#entityTypeId}`;
							if (main_core.Type.isInteger(this.#categoryId)) {
								optionName += `_${this.#categoryId}`;
							}
							main_core.userOptions.save('crm', optionName, 'languageId', languageId);
							this.#aiCopilotLanguageId = languageId;
						}, COPILOT_LANGUAGE_ID_SAVE_REQUEST_DELAY);
					}
				}
			});
			languageSelector.show();
		}
		#getInfoHelper(skipPackagesCheck = false) {
			if (skipPackagesCheck) {
				if (this.#extensionSettings.get('isAIEnabledInGlobalSettings')) {
					return null;
				}
				return () => {
					if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
						BX.UI.InfoHelper.show(this.#extensionSettings.get('aiDisabledSliderCode'));
					}
				};
			}
			if (this.#extensionSettings.get('isAIEnabledInGlobalSettings') && this.#extensionSettings.get('isAIHasPackages')) {
				return null;
			}
			return () => {
				if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
					if (!this.#extensionSettings.get('isAIEnabledInGlobalSettings')) {
						BX.UI.InfoHelper.show(this.#extensionSettings.get('aiDisabledSliderCode'));
					} else if (!this.#extensionSettings.get('isAIHasPackages')) {
						BX.UI.InfoHelper.show(this.#extensionSettings.get('aiPackagesEmptySliderCode'));
					}
				}
			};
		}

		// region Public methods
		updateAISettings(settings) {
			if (!SettingsMigrator.isValidChannelFormat(settings)) {
				throw new Error('Invalid settings format', settings);
			}
			this.#aiAutostartSettings = settings;
			this.#initializeChannelHandlers();
		}
		getChannelHandler(channelType) {
			return this.#channelHandlers.get(channelType);
		}
		isChannelAvailable(channelType) {
			return this.#channelHandlers.has(channelType);
		}
		getAvailableChannels() {
			return [...this.#channelHandlers.keys()];
		}
		// endregion
	}

	exports.SettingsButtonExtender = SettingsButtonExtender;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm.Activity, BX.Crm.Activity, BX.Crm.AI, BX.CRM.Kanban, BX.CRM.Kanban, BX, BX.Event, BX.Main, BX.UI.EntitySelector);
//# sourceMappingURL=settings-button-extender.bundle.js.map
