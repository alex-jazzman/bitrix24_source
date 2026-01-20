/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_vue3) {
	'use strict';

	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _authContainerNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("authContainerNode");
	var _isQrAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isQrAvailable");
	var _isStorePasswordAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isStorePasswordAvailable");
	var _isCaptchaAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCaptchaAvailable");
	var _qrText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("qrText");
	var _qrConfig = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("qrConfig");
	var _focusInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("focusInput");
	var _initVueApp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initVueApp");
	class SystemAuthAuthorize {
	  constructor(_params) {
	    Object.defineProperty(this, _initVueApp, {
	      value: _initVueApp2
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _authContainerNode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isQrAvailable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isStorePasswordAvailable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isCaptchaAvailable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _qrText, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _qrConfig, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _focusInput, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _authContainerNode)[_authContainerNode] = _params.authContainerNode;
	    babelHelpers.classPrivateFieldLooseBase(this, _isQrAvailable)[_isQrAvailable] = _params.isQrAvailable === 'Y';
	    babelHelpers.classPrivateFieldLooseBase(this, _isStorePasswordAvailable)[_isStorePasswordAvailable] = _params.isStorePasswordAvailable === 'Y';
	    babelHelpers.classPrivateFieldLooseBase(this, _isCaptchaAvailable)[_isCaptchaAvailable] = _params.isCaptchaAvailable === 'Y';
	    babelHelpers.classPrivateFieldLooseBase(this, _qrText)[_qrText] = _params.qrText || '';
	    babelHelpers.classPrivateFieldLooseBase(this, _qrConfig)[_qrConfig] = _params.qrConfig || '';
	    babelHelpers.classPrivateFieldLooseBase(this, _focusInput)[_focusInput] = _params.focusInput || '';
	    if (!main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _authContainerNode)[_authContainerNode])) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _initVueApp)[_initVueApp]();
	  }
	}
	function _initVueApp2() {
	  const context = this;
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp({
	    name: 'SystemAuthAuthorize',
	    data() {
	      return {
	        isWaiting: false,
	        authContainerNode: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _authContainerNode)[_authContainerNode],
	        isQrAvailable: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _isQrAvailable)[_isQrAvailable],
	        isStorePasswordAvailable: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _isStorePasswordAvailable)[_isStorePasswordAvailable],
	        isCaptchaAvailable: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _isCaptchaAvailable)[_isCaptchaAvailable],
	        focusInput: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _focusInput)[_focusInput],
	        qrText: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _qrText)[_qrText],
	        qrConfig: babelHelpers.classPrivateFieldLooseBase(this.getApplication(), _qrConfig)[_qrConfig],
	        isFormBlockVisible: true,
	        isCaptchaBlockVisible: false
	      };
	    },
	    beforeCreate() {
	      this.$bitrix.Application.set(context);
	    },
	    mounted() {
	      BX.UI.Hint.init(this.authContainerNode);
	      const focusInput = document.forms.form_auth[this.focusInput];
	      focusInput == null ? void 0 : focusInput.focus();
	      if (this.isQrAvailable) {
	        this.initQrCode();
	      }
	    },
	    methods: {
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
	      initQrCode() {
	        new QRCode('bx_auth_qr_code', {
	          text: this.qrText,
	          width: 220,
	          height: 220,
	          colorDark: '#000000',
	          colorLight: '#ffffff'
	        });
	        if (!this.qrConfig) {
	          return;
	        }
	        this.qrCodeSuccessIcon = this.authContainerNode.querySelector('.intranet-qr-scan-form__code-overlay');
	        const Pull = new BX.PullClient();
	        Pull.subscribe({
	          moduleId: 'main',
	          command: 'qrAuthorize',
	          callback: params => {
	            if (params.token) {
	              this.showQrCodeSuccessIcon();
	              main_core.ajax.runAction('main.qrcodeauth.authenticate', {
	                data: {
	                  token: params.token,
	                  remember: this.isStorePasswordAvailable ? 1 : 0
	                }
	              }).then(response => {
	                this.hideQrCodeSuccessIcon();
	                if (response.status === 'success') {
	                  window.location = params.redirectUrl !== '' ? params.redirectUrl : window.location;
	                }
	              }).catch(error => console.error(error));
	            }
	          }
	        });
	        Pull.start(this.qrConfig);
	      },
	      showQrCodeSuccessIcon() {
	        if (!main_core.Type.isDomNode(this.qrCodeSuccessIcon)) {
	          return;
	        }
	        main_core.Dom.addClass(this.qrCodeSuccessIcon, 'intranet-qr-scan-form__code-overlay--active');
	      },
	      hideQrCodeSuccessIcon() {
	        if (!main_core.Type.isDomNode(this.qrCodeSuccessIcon)) {
	          return;
	        }
	        main_core.Dom.removeClass(this.qrCodeSuccessIcon, 'intranet-qr-scan-form__code-overlay--active');
	      },
	      getApplication() {
	        return this.$bitrix.Application.get();
	      }
	    }
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _authContainerNode)[_authContainerNode]);
	}

	exports.SystemAuthAuthorize = SystemAuthAuthorize;

}((this.BX.Intranet = this.BX.Intranet || {}),BX,BX.Vue3));
//# sourceMappingURL=script.js.map
