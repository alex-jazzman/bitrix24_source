/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_ui_card_headercard, main_core, landing_ui_card_messagecard, landing_ui_form_formsettingsform, landing_ui_field_textfield, landing_ui_field_variablesfield, landing_ui_panel_basepresetpanel) {
	'use strict';

	var headerAndButtonsIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/header-and-button/dist/assets/header-and-buttons-message-icon.svg";

	class HeaderAndButtonContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.HeaderAndButtonContent');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_TITLE')
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				id: 'headerAndButtonMessage',
				icon: headerAndButtonsIcon,
				header: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_MESSAGE_HEADER'),
				description: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_MESSAGE_DESCRIPTION_2'),
				restoreState: true,
				more: () => {
					const helper = main_core.Reflection.getClass('top.BX.Helper');
					if (helper) {
						BX.Helper.show('redirect=detail&code=12802786');
					}
				}
			});
			const headersForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				id: 'headers',
				title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_HEADERS_FORM_TITLE'),
				fields: [new landing_ui_field_variablesfield.VariablesField({
					selector: 'title',
					title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_HEADERS_FORM_HEADER_FIELD_TITLE'),
					textOnly: true,
					content: this.options.formOptions.data.title,
					variables: this.getPersonalizationVariables()
				}), new landing_ui_field_variablesfield.VariablesField({
					selector: 'desc',
					title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_HEADERS_FORM_SUBHEADER_FIELD_TITLE'),
					textOnly: true,
					content: this.options.formOptions.data.desc,
					variables: this.getPersonalizationVariables()
				}), new BX.Landing.UI.Field.Checkbox({
					selector: 'hideDesc',
					items: [{
						value: 'hideDesc',
						name: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_HEADERS_FORM_HIDE_SUBHEADER_FIELD_TITLE')
					}
					// {
					// 	value: 'hideSeparator',
					// 	name: Loc.getMessage('LANDING_HEADER_AND_BUTTONS_HEADERS_FORM_HIDE_SEPARATOR_FIELD_TITLE'),
					// },
					],
					compact: true
				})]
			});
			const buttonsForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				id: 'buttons',
				title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_BUTTONS_FORM_TITLE'),
				fields: [new landing_ui_field_textfield.TextField({
					selector: 'buttonCaption',
					title: main_core.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_BUTTONS_FORM_SEND_BUTTON_TITLE'),
					textOnly: true,
					content: this.options.formOptions.data.buttonCaption
				})]
			});
			this.addItem(header);
			this.addItem(message);
			this.addItem(headersForm);
			this.addItem(buttonsForm);
		}
		getPersonalizationVariables() {
			return this.cache.remember('personalizationVariables', () => {
				return this.options.dictionary.personalization.list.map(item => {
					return {
						name: item.name,
						value: item.id
					};
				});
			});
		}

		// eslint-disable-next-line class-methods-use-this
		valueReducer(sourceValue) {
			const value = Object.entries(sourceValue).reduce((acc, [key, value]) => {
				if (key === 'hideDesc') {
					if (value.includes(key)) {
						acc.desc = '';
					}
					delete acc.hideDesc;
				}
				if (key === 'useSign') {
					acc.useSign = value.includes('useSign');
				}
				return acc;
			}, {
				...sourceValue
			});
			if (!this.items[2].getSwitch().getValue()) {
				value.title = '';
				value.desc = '';
			}
			return value;
		}
		onChange(event) {
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
	}

	exports.Content = HeaderAndButtonContent;
	exports.HeaderAndButtonContent = HeaderAndButtonContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.HeaderAndButton = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.HeaderAndButton || {}, BX.Landing.UI.Card, BX, BX.Landing.UI.Card, BX.Landing.UI.Form, BX.Landing.UI.Field, BX.Landing.UI.Field, BX.Landing.UI.Panel);
//# sourceMappingURL=header-and-button.bundle.js.map
