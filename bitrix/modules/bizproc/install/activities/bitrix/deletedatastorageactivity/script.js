/* eslint-disable */
(function (exports,main_core,bizproc_automation) {
	'use strict';

	var namespace = main_core.Reflection.namespace('BX.Bizproc.Activity');
	var DeleteDataStorageActivity = /*#__PURE__*/function () {
	  function DeleteDataStorageActivity(options) {
	    babelHelpers.classCallCheck(this, DeleteDataStorageActivity);
	    if (main_core.Type.isPlainObject(options)) {
	      this.documentType = options.documentType;
	      var form = document.forms[options.formName];
	      if (!main_core.Type.isNil(form)) {
	        var _this$storageIdSelect, _this$storageCodeInpu, _this$deleteModeSelec;
	        this.storageIdSelect = form.storage_id;
	        this.storageCodeInput = form.storage_code;
	        this.currentStorageId = Number(((_this$storageIdSelect = this.storageIdSelect) === null || _this$storageIdSelect === void 0 ? void 0 : _this$storageIdSelect.value) || 0);
	        this.currentStorageCode = (_this$storageCodeInpu = this.storageCodeInput) === null || _this$storageCodeInpu === void 0 ? void 0 : _this$storageCodeInpu.value;
	        this.deleteModeElement = document.querySelector('[data-role="bpa-sda-delete-mode-dependent"]');
	        this.deleteModeSelect = form.delete_mode;
	        this.currentDeleteMode = ((_this$deleteModeSelec = this.deleteModeSelect) === null || _this$deleteModeSelec === void 0 ? void 0 : _this$deleteModeSelec.value) || '';
	      }
	      this.document = new bizproc_automation.Document({
	        rawDocumentType: this.documentType,
	        documentFields: options.documentFields,
	        title: options.documentName
	      });
	      this.initAutomationContext();
	      this.initFilterFields(options);
	      this.render();
	    }
	  }
	  babelHelpers.createClass(DeleteDataStorageActivity, [{
	    key: "initFilterFields",
	    value: function initFilterFields(options) {
	      this.conditionIdPrefix = 'id_bpa_sra_field_';
	      this.filterFieldsContainer = document.querySelector('[data-role="bpa-sda-filter-fields-container"]');
	      this.filteringFieldsPrefix = options.filteringFieldsPrefix;
	      this.filterFieldsMap = new Map(Object.entries(options.filterFieldsMap).map(function (_ref) {
	        var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	          storageId = _ref2[0],
	          fieldsMap = _ref2[1];
	        return [Number(storageId), fieldsMap];
	      }));
	      this.conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
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
	      if (this.storageCodeInput) {
	        main_core.Event.bind(this.storageCodeInput, 'change', this.onStorageCodeChange.bind(this));
	      }
	      if (this.deleteModeSelect) {
	        main_core.Event.bind(this.deleteModeSelect, 'change', this.onDeleteModeChange.bind(this));
	      }
	    }
	  }, {
	    key: "onStorageIdChange",
	    value: function onStorageIdChange() {
	      this.storageCodeInput.value = '';
	      this.currentStorageId = Number(this.storageIdSelect.value);
	      this.conditionGroup = new bizproc_automation.ConditionGroup();
	      this.render();
	    }
	  }, {
	    key: "onStorageCodeChange",
	    value: function onStorageCodeChange() {
	      var _this$storageCodeInpu2;
	      this.storageIdSelect.value = '';
	      this.currentStorageCode = (_this$storageCodeInpu2 = this.storageCodeInput) === null || _this$storageCodeInpu2 === void 0 ? void 0 : _this$storageCodeInpu2.value;
	      this.conditionGroup = new bizproc_automation.ConditionGroup();
	      this.render();
	    }
	  }, {
	    key: "onDeleteModeChange",
	    value: function onDeleteModeChange() {
	      this.currentDeleteMode = this.deleteModeSelect.value;
	      this.conditionGroup = new bizproc_automation.ConditionGroup();
	      this.render();
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      if ((this.currentStorageId > 0 || this.currentStorageCode) && this.currentDeleteMode === 'multiple') {
	        main_core.Dom.show(this.deleteModeElement);
	        this.renderFilterFields();
	      } else {
	        main_core.Dom.hide(this.deleteModeElement);
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
	            head: main_core.Loc.getMessage('BIZPROC_SDA_FILTER_FIELDS_PROPERTY'),
	            collapsed: main_core.Loc.getMessage('BIZPROC_SDA_FILTER_FIELDS_COLLAPSED_TEXT')
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
	  }]);
	  return DeleteDataStorageActivity;
	}();
	namespace.DeleteDataStorageActivity = DeleteDataStorageActivity;

}((this.window = this.window || {}),BX,BX.Bizproc.Automation));
//# sourceMappingURL=script.js.map
