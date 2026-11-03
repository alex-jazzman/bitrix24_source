/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, landing_loc, landing_ui_card_headercard, landing_ui_card_messagecard, landing_ui_form_formsettingsform, landing_ui_field_agreementslist, landing_ui_panel_basepresetpanel) {
	'use strict';

	var messageIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/agreements/dist/assets/message-icon.svg";

	class AgreementsContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.AgreementsContent');
			main_core.Dom.attr(this.getLayout(), 'data-testid', 'landing-agreements-content');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_AGREEMENTS_TITLE')
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				id: 'agreementsMessage',
				header: landing_loc.Loc.getMessage('LANDING_AGREEMENTS_MESSAGE_HEADER'),
				description: landing_loc.Loc.getMessage('LANDING_AGREEMENTS_MESSAGE_DESCRIPTION'),
				icon: messageIcon,
				restoreState: true
			});
			main_core.Dom.attr(message.getLayout(), 'data-testid', 'landing-agreements-message');
			main_core.Dom.attr(message.getCloseButton(), 'data-testid', 'landing-agreements-message-close-btn');
			main_core.Dom.attr(message.getCloseLink(), 'data-testid', 'landing-agreements-message-hide-link');
			const listForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				id: 'agreementsList',
				fields: [new landing_ui_field_agreementslist.AgreementsList({
					selector: 'agreements',
					formOptions: this.options.formOptions,
					agreementsList: this.options.agreements,
					value: this.options.formOptions.data.agreements
				})]
			});
			main_core.Dom.attr(listForm.getLayout(), 'data-testid', 'landing-agreements-form');
			if (!message.isShown()) {
				main_core.Dom.style(header.getLayout(), 'margin-bottom', '0');
				main_core.Dom.style(listForm.getLayout(), 'margin-top', '-19px');
			}
			message.subscribe('onClose', () => {
				main_core.Dom.style(header.getLayout(), 'margin-bottom', '0');
				main_core.Dom.style(listForm.getLayout(), 'margin-top', '-19px');
			});
			this.addItem(header);
			this.addItem(message);
			this.addItem(listForm);
			this.listForm = listForm;
		}
		destroy() {
			this.listForm.fields.forEach(field => field.destroy());
			this.listForm.clear();
			this.items.forEach(item => {
				item.unsubscribeAll('onChange');
				item.unsubscribeAll('onClose');
			});
			this.items.clear();
			this.unsubscribeAll('onChange');
			this.clear();
		}
	}

	exports.AgreementsContent = AgreementsContent;
	exports.Content = AgreementsContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Agreements = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Agreements || {}, BX, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Card, BX.Landing.UI.Form, BX.Landing.UI.Field, BX.Landing.UI.Panel);
//# sourceMappingURL=agreements.bundle.js.map
