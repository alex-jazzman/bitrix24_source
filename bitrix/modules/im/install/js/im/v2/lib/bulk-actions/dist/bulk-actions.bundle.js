/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core_events,main_core,im_v2_const,im_v2_application_core,im_v2_lib_utils) {
	'use strict';

	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
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
	  static init() {
	    BulkActionsManager.getInstance();
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
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.openBulkActionsMode, this.enableBulkMode.bind(this));
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.closeBulkActionsMode, this.disableBulkMode.bind(this));
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
	    this.keyPressHandler = babelHelpers.classPrivateFieldLooseBase(this, _onKeyPressCloseBulkActions)[_onKeyPressCloseBulkActions].bind(this);
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
	  main_core.Event.bind(document, 'keydown', this.keyPressHandler);
	}
	function _unbindEscHandler2() {
	  main_core.Event.unbind(document, 'keydown', this.keyPressHandler);
	}
	function _onKeyPressCloseBulkActions2(event) {
	  if (im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
	    this.clearCollection();
	  }
	}
	Object.defineProperty(BulkActionsManager, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.BulkActionsManager = BulkActionsManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Event,BX,BX.Messenger.v2.Const,BX.Messenger.v2.Application,BX.Messenger.v2.Lib));
//# sourceMappingURL=bulk-actions.bundle.js.map
