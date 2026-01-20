/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core_events,im_v2_const,im_v2_application_core,im_v2_lib_escManager) {
	'use strict';

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _emitter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitter");
	var _bindEscHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEscHandler");
	var _unbindEscHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unbindEscHandler");
	var _onKeyPressCloseBulkActions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onKeyPressCloseBulkActions");
	class BulkActionsManager {
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  constructor() {
	    Object.defineProperty(this, _onKeyPressCloseBulkActions, {
	      value: _onKeyPressCloseBulkActions2
	    });
	    Object.defineProperty(this, _unbindEscHandler, {
	      value: _unbindEscHandler2
	    });
	    Object.defineProperty(this, _bindEscHandler, {
	      value: _bindEscHandler2
	    });
	    Object.defineProperty(this, _emitter, {
	      writable: true,
	      value: void 0
	    });
	    this.keyPressHandler = babelHelpers.classPrivateFieldLooseBase(this, _onKeyPressCloseBulkActions)[_onKeyPressCloseBulkActions].bind(this);
	  }
	  bindEvents(context) {
	    const {
	      emitter
	    } = context;
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter] = emitter;
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter].subscribe(im_v2_const.EventType.dialog.openBulkActionsMode, this.enableBulkMode.bind(this));
	    babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter].subscribe(im_v2_const.EventType.dialog.closeBulkActionsMode, this.disableBulkMode.bind(this));
	  }
	  enableBulkMode(event) {
	    const {
	      messageId,
	      dialogId
	    } = event.getData();
	    void im_v2_application_core.Core.getStore().dispatch('messages/select/enableBulkMode', {
	      messageId,
	      dialogId
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEscHandler)[_bindEscHandler]();
	  }
	  disableBulkMode(event) {
	    const {
	      dialogId
	    } = event.getData();
	    void im_v2_application_core.Core.getStore().dispatch('messages/select/disableBulkMode', {
	      dialogId
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _unbindEscHandler)[_unbindEscHandler]();
	  }
	  clearCollection() {
	    void im_v2_application_core.Core.getStore().dispatch('messages/select/clearCollection');
	    babelHelpers.classPrivateFieldLooseBase(this, _unbindEscHandler)[_unbindEscHandler]();
	  }
	}
	function _bindEscHandler2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter].subscribe(im_v2_const.EventType.key.onBeforeEscape, this.keyPressHandler);
	}
	function _unbindEscHandler2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _emitter)[_emitter].unsubscribe(im_v2_const.EventType.key.onBeforeEscape, this.keyPressHandler);
	}
	function _onKeyPressCloseBulkActions2() {
	  this.clearCollection();
	  return im_v2_lib_escManager.EscEventAction.handled;
	}
	Object.defineProperty(BulkActionsManager, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.BulkActionsManager = BulkActionsManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Event,BX.Messenger.v2.Const,BX.Messenger.v2.Application,BX.Messenger.v2.Lib));
//# sourceMappingURL=bulk-actions.bundle.js.map
