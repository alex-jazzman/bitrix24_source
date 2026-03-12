/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core) {
	'use strict';

	function prepareBaasContext(contextId) {
	  if (main_core.Type.isStringFilled(contextId) === false) {
	    throw new TypeError('Parameter must be the filled string.');
	  }
	  return removeNumbersAfterUnderscore(contextId);
	}
	function removeNumbersAfterUnderscore(str) {
	  return str.split('_').map(strPart => {
	    if (Number.isNaN(parseInt(strPart, 10))) {
	      return strPart;
	    }
	    return '';
	  }).filter(strPart => strPart).join('_');
	}

	const ErrorCode = {
	  ERROR_CODE_FORCE: 'ERROR_CODE_FORCE',
	  MONTHLY_LIMIT: 'LIMIT_IS_EXCEEDED_MONTHLY',
	  DAILY_LIMIT: 'LIMIT_IS_EXCEEDED_DAILY',
	  TARIFF_LIMIT: 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF',
	  BAAS_LIMIT: 'LIMIT_IS_EXCEEDED_BAAS',
	  BAAS_RATE_LIMIT: 'LIMIT_IS_EXCEEDED_BAAS_RATE_LIMIT',
	  OTHER: 'AI_ENGINE_ERROR_OTHER',
	  PROVIDER: 'AI_ENGINE_ERROR_PROVIDER'
	};
	var _boxLimitSliderCode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("boxLimitSliderCode");
	var _isCloud = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCloud");
	var _validateHandleGenerateErrorParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("validateHandleGenerateErrorParams");
	var _handleDailyLimitError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDailyLimitError");
	var _handleMonthlyLimitError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleMonthlyLimitError");
	var _handleForceError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleForceError");
	var _sendMsg = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendMsg");
	var _getError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getError");
	var _handleTariffLimitError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTariffLimitError");
	var _handleOtherError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleOtherError");
	var _handleProviderError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleProviderError");
	var _handleUndefinedError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleUndefinedError");
	var _handleBaasLimitError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleBaasLimitError");
	var _handleImageTariffLimitError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleImageTariffLimitError");
	var _showInfoHelper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showInfoHelper");
	var _replaceSliderCodeWithBoxLimitCodeIfBox = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replaceSliderCodeWithBoxLimitCodeIfBox");
	class AjaxErrorHandler {
	  static handleTextGenerateError(handleGenerateErrorParams) {
	    babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _validateHandleGenerateErrorParams)[_validateHandleGenerateErrorParams](handleGenerateErrorParams);
	    const code = handleGenerateErrorParams.errorCode;
	    switch (code) {
	      case ErrorCode.ERROR_CODE_FORCE:
	        {
	          var _handleGenerateErrorP;
	          if (handleGenerateErrorParams != null && (_handleGenerateErrorP = handleGenerateErrorParams.forceCodeRules) != null && _handleGenerateErrorP.length && handleGenerateErrorParams.forceOption) {
	            const result = babelHelpers.classPrivateFieldLooseBase(this, _handleForceError)[_handleForceError](handleGenerateErrorParams.forceCodeRules, handleGenerateErrorParams.forceOption, handleGenerateErrorParams.copilotInput);
	            if (result) {
	              return;
	            }
	          }
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleProviderError)[_handleProviderError]();
	        }
	      case ErrorCode.MONTHLY_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleMonthlyLimitError)[_handleMonthlyLimitError](handleGenerateErrorParams == null ? void 0 : handleGenerateErrorParams.sliderCode);
	        }
	      case ErrorCode.DAILY_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleDailyLimitError)[_handleDailyLimitError]();
	        }
	      case ErrorCode.TARIFF_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleTariffLimitError)[_handleTariffLimitError]();
	        }
	      case ErrorCode.BAAS_LIMIT:
	        {
	          if (handleGenerateErrorParams != null && handleGenerateErrorParams.showSliderWithMsg && handleGenerateErrorParams != null && handleGenerateErrorParams.sliderCode) {
	            return babelHelpers.classPrivateFieldLooseBase(this, _handleMonthlyLimitError)[_handleMonthlyLimitError](handleGenerateErrorParams.sliderCode);
	          }
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleBaasLimitError)[_handleBaasLimitError](handleGenerateErrorParams.baasOptions, handleGenerateErrorParams.sliderCode);
	        }
	      case ErrorCode.OTHER:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleOtherError)[_handleOtherError]();
	        }
	      case ErrorCode.PROVIDER:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleProviderError)[_handleProviderError]();
	        }
	      default:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleUndefinedError)[_handleUndefinedError]();
	        }
	    }
	  }
	  static handleImageGenerateError(handleGenerateErrorParams) {
	    babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _validateHandleGenerateErrorParams)[_validateHandleGenerateErrorParams](handleGenerateErrorParams);
	    const code = handleGenerateErrorParams.errorCode;
	    switch (code) {
	      case ErrorCode.ERROR_CODE_FORCE:
	        {
	          if (handleGenerateErrorParams.forceCodeRules && handleGenerateErrorParams.forceOption) {
	            const result = babelHelpers.classPrivateFieldLooseBase(this, _handleForceError)[_handleForceError](handleGenerateErrorParams.forceCodeRules, handleGenerateErrorParams.forceOption, handleGenerateErrorParams.copilotInput);
	            if (result) {
	              return;
	            }
	          }
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleProviderError)[_handleProviderError]();
	        }
	      case ErrorCode.MONTHLY_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleMonthlyLimitError)[_handleMonthlyLimitError](handleGenerateErrorParams == null ? void 0 : handleGenerateErrorParams.sliderCode);
	        }
	      case ErrorCode.DAILY_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleDailyLimitError)[_handleDailyLimitError]();
	        }
	      case ErrorCode.TARIFF_LIMIT:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleImageTariffLimitError)[_handleImageTariffLimitError]();
	        }
	      case ErrorCode.BAAS_LIMIT:
	        {
	          if (handleGenerateErrorParams != null && handleGenerateErrorParams.showSliderWithMsg && handleGenerateErrorParams != null && handleGenerateErrorParams.sliderCode) {
	            return babelHelpers.classPrivateFieldLooseBase(this, _handleMonthlyLimitError)[_handleMonthlyLimitError](handleGenerateErrorParams.sliderCode);
	          }
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleBaasLimitError)[_handleBaasLimitError](handleGenerateErrorParams.baasOptions);
	        }
	      case ErrorCode.OTHER:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleOtherError)[_handleOtherError]();
	        }
	      case ErrorCode.PROVIDER:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleProviderError)[_handleProviderError]();
	        }
	      default:
	        {
	          return babelHelpers.classPrivateFieldLooseBase(this, _handleUndefinedError)[_handleUndefinedError]();
	        }
	    }
	  }
	}
	function _isCloud2() {
	  return main_core.Extension.getSettings('ai.ajax-error-handler').isCloud;
	}
	function _validateHandleGenerateErrorParams2(params) {
	  var _params$baasOptions;
	  const code = params.errorCode;
	  const baasOptions = params.baasOptions;
	  const baasBindElement = (_params$baasOptions = params.baasOptions) == null ? void 0 : _params$baasOptions.bindElement;
	  const baasContext = params == null ? void 0 : params.baasOptions.context;
	  if (main_core.Type.isStringFilled(code) === false) {
	    throw new Error('AI.AjaxErrorHandler: errorCode option is required and must be a string');
	  }
	  if (main_core.Type.isPlainObject(baasOptions) === false) {
	    throw new TypeError('AI.AjaxErrorHandler: baasOptions option is required and must be a Object with context and bindElement properties');
	  }
	  if (baasBindElement && main_core.Type.isElementNode(baasBindElement) === false) {
	    throw new Error('AI.AjaxErrorHandler: baasOptions.bindElement option must be an element node');
	  }
	  if (main_core.Type.isStringFilled(baasContext) === false) {
	    throw new Error('AI.AjaxErrorHandler: baasOptions.context option is required and must be a string');
	  }
	}
	function _handleDailyLimitError2() {
	  babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _showInfoHelper)[_showInfoHelper](babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _replaceSliderCodeWithBoxLimitCodeIfBox)[_replaceSliderCodeWithBoxLimitCodeIfBox]('limit_copilot_max_number_daily_requests'));
	}
	function _handleMonthlyLimitError2(sliderCode) {
	  babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _showInfoHelper)[_showInfoHelper](sliderCode != null ? sliderCode : 'limit_copilot_requests');
	}
	function _handleForceError2(forceCodeRules, forceOption, bindElement) {
	  if (!(forceCodeRules != null && forceCodeRules.length)) {
	    return false;
	  }
	  if (forceCodeRules.includes('slider') && forceOption != null && forceOption.sliderCode) {
	    var _forceOption$sliderCo, _BX, _BX$UI;
	    (_forceOption$sliderCo = forceOption.sliderCode) != null && _forceOption$sliderCo.includes('redirect=detail&code') ? top.BX.Helper.show(forceOption.sliderCode) : (_BX = BX) == null ? void 0 : (_BX$UI = _BX.UI) == null ? void 0 : _BX$UI.InfoHelper.show(forceOption.sliderCode);
	  }
	  if (forceCodeRules.includes('msgWithHtmlLink')) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendMsg)[_sendMsg]('msgWithHtmlLink', forceOption, bindElement);
	  }
	  if (forceCodeRules.includes('code')) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendMsg)[_sendMsg]('code', forceOption, bindElement);
	  }
	  if (forceCodeRules.includes('msgPlainText')) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendMsg)[_sendMsg]('msgPlainText', forceOption, bindElement);
	  }
	  return false;
	}
	function _sendMsg2(forceCodeRule, forceOption, bindElement) {
	  const msg = babelHelpers.classPrivateFieldLooseBase(this, _getError)[_getError](forceCodeRule, forceOption);
	  if (!msg) {
	    return false;
	  }
	  bindElement.setErrors([{
	    code: 'ERROR_CODE_FORCE',
	    message: msg,
	    customData: {
	      clickHandler: () => command.execute()
	    }
	  }]);
	  return true;
	}
	function _getError2(forceCodeRule, forceOption) {
	  if (forceCodeRule === 'code' && forceOption != null && forceOption.code) {
	    return forceOption == null ? void 0 : forceOption.code;
	  }
	  if (forceCodeRule === 'msgPlainText' && forceOption != null && forceOption.msgPlainText) {
	    return forceOption == null ? void 0 : forceOption.msgPlainText;
	  }
	  if (forceCodeRule === 'msgHtml' && forceOption != null && forceOption.msgHtml) {
	    return forceOption == null ? void 0 : forceOption.msgHtml;
	  }
	  if (forceCodeRule === 'msgBBCode' && forceOption != null && forceOption.msgBBCode) {
	    return forceOption == null ? void 0 : forceOption.msgBBCode;
	  }
	  return '';
	}
	async function _handleTariffLimitError2() {
	  babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _showInfoHelper)[_showInfoHelper](babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _replaceSliderCodeWithBoxLimitCodeIfBox)[_replaceSliderCodeWithBoxLimitCodeIfBox]('limit_copilot_requests'));
	}
	function _handleOtherError2() {
	  return undefined;
	}
	function _handleProviderError2() {
	  return undefined;
	}
	function _handleUndefinedError2() {
	  return undefined;
	}
	function _handleBaasLimitError2(baasOptions) {
	  const {
	    bindElement,
	    context,
	    useAngle = true,
	    useSlider = false
	  } = baasOptions;
	  if (useSlider) {
	    main_core.Runtime.loadExtension('ui.info-helper').then(({
	      InfoHelper
	    }) => {
	      InfoHelper.show('limit_boost_copilot');
	    }).catch(err => {
	      console.error(err);
	    });
	    return;
	  }
	  main_core.Runtime.loadExtension('baas.store').then(({
	    ServiceWidget
	  }) => {
	    if (ServiceWidget) {
	      const preparedContext = prepareBaasContext(context);
	      const serviceWidget = ServiceWidget.getInstanceByCode('ai_copilot_token').bind(bindElement, preparedContext);
	      serviceWidget.getPopup().adjustPosition({
	        forceTop: true
	      });
	      serviceWidget.show();
	      if (useAngle === false) {
	        var _serviceWidget$getPop;
	        main_core.Dom.style((_serviceWidget$getPop = serviceWidget.getPopup()) == null ? void 0 : _serviceWidget$getPop.getPopupContainer().querySelector('.popup-window-angly'), 'opacity', 0);
	      } else {
	        var _serviceWidget$getPop2;
	        main_core.Dom.style((_serviceWidget$getPop2 = serviceWidget.getPopup()) == null ? void 0 : _serviceWidget$getPop2.getPopupContainer().querySelector('.popup-window-angly'), 'opacity', 1);
	      }
	    }
	  }).catch(e => {
	    console.error(e);
	  });
	}
	function _handleImageTariffLimitError2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _showInfoHelper)[_showInfoHelper]('limit_sites_ImageAssistant_AI');
	}
	async function _showInfoHelper2(code) {
	  const {
	    InfoHelper
	  } = await main_core.Runtime.loadExtension('ui.info-helper');
	  InfoHelper.show(code);
	}
	function _replaceSliderCodeWithBoxLimitCodeIfBox2(code) {
	  return babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _isCloud)[_isCloud]() ? code : babelHelpers.classPrivateFieldLooseBase(AjaxErrorHandler, _boxLimitSliderCode)[_boxLimitSliderCode];
	}
	Object.defineProperty(AjaxErrorHandler, _replaceSliderCodeWithBoxLimitCodeIfBox, {
	  value: _replaceSliderCodeWithBoxLimitCodeIfBox2
	});
	Object.defineProperty(AjaxErrorHandler, _showInfoHelper, {
	  value: _showInfoHelper2
	});
	Object.defineProperty(AjaxErrorHandler, _handleImageTariffLimitError, {
	  value: _handleImageTariffLimitError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleBaasLimitError, {
	  value: _handleBaasLimitError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleUndefinedError, {
	  value: _handleUndefinedError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleProviderError, {
	  value: _handleProviderError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleOtherError, {
	  value: _handleOtherError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleTariffLimitError, {
	  value: _handleTariffLimitError2
	});
	Object.defineProperty(AjaxErrorHandler, _getError, {
	  value: _getError2
	});
	Object.defineProperty(AjaxErrorHandler, _sendMsg, {
	  value: _sendMsg2
	});
	Object.defineProperty(AjaxErrorHandler, _handleForceError, {
	  value: _handleForceError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleMonthlyLimitError, {
	  value: _handleMonthlyLimitError2
	});
	Object.defineProperty(AjaxErrorHandler, _handleDailyLimitError, {
	  value: _handleDailyLimitError2
	});
	Object.defineProperty(AjaxErrorHandler, _validateHandleGenerateErrorParams, {
	  value: _validateHandleGenerateErrorParams2
	});
	Object.defineProperty(AjaxErrorHandler, _isCloud, {
	  value: _isCloud2
	});
	Object.defineProperty(AjaxErrorHandler, _boxLimitSliderCode, {
	  writable: true,
	  value: 'limit_copilot_requests_box'
	});

	exports.AjaxErrorHandler = AjaxErrorHandler;

}((this.BX.AI = this.BX.AI || {}),BX));
//# sourceMappingURL=ajax-error-handler.bundle.js.map
