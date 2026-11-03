/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_ui_panel_basepresetpanel, landing_ui_form_formsettingsform, landing_ui_field_defaultvaluefield, landing_ui_card_headercard, landing_loc, main_core, landing_ui_card_messagecard) {
	'use strict';

	class DefaultValues extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.DefaultValues');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DEFAULT_VALUE_TITLE')
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				id: 'defaultValueMessage',
				header: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DEFAULT_VALUE_MESSAGE_TITLE'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DEFAULT_VALUE_MESSAGE_DESCRIPTION'),
				restoreState: true
			});
			const fieldsForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				fields: [new landing_ui_field_defaultvaluefield.DefaultValueField({
					selector: 'presetFields',
					isLeadEnabled: this.options.isLeadEnabled,
					personalizationVariables: this.getPersonalizationVariables(),
					formOptions: {
						...this.options.formOptions
					},
					crmFields: {
						...this.options.crmFields
					},
					dictionary: {
						...this.options.dictionary
					},
					items: [...this.options.formOptions.presetFields]
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
		getPersonalizationVariables() {
			return this.cache.remember('personalizationVariables', () => {
				const {
					properties
				} = this.options.dictionary;
				if (main_core.Type.isPlainObject(properties) && main_core.Type.isArrayFilled(properties.list)) {
					return properties.list.map(item => {
						return {
							name: item.name,
							value: item.id
						};
					}).concat([{
						delimiter: true
					}]).concat(this.options.formOptions.data.fields.filter(field => {
						return ['phone', 'email', 'date', 'datetime', 'double', 'integer', 'lastname', 'name', 'secondname', 'string', 'text', 'money'].includes(field.type);
					}).map(field => {
						return {
							name: field.label,
							value: `%${field.name.toLowerCase()}%`
						};
					}));
				}
				return [];
			});
		}
		getLayout() {
			const layout = super.getLayout();
			main_core.Dom.addClass(layout, 'landing-ui-default-fields-values');
			return layout;
		}
		onChange(event) {
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
	}

	exports.Content = DefaultValues;
	exports.DefaultValues = DefaultValues;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.DefaultValues = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.DefaultValues || {}, BX.Landing.UI.Panel, BX.Landing.UI.Form, BX.Landing.UI.Field, BX.Landing.UI.Card, BX.Landing, BX, BX.Landing.UI.Card);
//# sourceMappingURL=default-values.bundle.js.map
