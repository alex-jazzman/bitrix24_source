/* eslint-disable */
(function (exports,main_core,main_core_events) {
	'use strict';

	let _ = t => t,
	  _t;
	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _onDocumentChangeHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentChangeHandler");
	var _onDocumentDeselectHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentDeselectHandler");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _onDocumentChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentChange");
	var _onDocumentDeselect = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDocumentDeselect");
	class CrmEntityFieldChangedTriggerRenderer {
	  constructor() {
	    Object.defineProperty(this, _onDocumentDeselect, {
	      value: _onDocumentDeselect2
	    });
	    Object.defineProperty(this, _onDocumentChange, {
	      value: _onDocumentChange2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _form, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onDocumentChangeHandler, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onDocumentDeselectHandler, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChange)[_onDocumentChange].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onDocumentDeselectHandler)[_onDocumentDeselectHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onDocumentDeselect)[_onDocumentDeselect].bind(this);
	  }
	  afterFormRender(form) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = form;
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = null;
	    main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler]);
	    main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentDeselectHandler)[_onDocumentDeselectHandler]);
	  }
	}
	function _bindEvents2() {
	  main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentChangeHandler)[_onDocumentChangeHandler]);
	  main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', babelHelpers.classPrivateFieldLooseBase(this, _onDocumentDeselectHandler)[_onDocumentDeselectHandler]);
	}
	function _onDocumentChange2(event) {
	  const {
	    item
	  } = event.getData();
	  main_core.ajax.runAction('bizproc.activity.request', {
	    data: {
	      documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
	      activity: 'CrmEntityFieldChangedTrigger',
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
	    const selectElement = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].id_Fields;
	    if (!selectElement) {
	      return;
	    }
	    main_core.Dom.clean(selectElement);
	    for (const [value, text] of Object.entries(data)) {
	      selectElement.add(main_core.Tag.render(_t || (_t = _`<option value="${0}">${0}</option>`), value, text));
	    }
	  }).catch(e => console.error(e));
	}
	function _onDocumentDeselect2() {
	  const selectElement = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form].id_Fields;
	  if (!selectElement) {
	    return;
	  }
	  main_core.Dom.clean(selectElement);
	}

	exports.CrmEntityFieldChangedTriggerRenderer = CrmEntityFieldChangedTriggerRenderer;

}((this.window = this.window || {}),BX,BX.Event));
//# sourceMappingURL=renderer.js.map
