/* eslint-disable */
(function (exports,main_core,bizproc_automation,main_core_events) {
	'use strict';

	let _ = t => t,
	  _t;
	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _documentType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentType");
	var _currentStorageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentStorageId");
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
	var _storageBlocks = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageBlocks");
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
	    Object.defineProperty(this, _currentStorageId, {
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
	    Object.defineProperty(this, _storageBlocks, {
	      writable: true,
	      value: []
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
	  async afterFormRender(form) {
	    const {
	      StorageSelector,
	      mapStorageBlocksToFilterFields,
	      resolveCurrentStorageId
	    } = await main_core.Runtime.loadExtension('bizproc.storage-selector');
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = form;
	    if (main_core.Type.isPlainObject(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options])) {
	      babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType] = babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].documentType;
	      if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _form)[_form])) {
	        var _babelHelpers$classPr;
	        babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = resolveCurrentStorageId(babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]);
	        babelHelpers.classPrivateFieldLooseBase(this, _deleteModeElement)[_deleteModeElement] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sda-delete-mode-dependent"]');
	        babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].delete_mode;
	        babelHelpers.classPrivateFieldLooseBase(this, _currentDeleteMode)[_currentDeleteMode] = ((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _deleteModeSelect)[_deleteModeSelect]) == null ? void 0 : _babelHelpers$classPr.value) || '';
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _document)[_document] = new bizproc_automation.Document({
	        rawDocumentType: babelHelpers.classPrivateFieldLooseBase(this, _documentType)[_documentType],
	        documentFields: [],
	        title: 'document'
	      });
	      main_core_events.EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', event => {
	        const {
	          blocks
	        } = event.getData();
	        babelHelpers.classPrivateFieldLooseBase(this, _storageBlocks)[_storageBlocks] = (blocks || []).filter(block => {
	          var _block$activity;
	          return ((_block$activity = block.activity) == null ? void 0 : _block$activity.Type) === 'CreateStorageNode';
	        });
	        babelHelpers.classPrivateFieldLooseBase(this, _initFilterFields)[_initFilterFields](babelHelpers.classPrivateFieldLooseBase(this, _options)[_options], mapStorageBlocksToFilterFields);
	        babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _initAutomationContext)[_initAutomationContext]();
	      babelHelpers.classPrivateFieldLooseBase(this, _initStorageSelector)[_initStorageSelector](StorageSelector);
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
	    if (babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].destroy();
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = null;
	    }
	  }
	}
	function _initStorageSelector2(StorageSelector) {
	  var _babelHelpers$classPr2;
	  const dialogId = 'entityselector_storage_id';
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = new StorageSelector({
	    dialogId,
	    onStateChange: babelHelpers.classPrivateFieldLooseBase(this, _onStorageStateChange)[_onStorageStateChange].bind(this),
	    initialValue: babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId],
	    storageCodeInput: (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr2.querySelector('[name="storage_code"]')
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].init();
	}
	function _onStorageStateChange2(newStorageId) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] !== String(newStorageId)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = String(newStorageId);
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup();
	  }
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
	  var _babelHelpers$classPr3;
	  return ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded) == null ? void 0 : _babelHelpers$classPr3.value) === 'Y';
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
	  if (babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] && babelHelpers.classPrivateFieldLooseBase(this, _currentDeleteMode)[_currentDeleteMode] === 'multiple') {
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
	function _initFilterFields2(options, mapStorageBlocksToFilterFields) {
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsContainer)[_filterFieldsContainer] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sda-filter-fields-container"]');
	  babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix] = options.filteringFieldsPrefix;
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = new Map(Object.entries(options.filterFieldsMap).map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]));
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = mapStorageBlocksToFilterFields(babelHelpers.classPrivateFieldLooseBase(this, _storageBlocks)[_storageBlocks], babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap]);
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup(options.conditions);
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector] = null;
	}

	exports.DeleteDataStorageActivityRenderer = DeleteDataStorageActivityRenderer;

}((this.window = this.window || {}),BX,BX.Bizproc.Automation,BX.Event));
//# sourceMappingURL=renderer.js.map
