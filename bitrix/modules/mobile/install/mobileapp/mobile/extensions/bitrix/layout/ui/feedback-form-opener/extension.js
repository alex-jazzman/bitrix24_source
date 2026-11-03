/**
 * @module layout/ui/feedback-form-opener
 */
jn.define('layout/ui/feedback-form-opener', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const AppTheme = require('apptheme');

	// Bridged from the webview page mobile/settings on b24:form:send:success.
	const FEEDBACK_SEND_SUCCESS_EVENT = 'app-feedback:onFeedbackSendSuccess';

	// One-shot handlers keyed by senderPage + formId, so a form dismissed
	// without submit does not leave a listener that fires on a later success.
	const sendSuccessHandlers = new Map();

	const subscribeToSendSuccess = (senderPage, formId, onSendSuccess) => {
		const key = `${senderPage}:${formId}`;

		const staleHandler = sendSuccessHandlers.get(key);
		if (staleHandler)
		{
			BX.removeCustomEvent(FEEDBACK_SEND_SUCCESS_EVENT, staleHandler);
		}

		const handler = (payload = {}) => {
			if (String(payload.senderPage) !== String(senderPage) || String(payload.formId) !== String(formId))
			{
				return;
			}

			BX.removeCustomEvent(FEEDBACK_SEND_SUCCESS_EVENT, handler);
			sendSuccessHandlers.delete(key);
			onSendSuccess(payload);
		};

		sendSuccessHandlers.set(key, handler);
		BX.addCustomEvent(FEEDBACK_SEND_SUCCESS_EVENT, handler);
	};

	class FeedbackForm
	{
		/**
		 * @param {Object} props
		 * @param {string} [props.formId]
		 * @param {string} [props.senderPage]
		 * @param {Function} [props.onSendSuccess] called once the form is submitted successfully
		 */
		constructor(props)
		{
			this.formId = AppTheme.id === 'dark' ? 'appFeedbackDark' : 'appFeedbackLight';

			if (props.formId)
			{
				this.formId = props.formId;
			}

			this.senderPage = props.senderPage ?? '';
			this.extraHiddenFields = props.extraHiddenFields ?? {};
			this.onSendSuccess = typeof props.onSendSuccess === 'function' ? props.onSendSuccess : null;
		}

		/**
		 * @param {Object} [backdropConfig]
		 * @param {Object} [params]
		 */
		openInBackdrop(backdropConfig = null, params = {})
		{
			const backdrop = backdropConfig ?? {
				mediumPositionPercent: 80,
				onlyMediumPosition: true,
				forceDismissOnSwipeDown: true,
				swipeAllowed: true,
				swipeContentAllowed: true,
				horizontalSwipeAllowed: false,
				navigationBarColor: Color.bgSecondary.toHex(),
				enableNavigationBarBorder: false,
			};

			const { title } = params;

			this.open({ backdrop, title });
		}

		/**
		 * @param params
		 * @param {Object} [params.backdrop]
		 * @param {string} [params.title]
		 */
		open(params)
		{
			const {
				backdrop = null,
				title = Loc.getMessage('FEEDBACK_FORM_TITLE'),
			} = params;

			if (this.onSendSuccess)
			{
				subscribeToSendSuccess(this.senderPage, this.formId, this.onSendSuccess);
			}

			PageManager.openPage({
				backgroundColor: Color.bgSecondary.toHex(),
				url: this.getUrl(),
				backdrop,
				titleParams: {
					text: title,
				},
				modal: Boolean(backdrop),
				cache: true,
			});
		}

		getHiddenFields()
		{
			return encodeURIComponent(
				JSON.stringify({
					from_domain: currentDomain,
					back_version: Application.getAppVersion(),
					os_phone: Application.getPlatform(),
					app_version: Application.getApiVersion(),
					region_model: env.languageId,
					phone_model: device.model,
					os_version: device.version,
					sender_page: this.senderPage,
					...this.extraHiddenFields,
				}),
			);
		}

		getUrl()
		{
			return `${env.siteDir}mobile/settings?formId=${this.formId}&hiddenFields=${this.getHiddenFields()}`;
		}
	}

	/**
	 * @deprecated
	 * @public
	 * @function openFeedbackForm
	 * @params {string} formId
	 * @params {object} [openPageConfig = {}]
	 * @return void
	 */
	const openFeedbackForm = (formId, openPageConfig = {}) => {
		const hiddenFields = encodeURIComponent(
			JSON.stringify({
				from_domain: currentDomain,
				back_version: Application.getAppVersion(),
				os_phone: Application.getPlatform(),
				app_version: Application.getApiVersion(),
				region_model: env.languageId,
				phone_model: device.model,
				os_version: device.version,
			}),
		);

		PageManager.openPage({
			backgroundColor: Color.bgSecondary.toHex(),
			url: `${env.siteDir}mobile/settings?formId=${formId}&hiddenFields=${hiddenFields}`,
			backdrop: {
				mediumPositionPercent: 80,
				onlyMediumPosition: true,
				forceDismissOnSwipeDown: true,
				swipeAllowed: true,
				swipeContentAllowed: true,
				horizontalSwipeAllowed: false,
				navigationBarColor: Color.bgSecondary.toHex(),
				enableNavigationBarBorder: false,
			},
			titleParams: {
				text: Loc.getMessage('FEEDBACK_FORM_TITLE'),
			},
			enableNavigationBarBorder: false,
			modal: true,
			cache: true,
			...openPageConfig,
		});
	};

	module.exports = { FeedbackForm, openFeedbackForm };
});
