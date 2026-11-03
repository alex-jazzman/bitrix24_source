/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, main_core_events, landing_loc, landing_ui_panel_basepresetpanel, landing_ui_form_formsettingsform, landing_ui_card_headercard, landing_ui_field_textfield, landing_ui_card_messagecard, crm_form_client, landing_ui_panel_formsettingspanel) {
	'use strict';

	class Whatsapp extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.Whatsapp');
			this.addItem(this.getHeader());
			if (this.options.dictionary.whatsapp.setup.completed) {
				this.addItem(this.getSettingsForm());
			} else {
				this.addItem(this.getWarningMessage());
			}
		}
		getHeader() {
			return this.cache.remember('header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_WHATSAPP_TITLE')
				});
			});
		}
		getWarningMessage() {
			return this.cache.remember('warningMessage', () => {
				return new landing_ui_card_messagecard.MessageCard({
					header: landing_loc.Loc.getMessage('LANDING_FORM_WHATSAPP_WARNING_HEADER'),
					description: landing_loc.Loc.getMessage('LANDING_FORM_WHATSAPP_WARNING_TEXT'),
					angle: false,
					closeable: false,
					more: () => {
						BX.SidePanel.Instance.open(this.options.dictionary.whatsapp.setup.link, {
							events: {
								onClose: () => {
									crm_form_client.FormClient.getInstance().getDictionary().then(dictionary => {
										this.options.dictionary = dictionary;
										landing_ui_panel_formsettingspanel.FormSettingsPanel.getInstance().setFormDictionary(dictionary);
										this.clear();
										this.addItem(this.getHeader());
										if (this.options.dictionary.whatsapp.setup.completed) {
											this.addItem(this.getSettingsForm());
										} else {
											this.addItem(this.getWarningMessage());
										}
									});
								}
							}
						});
					}
				});
			});
		}
		getSettingsForm() {
			return this.cache.remember('settingsForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_WHATSAPP_USE_CHECKBOX_LABEL'),
					fields: [this.getTextField()]
				});
			});
		}
		getUseCheckboxField() {
			return this.cache.remember('useCheckboxField', () => {
				return new BX.Landing.UI.Field.Checkbox({
					selector: 'use',
					compact: true,
					value: [main_core.Text.toBoolean(this.options.formOptions.whatsapp.use)],
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_USE_CHECKBOX_LABEL'),
						value: true
					}]
				});
			});
		}
		getTextField() {
			return this.cache.remember('textField', () => {
				const textItem = this.options.dictionary.whatsapp.messages.find(item => {
					return String(item.langId) === String(this.options.data.language);
				});
				const text = main_core.Type.isPlainObject(textItem) ? textItem.text : '';
				const field = new landing_ui_field_textfield.TextField({
					selector: 'text',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_WHATSAPP_TEXT_TITLE'),
					content: text,
					textOnly: true
				});
				main_core.Dom.addClass(field.input, 'landing-ui-disabled');
				return field;
			});
		}
		valueReducer(value) {
			return {
				whatsapp: {
					use: this.getSettingsForm().isOpened()
				}
			};
		}
		onChange(event) {
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
	}

	exports.Content = Whatsapp;
	exports.Whatsapp = Whatsapp;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Whatsapp = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Whatsapp || {}, BX, BX.Event, BX.Landing, BX.Landing.UI.Panel, BX.Landing.UI.Form, BX.Landing.UI.Card, BX.Landing.UI.Field, BX.Landing.UI.Card, BX.Crm.Form, BX.Landing.UI.Panel);
//# sourceMappingURL=whatsapp.bundle.js.map
