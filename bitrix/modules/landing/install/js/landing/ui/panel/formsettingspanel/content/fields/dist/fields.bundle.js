/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_loc, landing_ui_card_headercard, landing_ui_card_messagecard, landing_ui_panel_basepresetpanel, landing_ui_form_formsettingsform, landing_ui_field_fieldslistfield) {
	'use strict';

	var messageIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/fields/dist/assets/message-icon.svg";

	class FieldsContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.FieldsContent');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_FIELDS_TITLE')
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				id: 'fieldsMessage',
				header: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_FIELDS_MESSAGE_TITLE'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_FIELDS_MESSAGE_DESCRIPTION'),
				icon: messageIcon,
				restoreState: true
			});
			const fieldsForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				fields: [new landing_ui_field_fieldslistfield.FieldsListField({
					selector: 'fields',
					isLeadEnabled: this.options.isLeadEnabled,
					dictionary: this.options.dictionary,
					formOptions: {
						...this.options.formOptions
					},
					crmFields: {
						...this.options.crmFields
					},
					items: [...this.options.formOptions.data.fields]
				})]
			});
			if (!message.isShown()) {
				fieldsForm.setOffsetTop(-36);
			}
			message.subscribe('onClose', () => {
				fieldsForm.setOffsetTop(-36);
			});
			this.addItem(header);
			this.addItem(message);
			this.addItem(fieldsForm);
		}
	}

	exports.Content = FieldsContent;
	exports.FieldsContent = FieldsContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Fields = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Fields || {}, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX.Landing.UI.Form, BX.Landing.UI.Field);
//# sourceMappingURL=fields.bundle.js.map
