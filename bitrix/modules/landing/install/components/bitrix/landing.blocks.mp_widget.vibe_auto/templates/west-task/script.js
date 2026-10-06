/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, ui_feedback_form) {
	'use strict';

	class VibeAutoLinkTask extends BX.Landing.Widget.Base {
		constructor(element, option) {
			super(element);
			this.initialize(element, option);
		}
		initialize(element, option) {
			if (element && option) {
				const feedbackButtonElement = element.querySelector('#feedback-button');
				if (feedbackButtonElement) {
					if (option.id && option.forms && option.portal) {
						BX.Event.bind(feedbackButtonElement, 'click', () => this.openForm(option));
					}
				}
			}
		}
		openForm(params) {
			ui_feedback_form.Form.open({
				id: params.id,
				portalUri: params.portal,
				forms: params.forms,
				presets: params.presets
			});
		}
	}

	exports.VibeAutoLinkTask = VibeAutoLinkTask;

})(this.BX.Landing.Widget = this.BX.Landing.Widget || {}, BX.UI.Feedback);
//# sourceMappingURL=script.js.map
