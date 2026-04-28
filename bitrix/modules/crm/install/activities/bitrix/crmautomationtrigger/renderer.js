/* eslint-disable */
(function (exports,main_core,main_core_events,bizproc_automation) {
	'use strict';

	let _ = t => t,
	  _t;
	var _conditionFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionFields");
	var _conditionField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionField");
	var _triggerConditionField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("triggerConditionField");
	var _triggerConditionNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("triggerConditionNode");
	var _conditionSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("conditionSelector");
	var _onNodeSettingsSaveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onNodeSettingsSaveHandler");
	var _onDocumentChangeHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentChangeHandler");
	var _onDocumentRemoveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentRemoveHandler");
	var _onNodeSettingsSave = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onNodeSettingsSave");
	var _renderTriggerConditionSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderTriggerConditionSettings");
	var _recreateConditionSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("recreateConditionSelector");
	var _destroyConditionSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyConditionSelector");
	var _mountConditionNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountConditionNode");
	var _createConditionSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createConditionSelector");
	var _renderConditionGroupSelector = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderConditionGroupSelector");
	var _onDocumentChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentChange");
	var _onDocumentRemove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentRemove");
	var _updateContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateContext");
	var _setDefaultContext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDefaultContext");
	class CrmAutomationTriggerRenderer {
	  constructor() {
	    Object.defineProperty(this, _setDefaultContext, {
	      value: _setDefaultContext2
	    });
	    Object.defineProperty(this, _updateContext, {
	      value: _updateContext2
	    });
	    Object.defineProperty(this, _onDocumentRemove, {
	      value: _onDocumentRemove2
	    });
	    Object.defineProperty(this, _onDocumentChange, {
	      value: _onDocumentChange2
	    });
	    Object.defineProperty(this, _renderConditionGroupSelector, {
	      value: _renderConditionGroupSelector2
	    });
	    Object.defineProperty(this, _createConditionSelector, {
	      value: _createConditionSelector2
	    });
	    Object.defineProperty(this, _mountConditionNode, {
	      value: _mountConditionNode2
	    });
	    Object.defineProperty(this, _destroyConditionSelector, {
	      value: _destroyConditionSelector2
	    });
	    Object.defineProperty(this, _recreateConditionSelector, {
	      value: _recreateConditionSelector2
	    });
	    Object.defineProperty(this, _renderTriggerConditionSettings, {
	      value: _renderTriggerConditionSettings2
	    });
	    Object.defineProperty(this, _onNodeSettingsSave, {
	      value: _onNodeSettingsSave2
	    });
	    Object.defineProperty(this, _conditionFields, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _conditionField, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _triggerConditionField, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _triggerConditionNode, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _conditionSelector, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onNodeSettingsSaveHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onDocumentChangeHandler, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onDocumentRemoveHandler, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _setDefaultContext)[_setDefaultContext]();
	    babelHelpers.classPrivateFieldLooseBase(this, _onNodeSettingsSaveHandler)[_onNodeSettingsSaveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onNodeSettingsSave)[_onNodeSettingsSave].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChange)[_onDocumentChange].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onDocumentRemoveHandler)[_onDocumentRemoveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onDocumentRemove)[_onDocumentRemove].bind(this);
	  }
	  afterFormRender(form) {
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionField)[_conditionField] = form.querySelector('#row_condition');
	    if (main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _conditionSelector)[_conditionSelector])) {
	      main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _conditionField)[_conditionField]);
	    }
	    main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:nodeSettingsSaving', babelHelpers.classPrivateFieldLooseBase(this, _onNodeSettingsSaveHandler)[_onNodeSettingsSaveHandler]);
	    main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler]);
	    main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentRemoveHandler)[_onDocumentRemoveHandler]);
	  }
	  getControlRenderers() {
	    return {
	      '@trigger-condition-settings': field => babelHelpers.classPrivateFieldLooseBase(this, _renderTriggerConditionSettings)[_renderTriggerConditionSettings](field),
	      '@condition-group-selector': field => babelHelpers.classPrivateFieldLooseBase(this, _renderConditionGroupSelector)[_renderConditionGroupSelector](field)
	    };
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _conditionFields)[_conditionFields] = [];
	    main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', babelHelpers.classPrivateFieldLooseBase(this, _onNodeSettingsSaveHandler)[_onNodeSettingsSaveHandler]);
	    main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler]);
	    main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentRemoveHandler)[_onDocumentRemoveHandler]);
	  }
	}
	function _onNodeSettingsSave2(event) {
	  const {
	    formData
	  } = event.getData();
	  for (const property of babelHelpers.classPrivateFieldLooseBase(this, _conditionFields)[_conditionFields]) {
	    const conditionGroup = bizproc_automation.ConditionGroup.createFromForm(formData, property);
	    formData[property] = conditionGroup.serialize();
	  }
	  formData.condition = bizproc_automation.ConditionGroup.createFromForm(formData).serialize();
	}
	function _renderTriggerConditionSettings2(field) {
	  babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionField)[_triggerConditionField] = field;
	  const property = field.property;
	  const settings = property.Settings;
	  if (!settings) {
	    babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode] = main_core.Tag.render(_t || (_t = _`<div></div>`));
	    return babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode];
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _updateContext)[_updateContext](settings);
	  babelHelpers.classPrivateFieldLooseBase(this, _recreateConditionSelector)[_recreateConditionSelector](field.value);
	  return babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode];
	}
	function _recreateConditionSelector2(value = null) {
	  babelHelpers.classPrivateFieldLooseBase(this, _destroyConditionSelector)[_destroyConditionSelector]();
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionSelector)[_conditionSelector] = babelHelpers.classPrivateFieldLooseBase(this, _createConditionSelector)[_createConditionSelector](value);
	  babelHelpers.classPrivateFieldLooseBase(this, _mountConditionNode)[_mountConditionNode](babelHelpers.classPrivateFieldLooseBase(this, _conditionSelector)[_conditionSelector].createNode());
	}
	function _destroyConditionSelector2() {
	  var _babelHelpers$classPr;
	  (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _conditionSelector)[_conditionSelector]) == null ? void 0 : _babelHelpers$classPr.destroy();
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionSelector)[_conditionSelector] = null;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode]) {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode]);
	    babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode] = null;
	  }
	}
	function _mountConditionNode2(node) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode]) {
	    main_core.Dom.replace(babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode], node);
	  } else {
	    main_core.Dom.append(node, babelHelpers.classPrivateFieldLooseBase(this, _conditionField)[_conditionField]);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionNode)[_triggerConditionNode] = node;
	}
	function _createConditionSelector2(value = null) {
	  const name = babelHelpers.classPrivateFieldLooseBase(this, _triggerConditionField)[_triggerConditionField].property.Name;
	  return new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(value), {
	    fields: bizproc_automation.getGlobalContext().document.getFields(),
	    showValuesSelector: false,
	    caption: {
	      head: name
	    },
	    isExpanded: true
	  });
	}
	function _renderConditionGroupSelector2(field) {
	  const property = field.property;
	  babelHelpers.classPrivateFieldLooseBase(this, _conditionFields)[_conditionFields].push(property.Id);
	  const selector = new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(field.value), {
	    fields: property.Settings.Fields,
	    fieldPrefix: property.Id,
	    showValuesSelector: false,
	    caption: {
	      head: property.Name
	    },
	    isExpanded: true
	  });
	  return selector.createNode();
	}
	function _onDocumentChange2(event) {
	  const {
	    item
	  } = event.getData();
	  main_core.ajax.runAction('bizproc.activity.request', {
	    data: {
	      documentType: bizproc_automation.getGlobalContext().document.getRawType(),
	      activity: 'CrmAutomationTrigger',
	      params: {
	        document: item.id,
	        form_name: 'document'
	      }
	    }
	  }).then(response => {
	    const data = response.data;
	    if (!main_core.Type.isPlainObject(data)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateContext)[_updateContext](data);
	    main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _conditionField)[_conditionField]);
	    babelHelpers.classPrivateFieldLooseBase(this, _recreateConditionSelector)[_recreateConditionSelector]();
	  }).catch(e => console.error(e));
	}
	function _onDocumentRemove2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _setDefaultContext)[_setDefaultContext]();
	  babelHelpers.classPrivateFieldLooseBase(this, _destroyConditionSelector)[_destroyConditionSelector]();
	  main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _conditionField)[_conditionField]);
	}
	function _updateContext2(data) {
	  const document = new bizproc_automation.Document({
	    rawDocumentType: data.DocumentType,
	    documentFields: data.Fields,
	    title: data.Title
	  });
	  bizproc_automation.setGlobalContext(new bizproc_automation.Context({
	    document
	  }));
	}
	function _setDefaultContext2() {
	  const document = new bizproc_automation.Document({
	    rawDocumentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
	    documentFields: [],
	    title: 'document'
	  });
	  bizproc_automation.setGlobalContext(new bizproc_automation.Context({
	    document
	  }));
	}

	exports.CrmAutomationTriggerRenderer = CrmAutomationTriggerRenderer;

}((this.window = this.window || {}),BX,BX.Event,BX.Bizproc.Automation));
//# sourceMappingURL=renderer.js.map
