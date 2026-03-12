/* eslint-disable */
(function (exports,main_core,bizproc_automation,main_core_events,ui_entitySelector) {
	'use strict';

	let _ = t => t,
	  _t;
	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _documentType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentType");
	var _storageCodeInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageCodeInput");
	var _currentStorageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentStorageId");
	var _currentStorageCode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentStorageCode");
	var _deleteModeElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteModeElement");
	var _deleteModeSelect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteModeSelect");
	var _currentDeleteMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentDeleteMode");
	var _document = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("document");
	var _conditionGroup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionGroup");
	var _filterFieldsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFieldsContainer");
	var _filteringFieldsPrefix = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filteringFieldsPrefix");
	var _filterFieldsMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFieldsMap");
	var _onDeleteModeChangeHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDeleteModeChangeHandler");
	var _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _conditionGroupSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionGroupSelector");
	var _initStorageSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initStorageSelector");
	var _onStorageStateChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageStateChange");
	var _onDeleteModeChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDeleteModeChange");
	var _renderFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFilterFields");
	var _getFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilterExpandedState");
	var _saveFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveFilterExpandedState");
	var _showFieldSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showFieldSelector");
	var _render = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _initAutomationContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initAutomationContext");
	var _initFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initFilterFields");
	class DeleteDataStorageActivityRenderer {
	  constructor() {
	    Object.defineProperty(this, _initFilterFields, {
	      value: _initFilterFields2
	    });
	    Object.defineProperty(this, _initAutomationContext, {
	      value: _initAutomationContext2
	    });
	    Object.defineProperty(this, _render, {
	      value: _render2
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
	    Object.defineProperty(this, _onDeleteModeChange, {
	      value: _onDeleteModeChange2
	    });
	    Object.defineProperty(this, _onStorageStateChange, {
	      value: _onStorageStateChange2
	    });
	    Object.defineProperty(this, _initStorageSelector, {
	      value: _initStorageSelector2
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
	    Object.defineProperty(this, _storageCodeInput, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentStorageId, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _currentStorageCode, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _deleteModeElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _deleteModeSelect, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentDeleteMode, {
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
	    Object.defineProperty(this, _filterFieldsContainer, {
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
	    Object.defineProperty(this, _onDeleteModeChangeHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _dialog, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _conditionGroupSelector, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _onDeleteModeChangeHandler)[_onDeleteModeChangeHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onDeleteModeChange)[_onDeleteModeChange].bind(this);
	  }
	  getControlRenderers() {
	    return {
	      filterFields: field => {
	        babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = field.property.Options || {};
	        babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].headCaption = field.property.Name;
	        return main_core.Tag.render(_t || (_t = _`
					<div data-role="bpa-sda-delete-mode-dependent">
						<div data-role="bpa-sda-filter-fields-container"></div>
					</div>
				`));
	      }
	    };
	  }
	  afterFormRender(form) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = form;
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = ui_entitySelector.Dialog.getById('entityselector_storage_id');
	    if (main_core.Type.isPlainObject(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options])) {
	      babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType] = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].documentType;
	      if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _form)[_form])) {
	        var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5;
	        babelHelpers.classPrivateFieldLooseBase(this, _storageCodeInput)[_storageCodeInput] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].storage_code;
	        const item = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]) == null ? void 0 : (_babelHelpers$classPr2 = _babelHelpers$classPr.selectedItems.values()) == null ? void 0 : (_babelHelpers$classPr3 = _babelHelpers$classPr2.next()) == null ? void 0 : _babelHelpers$classPr3.value;
	        babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = (item == null ? void 0 : item.id) || 0;
	        babelHelpers.classPrivateFieldLooseBase(this, _currentStorageCode)[_currentStorageCode] = ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _storageCodeInput)[_storageCodeInput]) == null ? void 0 : _babelHelpers$classPr4.value) || '';
	        babelHelpers.classPrivateFieldLooseBase(this, _deleteModeElement)[_deleteModeElement] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sda-delete-mode-dependent"]');
	        babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].delete_mode;
	        babelHelpers.classPrivateFieldLooseBase(this, _currentDeleteMode)[_currentDeleteMode] = ((_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect]) == null ? void 0 : _babelHelpers$classPr5.value) || '';
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _document)[_document] = new bizproc_automation.Document({
	        rawDocumentType: babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType],
	        documentFields: [],
	        title: 'document'
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _initAutomationContext)[_initAutomationContext]();
	      babelHelpers.classPrivateFieldLooseBase(this, _initFilterFields)[_initFilterFields](babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]);
	      babelHelpers.classPrivateFieldLooseBase(this, _initStorageSelector)[_initStorageSelector]();
	      if (babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect]) {
	        main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect], 'change', babelHelpers.classPrivateFieldLooseBase(this, _onDeleteModeChangeHandler)[_onDeleteModeChangeHandler]);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	    }
	  }
	  destroy() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect]) {
	      main_core.Event.unbind(babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect], 'change', babelHelpers.classPrivateFieldLooseBase(this, _onDeleteModeChangeHandler)[_onDeleteModeChangeHandler]);
	    }
	  }
	}
	function _initStorageSelector2() {
	  main_core.Runtime.loadExtension('bizproc.storage-selector').then(({
	    StorageSelector
	  }) => {
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = new StorageSelector({
	      dialogId: 'entityselector_storage_id',
	      storageCodeInput: babelHelpers.classPrivateFieldLooseBase(this, _storageCodeInput)[_storageCodeInput],
	      onStateChange: babelHelpers.classPrivateFieldLooseBase(this, _onStorageStateChange)[_onStorageStateChange].bind(this)
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].init();
	  }).catch(e => console.error(e));
	}
	function _onStorageStateChange2(newStorageId) {
	  var _babelHelpers$classPr6;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = newStorageId;
	  babelHelpers.classPrivateFieldLooseBase(this, _currentStorageCode)[_currentStorageCode] = (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _storageCodeInput)[_storageCodeInput]) == null ? void 0 : _babelHelpers$classPr6.value;
	  babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	}
	function _onDeleteModeChange2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _currentDeleteMode)[_currentDeleteMode] = babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect].value;
	  babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	}
	function _renderFilterFields2() {
	  if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup]) && main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector])) {
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector] = new bizproc_automation.ConditionGroupSelector(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup], {
	      fields: Object.values(babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap].get(babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId]) || {}),
	      fieldPrefix: babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix],
	      customSelector: main_core.Type.isFunction(window.BPAShowSelector) ? babelHelpers.classPrivateFieldLooseBase(this, _showFieldSelector)[_showFieldSelector] : null,
	      caption: {
	        head: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].headCaption,
	        collapsed: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].collapsedCaption
	      },
	      isExpanded: babelHelpers.classPrivateFieldLooseBase(this, _getFilterExpandedState)[_getFilterExpandedState]()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector].subscribe('onToggleGroupViewClick', event => {
	      const data = event.getData();
	      babelHelpers.classPrivateFieldLooseBase(this, _saveFilterExpandedState)[_saveFilterExpandedState](data.isExpanded);
	    });
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsContainer)[_filterFieldsContainer]);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector].createNode(), babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsContainer)[_filterFieldsContainer]);
	  }
	}
	function _getFilterExpandedState2() {
	  var _babelHelpers$classPr7;
	  return ((_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded) == null ? void 0 : _babelHelpers$classPr7.value) === 'Y';
	}
	function _saveFilterExpandedState2(isExpanded) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded.value = isExpanded ? 'Y' : 'N';
	  }
	}
	function _showFieldSelector2(targetInputId) {
	  window.BPAShowSelector(targetInputId, 'string', '');
	}
	function _render2() {
	  if ((babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] > 0 || babelHelpers.classPrivateFieldLooseBase(this, _currentStorageCode)[_currentStorageCode]) && babelHelpers.classPrivateFieldLooseBase(this, _currentDeleteMode)[_currentDeleteMode] === 'multiple') {
	    main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _deleteModeElement)[_deleteModeElement]);
	    babelHelpers.classPrivateFieldLooseBase(this, _renderFilterFields)[_renderFilterFields]();
	  } else {
	    main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _deleteModeElement)[_deleteModeElement]);
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
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsContainer)[_filterFieldsContainer] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sda-filter-fields-container"]');
	  babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix] = options.filteringFieldsPrefix;
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = new Map(Object.entries(options.filterFieldsMap).map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]));
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup(options.conditions);
	}

	exports.DeleteDataStorageActivityRenderer = DeleteDataStorageActivityRenderer;

}((this.window = this.window || {}),BX,BX.Bizproc.Automation,BX.Event,BX.UI.EntitySelector));
//# sourceMappingURL=renderer.js.map
