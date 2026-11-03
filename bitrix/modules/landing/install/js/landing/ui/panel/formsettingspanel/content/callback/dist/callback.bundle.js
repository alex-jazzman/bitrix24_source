/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, main_core_events, landing_loc, landing_ui_panel_basepresetpanel, landing_ui_form_formsettingsform, landing_ui_card_headercard, landing_ui_field_textfield, landing_ui_card_messagecard) {
	'use strict';

	class Callback extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.Callback');
			this.addItem(this.getHeader());
			if (!this.isAvailable()) {
				this.addItem(this.getWarningMessage());
				this.getSettingsForm().disable();
			}
			this.addItem(this.getSettingsForm());
		}
		getHeader() {
			return this.cache.remember('header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_TITLE')
				});
			});
		}
		getWarningMessage() {
			return this.cache.remember('warningMessage', () => {
				return new landing_ui_card_messagecard.MessageCard({
					header: landing_loc.Loc.getMessage('LANDING_FORM_CALLBACK_WARNING_HEADER'),
					description: landing_loc.Loc.getMessage('LANDING_FORM_CALLBACK_WARNING_TEXT'),
					angle: false,
					closeable: false,
					hideActions: true,
					context: 'warning'
				});
			});
		}
		isAvailable() {
			return this.cache.remember('isAvailable', () => {
				return this.options.dictionary.callback.from.length > 0;
			});
		}
		getSettingsForm() {
			return this.cache.remember('settingsForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_USE_CHECKBOX_LABEL'),
					toggleable: true,
					toggleableType: landing_ui_form_formsettingsform.FormSettingsForm.ToggleableType.Switch,
					opened: this.isAvailable() && main_core.Text.toBoolean(this.options.formOptions.callback.use),
					fields: [this.getPhoneListField(), this.getTextField()]
				});
			});
		}
		getUseCheckboxField() {
			return this.cache.remember('useCheckboxField', () => {
				return new BX.Landing.UI.Field.Checkbox({
					selector: 'use',
					compact: true,
					value: [main_core.Text.toBoolean(this.options.formOptions.callback.use)],
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_USE_CHECKBOX_LABEL'),
						value: true
					}]
				});
			});
		}
		getPhoneListField() {
			return this.cache.remember('phoneListField', () => {
				return new BX.Landing.UI.Field.Dropdown({
					selector: 'from',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_PHONE_TITLE'),
					content: this.options.formOptions.callback.from,
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_DEFAULT_PHONE_NOT_SELECTED'),
						value: ''
					}, ...this.options.dictionary.callback.from.map(item => {
						return {
							name: item.name,
							value: item.id
						};
					})]
				});
			});
		}
		getTextField() {
			return this.cache.remember('textField', () => {
				return new landing_ui_field_textfield.TextField({
					selector: 'text',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CALLBACK_TEXT_TITLE'),
					content: this.options.formOptions.callback.text,
					textOnly: true
				});
			});
		}
		valueReducer(value) {
			return {
				callback: {
					...value,
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

	exports.Callback = Callback;
	exports.Content = Callback;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Callback = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Callback || {}, BX, BX.Event, BX.Landing, BX.Landing.UI.Panel, BX.Landing.UI.Form, BX.Landing.UI.Card, BX.Landing.UI.Field, BX.Landing.UI.Card);
//# sourceMappingURL=callback.bundle.js.map
