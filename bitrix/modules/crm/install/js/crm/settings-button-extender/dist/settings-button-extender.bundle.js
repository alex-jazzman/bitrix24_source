/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core_events,ui_entitySelector,crm_activity_todoNotificationSkipMenu,crm_activity_todoPingSettingsMenu,crm_kanban_restriction,crm_kanban_sort,main_core,main_popup) {
	'use strict';

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
	    var _value$constructor;
	    return (value == null ? void 0 : (_value$constructor = value.constructor) == null ? void 0 : _value$constructor.name) || 'unknown';
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

	var _entityTypeId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _grid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grid");
	var _disableLastActivitySort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disableLastActivitySort");
	var _enableLastActivitySort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enableLastActivitySort");
	var _isColumnExists = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isColumnExists");
	var _isColumnShowed = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isColumnShowed");
	var _isColumnSortable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isColumnSortable");
	var _getShowedColumnList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getShowedColumnList");
	var _setSortOrder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setSortOrder");
	var _showColumn = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showColumn");
	class SortController {
	  constructor(entityTypeId, grid) {
	    Object.defineProperty(this, _showColumn, {
	      value: _showColumn2
	    });
	    Object.defineProperty(this, _setSortOrder, {
	      value: _setSortOrder2
	    });
	    Object.defineProperty(this, _getShowedColumnList, {
	      value: _getShowedColumnList2
	    });
	    Object.defineProperty(this, _isColumnSortable, {
	      value: _isColumnSortable2
	    });
	    Object.defineProperty(this, _isColumnShowed, {
	      value: _isColumnShowed2
	    });
	    Object.defineProperty(this, _isColumnExists, {
	      value: _isColumnExists2
	    });
	    Object.defineProperty(this, _enableLastActivitySort, {
	      value: _enableLastActivitySort2
	    });
	    Object.defineProperty(this, _disableLastActivitySort, {
	      value: _disableLastActivitySort2
	    });
	    Object.defineProperty(this, _entityTypeId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _grid, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId] = main_core.Text.toInteger(entityTypeId);
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid] = requireClass(grid, BX.Main.grid, 'grid');
	  }
	  isLastActivitySortSupported() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _isColumnExists)[_isColumnExists]('LAST_ACTIVITY_TIME');
	  }
	  isLastActivitySortEnabled() {
	    const options = babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getUserOptions().getCurrentOptions();
	    const column = options.last_sort_by;
	    const order = options.last_sort_order;
	    return (column == null ? void 0 : column.toLowerCase()) === 'last_activity_time' && (order == null ? void 0 : order.toLowerCase()) === 'desc';
	  }
	  toggleLastActivitySort() {
	    if (this.isLastActivitySortEnabled()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _disableLastActivitySort)[_disableLastActivitySort]();
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _enableLastActivitySort)[_enableLastActivitySort]();
	    }
	  }
	}
	async function _disableLastActivitySort2() {
	  const sort = DefaultSort[babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId]];
	  let column;
	  if (main_core.Type.isPlainObject(sort) && babelHelpers.classPrivateFieldLooseBase(this, _isColumnExists)[_isColumnExists](sort.column) && babelHelpers.classPrivateFieldLooseBase(this, _isColumnSortable)[_isColumnSortable](sort.column)) {
	    column = sort.column;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isColumnShowed)[_isColumnShowed](column)) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _showColumn)[_showColumn](column);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _setSortOrder)[_setSortOrder](column, sort.order);
	  } else {
	    // fist showed different sortable
	    column = babelHelpers.classPrivateFieldLooseBase(this, _getShowedColumnList)[_getShowedColumnList]().find(columnName => {
	      return columnName !== 'LAST_ACTIVITY_TIME' && babelHelpers.classPrivateFieldLooseBase(this, _isColumnSortable)[_isColumnSortable](columnName);
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].sortByColumn(column);
	}
	async function _enableLastActivitySort2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isColumnShowed)[_isColumnShowed]('LAST_ACTIVITY_TIME')) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _showColumn)[_showColumn]('LAST_ACTIVITY_TIME');
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _setSortOrder)[_setSortOrder]('LAST_ACTIVITY_TIME', 'desc');
	  babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].sortByColumn('LAST_ACTIVITY_TIME');
	}
	function _isColumnExists2(column) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getParam('COLUMNS_ALL', {}).hasOwnProperty(column);
	}
	function _isColumnShowed2(column) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _getShowedColumnList)[_getShowedColumnList]().includes(column);
	}
	function _isColumnSortable2(column) {
	  const columnParams = babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getColumnByName(column);
	  return !!(columnParams && columnParams.sort !== false);
	}
	function _getShowedColumnList2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getSettingsWindow().getShowedColumns();
	}
	function _setSortOrder2(column, order) {
	  babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getColumnByName(column).sort_order = order;
	}
	function _showColumn2(column) {
	  return new Promise((resolve, reject) => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isColumnExists)[_isColumnExists](column)) {
	      reject(new Error(`Column ${column} does not exists`));
	      return;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isColumnShowed)[_isColumnShowed](column)) {
	      reject(new Error(`Column ${column} is showed already`));
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getSettingsWindow().select(column);
	    const showedColumns = babelHelpers.classPrivateFieldLooseBase(this, _getShowedColumnList)[_getShowedColumnList]();
	    showedColumns.push(column);
	    babelHelpers.classPrivateFieldLooseBase(this, _grid)[_grid].getSettingsWindow().saveColumns(showedColumns, resolve);
	  });
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
	 * @abstract
	 */
	class BaseChannelHandler {
	  constructor(settings, extensionSettings) {
	    this.settings = null;
	    this.extensionSettings = null;
	    this.onActionClick = null;
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
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('firstCall')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_INCOMING'),
	      className: this.isActionActive('allCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('allCalls')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_OUTGOING'),
	      className: this.isActionActive('outgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('outgoingCalls')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_ALL_MSGVER_1'),
	      className: this.isActionActive('allIncomingOutgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('allIncomingOutgoingCalls')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
	      className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('manual')
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
	      default:
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
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('firstChat')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES_PROCESSING_ALL'),
	      className: this.isActionActive('allChats') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('allChats')
	    }, {
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
	      className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	      onclick: showInfoHelper != null ? showInfoHelper : this.createActionHandler('manual')
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
	      default:
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

	const EntityType = main_core.Reflection.getClass('BX.CrmEntityType');
	var _entityTypeId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _categoryId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("categoryId");
	var _pingSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pingSettings");
	var _rootMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rootMenu");
	var _targetItemId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetItemId");
	var _expandsBehindThan = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("expandsBehindThan");
	var _kanbanController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("kanbanController");
	var _restriction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restriction");
	var _gridController = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("gridController");
	var _todoSkipMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("todoSkipMenu");
	var _todoPingSettingsMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("todoPingSettingsMenu");
	var _isSetSortRequestRunning = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSetSortRequestRunning");
	var _smartActivityNotificationSupported = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("smartActivityNotificationSupported");
	var _aiAutostartSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("aiAutostartSettings");
	var _aiCopilotLanguageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("aiCopilotLanguageId");
	var _isSetAiSettingsRequestRunning = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSetAiSettingsRequestRunning");
	var _extensionSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("extensionSettings");
	var _channelHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("channelHandlers");
	var _aiSettingsService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("aiSettingsService");
	var _initializeProperties = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeProperties");
	var _initializeMenus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeMenus");
	var _parseAISettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseAISettings");
	var _initializeChannelHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeChannelHandlers");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _getItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItems");
	var _resolveEarlyTargetId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resolveEarlyTargetId");
	var _getPushCrmSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPushCrmSettings");
	var _shouldShowLastActivitySortToggle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowLastActivitySortToggle");
	var _getLastActivitySortToggle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastActivitySortToggle");
	var _isLastActivitySortEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLastActivitySortEnabled");
	var _handleLastActivitySortToggleClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleLastActivitySortToggleClick");
	var _shouldShowTodoSkipMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowTodoSkipMenu");
	var _shouldShowTodoPingSettingsMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowTodoPingSettingsMenu");
	var _getCoPilotSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCoPilotSettings");
	var _handleChannelAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleChannelAction");
	var _saveAISettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveAISettings");
	var _handleCoPilotLanguageSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCoPilotLanguageSelect");
	var _getInfoHelper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInfoHelper");
	/**
	 * @memberOf BX.Crm
	 */
	class SettingsButtonExtender {
	  constructor(_params) {
	    Object.defineProperty(this, _getInfoHelper, {
	      value: _getInfoHelper2
	    });
	    Object.defineProperty(this, _handleCoPilotLanguageSelect, {
	      value: _handleCoPilotLanguageSelect2
	    });
	    Object.defineProperty(this, _saveAISettings, {
	      value: _saveAISettings2
	    });
	    Object.defineProperty(this, _handleChannelAction, {
	      value: _handleChannelAction2
	    });
	    Object.defineProperty(this, _getCoPilotSettings, {
	      value: _getCoPilotSettings2
	    });
	    Object.defineProperty(this, _shouldShowTodoPingSettingsMenu, {
	      value: _shouldShowTodoPingSettingsMenu2
	    });
	    Object.defineProperty(this, _shouldShowTodoSkipMenu, {
	      value: _shouldShowTodoSkipMenu2
	    });
	    Object.defineProperty(this, _handleLastActivitySortToggleClick, {
	      value: _handleLastActivitySortToggleClick2
	    });
	    Object.defineProperty(this, _isLastActivitySortEnabled, {
	      value: _isLastActivitySortEnabled2
	    });
	    Object.defineProperty(this, _getLastActivitySortToggle, {
	      value: _getLastActivitySortToggle2
	    });
	    Object.defineProperty(this, _shouldShowLastActivitySortToggle, {
	      value: _shouldShowLastActivitySortToggle2
	    });
	    Object.defineProperty(this, _getPushCrmSettings, {
	      value: _getPushCrmSettings2
	    });
	    Object.defineProperty(this, _resolveEarlyTargetId, {
	      value: _resolveEarlyTargetId2
	    });
	    Object.defineProperty(this, _getItems, {
	      value: _getItems2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _initializeChannelHandlers, {
	      value: _initializeChannelHandlers2
	    });
	    Object.defineProperty(this, _parseAISettings, {
	      value: _parseAISettings2
	    });
	    Object.defineProperty(this, _initializeMenus, {
	      value: _initializeMenus2
	    });
	    Object.defineProperty(this, _initializeProperties, {
	      value: _initializeProperties2
	    });
	    Object.defineProperty(this, _entityTypeId$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _categoryId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _pingSettings, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _rootMenu, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _targetItemId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _expandsBehindThan, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _kanbanController, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _restriction, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _gridController, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _todoSkipMenu, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _todoPingSettingsMenu, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isSetSortRequestRunning, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _smartActivityNotificationSupported, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _aiAutostartSettings, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _aiCopilotLanguageId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isSetAiSettingsRequestRunning, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _extensionSettings, {
	      writable: true,
	      value: main_core.Extension.getSettings('crm.settings-button-extender')
	    });
	    Object.defineProperty(this, _channelHandlers, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _aiSettingsService, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeProperties)[_initializeProperties](_params);
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeMenus)[_initializeMenus](_params);
	    babelHelpers.classPrivateFieldLooseBase(this, _parseAISettings)[_parseAISettings](_params.aiAutostartSettings);
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeChannelHandlers)[_initializeChannelHandlers]();
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].clear();
	    main_core_events.EventEmitter.unsubscribeAll(main_core_events.EventEmitter.GLOBAL_TARGET, 'onPopupShow');
	  }
	  // region Public methods
	  updateAISettings(settings) {
	    if (!SettingsMigrator.isValidChannelFormat(settings)) {
	      throw new Error('Invalid settings format', settings);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings] = settings;
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeChannelHandlers)[_initializeChannelHandlers]();
	  }
	  getChannelHandler(channelType) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].get(channelType);
	  }
	  isChannelAvailable(channelType) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].has(channelType);
	  }
	  getAvailableChannels() {
	    return [...babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].keys()];
	  }
	  // endregion
	}
	function _initializeProperties2(params) {
	  var _params$expandsBehind;
	  babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1] = main_core.Text.toInteger(params.entityTypeId);
	  babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId] = main_core.Type.isInteger(params.categoryId) ? params.categoryId : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _pingSettings)[_pingSettings] = main_core.Type.isPlainObject(params.pingSettings) ? params.pingSettings : {};
	  babelHelpers.classPrivateFieldLooseBase(this, _expandsBehindThan)[_expandsBehindThan] = requireArrayOfString((_params$expandsBehind = params.expandsBehindThan) != null ? _params$expandsBehind : [], 'params.expandsBehindThan');
	  babelHelpers.classPrivateFieldLooseBase(this, _smartActivityNotificationSupported)[_smartActivityNotificationSupported] = main_core.Text.toBoolean(params.smartActivityNotificationSupported);
	  if (EntityType && !EntityType.isDefined(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1])) {
	    throw new Error(`Provided entityTypeId is invalid: ${babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1]}`);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _rootMenu)[_rootMenu] = requireClass(params.rootMenu, main_popup.Menu, 'params.rootMenu');
	  babelHelpers.classPrivateFieldLooseBase(this, _targetItemId)[_targetItemId] = requireStringOrNull(params.targetItemId, 'params.targetItemId');
	  babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController] = requireClassOrNull(params.controller, crm_kanban_sort.SettingsController, 'params.controller');
	  babelHelpers.classPrivateFieldLooseBase(this, _restriction)[_restriction] = requireClassOrNull(params.restriction, crm_kanban_restriction.Restriction, 'params.restriction');
	  if (main_core.Reflection.getClass('BX.Main.grid') && params.grid) {
	    babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController] = new SortController(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1], params.grid);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _aiCopilotLanguageId)[_aiCopilotLanguageId] = params.aiCopilotLanguageId;
	  babelHelpers.classPrivateFieldLooseBase(this, _aiSettingsService)[_aiSettingsService] = new AISettingsService(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1], babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId]);
	}
	function _initializeMenus2(params) {
	  babelHelpers.classPrivateFieldLooseBase(this, _todoSkipMenu)[_todoSkipMenu] = new crm_activity_todoNotificationSkipMenu.TodoNotificationSkipMenu({
	    entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1],
	    selectedValue: requireStringOrNull(params.todoCreateNotificationSkipPeriod, 'params.todoCreateNotificationSkipPeriod')
	  });
	  if (Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _pingSettings)[_pingSettings]).length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _todoPingSettingsMenu)[_todoPingSettingsMenu] = new crm_activity_todoPingSettingsMenu.TodoPingSettingsMenu({
	      entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1],
	      settings: babelHelpers.classPrivateFieldLooseBase(this, _pingSettings)[_pingSettings]
	    });
	  }
	}
	function _parseAISettings2(aiSettingsJson) {
	  const settingsJson = requireStringOrNull(aiSettingsJson, 'params.aiAutostartSettings');
	  if (!main_core.Type.isStringFilled(settingsJson)) {
	    return;
	  }
	  try {
	    const rawSettings = JSON.parse(settingsJson);
	    if (main_core.Type.isPlainObject(rawSettings)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings] = SettingsMigrator.migrateToChannelFormat(rawSettings);
	    }
	  } catch (error) {
	    throw new Error('Failed to parse AI settings:', error);
	  }
	}
	function _initializeChannelHandlers2() {
	  var _babelHelpers$classPr;
	  babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].clear();
	  if (!((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings]) != null && _babelHelpers$classPr.channels)) {
	    return;
	  }
	  Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings].channels).forEach(([channelType, settings]) => {
	    const handler = ChannelHandlerFactory.create(channelType, settings, babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings]);
	    if (handler) {
	      handler.setActionClickHandler((event, menuItem, action) => {
	        babelHelpers.classPrivateFieldLooseBase(this, _handleChannelAction)[_handleChannelAction](channelType, action, event, menuItem);
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].set(channelType, handler);
	    }
	  });
	}
	function _bindEvents2() {
	  const createdMenuItemIds = [];
	  main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onPopupShow', event => {
	    const popup = event.getTarget();
	    if (popup.getId() !== babelHelpers.classPrivateFieldLooseBase(this, _rootMenu)[_rootMenu].getId()) {
	      return;
	    }
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _getItems)[_getItems]();
	    if (items.length <= 0) {
	      return;
	    }
	    while (createdMenuItemIds.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _rootMenu)[_rootMenu].removeMenuItem(createdMenuItemIds.pop());
	    }
	    let targetItemId = babelHelpers.classPrivateFieldLooseBase(this, _resolveEarlyTargetId)[_resolveEarlyTargetId]();
	    for (const item of items.reverse())
	    // new item is *prepended* on top of target item, therefore reverse
	    {
	      const newItem = babelHelpers.classPrivateFieldLooseBase(this, _rootMenu)[_rootMenu].addMenuItem(item, targetItemId);
	      if (newItem) {
	        targetItemId = newItem.getId();
	        createdMenuItemIds.push(newItem.getId());
	      }
	    }
	  });
	}
	function _getItems2() {
	  const items = [];
	  const pushCrmSettings = babelHelpers.classPrivateFieldLooseBase(this, _getPushCrmSettings)[_getPushCrmSettings]();
	  if (pushCrmSettings) {
	    items.push(pushCrmSettings);
	  }
	  const coPilotSettings = babelHelpers.classPrivateFieldLooseBase(this, _getCoPilotSettings)[_getCoPilotSettings]();
	  if (coPilotSettings) {
	    items.push(coPilotSettings);
	  }
	  return items;
	}
	function _resolveEarlyTargetId2() {
	  var _earlyItem$getId;
	  const items = babelHelpers.classPrivateFieldLooseBase(this, _rootMenu)[_rootMenu].getMenuItems();
	  const earlyItem = items.find(item => babelHelpers.classPrivateFieldLooseBase(this, _expandsBehindThan)[_expandsBehindThan].includes(item.getId()));
	  return (_earlyItem$getId = earlyItem == null ? void 0 : earlyItem.getId()) != null ? _earlyItem$getId : babelHelpers.classPrivateFieldLooseBase(this, _targetItemId)[_targetItemId];
	}
	function _getPushCrmSettings2() {
	  const pushCrmItems = [];
	  if (babelHelpers.classPrivateFieldLooseBase(this, _shouldShowLastActivitySortToggle)[_shouldShowLastActivitySortToggle]()) {
	    pushCrmItems.push(babelHelpers.classPrivateFieldLooseBase(this, _getLastActivitySortToggle)[_getLastActivitySortToggle]());
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _shouldShowTodoSkipMenu)[_shouldShowTodoSkipMenu]()) {
	    pushCrmItems.push(...babelHelpers.classPrivateFieldLooseBase(this, _todoSkipMenu)[_todoSkipMenu].getItems());
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _shouldShowTodoPingSettingsMenu)[_shouldShowTodoPingSettingsMenu]()) {
	    pushCrmItems.push(...babelHelpers.classPrivateFieldLooseBase(this, _todoPingSettingsMenu)[_todoPingSettingsMenu].getItems());
	  }
	  if (pushCrmItems.length <= 0) {
	    return null;
	  }
	  return {
	    text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM'),
	    items: pushCrmItems
	  };
	}
	function _shouldShowLastActivitySortToggle2() {
	  var _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4;
	  const shouldShowInKanban = ((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController]) == null ? void 0 : _babelHelpers$classPr2.getCurrentSettings().isTypeSupported(crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME)) && ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _restriction)[_restriction]) == null ? void 0 : _babelHelpers$classPr3.isSortTypeChangeAvailable());
	  return !!(shouldShowInKanban || (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController]) != null && _babelHelpers$classPr4.isLastActivitySortSupported());
	}
	function _getLastActivitySortToggle2() {
	  return {
	    text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM_TOGGLE_SORT'),
	    disabled: babelHelpers.classPrivateFieldLooseBase(this, _isSetSortRequestRunning)[_isSetSortRequestRunning],
	    className: babelHelpers.classPrivateFieldLooseBase(this, _isLastActivitySortEnabled)[_isLastActivitySortEnabled]() ? CHECKED_CLASS : NOT_CHECKED_CLASS,
	    onclick: babelHelpers.classPrivateFieldLooseBase(this, _handleLastActivitySortToggleClick)[_handleLastActivitySortToggleClick].bind(this)
	  };
	}
	function _isLastActivitySortEnabled2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController]) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController].getCurrentSettings().getCurrentType() === crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController]) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController].isLastActivitySortEnabled();
	  }
	  return false;
	}
	function _handleLastActivitySortToggleClick2(event, item) {
	  var _item$getMenuWindow, _item$getMenuWindow$g;
	  (_item$getMenuWindow = item.getMenuWindow()) == null ? void 0 : (_item$getMenuWindow$g = _item$getMenuWindow.getRootMenuWindow()) == null ? void 0 : _item$getMenuWindow$g.close();
	  item.disable();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController]) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isSetSortRequestRunning)[_isSetSortRequestRunning]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _isSetSortRequestRunning)[_isSetSortRequestRunning] = true;
	    const settings = babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController].getCurrentSettings();
	    const newSortType = settings.getCurrentType() === crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME ? settings.getSupportedTypes().find(sortType => sortType !== crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME) : crm_kanban_sort.Type.BY_LAST_ACTIVITY_TIME;
	    babelHelpers.classPrivateFieldLooseBase(this, _kanbanController)[_kanbanController].setCurrentSortType(newSortType).then(() => {}).catch(() => {}).finally(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _isSetSortRequestRunning)[_isSetSortRequestRunning] = false;
	      item.enable();
	    });
	  } else if (babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _gridController)[_gridController].toggleLastActivitySort();
	    item.enable();
	  } else {
	    throw new Error('Can not handle last activity toggle click');
	  }
	}
	function _shouldShowTodoSkipMenu2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _smartActivityNotificationSupported)[_smartActivityNotificationSupported];
	}
	function _shouldShowTodoPingSettingsMenu2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _todoPingSettingsMenu)[_todoPingSettingsMenu] && babelHelpers.classPrivateFieldLooseBase(this, _shouldShowLastActivitySortToggle)[_shouldShowLastActivitySortToggle]();
	}
	function _getCoPilotSettings2() {
	  const showInfoHelper = babelHelpers.classPrivateFieldLooseBase(this, _getInfoHelper)[_getInfoHelper]();
	  const menuItems = [];

	  // call settings
	  const callHandler = babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].get(CHANNEL_TYPE_CALL);
	  if (callHandler) {
	    menuItems.push({
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS'),
	      disabled: babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning],
	      items: callHandler.getMenuItems(showInfoHelper)
	    });
	  }

	  // chat settings
	  const chatHandler = babelHelpers.classPrivateFieldLooseBase(this, _channelHandlers)[_channelHandlers].get(CHANNEL_TYPE_CHAT);
	  if (chatHandler) {
	    menuItems.push({
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES'),
	      disabled: babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning],
	      items: chatHandler.getMenuItems(showInfoHelper)
	    });
	  }
	  if (main_core.Type.isStringFilled(babelHelpers.classPrivateFieldLooseBase(this, _aiCopilotLanguageId)[_aiCopilotLanguageId])) {
	    var _babelHelpers$classPr5;
	    menuItems.push({
	      text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_LANGUAGE_MSGVER_1'),
	      onclick: (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _getInfoHelper)[_getInfoHelper](true)) != null ? _babelHelpers$classPr5 : babelHelpers.classPrivateFieldLooseBase(this, _handleCoPilotLanguageSelect)[_handleCoPilotLanguageSelect].bind(this)
	    });
	  }
	  if (menuItems.length === 0) {
	    return null;
	  }
	  return {
	    text: main_core.Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_IN_CRM'),
	    disabled: babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning],
	    items: menuItems
	  };
	}
	function _handleChannelAction2(channelType, action, event, menuItem) {
	  var _menuItem$getMenuWind, _menuItem$getMenuWind2, _menuItem$getMenuWind3, _menuItem$getMenuWind4;
	  (_menuItem$getMenuWind = menuItem.getMenuWindow()) == null ? void 0 : (_menuItem$getMenuWind2 = _menuItem$getMenuWind.getRootMenuWindow()) == null ? void 0 : _menuItem$getMenuWind2.close();
	  (_menuItem$getMenuWind3 = menuItem.getMenuWindow()) == null ? void 0 : (_menuItem$getMenuWind4 = _menuItem$getMenuWind3.getParentMenuItem()) == null ? void 0 : _menuItem$getMenuWind4.disable();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning] = true;
	  setTimeout(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _saveAISettings)[_saveAISettings](menuItem);
	  }, 50);
	}
	async function _saveAISettings2(menuItem) {
	  try {
	    babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings] = await babelHelpers.classPrivateFieldLooseBase(this, _aiSettingsService)[_aiSettingsService].saveWithErrorHandling(babelHelpers.classPrivateFieldLooseBase(this, _aiAutostartSettings)[_aiAutostartSettings]);
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeChannelHandlers)[_initializeChannelHandlers]();
	  } catch {
	    // error already handled in service
	  } finally {
	    var _menuItem$getMenuWind5, _menuItem$getMenuWind6;
	    (_menuItem$getMenuWind5 = menuItem.getMenuWindow()) == null ? void 0 : (_menuItem$getMenuWind6 = _menuItem$getMenuWind5.getParentMenuItem()) == null ? void 0 : _menuItem$getMenuWind6.enable();
	    babelHelpers.classPrivateFieldLooseBase(this, _isSetAiSettingsRequestRunning)[_isSetAiSettingsRequestRunning] = false;
	  }
	}
	function _handleCoPilotLanguageSelect2(event) {
	  const languageSelector = new ui_entitySelector.Dialog({
	    targetNode: event.target,
	    multiple: false,
	    showAvatars: false,
	    dropdownMode: true,
	    compactView: true,
	    enableSearch: true,
	    context: `COPILOT-LANGUAGE-SELECTOR-${babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1]}-${babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId]}`,
	    width: COPILOT_LANGUAGE_SELECTOR_POPUP_WIDTH,
	    tagSelectorOptions: {
	      textBoxWidth: '100%'
	    },
	    preselectedItems: [['copilot_language', babelHelpers.classPrivateFieldLooseBase(this, _aiCopilotLanguageId)[_aiCopilotLanguageId]]],
	    entities: [{
	      id: 'copilot_language',
	      options: {
	        entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1],
	        categoryId: babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId]
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
	          let optionName = `ai_config_${babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1]}`;
	          if (main_core.Type.isInteger(babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId])) {
	            optionName += `_${babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId]}`;
	          }
	          main_core.userOptions.save('crm', optionName, 'languageId', languageId);
	          babelHelpers.classPrivateFieldLooseBase(this, _aiCopilotLanguageId)[_aiCopilotLanguageId] = languageId;
	        }, COPILOT_LANGUAGE_ID_SAVE_REQUEST_DELAY);
	      }
	    }
	  });
	  languageSelector.show();
	}
	function _getInfoHelper2(skipPackagesCheck = false) {
	  if (skipPackagesCheck) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('isAIEnabledInGlobalSettings')) {
	      return null;
	    }
	    return () => {
	      if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
	        BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('aiDisabledSliderCode'));
	      }
	    };
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('isAIEnabledInGlobalSettings') && babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('isAIHasPackages')) {
	    return null;
	  }
	  return () => {
	    if (main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('isAIEnabledInGlobalSettings')) {
	        BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('aiDisabledSliderCode'));
	      } else if (!babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('isAIHasPackages')) {
	        BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _extensionSettings)[_extensionSettings].get('aiPackagesEmptySliderCode'));
	      }
	    }
	  };
	}

	exports.SettingsButtonExtender = SettingsButtonExtender;

}((this.BX.Crm = this.BX.Crm || {}),BX.Event,BX.UI.EntitySelector,BX.Crm.Activity,BX.Crm.Activity,BX.CRM.Kanban,BX.CRM.Kanban,BX,BX.Main));
//# sourceMappingURL=settings-button-extender.bundle.js.map
