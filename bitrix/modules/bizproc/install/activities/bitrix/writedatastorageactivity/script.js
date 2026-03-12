/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,main_popup,bizproc_router,ui_entitySelector,bizproc_automation,main_core,main_core_events) {
	'use strict';

	let _ = t => t,
	  _t;
	var _getCreateNewStorageHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCreateNewStorageHandler");
	class StorageSelectorFooter extends ui_entitySelector.DefaultFooter {
	  constructor(dialog, options) {
	    super(dialog, options);
	    Object.defineProperty(this, _getCreateNewStorageHandler, {
	      value: _getCreateNewStorageHandler2
	    });
	  }
	  getContent() {
	    return this.cache.remember('write-data-storage-activity', () => {
	      return main_core.Tag.render(_t || (_t = _`
				<span onclick="${0}" class="ui-selector-footer-link ui-selector-footer-link-add">
					${0}
				</span>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getCreateNewStorageHandler)[_getCreateNewStorageHandler](), main_core.Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_STORAGE'));
	    });
	  }
	}
	function _getCreateNewStorageHandler2() {
	  const handler = this.getOption('onCreateNewStorageHandler');
	  if (main_core.Type.isNil(handler) || !main_core.Type.isFunction(handler)) {
	    throw Error('The "onCreateNewStorageHandler" option must be a function.');
	  }
	  return handler;
	}

	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _tabId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tabId");
	var _storageIdField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageIdField");
	var _storageItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageItems");
	var _eventHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("eventHandlers");
	var _currentValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentValue");
	var _createStorageItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createStorageItems");
	var _createTagSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createTagSelector");
	var _createItemOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createItemOptions");
	var _setSelectedStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setSelectedStorage");
	class StorageSelector {
	  constructor(storageIdField, storageItems, eventHandlers) {
	    Object.defineProperty(this, _setSelectedStorage, {
	      value: _setSelectedStorage2
	    });
	    Object.defineProperty(this, _createItemOptions, {
	      value: _createItemOptions2
	    });
	    Object.defineProperty(this, _createTagSelector, {
	      value: _createTagSelector2
	    });
	    Object.defineProperty(this, _createStorageItems, {
	      value: _createStorageItems2
	    });
	    Object.defineProperty(this, _currentValue, {
	      value: _currentValue2
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: 'bizproc-storage'
	    });
	    Object.defineProperty(this, _tabId, {
	      writable: true,
	      value: 'storage-tab'
	    });
	    Object.defineProperty(this, _storageIdField, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageItems, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _eventHandlers, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField] = storageIdField;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageItems)[_storageItems] = storageItems;
	    babelHelpers.classPrivateFieldLooseBase(this, _eventHandlers)[_eventHandlers] = eventHandlers;
	  }
	  getTagSelector(targetNode) {
	    bizproc_router.Router.init();
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _createStorageItems)[_createStorageItems]();
	    return babelHelpers.classPrivateFieldLooseBase(this, _createTagSelector)[_createTagSelector](items);
	  }
	}
	function _currentValue2() {
	  const value = parseInt(babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField].value);
	  return Number.isNaN(value) ? null : value;
	}
	function _createStorageItems2() {
	  const storageId = babelHelpers.classPrivateFieldLooseBase(this, _currentValue)[_currentValue]();
	  return babelHelpers.classPrivateFieldLooseBase(this, _storageItems)[_storageItems].map(item => babelHelpers.classPrivateFieldLooseBase(this, _createItemOptions)[_createItemOptions](item, storageId !== null && item.id === storageId));
	}
	function _createTagSelector2(items) {
	  return new ui_entitySelector.TagSelector({
	    dialogOptions: {
	      items,
	      tabs: [{
	        id: babelHelpers.classPrivateFieldLooseBase(this, _tabId)[_tabId],
	        title: main_core.Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_TAB_TITLE')
	      }],
	      width: 400,
	      height: 300,
	      enableSearch: true,
	      compactView: true,
	      dropdownMode: true,
	      showAvatars: false,
	      events: {
	        'Item:onSelect': event => {
	          const {
	            item: selectedItem
	          } = event.getData();
	          babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField].value = selectedItem.getId();
	          babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField].dispatchEvent(new Event('change'));
	        },
	        'Item:onDeselect': event => {
	          babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField].value = '';
	          babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField].dispatchEvent(new Event('change'));
	        }
	      },
	      footer: StorageSelectorFooter,
	      footerOptions: {
	        onCreateNewStorageHandler: babelHelpers.classPrivateFieldLooseBase(this, _eventHandlers)[_eventHandlers].onCreateNewStorageHandler
	      }
	    },
	    multiple: false,
	    tagMaxWidth: 500,
	    textBoxWidth: 100,
	    events: {
	      'onAfterTagAdd': event => {
	        const selector = event.getTarget();
	        const {
	          tag
	        } = event.getData();
	        const itemOptions = babelHelpers.classPrivateFieldLooseBase(this, _createItemOptions)[_createItemOptions]({
	          id: tag.id,
	          title: tag.title.text
	        }, true);
	        selector.dialog.addItem(itemOptions);
	        babelHelpers.classPrivateFieldLooseBase(this, _setSelectedStorage)[_setSelectedStorage](tag.id, tag.title.text);
	      }
	    }
	  });
	}
	function _createItemOptions2(item, selected = false) {
	  return {
	    id: item.id,
	    title: item.title,
	    entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId],
	    tabs: babelHelpers.classPrivateFieldLooseBase(this, _tabId)[_tabId],
	    selected: selected,
	    linkTitle: main_core.Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_OPEN_STORAGE_LIST'),
	    link: `/bitrix/components/bitrix/bizproc.storage.item.list/?storageId=${item.id}`
	  };
	}
	function _setSelectedStorage2(storageId, title) {
	  const field = babelHelpers.classPrivateFieldLooseBase(this, _storageIdField)[_storageIdField];
	  let option = [...field.options].find(o => o.value == storageId);
	  if (!option) {
	    option = new Option(main_core.Text.encode(title != null ? title : ''), main_core.Text.encode(storageId));
	    field.add(option);
	  }
	  field.value = storageId;
	  field.dispatchEvent(new Event('change'));
	}

	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _documentType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentType");
	var _storageIdSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageIdSelect");
	var _writeModeElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("writeModeElement");
	var _writeModeSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("writeModeSelect");
	var _currentWriteMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentWriteMode");
	var _document = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("document");
	var _conditionGroup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionGroup");
	var _filteringFieldsPrefix = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filteringFieldsPrefix");
	var _filterFieldsMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFieldsMap");
	var _onWriteModeChangeHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onWriteModeChangeHandler");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _renderFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFilterFields");
	var _getFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilterExpandedState");
	var _saveFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveFilterExpandedState");
	var _showFieldSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showFieldSelector");
	var _onWriteModeChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onWriteModeChange");
	var _render = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _initAutomationContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initAutomationContext");
	var _initFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initFilterFields");
	class StorageFilter {
	  constructor(_options2) {
	    Object.defineProperty(this, _initFilterFields, {
	      value: _initFilterFields2
	    });
	    Object.defineProperty(this, _initAutomationContext, {
	      value: _initAutomationContext2
	    });
	    Object.defineProperty(this, _render, {
	      value: _render2
	    });
	    Object.defineProperty(this, _onWriteModeChange, {
	      value: _onWriteModeChange2
	    });
	    Object.defineProperty(this, _showFieldSelector, {
	      value: _showFieldSelector2
	    });
	    Object.defineProperty(this, _saveFilterExpandedState, {
	      value: _saveFilterExpandedState2
	    });
	    Object.defineProperty(this, _getFilterExpandedState, {
	      value: _getFilterExpandedState2
	    });
	    Object.defineProperty(this, _renderFilterFields, {
	      value: _renderFilterFields2
	    });
	    Object.defineProperty(this, _form, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _documentType, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _storageIdSelect, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _writeModeElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _writeModeSelect, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentWriteMode, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _document, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _conditionGroup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _filteringFieldsPrefix, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _filterFieldsMap, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _onWriteModeChangeHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: null
	    });
	    if (!main_core.Type.isPlainObject(_options2)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = _options2;
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = document.forms[_options2.formName];
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType] = _options2.documentType;
	    babelHelpers.classPrivateFieldLooseBase(this, _onWriteModeChangeHandler)[_onWriteModeChangeHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onWriteModeChange)[_onWriteModeChange].bind(this);
	    if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _form)[_form])) {
	      var _babelHelpers$classPr;
	      babelHelpers.classPrivateFieldLooseBase(this, _storageIdSelect)[_storageIdSelect] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].StorageId;
	      babelHelpers.classPrivateFieldLooseBase(this, _writeModeElement)[_writeModeElement] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sra-storage-id-dependent"]');
	      babelHelpers.classPrivateFieldLooseBase(this, _writeModeSelect)[_writeModeSelect] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].RewriteMode;
	      babelHelpers.classPrivateFieldLooseBase(this, _currentWriteMode)[_currentWriteMode] = ((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _writeModeSelect)[_writeModeSelect]) == null ? void 0 : _babelHelpers$classPr.value) || '';
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _document)[_document] = new bizproc_automation.Document({
	      rawDocumentType: babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType],
	      documentFields: [],
	      title: 'document'
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _initAutomationContext)[_initAutomationContext]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initFilterFields)[_initFilterFields](_options2);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _writeModeSelect)[_writeModeSelect]) {
	      main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _writeModeSelect)[_writeModeSelect], 'change', babelHelpers.classPrivateFieldLooseBase(this, _onWriteModeChangeHandler)[_onWriteModeChangeHandler]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	  }
	  renderTo(container) {
	    if (main_core.Type.isNil(container)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = container;
	    babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	  }
	}
	function _renderFilterFields2() {
	  if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup])) {
	    var _babelHelpers$classPr2;
	    const storageId = Number(((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _storageIdSelect)[_storageIdSelect]) == null ? void 0 : _babelHelpers$classPr2.value) || 0);
	    const selector = new bizproc_automation.ConditionGroupSelector(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup], {
	      fields: Object.values(babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap].get(storageId) || {}),
	      fieldPrefix: babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix],
	      customSelector: main_core.Type.isFunction(window.BPAShowSelector) ? babelHelpers.classPrivateFieldLooseBase(this, _showFieldSelector)[_showFieldSelector] : null,
	      caption: {
	        head: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].headCaption,
	        collapsed: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].collapsedCaption
	      },
	      isExpanded: babelHelpers.classPrivateFieldLooseBase(this, _getFilterExpandedState)[_getFilterExpandedState]()
	    });
	    selector.subscribe('onToggleGroupViewClick', event => {
	      const data = event.getData();
	      babelHelpers.classPrivateFieldLooseBase(this, _saveFilterExpandedState)[_saveFilterExpandedState](data.isExpanded);
	    });
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    main_core.Dom.append(selector.createNode(), babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	  }
	}
	function _getFilterExpandedState2() {
	  var _babelHelpers$classPr3;
	  return ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].IsExpanded) == null ? void 0 : _babelHelpers$classPr3.value) === 'Y';
	}
	function _saveFilterExpandedState2(isExpanded) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].IsExpanded) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].IsExpanded.value = isExpanded ? 'Y' : 'N';
	  }
	}
	function _showFieldSelector2(targetInputId) {
	  window.BPAShowSelector(targetInputId, 'string', '');
	}
	function _onWriteModeChange2() {
	  var _babelHelpers$classPr4;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentWriteMode)[_currentWriteMode] = ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _writeModeSelect)[_writeModeSelect]) == null ? void 0 : _babelHelpers$classPr4.value) || '';
	  babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	}
	function _render2() {
	  if (main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container])) {
	    return;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _currentWriteMode)[_currentWriteMode] === StorageFilter.Mode.MERGE || babelHelpers.classPrivateFieldLooseBase(this, _currentWriteMode)[_currentWriteMode] === StorageFilter.Mode.REWRITE) {
	    main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _writeModeElement)[_writeModeElement]);
	    babelHelpers.classPrivateFieldLooseBase(this, _renderFilterFields)[_renderFilterFields]();
	  } else {
	    main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _writeModeElement)[_writeModeElement]);
	  }
	}
	function _initAutomationContext2() {
	  try {
	    bizproc_automation.getGlobalContext();
	  } catch {
	    bizproc_automation.setGlobalContext(new bizproc_automation.Context({
	      document: babelHelpers.classPrivateFieldLooseBase(this, _document)[_document]
	    }));
	  }
	}
	function _initFilterFields2(options) {
	  var _options$conditions, _options$filteringFie;
	  const filterFieldsMap = main_core.Type.isPlainObject(options.filterFieldsMap) ? options.filterFieldsMap : {};
	  const conditions = (_options$conditions = options.conditions) != null ? _options$conditions : null;
	  babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix] = (_options$filteringFie = options.filteringFieldsPrefix) != null ? _options$filteringFie : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = new Map(Object.entries(filterFieldsMap).map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]));
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup(conditions);
	}
	StorageFilter.Mode = {
	  NEW: 'newItem',
	  MERGE: 'mergeFields',
	  REWRITE: 'rewriteFields'
	};

	let _$1 = t => t,
	  _t$1,
	  _t2,
	  _t3,
	  _t4;
	const namespace = main_core.Reflection.namespace('BX.Bizproc.Activity');
	var _fieldsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldsContainer");
	var _storageSelectorContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageSelectorContainer");
	var _storageIdField$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageIdField");
	var _storageCodeField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageCodeField");
	var _addFieldButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFieldButton");
	var _documentType$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentType");
	var _storageFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageFields");
	var _currentValues = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentValues");
	var _systemFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("systemFields");
	var _storageItems$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageItems");
	var _fieldMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldMenu");
	var _dynamicStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dynamicStorage");
	var _fieldIndex = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldIndex");
	var _storageSelectorInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageSelectorInstance");
	var _fieldsCache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fieldsCache");
	var _onAfterFieldRendererHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAfterFieldRendererHandler");
	var _onStorageRemoveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageRemoveHandler");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _onStorageRemove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageRemove");
	var _onAfterFieldRenderer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAfterFieldRenderer");
	var _configureStorageCodeField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("configureStorageCodeField");
	var _initializeFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeFields");
	var _initializeDynamicStorageFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeDynamicStorageFields");
	var _initializeStaticStorageFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initializeStaticStorageFields");
	var _restoreSavedFieldValues = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restoreSavedFieldValues");
	var _createNewStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createNewStorage");
	var _resetFieldContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetFieldContainer");
	var _onChangeStorageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onChangeStorageId");
	var _clearFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearFields");
	var _onChangeStorageCode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onChangeStorageCode");
	var _openStorageEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openStorageEdit");
	var _selectNewStorage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectNewStorage");
	var _getStorageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStorageId");
	var _getFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFields");
	var _onAddButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAddButtonClick");
	var _showDynamicFieldSelectionMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showDynamicFieldSelectionMenu");
	var _buildDynamicMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildDynamicMenuItems");
	var _showFieldSelectionMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showFieldSelectionMenu");
	var _getAddedFieldIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAddedFieldIds");
	var _buildMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildMenuItems");
	var _createFieldMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createFieldMenu");
	var _createDynamicKeyField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDynamicKeyField");
	var _createDynamicValueField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDynamicValueField");
	var _renderDynamicFieldRow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDynamicFieldRow");
	var _renderSystemFieldRow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderSystemFieldRow");
	var _cleanupExistingMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cleanupExistingMenu");
	var _addDynamicStorageField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addDynamicStorageField");
	var _openFieldEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openFieldEdit");
	var _addStorageField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addStorageField");
	var _addField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addField");
	var _editStorageField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editStorageField");
	var _editField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editField");
	var _renderFieldRow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFieldRow");
	var _getSelectField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSelectField");
	var _getEqualSign = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEqualSign");
	var _getField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getField");
	var _getDeleteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDeleteButton");
	var _getEditButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEditButton");
	var _deleteFieldRow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteFieldRow");
	var _renderStorageSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderStorageSelector");
	var _unbindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unbindEvents");
	class WriteDataStorageActivity {
	  constructor(_options) {
	    Object.defineProperty(this, _unbindEvents, {
	      value: _unbindEvents2
	    });
	    Object.defineProperty(this, _renderStorageSelector, {
	      value: _renderStorageSelector2
	    });
	    Object.defineProperty(this, _deleteFieldRow, {
	      value: _deleteFieldRow2
	    });
	    Object.defineProperty(this, _getEditButton, {
	      value: _getEditButton2
	    });
	    Object.defineProperty(this, _getDeleteButton, {
	      value: _getDeleteButton2
	    });
	    Object.defineProperty(this, _getField, {
	      value: _getField2
	    });
	    Object.defineProperty(this, _getEqualSign, {
	      value: _getEqualSign2
	    });
	    Object.defineProperty(this, _getSelectField, {
	      value: _getSelectField2
	    });
	    Object.defineProperty(this, _renderFieldRow, {
	      value: _renderFieldRow2
	    });
	    Object.defineProperty(this, _editField, {
	      value: _editField2
	    });
	    Object.defineProperty(this, _editStorageField, {
	      value: _editStorageField2
	    });
	    Object.defineProperty(this, _addField, {
	      value: _addField2
	    });
	    Object.defineProperty(this, _addStorageField, {
	      value: _addStorageField2
	    });
	    Object.defineProperty(this, _openFieldEdit, {
	      value: _openFieldEdit2
	    });
	    Object.defineProperty(this, _addDynamicStorageField, {
	      value: _addDynamicStorageField2
	    });
	    Object.defineProperty(this, _cleanupExistingMenu, {
	      value: _cleanupExistingMenu2
	    });
	    Object.defineProperty(this, _renderSystemFieldRow, {
	      value: _renderSystemFieldRow2
	    });
	    Object.defineProperty(this, _renderDynamicFieldRow, {
	      value: _renderDynamicFieldRow2
	    });
	    Object.defineProperty(this, _createDynamicValueField, {
	      value: _createDynamicValueField2
	    });
	    Object.defineProperty(this, _createDynamicKeyField, {
	      value: _createDynamicKeyField2
	    });
	    Object.defineProperty(this, _createFieldMenu, {
	      value: _createFieldMenu2
	    });
	    Object.defineProperty(this, _buildMenuItems, {
	      value: _buildMenuItems2
	    });
	    Object.defineProperty(this, _getAddedFieldIds, {
	      value: _getAddedFieldIds2
	    });
	    Object.defineProperty(this, _showFieldSelectionMenu, {
	      value: _showFieldSelectionMenu2
	    });
	    Object.defineProperty(this, _buildDynamicMenuItems, {
	      value: _buildDynamicMenuItems2
	    });
	    Object.defineProperty(this, _showDynamicFieldSelectionMenu, {
	      value: _showDynamicFieldSelectionMenu2
	    });
	    Object.defineProperty(this, _onAddButtonClick, {
	      value: _onAddButtonClick2
	    });
	    Object.defineProperty(this, _getFields, {
	      value: _getFields2
	    });
	    Object.defineProperty(this, _getStorageId, {
	      value: _getStorageId2
	    });
	    Object.defineProperty(this, _selectNewStorage, {
	      value: _selectNewStorage2
	    });
	    Object.defineProperty(this, _openStorageEdit, {
	      value: _openStorageEdit2
	    });
	    Object.defineProperty(this, _onChangeStorageCode, {
	      value: _onChangeStorageCode2
	    });
	    Object.defineProperty(this, _clearFields, {
	      value: _clearFields2
	    });
	    Object.defineProperty(this, _onChangeStorageId, {
	      value: _onChangeStorageId2
	    });
	    Object.defineProperty(this, _resetFieldContainer, {
	      value: _resetFieldContainer2
	    });
	    Object.defineProperty(this, _createNewStorage, {
	      value: _createNewStorage2
	    });
	    Object.defineProperty(this, _restoreSavedFieldValues, {
	      value: _restoreSavedFieldValues2
	    });
	    Object.defineProperty(this, _initializeStaticStorageFields, {
	      value: _initializeStaticStorageFields2
	    });
	    Object.defineProperty(this, _initializeDynamicStorageFields, {
	      value: _initializeDynamicStorageFields2
	    });
	    Object.defineProperty(this, _initializeFields, {
	      value: _initializeFields2
	    });
	    Object.defineProperty(this, _configureStorageCodeField, {
	      value: _configureStorageCodeField2
	    });
	    Object.defineProperty(this, _onAfterFieldRenderer, {
	      value: _onAfterFieldRenderer2
	    });
	    Object.defineProperty(this, _onStorageRemove, {
	      value: _onStorageRemove2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _fieldsContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageSelectorContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageIdField$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageCodeField, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _addFieldButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _documentType$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageFields, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _currentValues, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _systemFields, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageItems$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _fieldMenu, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dynamicStorage, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fieldIndex, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageSelectorInstance, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fieldsCache, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _onAfterFieldRendererHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onStorageRemoveHandler, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer] = _options.fieldsContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorContainer)[_storageSelectorContainer] = _options.storageSelectorContainer;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1] = _options.storageIdField;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField] = _options.storageCodeField;
	    babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton] = _options.addFieldButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _documentType$1)[_documentType$1] = _options.documentType;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues] = _options.currentValues;
	    babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields] = _options.systemFields;
	    babelHelpers.classPrivateFieldLooseBase(this, _storageItems$1)[_storageItems$1] = main_core.Type.isArray(_options.storageItems) ? _options.storageItems : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldIndex)[_fieldIndex] = 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _onAfterFieldRendererHandler)[_onAfterFieldRendererHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onAfterFieldRenderer)[_onAfterFieldRenderer].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemove)[_onStorageRemove].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _configureStorageCodeField)[_configureStorageCodeField]();
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeFields)[_initializeFields](_options);
	    babelHelpers.classPrivateFieldLooseBase(this, _renderStorageSelector)[_renderStorageSelector]();
	    const form = document.forms[_options.formName];
	    if (form) {
	      const container = form.querySelector('[data-role="bpa-sra-filter-fields-container"]');
	      new StorageFilter({
	        documentType: _options.documentType,
	        headCaption: _options.headCaption,
	        collapsedCaption: _options.collapsedCaption,
	        filterFieldsMap: _options.filterFieldsMap,
	        conditions: _options.conditions,
	        filteringFieldsPrefix: _options.filteringFieldsPrefix,
	        formName: _options.formName
	      }).renderTo(container);
	    }
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unbindEvents)[_unbindEvents]();
	  }
	}
	function _bindEvents2() {
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1], 'change', babelHelpers.classPrivateFieldLooseBase(this, _onChangeStorageId)[_onChangeStorageId].bind(this));
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField], 'change', babelHelpers.classPrivateFieldLooseBase(this, _onChangeStorageCode)[_onChangeStorageCode].bind(this));
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton], 'click', babelHelpers.classPrivateFieldLooseBase(this, _onAddButtonClick)[_onAddButtonClick].bind(this));
	  main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', babelHelpers.classPrivateFieldLooseBase(this, _onAfterFieldRendererHandler)[_onAfterFieldRendererHandler]);
	  main_core_events.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler]);
	}
	function _onStorageRemove2(event) {
	  const storageId = Number(event.getData().storageId);
	  if (storageId <= 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _storageItems$1)[_storageItems$1] = babelHelpers.classPrivateFieldLooseBase(this, _storageItems$1)[_storageItems$1].filter(item => item.id !== storageId);
	  babelHelpers.classPrivateFieldLooseBase(this, _clearFields)[_clearFields]();
	  babelHelpers.classPrivateFieldLooseBase(this, _renderStorageSelector)[_renderStorageSelector]();
	}
	function _onAfterFieldRenderer2(event) {
	  const node = event.data.node;
	  const textarea = node.querySelector('textarea[name="field_values[]"], textarea[name="field_keys[]"]');
	  if (!textarea) {
	    return;
	  }
	  const isFieldValues = textarea.name === 'field_values[]';
	  const randString = Math.random().toString(36).slice(2, 11);
	  const uniqueId = `field_${isFieldValues ? 'values' : 'keys'}_${randString}`;
	  textarea.id = uniqueId;
	  const button = node.querySelector('[data-role="bp-selector-button"]');
	  if (!button) {
	    return;
	  }
	  const oldOnclick = button.getAttribute('onclick');
	  if (oldOnclick) {
	    const newOnclick = oldOnclick.replace(/BPAShowSelector\('([^']+)'(\s*,\s*[^)]+)\)/, `BPAShowSelector('${uniqueId}'$2)`);
	    button.setAttribute('onclick', newOnclick);
	  }
	}
	function _configureStorageCodeField2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField].closest('[data-cid="StorageCode"]');
	}
	function _initializeFields2(options) {
	  const storageCodeValue = babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField].value;
	  if (main_core.Type.isStringFilled(storageCodeValue)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeDynamicStorageFields)[_initializeDynamicStorageFields]();
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _initializeStaticStorageFields)[_initializeStaticStorageFields](options.fields);
	  }
	  const storageId = babelHelpers.classPrivateFieldLooseBase(this, _getStorageId)[_getStorageId]();
	  if (storageId <= 0 && !main_core.Type.isStringFilled(storageCodeValue)) {
	    main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton]);
	  }
	}
	function _initializeDynamicStorageFields2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage] = true;
	  for (const [fieldName, value] of Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues])) {
	    if (value) {
	      babelHelpers.classPrivateFieldLooseBase(this, _addDynamicStorageField)[_addDynamicStorageField](fieldName, value);
	    }
	  }
	}
	function _initializeStaticStorageFields2(fields) {
	  babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage] = false;
	  if (!main_core.Type.isArrayFilled(fields) && !main_core.Type.isArrayFilled(babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields])) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields] = [...babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields], ...fields];
	  babelHelpers.classPrivateFieldLooseBase(this, _restoreSavedFieldValues)[_restoreSavedFieldValues]();
	}
	function _restoreSavedFieldValues2() {
	  for (const [fieldName, value] of Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues])) {
	    if (value && (!main_core.Type.isArray(value) || value.length > 0)) {
	      const field = babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields].find(item => item.FieldName === fieldName);
	      if (field) {
	        field.Value = value;
	        babelHelpers.classPrivateFieldLooseBase(this, _addField)[_addField](field);
	      }
	    }
	  }
	}
	async function _createNewStorage2() {
	  var _storageData$storageT;
	  const storageData = await babelHelpers.classPrivateFieldLooseBase(this, _openStorageEdit)[_openStorageEdit]();
	  if (main_core.Type.isNil(storageData)) {
	    return;
	  }
	  const storageId = storageData.storageId;
	  const title = (_storageData$storageT = storageData.storageTitle) != null ? _storageData$storageT : '';
	  babelHelpers.classPrivateFieldLooseBase(this, _selectNewStorage)[_selectNewStorage](storageId, title);
	  await babelHelpers.classPrivateFieldLooseBase(this, _resetFieldContainer)[_resetFieldContainer](storageId);
	}
	async function _resetFieldContainer2(storageId) {
	  const fields = await babelHelpers.classPrivateFieldLooseBase(this, _getFields)[_getFields](storageId);
	  babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields] = [...babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields], ...fields];
	  main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer]);
	  main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton]);
	}
	async function _onChangeStorageId2(event) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField].value = '';
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage] = false;
	  const storageId = babelHelpers.classPrivateFieldLooseBase(this, _getStorageId)[_getStorageId]();
	  if (storageId <= 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _clearFields)[_clearFields]();
	    return;
	  }
	  await babelHelpers.classPrivateFieldLooseBase(this, _resetFieldContainer)[_resetFieldContainer](storageId);
	}
	function _clearFields2() {
	  main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer]);
	  main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton]);
	}
	function _onChangeStorageCode2(event) {
	  const storageCode = event.currentTarget.value.trim();
	  if (!main_core.Type.isStringFilled(storageCode)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _clearFields)[_clearFields]();
	    return;
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage]) {
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer]);
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance].removeTags();
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage] = true;
	  main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton]);
	}
	function _openStorageEdit2() {
	  return new Promise(resolve => {
	    main_core.Runtime.loadExtension('bizproc.router').then(({
	      Router
	    }) => {
	      Router.openStorageEdit({
	        events: {
	          onCloseComplete: event => {
	            const slider = event.getSlider();
	            const dictionary = slider ? slider.getData() : null;
	            let data = null;
	            if (dictionary && dictionary.has('data')) {
	              data = {
	                storageId: dictionary.get('data').storageId || null,
	                storageTitle: dictionary.get('data').storageTitle || ''
	              };
	            }
	            resolve(data);
	          }
	        }
	      });
	    }).catch(e => {
	      console.error(e);
	      resolve(null);
	    });
	  });
	}
	function _selectNewStorage2(storageId, title) {
	  babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance].addTag({
	    id: storageId,
	    title,
	    entityId: 'bizproc-storage',
	    link: `/bitrix/components/bitrix/bizproc.storage.item.list/?storageId=${storageId}`
	  });
	}
	function _getStorageId2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1].value ? Number(babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1].value) : null;
	}
	async function _getFields2(storageId) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _fieldsCache)[_fieldsCache].has(storageId)) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _fieldsCache)[_fieldsCache].get(storageId);
	  }
	  const response = await main_core.ajax.runAction(WriteDataStorageActivity.Action.GET_FIELDS, {
	    data: {
	      storageId,
	      format: true
	    }
	  });
	  if (response.status === 'success') {
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldsCache)[_fieldsCache].set(storageId, response.data);
	    return response.data;
	  }
	  return [];
	}
	function _onAddButtonClick2(event) {
	  event.preventDefault();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _dynamicStorage)[_dynamicStorage]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _showDynamicFieldSelectionMenu)[_showDynamicFieldSelectionMenu]();
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _showFieldSelectionMenu)[_showFieldSelectionMenu]();
	  }
	}
	function _showDynamicFieldSelectionMenu2() {
	  const addedFieldIds = babelHelpers.classPrivateFieldLooseBase(this, _getAddedFieldIds)[_getAddedFieldIds]();
	  const menuItems = babelHelpers.classPrivateFieldLooseBase(this, _buildDynamicMenuItems)[_buildDynamicMenuItems](addedFieldIds);
	  babelHelpers.classPrivateFieldLooseBase(this, _cleanupExistingMenu)[_cleanupExistingMenu]();
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu] = babelHelpers.classPrivateFieldLooseBase(this, _createFieldMenu)[_createFieldMenu](menuItems);
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu].show();
	}
	function _buildDynamicMenuItems2(addedFieldIds) {
	  var _Loc$getMessage;
	  const menuItems = [];
	  for (const field of babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields]) {
	    if (!addedFieldIds.has(field.FieldName) && main_core.Type.isStringFilled(field.Name)) {
	      menuItems.push({
	        text: main_core.Text.encode(field.Name),
	        onclick: (event, menuItem) => {
	          menuItem.getMenuWindow().close();
	          babelHelpers.classPrivateFieldLooseBase(this, _addDynamicStorageField)[_addDynamicStorageField](main_core.Text.encode(field.FieldName));
	        }
	      });
	    }
	  }
	  menuItems.push({
	    text: (_Loc$getMessage = main_core.Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_ANOTHER_FIELD')) != null ? _Loc$getMessage : '',
	    onclick: async (event, menuItem) => {
	      menuItem.getMenuWindow().close();
	      babelHelpers.classPrivateFieldLooseBase(this, _addDynamicStorageField)[_addDynamicStorageField]();
	    }
	  });
	  return menuItems;
	}
	function _showFieldSelectionMenu2() {
	  const addedFieldIds = babelHelpers.classPrivateFieldLooseBase(this, _getAddedFieldIds)[_getAddedFieldIds]();
	  const menuItems = babelHelpers.classPrivateFieldLooseBase(this, _buildMenuItems)[_buildMenuItems](addedFieldIds);
	  babelHelpers.classPrivateFieldLooseBase(this, _cleanupExistingMenu)[_cleanupExistingMenu]();
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu] = babelHelpers.classPrivateFieldLooseBase(this, _createFieldMenu)[_createFieldMenu](menuItems);
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu].show();
	}
	function _getAddedFieldIds2() {
	  const fieldRows = [...babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer].querySelectorAll('tr[data-id]')];
	  return new Set(fieldRows.map(row => row.dataset.id));
	}
	function _buildMenuItems2(addedFieldIds) {
	  var _Loc$getMessage2;
	  const menuItems = [{
	    text: (_Loc$getMessage2 = main_core.Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_FIELD')) != null ? _Loc$getMessage2 : '',
	    onclick: async (event, menuItem) => {
	      menuItem.getMenuWindow().close();
	      const field = await babelHelpers.classPrivateFieldLooseBase(this, _openFieldEdit)[_openFieldEdit]();
	      if (field) {
	        babelHelpers.classPrivateFieldLooseBase(this, _addStorageField)[_addStorageField](field);
	        babelHelpers.classPrivateFieldLooseBase(this, _addField)[_addField](field);
	      }
	    }
	  }];
	  for (const field of babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields]) {
	    const fieldId = String(field.Id);
	    if (!addedFieldIds.has(fieldId) && main_core.Type.isStringFilled(field.Name)) {
	      menuItems.push({
	        text: main_core.Text.encode(field.Name),
	        onclick: async (event, menuItem) => {
	          menuItem.getMenuWindow().close();
	          babelHelpers.classPrivateFieldLooseBase(this, _addField)[_addField](field);
	        }
	      });
	    }
	  }
	  return menuItems;
	}
	function _createFieldMenu2(menuItems) {
	  return main_popup.PopupMenu.create({
	    id: `bp_wsa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
	    bindElement: babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton],
	    autoHide: true,
	    items: menuItems,
	    events: {
	      onPopupClose: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _cleanupExistingMenu)[_cleanupExistingMenu]();
	      }
	    }
	  });
	}
	function _createDynamicKeyField2(customValue = '') {
	  const fieldIndex = babelHelpers.classPrivateFieldLooseBase(this, _fieldIndex)[_fieldIndex];
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldIndex)[_fieldIndex]++;
	  return {
	    Id: customValue || `dynamic_${fieldIndex}`,
	    Name: '',
	    FieldName: 'field_keys[]',
	    Type: 'string',
	    Required: false,
	    AllowSelection: true,
	    Value: customValue
	  };
	}
	function _createDynamicValueField2(customValue = '') {
	  const fieldIndex = babelHelpers.classPrivateFieldLooseBase(this, _fieldIndex)[_fieldIndex];
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldIndex)[_fieldIndex]++;
	  return {
	    Id: customValue || `dynamic_${fieldIndex}`,
	    Name: '',
	    FieldName: 'field_values[]',
	    Type: 'string',
	    Required: false,
	    AllowSelection: true,
	    Value: customValue
	  };
	}
	function _renderDynamicFieldRow2(row, leftField, rightField) {
	  const leftCell = row.insertCell(-1);
	  main_core.Dom.addClass(leftCell, 'dynamic-field');
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](leftField, leftField.Value), leftCell);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getEqualSign)[_getEqualSign](), row.insertCell(-1));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](rightField, rightField.Value), row.insertCell(-1));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getDeleteButton)[_getDeleteButton](row), row.insertCell(-1));
	}
	function _renderSystemFieldRow2(row, leftField, rightField) {
	  const leftCell = row.insertCell(-1);
	  main_core.Dom.addClass(leftCell, 'locked-field');
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](leftField, leftField.Value), leftCell);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getEqualSign)[_getEqualSign](), row.insertCell(-1));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](rightField, rightField.Value), row.insertCell(-1));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getDeleteButton)[_getDeleteButton](row), row.insertCell(-1));
	}
	function _cleanupExistingMenu2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu] && babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu].getId()) {
	    main_popup.PopupMenu.destroy(babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu].getId());
	    babelHelpers.classPrivateFieldLooseBase(this, _fieldMenu)[_fieldMenu] = null;
	  }
	}
	function _addDynamicStorageField2(key, value) {
	  const keyField = babelHelpers.classPrivateFieldLooseBase(this, _createDynamicKeyField)[_createDynamicKeyField](key);
	  const valueField = babelHelpers.classPrivateFieldLooseBase(this, _createDynamicValueField)[_createDynamicValueField](value);
	  const row = babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer].insertRow(-1);
	  row.dataset.id = keyField.Id;
	  const index = babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields].findIndex(f => f.Id === key);
	  if (index === -1) {
	    babelHelpers.classPrivateFieldLooseBase(this, _renderDynamicFieldRow)[_renderDynamicFieldRow](row, keyField, valueField);
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _renderSystemFieldRow)[_renderSystemFieldRow](row, keyField, valueField);
	  }
	}
	function _openFieldEdit2(fieldId = null) {
	  return new Promise(resolve => {
	    main_core.Runtime.loadExtension('bizproc.router').then(({
	      Router
	    }) => {
	      Router.openStorageFieldEdit({
	        events: {
	          onCloseComplete: event => {
	            const slider = event.getSlider();
	            const dictionary = slider ? slider.getData() : null;
	            let data = null;
	            if (dictionary && dictionary.has('data')) {
	              data = dictionary.get('data');
	            }
	            resolve(data);
	          }
	        },
	        requestMethod: 'get',
	        requestParams: {
	          storageId: babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1].value,
	          fieldId
	        }
	      });
	    }).catch(e => {
	      console.error(e);
	      resolve(null);
	    });
	  });
	}
	function _addStorageField2(field) {
	  babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields].push(field);
	}
	function _addField2(field) {
	  const row = babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer].insertRow(-1);
	  row.dataset.id = field.Id;
	  babelHelpers.classPrivateFieldLooseBase(this, _renderFieldRow)[_renderFieldRow](row, field);
	}
	function _editStorageField2(field) {
	  const index = babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields].findIndex(f => f.Id === field.Id);
	  if (index !== -1) {
	    babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields][index] = field;
	  }
	}
	function _editField2(field) {
	  const row = babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer].querySelector(`tr[data-id="${field.Id}"]`);
	  if (row) {
	    main_core.Dom.clean(row);
	    babelHelpers.classPrivateFieldLooseBase(this, _renderFieldRow)[_renderFieldRow](row, field);
	  }
	}
	function _renderFieldRow2(row, field) {
	  const leftCell = row.insertCell(-1);
	  main_core.Dom.addClass(leftCell, 'static-field');
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getSelectField)[_getSelectField](field.Name), leftCell);
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getEqualSign)[_getEqualSign](), row.insertCell(-1));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](field), row.insertCell(-1));
	  const editBtn = babelHelpers.classPrivateFieldLooseBase(this, _getEditButton)[_getEditButton](row, field.Id);
	  if (editBtn) {
	    main_core.Dom.append(editBtn, row.insertCell(-1));
	  } else {
	    row.insertCell(-1);
	  }
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getDeleteButton)[_getDeleteButton](row), row.insertCell(-1));
	}
	function _getSelectField2(name) {
	  return main_core.Tag.render(_t$1 || (_t$1 = _$1`<span>${0}</span>`), main_core.Text.encode(name));
	}
	function _getEqualSign2() {
	  return main_core.Tag.render(_t2 || (_t2 = _$1`<span>=</span>`));
	}
	function _getField2(field, value = null) {
	  var _babelHelpers$classPr;
	  let currentValue = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _currentValues)[_currentValues][field.FieldName]) != null ? _babelHelpers$classPr : null;
	  if (value) {
	    currentValue = value;
	  }
	  return BX.Bizproc.FieldType.renderControl(babelHelpers.classPrivateFieldLooseBase(this, _documentType$1)[_documentType$1], field, field.FieldName, currentValue, 'designer');
	}
	function _getDeleteButton2(row) {
	  const button = main_core.Tag.render(_t3 || (_t3 = _$1`<a href="#"><div class="ui-icon-set --cross-m"></div></a>`));
	  main_core.Event.bind(button, 'click', event => {
	    event.preventDefault();
	    main_core.Dom.remove(row);
	  });
	  return button;
	}
	function _getEditButton2(row, fieldId) {
	  const button = main_core.Tag.render(_t4 || (_t4 = _$1`<a href="#"><div class="ui-icon-set --edit-m"></div></a>`));
	  const systemFieldIds = babelHelpers.classPrivateFieldLooseBase(this, _systemFields)[_systemFields].map(item => item.Id);
	  if (systemFieldIds.includes(fieldId)) {
	    return null;
	  }
	  main_core.Event.bind(button, 'click', async event => {
	    event.preventDefault();
	    const field = await babelHelpers.classPrivateFieldLooseBase(this, _openFieldEdit)[_openFieldEdit](fieldId);
	    if (!field) {
	      return;
	    }
	    const isDeleteAction = field.action === WriteDataStorageActivity.Action.DELETE_FIELD && field.id;
	    if (isDeleteAction) {
	      babelHelpers.classPrivateFieldLooseBase(this, _deleteFieldRow)[_deleteFieldRow](Number(field.id));
	      babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields] = babelHelpers.classPrivateFieldLooseBase(this, _storageFields)[_storageFields].filter(f => f.Id !== Number(field.id));
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _editStorageField)[_editStorageField](field);
	      babelHelpers.classPrivateFieldLooseBase(this, _editField)[_editField](field);
	    }
	  });
	  return button;
	}
	function _deleteFieldRow2(fieldId) {
	  const rowToRemove = babelHelpers.classPrivateFieldLooseBase(this, _fieldsContainer)[_fieldsContainer].querySelector(`[data-id="${fieldId}"]`);
	  if (rowToRemove) {
	    main_core.Dom.remove(rowToRemove);
	  }
	}
	function _renderStorageSelector2() {
	  var _babelHelpers$classPr2;
	  babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorContainer)[_storageSelectorContainer].innerHTML = '';
	  babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance] = new StorageSelector(babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1], (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _storageItems$1)[_storageItems$1]) != null ? _babelHelpers$classPr2 : [], {
	    onCreateNewStorageHandler: babelHelpers.classPrivateFieldLooseBase(this, _createNewStorage)[_createNewStorage].bind(this)
	  }).getTagSelector();
	  babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance].renderTo(babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorContainer)[_storageSelectorContainer]);
	}
	function _unbindEvents2() {
	  main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _storageIdField$1)[_storageIdField$1]);
	  main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _storageCodeField)[_storageCodeField]);
	  main_core.Event.unbindAll(babelHelpers.classPrivateFieldLooseBase(this, _addFieldButton)[_addFieldButton]);
	  babelHelpers.classPrivateFieldLooseBase(this, _fieldsCache)[_fieldsCache].clear();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _storageSelectorInstance)[_storageSelectorInstance].destroy();
	  }
	  main_core_events.EventEmitter.unsubscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', babelHelpers.classPrivateFieldLooseBase(this, _onAfterFieldRendererHandler)[_onAfterFieldRendererHandler]);
	  main_core_events.EventEmitter.unsubscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', babelHelpers.classPrivateFieldLooseBase(this, _onStorageRemoveHandler)[_onStorageRemoveHandler]);
	}
	WriteDataStorageActivity.Mode = {
	  MERGE: 'mergeFields',
	  REWRITE: 'rewriteFields'
	};
	WriteDataStorageActivity.Action = {
	  GET_FIELDS: 'bizproc.v2.StorageField.getFieldsByStorageId',
	  DELETE_FIELD: 'bizproc.v2.StorageField.delete'
	};
	namespace.WriteDataStorageActivity = WriteDataStorageActivity;

}((this.BX.Bizproc.Activity = this.BX.Bizproc.Activity || {}),BX.Main,BX.Bizproc,BX.UI.EntitySelector,BX.Bizproc.Automation,BX,BX.Event));
//# sourceMappingURL=script.js.map
