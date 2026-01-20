/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,call_lib_callManager) {
	'use strict';

	const {
	  callInstalled = false
	} = main_core.Extension.getSettings('im.v2.lib.call');
	const isCallManagerInstalled = Boolean(call_lib_callManager.CallManager);
	class CallManagerStub {
	  static getInstance() {
	    console.warn('module call is not installed');
	    if (!this.instance) {
	      this.instance = new Proxy(new CallManagerStub(), {
	        get(target, prop, receiver) {
	          if (prop in CallManagerStub) {
	            return CallManagerStub[prop];
	          }
	          if (typeof prop === 'string') {
	            return () => null;
	          }
	          return Reflect.get(target, prop, receiver);
	        }
	      });
	    }
	    return this.instance;
	  }
	}
	CallManagerStub.viewContainerClass = 'bx-im-messenger__call_container';
	CallManagerStub.instance = null;
	const CallManager = callInstalled && isCallManagerInstalled ? call_lib_callManager.CallManager : CallManagerStub;

	exports.CallManager = CallManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX??{},BX?.Call?.Lib??{}));
//# sourceMappingURL=call.bundle.js.map
