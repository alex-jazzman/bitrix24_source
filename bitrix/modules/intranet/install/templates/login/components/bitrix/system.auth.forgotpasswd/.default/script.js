/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_vue3) {
	'use strict';

	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _rootNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rootNode");
	var _isFormVisible = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isFormVisible");
	var _isCaptchaAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCaptchaAvailable");
	var _initVueApp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initVueApp");
	class SystemAuthForgotPassword {
	  constructor(params) {
	    Object.defineProperty(this, _initVueApp, {
	      value: _initVueApp2
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _rootNode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isFormVisible, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isCaptchaAvailable, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode] = params.containerNode;
	    babelHelpers.classPrivateFieldLooseBase(this, _isFormVisible)[_isFormVisible] = params.isFormVisible === 'Y';
	    babelHelpers.classPrivateFieldLooseBase(this, _isCaptchaAvailable)[_isCaptchaAvailable] = params.isCaptchaAvailable === 'Y';
	    if (!main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode])) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _initVueApp)[_initVueApp]();
	  }
	}
	function _initVueApp2() {
	  const context = this;
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp({
	    name: 'SystemAuthForgotPassword',
	    data() {
	      return {
	        isWaiting: false,
	        isFormVisible: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _isFormVisible)[_isFormVisible],
	        isEmailEntered: false,
	        isFormBlockVisible: true,
	        isCaptchaBlockVisible: false,
	        isCaptchaAvailable: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _isCaptchaAvailable)[_isCaptchaAvailable]
	      };
	    },
	    beforeCreate() {
	      this.$bitrix.Application.set(context);
	    },
	    computed: {
	      loginOrEmail() {
	        return this.isEmailEntered ? 'USER_EMAIL' : 'USER_LOGIN';
	      }
	    },
	    mounted() {
	      if (this.$refs && main_core.Type.isDomNode(this.$refs.modalInput)) {
	        this.$refs.modalInput.focus();
	      }
	    },
	    methods: {
	      onEnterLoginOrEmail(value) {
	        this.isEmailEntered = main_core.Validation.isEmail(value);
	      },
	      onButtonClick(event) {
	        if (this.isCaptchaAvailable && !this.isCaptchaBlockVisible) {
	          event.preventDefault();
	          this.showCaptchaBlock();
	        } else {
	          this.isWaiting = true;
	        }
	      },
	      showCaptchaBlock() {
	        this.isFormBlockVisible = false;
	        this.isCaptchaBlockVisible = true;
	      },
	      getApplication() {
	        return this.$bitrix.Application.get();
	      }
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode]);
	}

	exports.SystemAuthForgotPassword = SystemAuthForgotPassword;

}((this.BX.Intranet = this.BX.Intranet || {}),BX,BX.Vue3));
//# sourceMappingURL=script.js.map
