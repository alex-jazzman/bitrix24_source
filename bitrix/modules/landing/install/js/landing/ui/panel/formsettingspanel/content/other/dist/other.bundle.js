/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, ui_designTokens, landing_ui_card_headercard, landing_loc, landing_ui_form_formsettingsform, landing_ui_field_textfield, landing_ui_panel_basepresetpanel, main_core_events, main_core, landing_ui_field_basefield, ui_entitySelector, landing_pageobject, landing_ui_card_basecard) {
	'use strict';

	class UserSelectorField extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			main_core.Dom.removeClass(this.input, 'landing-ui-field-input');
			this.getTagSelector().renderTo(this.input);
		}
		getTagSelector() {
			return this.cache.remember('tagSelector', () => {
				const root = landing_pageobject.PageObject.getRootWindow();
				return new root.BX.UI.EntitySelector.TagSelector({
					id: 'user-selector',
					dialogOptions: {
						id: 'user-selector',
						entities: [{
							id: 'user',
							options: {
								activeUsers: true
							}
						}],
						preselectedItems: this.options.value,
						events: {
							'Item:onSelect': () => {
								this.emit('onChange', {
									skipPrepare: true
								});
							},
							'Item:onDeselect': () => {
								this.emit('onChange', {
									skipPrepare: true
								});
							}
						}
					}
				});
			});
		}
		getValue() {
			return this.getTagSelector().getDialog().getSelectedItems().map(item => {
				return item.id;
			});
		}
	}

	class Other extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.SpamProtection');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_OTHER_TITLE')
			});
			const otherForm = new landing_ui_form_formsettingsform.FormSettingsForm({
				id: 'other',
				description: null,
				fields: [this.getNameField(), this.getUserSelectorField(), this.getCheckWorkTimeField(), this.getLanguageField(), this.getUseSignField()]
			});
			this.addItem(header);
			this.addItem(otherForm);
			const idCard = new landing_ui_card_basecard.BaseCard();
			main_core.Dom.style(idCard.getLayout(), {
				padding: 0,
				margin: 0
			});
			const id = this.options.formOptions.id;
			main_core.Dom.append(main_core.Tag.render`<div>${landing_loc.Loc.getMessage('LANDING_CRM_FORM_ID_MSGVER_1')} ${id}</div>`, idCard.getBody());
			this.addItem(idCard);
		}
		canRemoveCopyrights() {
			return this.options.dictionary.sign.canRemove;
		}
		getNameField() {
			return this.cache.remember('nameField', () => {
				return new landing_ui_field_textfield.TextField({
					title: landing_loc.Loc.getMessage('LANDING_FORM_OTHER_TITLE_NAME_TITLE'),
					selector: 'name',
					textOnly: true,
					content: this.options.formOptions.name
				});
			});
		}
		getUseSignField() {
			return this.cache.remember('useSignField', () => {
				return new BX.Landing.UI.Field.Checkbox({
					selector: 'useSign',
					value: this.options.formOptions.data.useSign ? ['useSign'] : [],
					items: [{
						value: 'useSign',
						html: `${landing_loc.Loc.getMessage('LANDING_HEADER_AND_BUTTONS_BUTTONS_SIGN_B_24')}`,
						name: ''
					}],
					compact: true
				});
			});
		}
		getUserSelectorField() {
			return this.cache.remember('userSelectorField', () => {
				return new UserSelectorField({
					selector: 'users',
					title: landing_loc.Loc.getMessage('LANDING_CRM_FORM_USER'),
					value: this.options.formOptions.responsible.users.reduce((acc, item) => {
						if (main_core.Type.isStringFilled(item) || main_core.Type.isNumber(item)) {
							acc.push(['user', item]);
						}
						return acc;
					}, [])
				});
			});
		}
		getCheckWorkTimeField() {
			return this.cache.remember('checkWorkTimeField', () => {
				return new BX.Landing.UI.Field.Checkbox({
					selector: 'checkWorkTime',
					compact: true,
					value: [this.options.formOptions.responsible.checkWorkTime ? 'Y' : 'N'],
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_OTHER_CHECK_WORK_TIME'),
						value: 'Y'
					}]
				});
			});
		}
		getLanguageField() {
			return this.cache.remember('language', () => {
				return new BX.Landing.UI.Field.Dropdown({
					selector: 'language',
					title: landing_loc.Loc.getMessage('LANDING_CRM_FORM_LANGUAGE'),
					items: this.options.dictionary.languages.map(item => {
						return {
							name: item.name,
							value: item.id
						};
					}),
					content: this.options.formOptions.data.language
				});
			});
		}
		valueReducer(value) {
			return {
				name: value.name,
				data: {
					language: this.getLanguageField().getValue(),
					useSign: value.useSign.includes('useSign')
				},
				responsible: {
					users: value.users,
					checkWorkTime: value.checkWorkTime[0] === 'Y'
				}
			};
		}
		onChange(event) {
			if (!this.canRemoveCopyrights()) {
				const checkbox = this.getUseSignField();
				if (!checkbox.getValue().includes('useSign')) {
					checkbox.setValue(['useSign']);
					if (main_core.Type.isStringFilled(this.options.dictionary.restriction.helper)) {
						const evalGlobal = main_core.Reflection.getClass('BX.evalGlobal');
						if (main_core.Type.isFunction(evalGlobal)) {
							evalGlobal(this.options.dictionary.restriction.helper);
						}
					}
				}
			}
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
	}

	exports.Content = Other;
	exports.Other = Other;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Other = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Other || {}, window, BX.Landing.UI.Card, BX.Landing, BX.Landing.UI.Form, BX.Landing.UI.Field, BX.Landing.UI.Panel, BX.Event, BX, BX.Landing.UI.Field, BX.UI.EntitySelector, BX.Landing, BX.Landing.UI.Card);
//# sourceMappingURL=other.bundle.js.map
