/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_ui_panel_basepresetpanel, landing_ui_card_headercard, landing_loc, landing_ui_card_basecard, main_core, main_core_events, landing_ui_card_messagecard, crm_form_integration) {
	'use strict';

	class FacebookContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.FacebookContent');
			this.addItem(new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_SIDEBAR_BUTTON_FACEBOOK')
			}));
			if (!this.options.dictionary.integration.canUse) {
				this.addItem(new landing_ui_card_messagecard.MessageCard({
					header: landing_loc.Loc.getMessage('LANDING_CRM_FORM_INTEGRATION_SEO_NOT_INSTALLED_HEADER'),
					description: landing_loc.Loc.getMessage('LANDING_CRM_FORM_INTEGRATION_SEO_NOT_INSTALLED_FB_TEXT'),
					angle: false,
					closeable: false
				}));
				return;
			}
			const buttonCard = new landing_ui_card_basecard.BaseCard();
			main_core.Dom.style(buttonCard.getLayout(), {
				padding: 0,
				margin: 0
			});
			const integration = new crm_form_integration.Integration({
				type: 'facebook',
				form: this.options.formOptions,
				fields: this.options.crmFields,
				dictionary: this.options.dictionary
			});
			integration.subscribe('change', this.onChange.bind(this));
			main_core.Dom.append(integration.render(), buttonCard.getBody());
			this.addItem(buttonCard);
		}
		prepareButtonText(formOptions) {
			const enabled = formOptions.integration.cases.some(item => {
				return item.providerCode === 'facebook';
			});
			if (enabled) {
				return landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_FACEBOOK_BUTTON_ENABLED');
			}
			return landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_FACEBOOK_BUTTON');
		}
		valueReducer(value) {
			return {
				integration: this.options.formOptions.integration
			};
		}
		onChange(event) {
			this.emit('onChange', {
				skipPrepare: false
			});
		}
		getData() {
			return this.options.formOptions.integration.cases.filter(data => data.providerCode === 'facebook')[0] || null;
		}
	}

	exports.Content = FacebookContent;
	exports.FacebookContent = FacebookContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Facebook = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Facebook || {}, BX.Landing.UI.Panel, BX.Landing.UI.Card, BX.Landing, BX.Landing.UI.Card, BX, BX.Event, BX.Landing.UI.Card, BX.Crm.Form);
//# sourceMappingURL=facebook.bundle.js.map
