/* eslint-disable */
(function (exports,main_core,bizproc_automation,main_core_events) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _documentType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentType");
	var _document = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("document");
	var _storageIdDependentElements = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageIdDependentElements");
	var _returnFieldsMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("returnFieldsMap");
	var _returnFieldsIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("returnFieldsIds");
	var _systemReturnFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("systemReturnFields");
	var _filterFieldsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFieldsContainer");
	var _filteringFieldsPrefix = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filteringFieldsPrefix");
	var _filterFieldsMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterFieldsMap");
	var _conditionGroup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionGroup");
	var _conditionGroupSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionGroupSelector");
	var _currentStorageId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentStorageId");
	var _storageBlocks = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("storageBlocks");
	var _initStorageSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initStorageSelector");
	var _initFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initFilterFields");
	var _initReturnFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initReturnFields");
	var _initAutomationContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initAutomationContext");
	var _populateDynamicStorageReturnFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("populateDynamicStorageReturnFields");
	var _onStorageStateChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onStorageStateChange");
	var _render = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _showFieldSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showFieldSelector");
	var _renderFilterFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderFilterFields");
	var _getFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilterExpandedState");
	var _saveFilterExpandedState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveFilterExpandedState");
	var _renderReturnFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderReturnFields");
	class ReadDataStorageActivityRenderer {
	  constructor() {
	    Object.defineProperty(this, _renderReturnFields, {
	      value: _renderReturnFields2
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
	    Object.defineProperty(this, _showFieldSelector, {
	      value: _showFieldSelector2
	    });
	    Object.defineProperty(this, _render, {
	      value: _render2
	    });
	    Object.defineProperty(this, _onStorageStateChange, {
	      value: _onStorageStateChange2
	    });
	    Object.defineProperty(this, _populateDynamicStorageReturnFields, {
	      value: _populateDynamicStorageReturnFields2
	    });
	    Object.defineProperty(this, _initAutomationContext, {
	      value: _initAutomationContext2
	    });
	    Object.defineProperty(this, _initReturnFields, {
	      value: _initReturnFields2
	    });
	    Object.defineProperty(this, _initFilterFields, {
	      value: _initFilterFields2
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
	    Object.defineProperty(this, _dialog, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _documentType, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _document, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _storageIdDependentElements, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _returnFieldsMap, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _returnFieldsIds, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _systemReturnFields, {
	      writable: true,
	      value: new Map()
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
	    Object.defineProperty(this, _conditionGroup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _conditionGroupSelector, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _currentStorageId, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _storageBlocks, {
	      writable: true,
	      value: []
	    });
	  }
	  getControlRenderers() {
	    return {
	      filterFields: field => {
	        babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = field.property.Options || {};
	        babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].headCaption = field.property.Name || '';
	        return main_core.Tag.render(_t || (_t = _`
					<div data-role="bpa-sra-storage-id-dependent">
						<div data-role="bpa-sra-filter-fields-container"></div>
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
	        babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = resolveCurrentStorageId(babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]);
	        babelHelpers.classPrivateFieldLooseBase(this, _storageIdDependentElements)[_storageIdDependentElements] = form.querySelectorAll('#row_return_fields, #row_filter_fields');
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
	        babelHelpers.classPrivateFieldLooseBase(this, _initReturnFields)[_initReturnFields](babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]);
	        babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _initAutomationContext)[_initAutomationContext]();
	      babelHelpers.classPrivateFieldLooseBase(this, _initStorageSelector)[_initStorageSelector](StorageSelector);
	      babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	    }
	  }
	  destroy() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].destroy();
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = null;
	    }
	  }
	}
	function _initStorageSelector2(StorageSelector) {
	  var _babelHelpers$classPr;
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = new StorageSelector({
	    dialogId: 'entityselector_storage_id',
	    onStateChange: babelHelpers.classPrivateFieldLooseBase(this, _onStorageStateChange)[_onStorageStateChange].bind(this),
	    initialValue: babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId],
	    storageCodeInput: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr.querySelector('[name="storage_code"]')
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].init();
	}
	function _initFilterFields2(options, mapStorageBlocksToFilterFields) {
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsContainer)[_filterFieldsContainer] = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('[data-role="bpa-sra-filter-fields-container"]');
	  babelHelpers.classPrivateFieldLooseBase(this, _filteringFieldsPrefix)[_filteringFieldsPrefix] = options.filteringFieldsPrefix;
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = new Map(Object.entries(options.filterFieldsMap).map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]));
	  babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap] = mapStorageBlocksToFilterFields(babelHelpers.classPrivateFieldLooseBase(this, _storageBlocks)[_storageBlocks], babelHelpers.classPrivateFieldLooseBase(this, _filterFieldsMap)[_filterFieldsMap]);
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup(options.conditions);
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector] = null;
	}
	function _initReturnFields2(options) {
	  babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsIds)[_returnFieldsIds] = main_core.Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];
	  const storageInput = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelector('input[name="storage_id"]');
	  const storageIdValue = (storageInput == null ? void 0 : storageInput.value) || '';
	  if (!storageIdValue || storageIdValue === '0') {
	    const inputs = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].querySelectorAll('[name="return_fields_by_storage_code[]"]');
	    const values = [...inputs].map(input => input.value).filter(Boolean);
	    if (values.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsIds)[_returnFieldsIds] = values;
	    }
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsMap)[_returnFieldsMap] = new Map();
	  Object.entries(options.returnFieldsMap).forEach(([storageId, fieldsMap]) => {
	    babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsMap)[_returnFieldsMap].set(String(storageId), new Map(Object.entries(fieldsMap)));
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _systemReturnFields)[_systemReturnFields] = new Map();
	  if (main_core.Type.isPlainObject(options.systemReturnFields)) {
	    Object.entries(options.systemReturnFields).forEach(([fieldId, field]) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _systemReturnFields)[_systemReturnFields].set(String(fieldId), {
	        Name: field.Name
	      });
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _populateDynamicStorageReturnFields)[_populateDynamicStorageReturnFields]();
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
	function _populateDynamicStorageReturnFields2() {
	  for (const block of babelHelpers.classPrivateFieldLooseBase(this, _storageBlocks)[_storageBlocks]) {
	    var _block$activity2;
	    const properties = (_block$activity2 = block.activity) == null ? void 0 : _block$activity2.Properties;
	    if (!(properties != null && properties.StorageCode) || !main_core.Type.isArrayFilled(properties.SelectedFields)) {
	      continue;
	    }
	    const fieldsMap = new Map(babelHelpers.classPrivateFieldLooseBase(this, _systemReturnFields)[_systemReturnFields]);
	    for (const field of properties.SelectedFields) {
	      fieldsMap.set(String(field.code), {
	        Name: field.name
	      });
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsMap)[_returnFieldsMap].set(String(properties.StorageCode), fieldsMap);
	  }
	}
	function _onStorageStateChange2(newStorageId) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] !== String(newStorageId)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] = String(newStorageId);
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroupSelector)[_conditionGroupSelector] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionGroup)[_conditionGroup] = new bizproc_automation.ConditionGroup();
	    babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsIds)[_returnFieldsIds] = [];
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	}
	function _render2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] || babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId] === '0') {
	    var _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _storageIdDependentElements)[_storageIdDependentElements]) == null ? void 0 : _babelHelpers$classPr2.forEach(element => main_core.Dom.hide(element));
	  } else {
	    var _babelHelpers$classPr3;
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _storageIdDependentElements)[_storageIdDependentElements]) == null ? void 0 : _babelHelpers$classPr3.forEach(element => main_core.Dom.show(element));
	    babelHelpers.classPrivateFieldLooseBase(this, _renderFilterFields)[_renderFilterFields]();
	    babelHelpers.classPrivateFieldLooseBase(this, _renderReturnFields)[_renderReturnFields]();
	  }
	}
	function _showFieldSelector2(targetInputId) {
	  window.BPAShowSelector(targetInputId, 'string', '');
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
	  var _babelHelpers$classPr4;
	  return ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded) == null ? void 0 : _babelHelpers$classPr4.value) === 'Y';
	}
	function _saveFilterExpandedState2(isExpanded) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].is_expanded.value = isExpanded ? 'Y' : 'N';
	  }
	}
	function _renderReturnFields2() {
	  var _babelHelpers$classPr5;
	  const storageId = babelHelpers.classPrivateFieldLooseBase(this, _currentStorageId)[_currentStorageId];
	  const fieldsMap = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsMap)[_returnFieldsMap]) == null ? void 0 : _babelHelpers$classPr5.get(storageId);
	  if (!main_core.Type.isNil(fieldsMap)) {
	    const fieldOptions = {};
	    fieldsMap.forEach((field, fieldId) => {
	      fieldOptions[fieldId] = field.Name;
	    });
	    const selectElement = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].id_return_fields;
	    if (!selectElement) {
	      return;
	    }
	    main_core.Dom.clean(selectElement);
	    for (const [value, text] of Object.entries(fieldOptions)) {
	      var _babelHelpers$classPr6, _babelHelpers$classPr7;
	      const isSelected = ((_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsIds)[_returnFieldsIds]) == null ? void 0 : _babelHelpers$classPr6.includes(value)) || ((_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _returnFieldsIds)[_returnFieldsIds]) == null ? void 0 : _babelHelpers$classPr7.includes(Number(value)));
	      selectElement.add(main_core.Tag.render(_t2 || (_t2 = _`
						<option value="${0}" ${0}>
							${0}
						</option>
					`), main_core.Text.encode(value), isSelected ? 'selected' : '', main_core.Text.encode(text)));
	    }
	  }
	}

	exports.ReadDataStorageActivityRenderer = ReadDataStorageActivityRenderer;

}((this.window = this.window || {}),BX,BX.Bizproc.Automation,BX.Event));
//# sourceMappingURL=renderer.js.map
