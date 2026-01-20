/* eslint-disable */
(function (exports,main_core,bizproc_automation) {
	'use strict';

	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var namespace = main_core.Reflection.namespace('BX.Bizproc.Activity');
	var _storageCodeData = /*#__PURE__*/new WeakMap();
	var _onStorageCodeChange = /*#__PURE__*/new WeakSet();
	var _clearStorageCodeAndValue = /*#__PURE__*/new WeakSet();
	var _renderStorageCodeFields = /*#__PURE__*/new WeakSet();
	var ReadDataStorageActivity = /*#__PURE__*/function () {
	  function ReadDataStorageActivity(options) {
	    babelHelpers.classCallCheck(this, ReadDataStorageActivity);
	    _classPrivateMethodInitSpec(this, _renderStorageCodeFields);
	    _classPrivateMethodInitSpec(this, _clearStorageCodeAndValue);
	    _classPrivateMethodInitSpec(this, _onStorageCodeChange);
	    _classPrivateFieldInitSpec(this, _storageCodeData, {
	      writable: true,
	      value: {
	        dependentElements: [],
	        isReturnFieldsRendered: true
	      }
	    });
	    babelHelpers.defineProperty(this, "returnFieldsProperty", {});
	    if (main_core.Type.isPlainObject(options)) {
	      this.documentType = options.documentType;
	      var form = document.forms[options.formName];
	      if (!main_core.Type.isNil(form)) {
	        var _this$storageIdSelect, _babelHelpers$classPr;
	        this.storageIdSelect = form.storage_id;
	        this.currentStorageId = Number(((_this$storageIdSelect = this.storageIdSelect) === null || _this$storageIdSelect === void 0 ? void 0 : _this$storageIdSelect.value) || 0);
	        this.storageIdDependentElements = form.querySelectorAll('[data-role="bpa-sra-storage-id-dependent"]');
	        babelHelpers.classPrivateFieldGet(this, _storageCodeData).element = form.storage_code;
	        (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _storageCodeData).dependentElements).push.apply(_babelHelpers$classPr, babelHelpers.toConsumableArray(form.querySelectorAll('[data-role="bpa-sra-storage-code-dependent"]').values()).concat([form.querySelector('[data-role="bpa-sra-filter-fields-container"]').closest('tr')]));
	      }
	      this.document = new bizproc_automation.Document({
	        rawDocumentType: this.documentType,
	        documentFields: options.documentFields,
	        title: options.documentName
	      });
	      this.initAutomationContext();
	      this.initFilterFields(options);
	      this.initReturnFields(options);
	      this.render();
	    }
	  }
	  babelHelpers.createClass(ReadDataStorageActivity, [{
	    key: "initFilterFields",
	    value: function initFilterFields(options) {
	      this.conditionIdPrefix = 'id_bpa_sra_field_';
	      this.filterFieldsContainer = document.querySelector('[data-role="bpa-sra-filter-fields-container"]');
	      this.filteringFieldsPrefix = options.filteringFieldsPrefix;
	      this.filterFieldsMap = new Map(Object.entries(options.filterFieldsMap).map(function (_ref) {
	        var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	          storageId = _ref2[0],
	          fieldsMap = _ref2[1];
	        return [Number(storageId), fieldsMap];
	      }));
	      if (!main_core.Type.isNil(options.documentType)) {
	        BX.Bizproc.Automation.API.documentType = options.documentType;
	      }
	      this.conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
	    }
	  }, {
	    key: "initReturnFields",
	    value: function initReturnFields(options) {
	      var _this = this;
	      this.returnFieldsProperty = options.returnFieldsProperty;
	      this.returnFieldsIds = main_core.Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];
	      this.returnFieldsMapContainer = document.querySelector('[data-role="bpa-sra-return-fields-container"]');
	      this.returnFieldsMap = new Map();
	      Object.entries(options.returnFieldsMap).forEach(function (_ref3) {
	        var _ref4 = babelHelpers.slicedToArray(_ref3, 2),
	          storageId = _ref4[0],
	          fieldsMap = _ref4[1];
	        _this.returnFieldsMap.set(Number(storageId), new Map(Object.entries(fieldsMap)));
	      });
	      babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsProperty = options.returnFieldsByStorageCodeProperty;
	      babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsContainer = document.querySelector('[data-role="bpa-sra-return-fields-by-storage-code-container"]');
	    }
	  }, {
	    key: "initAutomationContext",
	    value: function initAutomationContext() {
	      try {
	        bizproc_automation.getGlobalContext();
	      } catch (_unused) {
	        bizproc_automation.setGlobalContext(new bizproc_automation.Context({
	          document: this.document
	        }));
	      }
	    }
	  }, {
	    key: "init",
	    value: function init() {
	      if (this.storageIdSelect) {
	        main_core.Event.bind(this.storageIdSelect, 'change', this.onStorageIdChange.bind(this));
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _storageCodeData).element) {
	        this.renderFilterFields();
	        main_core.Event.bind(babelHelpers.classPrivateFieldGet(this, _storageCodeData).element, 'input', _classPrivateMethodGet(this, _onStorageCodeChange, _onStorageCodeChange2).bind(this));
	        main_core.Event.bind(babelHelpers.classPrivateFieldGet(this, _storageCodeData).element, 'focus', _classPrivateMethodGet(this, _onStorageCodeChange, _onStorageCodeChange2).bind(this));
	      }
	    }
	  }, {
	    key: "onStorageIdChange",
	    value: function onStorageIdChange() {
	      this.currentStorageId = Number(this.storageIdSelect.value);
	      if (this.currentStorageId > 0) {
	        _classPrivateMethodGet(this, _clearStorageCodeAndValue, _clearStorageCodeAndValue2).call(this);
	      }
	      this.conditionGroup = new bizproc_automation.ConditionGroup();
	      this.returnFieldsIds = [];
	      this.render();
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      babelHelpers.classPrivateFieldGet(this, _storageCodeData).dependentElements.forEach(function (element) {
	        return main_core.Dom.hide(element);
	      });
	      if (main_core.Type.isNil(this.currentStorageId) || this.currentStorageId <= 0) {
	        this.storageIdDependentElements.forEach(function (element) {
	          return main_core.Dom.hide(element);
	        });
	        _classPrivateMethodGet(this, _renderStorageCodeFields, _renderStorageCodeFields2).call(this);
	      } else {
	        this.storageIdDependentElements.forEach(function (element) {
	          return main_core.Dom.show(element);
	        });
	        this.renderFilterFields();
	        this.renderReturnFields();
	      }
	    }
	  }, {
	    key: "showFieldSelector",
	    value: function showFieldSelector(targetInputId) {
	      BPAShowSelector(targetInputId, 'string', '');
	    }
	  }, {
	    key: "renderFilterFields",
	    value: function renderFilterFields() {
	      if (!main_core.Type.isNil(this.conditionGroup)) {
	        var selector = new bizproc_automation.ConditionGroupSelector(this.conditionGroup, {
	          fields: Object.values(this.filterFieldsMap.get(this.currentStorageId) || {}),
	          fieldPrefix: this.filteringFieldsPrefix,
	          customSelector: main_core.Type.isFunction(BPAShowSelector) ? this.showFieldSelector : null,
	          caption: {
	            head: main_core.Loc.getMessage('BIZPROC_SRA_FILTER_FIELDS_PROPERTY'),
	            collapsed: main_core.Loc.getMessage('BIZPROC_SRA_FILTER_FIELDS_COLLAPSED_TEXT')
	          }
	        });
	        if (selector.modern && this.filterFieldsContainer && this.filterFieldsContainer.parentNode) {
	          var element = this.filterFieldsContainer.parentNode.firstElementChild === this.filterFieldsContainer ? this.filterFieldsContainer.parentNode.parentNode.firstElementChild : this.filterFieldsContainer.parentNode.firstElementChild;
	          main_core.Dom.clean(element);
	        }
	        main_core.Dom.clean(this.filterFieldsContainer);
	        main_core.Dom.append(selector.createNode(), this.filterFieldsContainer);
	      }
	    }
	  }, {
	    key: "renderReturnFields",
	    value: function renderReturnFields() {
	      var storageId = this.currentStorageId;
	      var fieldsMap = this.returnFieldsMap.get(storageId);
	      if (!main_core.Type.isNil(fieldsMap)) {
	        var fieldOptions = {};
	        fieldsMap.forEach(function (field, fieldId) {
	          fieldOptions[fieldId] = field.Name;
	        });
	        this.returnFieldsProperty.Options = fieldOptions;
	        main_core.Dom.clean(this.returnFieldsMapContainer);
	        this.returnFieldsMapContainer.appendChild(BX.Bizproc.FieldType.renderControl(this.documentType, this.returnFieldsProperty, this.returnFieldsProperty.FieldName, this.returnFieldsIds, 'designer'));
	      }
	    }
	  }]);
	  return ReadDataStorageActivity;
	}();
	function _onStorageCodeChange2() {
	  if (this.currentStorageId <= 0 && babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsContainer) {
	    if (!main_core.Type.isStringFilled(babelHelpers.classPrivateFieldGet(this, _storageCodeData).element.value)) {
	      _classPrivateMethodGet(this, _clearStorageCodeAndValue, _clearStorageCodeAndValue2).call(this);
	    }
	    this.render();
	  }
	}
	function _clearStorageCodeAndValue2() {
	  babelHelpers.classPrivateFieldGet(this, _storageCodeData).dependentElements.forEach(function (element) {
	    return main_core.Dom.hide(element);
	  });
	  babelHelpers.classPrivateFieldGet(this, _storageCodeData).element.value = '';
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsContainer);
	  babelHelpers.classPrivateFieldGet(this, _storageCodeData).isReturnFieldsRendered = false;
	  this.conditionGroup = new bizproc_automation.ConditionGroup();
	}
	function _renderStorageCodeFields2() {
	  if (main_core.Type.isStringFilled(babelHelpers.classPrivateFieldGet(this, _storageCodeData).element.value)) {
	    babelHelpers.classPrivateFieldGet(this, _storageCodeData).dependentElements.forEach(function (element) {
	      return main_core.Dom.show(element);
	    });
	    if (!babelHelpers.classPrivateFieldGet(this, _storageCodeData).isReturnFieldsRendered) {
	      this.renderFilterFields();
	      main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsContainer);
	      main_core.Dom.append(BX.Bizproc.FieldType.renderControlDesigner(this.documentType, babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsProperty, babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsProperty.FieldName), babelHelpers.classPrivateFieldGet(this, _storageCodeData).returnFieldsContainer);
	      babelHelpers.classPrivateFieldGet(this, _storageCodeData).isReturnFieldsRendered = true;
	    }
	  }
	}
	namespace.ReadDataStorageActivity = ReadDataStorageActivity;

}((this.window = this.window || {}),BX,BX.Bizproc.Automation));
//# sourceMappingURL=script.js.map
