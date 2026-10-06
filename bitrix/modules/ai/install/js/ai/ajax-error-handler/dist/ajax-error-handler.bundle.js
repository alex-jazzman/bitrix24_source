/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
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

	// An active Vibe+ portal is already on the top tariff: the server answers such a limit with the
	// technical text and a support button, and deliberately sends no slider code.
	const VIBE_PLUS_TECHNICAL_LIMIT_STATE = 'TechnicalLimit';
	const ErrorCode = {
		ERROR_CODE_FORCE: 'ERROR_CODE_FORCE',
		MONTHLY_LIMIT: 'LIMIT_IS_EXCEEDED_MONTHLY',
		DAILY_LIMIT: 'LIMIT_IS_EXCEEDED_DAILY',
		TARIFF_LIMIT: 'SERVICE_IS_NOT_AVAILABLE_BY_TARIFF',
		BAAS_LIMIT: 'LIMIT_IS_EXCEEDED_BAAS',
		OTHER: 'AI_ENGINE_ERROR_OTHER',
		PROVIDER: 'AI_ENGINE_ERROR_PROVIDER'
	};
	class AjaxErrorHandler {
		static #boxLimitSliderCode = 'limit_copilot_requests_box';
		static #isCloud() {
			return main_core.Extension.getSettings('ai.ajax-error-handler').isCloud;
		}
		static handleTextGenerateError(handleGenerateErrorParams) {
			AjaxErrorHandler.#validateHandleGenerateErrorParams(handleGenerateErrorParams);
			const code = handleGenerateErrorParams.errorCode;
			switch (code) {
				case ErrorCode.ERROR_CODE_FORCE:
					{
						if (handleGenerateErrorParams?.forceCodeRules?.length && handleGenerateErrorParams.forceOption) {
							const result = this.#handleForceError(handleGenerateErrorParams.forceCodeRules, handleGenerateErrorParams.forceOption, handleGenerateErrorParams.copilotInput);
							if (result) {
								return;
							}
						}
						return this.#handleProviderError();
					}
				case ErrorCode.MONTHLY_LIMIT:
					{
						return this.#handleMonthlyLimitError(handleGenerateErrorParams?.sliderCode, handleGenerateErrorParams?.vibePlusLimitState);
					}
				case ErrorCode.DAILY_LIMIT:
					{
						return this.#handleDailyLimitError(handleGenerateErrorParams?.sliderCode, handleGenerateErrorParams?.vibePlusLimitState);
					}
				case ErrorCode.TARIFF_LIMIT:
					{
						return this.#handleTariffLimitError();
					}
				case ErrorCode.BAAS_LIMIT:
					{
						if (handleGenerateErrorParams?.showSliderWithMsg && handleGenerateErrorParams?.sliderCode) {
							return this.#handleMonthlyLimitError(handleGenerateErrorParams.sliderCode);
						}
						return this.#handleBaasLimitError(handleGenerateErrorParams.baasOptions, handleGenerateErrorParams.sliderCode);
					}
				case ErrorCode.OTHER:
					{
						return this.#handleOtherError();
					}
				case ErrorCode.PROVIDER:
					{
						return this.#handleProviderError();
					}
				default:
					{
						return this.#handleUndefinedError();
					}
			}
		}
		static #validateHandleGenerateErrorParams(params) {
			const code = params.errorCode;
			const baasOptions = params.baasOptions;
			const baasBindElement = params.baasOptions?.bindElement;
			const baasContext = params?.baasOptions.context;
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
		static #handleDailyLimitError(sliderCode, vibePlusLimitState) {
			if (AjaxErrorHandler.#isVibePlusTechnicalLimit(vibePlusLimitState)) {
				return;
			}
			AjaxErrorHandler.#showInfoHelper(AjaxErrorHandler.#replaceSliderCodeWithBoxLimitCodeIfBox(sliderCode === 'limit_why_pay_tariff_vibe' ? sliderCode : 'limit_copilot_max_number_daily_requests'));
		}
		static #handleMonthlyLimitError(sliderCode, vibePlusLimitState) {
			if (AjaxErrorHandler.#isVibePlusTechnicalLimit(vibePlusLimitState)) {
				return;
			}
			AjaxErrorHandler.#showInfoHelper(sliderCode ?? 'limit_copilot_requests');
		}
		static #isVibePlusTechnicalLimit(vibePlusLimitState) {
			return vibePlusLimitState === VIBE_PLUS_TECHNICAL_LIMIT_STATE;
		}
		static isVibePlusTechnicalLimit(customData) {
			return AjaxErrorHandler.#isVibePlusTechnicalLimit(customData?.vibePlusLimitState);
		}

		// The technical limit text is written for the messenger, where BBCode is rendered. CoPilot shows
		// the error as plain text, so the promoter link is cut off and the ask to contact support stays.
		static getVibePlusTechnicalLimitMessage(customData) {
			if (!AjaxErrorHandler.isVibePlusTechnicalLimit(customData)) {
				return null;
			}
			const message = customData?.msgForIm;
			return main_core.Type.isStringFilled(message) ? message.replaceAll(/\s*\[url=[^\]]*].*?\[\/url]/gi, '').trim() : null;
		}
		static #handleForceError(forceCodeRules, forceOption, bindElement) {
			if (!forceCodeRules?.length) {
				return false;
			}
			if (forceCodeRules.includes('slider') && forceOption?.sliderCode) {
				forceOption.sliderCode?.includes('redirect=detail&code') ? top.BX.Helper.show(forceOption.sliderCode) : BX?.UI?.InfoHelper.show(forceOption.sliderCode);
			}
			if (forceCodeRules.includes('msgWithHtmlLink')) {
				return this.#sendMsg('msgWithHtmlLink', forceOption, bindElement);
			}
			if (forceCodeRules.includes('code')) {
				return this.#sendMsg('code', forceOption, bindElement);
			}
			if (forceCodeRules.includes('msgPlainText')) {
				return this.#sendMsg('msgPlainText', forceOption, bindElement);
			}
			return false;
		}
		static #sendMsg(forceCodeRule, forceOption, bindElement) {
			const msg = this.#getError(forceCodeRule, forceOption);
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
		static #getError(forceCodeRule, forceOption) {
			if (forceCodeRule === 'code' && forceOption?.code) {
				return forceOption?.code;
			}
			if (forceCodeRule === 'msgPlainText' && forceOption?.msgPlainText) {
				return forceOption?.msgPlainText;
			}
			if (forceCodeRule === 'msgHtml' && forceOption?.msgHtml) {
				return forceOption?.msgHtml;
			}
			if (forceCodeRule === 'msgBBCode' && forceOption?.msgBBCode) {
				return forceOption?.msgBBCode;
			}
			return '';
		}

		// eslint-disable-next-line sonarjs/no-identical-functions
		static async #handleTariffLimitError() {
			AjaxErrorHandler.#showInfoHelper(AjaxErrorHandler.#replaceSliderCodeWithBoxLimitCodeIfBox('limit_copilot_requests'));
		}
		static #handleOtherError() {
			return undefined;
		}
		static #handleProviderError() {
			return undefined;
		}
		static #handleUndefinedError() {
			return undefined;
		}
		static #handleBaasLimitError(baasOptions) {
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
						main_core.Dom.style(serviceWidget.getPopup()?.getPopupContainer().querySelector('.popup-window-angly'), 'opacity', 0);
					} else {
						main_core.Dom.style(serviceWidget.getPopup()?.getPopupContainer().querySelector('.popup-window-angly'), 'opacity', 1);
					}
				}
			}).catch(e => {
				console.error(e);
			});
		}
		static handleImageGenerateError(handleGenerateErrorParams) {
			AjaxErrorHandler.#validateHandleGenerateErrorParams(handleGenerateErrorParams);
			const code = handleGenerateErrorParams.errorCode;
			switch (code) {
				case ErrorCode.ERROR_CODE_FORCE:
					{
						if (handleGenerateErrorParams.forceCodeRules && handleGenerateErrorParams.forceOption) {
							const result = this.#handleForceError(handleGenerateErrorParams.forceCodeRules, handleGenerateErrorParams.forceOption, handleGenerateErrorParams.copilotInput);
							if (result) {
								return;
							}
						}
						return this.#handleProviderError();
					}
				case ErrorCode.MONTHLY_LIMIT:
					{
						return this.#handleMonthlyLimitError(handleGenerateErrorParams?.sliderCode, handleGenerateErrorParams?.vibePlusLimitState);
					}
				case ErrorCode.DAILY_LIMIT:
					{
						return this.#handleDailyLimitError(handleGenerateErrorParams?.sliderCode, handleGenerateErrorParams?.vibePlusLimitState);
					}
				case ErrorCode.TARIFF_LIMIT:
					{
						return this.#handleImageTariffLimitError();
					}
				case ErrorCode.BAAS_LIMIT:
					{
						if (handleGenerateErrorParams?.showSliderWithMsg && handleGenerateErrorParams?.sliderCode) {
							return this.#handleMonthlyLimitError(handleGenerateErrorParams.sliderCode);
						}
						return this.#handleBaasLimitError(handleGenerateErrorParams.baasOptions);
					}
				case ErrorCode.OTHER:
					{
						return this.#handleOtherError();
					}
				case ErrorCode.PROVIDER:
					{
						return this.#handleProviderError();
					}
				default:
					{
						return this.#handleUndefinedError();
					}
			}
		}
		static #handleImageTariffLimitError() {
			this.#showInfoHelper('limit_sites_ImageAssistant_AI');
		}
		static async #showInfoHelper(code) {
			const {
				InfoHelper
			} = await main_core.Runtime.loadExtension('ui.info-helper');
			InfoHelper.show(code);
		}
		static #replaceSliderCodeWithBoxLimitCodeIfBox(code) {
			return AjaxErrorHandler.#isCloud() ? code : AjaxErrorHandler.#boxLimitSliderCode;
		}
	}

	exports.AjaxErrorHandler = AjaxErrorHandler;

})(this.BX.AI = this.BX.AI || {}, BX);
//# sourceMappingURL=ajax-error-handler.bundle.js.map
