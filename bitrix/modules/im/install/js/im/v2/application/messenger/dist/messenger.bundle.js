/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core,im_v2_component_messenger) {
	'use strict';

	var _initPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPromise");
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _vueInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("vueInstance");
	var _applicationName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("applicationName");
	var _init = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("init");
	var _initCore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCore");
	class MessengerApplication {
	  // assigned externally

	  constructor(params = {}) {
	    Object.defineProperty(this, _initCore, {
	      value: _initCore2
	    });
	    Object.defineProperty(this, _init, {
	      value: _init2
	    });
	    this.bitrixVue = null;
	    Object.defineProperty(this, _initPromise, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _vueInstance, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _applicationName, {
	      writable: true,
	      value: 'Messenger'
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	    babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise] = babelHelpers.classPrivateFieldLooseBase(this, _init)[_init]();
	  }
	  ready() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise];
	  }
	  async initComponent(node) {
	    this.unmountComponent();
	    babelHelpers.classPrivateFieldLooseBase(this, _vueInstance)[_vueInstance] = await im_v2_application_core.Core.createVue(this, {
	      name: babelHelpers.classPrivateFieldLooseBase(this, _applicationName)[_applicationName],
	      el: node,
	      components: {
	        MessengerComponent: im_v2_component_messenger.Messenger
	      },
	      template: '<MessengerComponent />'
	    });
	  }
	  unmountComponent() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _vueInstance)[_vueInstance]) {
	      return;
	    }
	    this.bitrixVue.unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _vueInstance)[_vueInstance] = null;
	  }
	}
	async function _init2() {
	  await babelHelpers.classPrivateFieldLooseBase(this, _initCore)[_initCore]();
	  return this;
	}
	async function _initCore2() {
	  im_v2_application_core.Core.setApplicationData(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	  await im_v2_application_core.Core.ready();
	}

	exports.MessengerApplication = MessengerApplication;

}((this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}),BX.Messenger.v2.Application,BX.Messenger.v2.Component));
//# sourceMappingURL=messenger.bundle.js.map
