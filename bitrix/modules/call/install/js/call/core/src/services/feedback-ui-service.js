import { Type, Runtime, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';

/**
 * Manages the post-call feedback popup: button click handling and popup lifecycle.
 */
export class FeedbackUiService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} config.container
	 * @param {boolean} [config.darkMode=false]
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, darkMode = false, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.FeedbackUiService');

		this.viewPort = viewPort;
		this.container = container;
		this.darkMode = darkMode;
		this.feedbackPopup = null;
		this.callStore = callStore ?? null;
	}

	/**
	 * Handles the feedback button click by loading and opening the feedback form.
	 *
	 * @param {object} callDetails
	 * @param {string|number} callDetails.callId
	 * @param {string|number} callDetails.instanceId
	 * @param {string} callDetails.provider
	 * @param {number} callDetails.userCount
	 * @param {number} callDetails.userId
	 */
	onButtonClick(callDetails)
	{
		Runtime.loadExtension('ui.feedback.form')
			.then(() => {
				BX.UI.Feedback.Form.open({
					id: `call_feedback_${callDetails.callId}-${callDetails.instanceId}-${Math.random()}`,
					forms: [
						{ zones: ['ru', 'by', 'kz'], id: 406, sec: '9lhjhn', lang: 'ru' },
						{ zones: ['de'], id: 754, sec: '6upe49', lang: 'de' },
						{ zones: ['es'], id: 750, sec: 'whk4la', lang: 'es' },
						{ zones: ['com.br'], id: 752, sec: 'is01cs', lang: 'com.br' },
						{ zones: ['en'], id: 748, sec: 'pds0h6', lang: 'en' },
					],
					presets: {
						sender_page: 'call',
						call_type: callDetails.provider,
						call_amount: callDetails.userCount,
						call_id: `id: ${callDetails.callId}, instanceId: ${callDetails.instanceId}`,
						id_of_user: callDetails.userId,
						from_domain: location.origin,
					},
				});
			})
			.catch((error) => {
				console.error('BX.Call.FeedbackUiService: failed to load ui.feedback.form', error);
			});
	}

	/**
	 * Shows the post-call quality feedback popup using BX.UI.Feedback.Form.
	 *
	 * @param {object} callDetails
	 * @param {string|number} callDetails.callId
	 * @param {number} callDetails.userCount
	 */
	showFeedbackPopup(callDetails)
	{
		Runtime.loadExtension('ui.feedback.form')
			.then(() => {
				BX.UI.Feedback.Form.open({
					id: `call_feedback_${Math.random()}`,
					forms: [{ zones: ['ru'], id: 406, sec: '9lhjhn', lang: 'ru' }],
					presets: {
						call_id: callDetails.callId || 0,
						call_amount: callDetails.userCount || 0,
					},
				});
			})
			.catch((error) => {
				console.error('BX.Call.FeedbackUiService: failed to load ui.feedback.form', error);
			});
	}

	/**
	 * Shows the legacy Vue-based feedback popup inside a Popup container.
	 * Used as a fallback for older call types.
	 *
	 * @param {object} callDetails
	 */
	showLegacyFeedbackPopup(callDetails)
	{
		if (this.feedbackPopup)
		{
			return;
		}

		if (!Type.isPlainObject(callDetails))
		{
			return;
		}

		const darkMode = this.darkMode;

		Runtime.loadExtension('im.component.call-feedback')
			.then(() => {
				let vueInstance = null;

				this.feedbackPopup = new Popup({
					id: 'im-call-feedback',
					content: '',
					titleBar: Loc.getMessage('IM_CALL_QUALITY_FEEDBACK'),
					closeIcon: true,
					noAllPaddings: true,
					cacheable: false,
					background: darkMode ? '#3A414B' : null,
					darkMode,
					closeByEsc: true,
					autoHide: true,
					events: {
						onPopupDestroy: () => {
							if (vueInstance)
							{
								vueInstance.$destroy();
							}

							this.feedbackPopup = null;
						},
					},
				});

				const template =					'<bx-im-component-call-feedback '
					+ '@feedbackSent="onFeedbackSent" '
					+ ':darkMode="darkMode" '
					+ ':callDetails="callDetails" />';

				vueInstance = BX.Vue.createApp({
					template,
					data() {
						return {
							darkMode,
							callDetails,
						};
					},
					methods: {
						onFeedbackSent: () => {
							setTimeout(() => {
								if (this.feedbackPopup)
								{
									this.feedbackPopup.close();
								}
							}, 1500);
						},
					},
				});

				vueInstance.mount(`#${this.feedbackPopup.getContentContainer().id}`);

				this.feedbackPopup.show();
			})
			.catch((error) => {
				console.error('BX.Call.FeedbackUiService: failed to load im.component.call-feedback', error);
			});
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;

		if (this.feedbackPopup)
		{
			this.feedbackPopup.close();
			this.feedbackPopup = null;
		}

		this.viewPort = null;
		this.container = null;
	}
}
