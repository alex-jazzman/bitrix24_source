/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_ui_card_headercard, landing_loc, landing_ui_form_formsettingsform, landing_ui_field_radiobuttonfield, landing_ui_panel_basepresetpanel, main_core, ui_buttons, landing_ui_panel_formsettingspanel, landing_ui_card_messagecard) {
	'use strict';

	const YANDEX_CAPTCHA_SERVICE = 'yandex';
	const GOOGLE_CAPTCHA_SERVICE = 'google';
	const YANDEX_AVAILABLE_ZONES = new Set(['ru', 'by', 'kz', 'uz']);

	class KeysForm extends landing_ui_form_formsettingsform.FormSettingsForm {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.Content.SpamProtection.KeysForm');
			main_core.Dom.addClass(this.layout, 'landing-ui-form-form-keys-settings');
			this.getButton().renderTo(this.layout);
			this.value = {};
		}
		getButton() {
			return this.cache.remember('button', () => {
				return new ui_buttons.Button({
					text: this.options.buttonLabel,
					color: ui_buttons.ButtonColor.LIGHT_BORDER,
					onclick: () => {
						this.getButton().setWaiting(true);

						// eslint-disable-next-line promise/catch-or-return
						main_core.Runtime.loadExtension('crm.form.captcha').then(({
							Captcha
						}) => {
							this.getButton().setWaiting(false);
							return Captcha.open(this.options.type);
						}).then(result => {
							this.value = {
								...result
							};
							const formSettingsPanel = landing_ui_panel_formsettingspanel.FormSettingsPanel.getInstance();
							if (this.options.type === YANDEX_CAPTCHA_SERVICE) {
								formSettingsPanel.getFormDictionary().captcha.yandexCaptcha.hasKeys = main_core.Type.isStringFilled(result.key) && main_core.Type.isStringFilled(result.secret);
							} else {
								formSettingsPanel.getFormDictionary().captcha.recaptcha.hasKeys = main_core.Type.isStringFilled(result.key) && main_core.Type.isStringFilled(result.secret);
							}
							const activeButton = formSettingsPanel.getSidebarButtons().find(button => {
								return button.isActive();
							});
							if (activeButton) {
								activeButton.getLayout().click();
							}
							this.emit('onChange');
						});
					}
				});
			});
		}
		serialize() {
			return this.value;
		}
	}

	class SpamProtection extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.SpamProtection');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TITLE')
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				header: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_MESSAGE_TITLE'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_MESSAGE_TEXT'),
				angle: false
			});
			if (YANDEX_AVAILABLE_ZONES.has(options.dictionary.region)) {
				// yandexCaptcha is chosen for ru region or if chosen explicitly
				let chosenCaptcha = GOOGLE_CAPTCHA_SERVICE;
				if (this.options.formOptions.captcha.service === GOOGLE_CAPTCHA_SERVICE || this.options.formOptions.captcha.service === '' && this.options.formOptions.captcha.recaptcha.use === true) {
					chosenCaptcha = GOOGLE_CAPTCHA_SERVICE;
				} else if (options.dictionary.region === 'ru' || this.options.formOptions.captcha.service === YANDEX_CAPTCHA_SERVICE) {
					chosenCaptcha = YANDEX_CAPTCHA_SERVICE;
				}
				const captchaServiceForm = this.getServiceForm(false, chosenCaptcha);
				this.addItem(header);
				this.addItem(message);
				this.addItem(captchaServiceForm);
				captchaServiceForm.subscribe('onChange', this.onCaptchaServiceChange.bind(this));
				this.onCaptchaServiceChange();
				return;
			}
			const captchaServiceForm = this.getServiceForm(true, GOOGLE_CAPTCHA_SERVICE);
			const recaptchaTypeForm = this.getRecaptchaForm();
			this.addItem(captchaServiceForm);
			this.addItem(recaptchaTypeForm);
			recaptchaTypeForm.subscribe('onChange', this.onRecaptchaTypeChange.bind(this));
			this.onRecaptchaTypeChange();
		}
		getServiceForm(isHidden, chosenCaptcha) {
			return new landing_ui_form_formsettingsform.FormSettingsForm({
				id: 'service',
				description: null,
				hidden: isHidden,
				fields: [new BX.Landing.UI.Field.Dropdown({
					selector: 'service',
					title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_SERVICE_TITLE'),
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_SERVICE_OPTION_YANDEX'),
						value: YANDEX_CAPTCHA_SERVICE
					}, {
						name: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_SERVICE_OPTION_GOOGLE'),
						value: GOOGLE_CAPTCHA_SERVICE
					}],
					content: chosenCaptcha
				})]
			});
		}
		onCaptchaServiceChange() {
			const recaptchaTypeForm = this.getRecaptchaForm();
			const yandexCaptchaForm = this.getYandexCaptchaForm();
			const foreignServiceWarningForm = this.getForeignServiceWarningForm();
			main_core.Dom.remove(recaptchaTypeForm.getLayout());
			main_core.Dom.remove(yandexCaptchaForm.getLayout());
			main_core.Dom.remove(foreignServiceWarningForm.getLayout());
			if (this.getValue().captcha.service === GOOGLE_CAPTCHA_SERVICE) {
				yandexCaptchaForm.unsubscribe('onChange', this.onYandexTypeChange.bind(this));
				this.onYandexTypeChange();
				this.addForeignServiceWarningForm(foreignServiceWarningForm, GOOGLE_CAPTCHA_SERVICE);
				this.addItem(recaptchaTypeForm);
				recaptchaTypeForm.subscribe('onChange', this.onRecaptchaTypeChange.bind(this));
				this.onRecaptchaTypeChange();
			} else {
				recaptchaTypeForm.unsubscribe('onChange', this.onRecaptchaTypeChange.bind(this));
				this.onRecaptchaTypeChange();
				this.addForeignServiceWarningForm(foreignServiceWarningForm, YANDEX_CAPTCHA_SERVICE);
				this.addItem(yandexCaptchaForm);
				yandexCaptchaForm.subscribe('onChange', this.onYandexTypeChange.bind(this));
				this.onYandexTypeChange();
			}
		}
		addForeignServiceWarningForm(form, service) {
			if (this.options.dictionary.region === 'by' || this.options.dictionary.region === 'ru' && service === GOOGLE_CAPTCHA_SERVICE) {
				this.addItem(form);
			}
		}
		getForeignServiceWarningForm() {
			return this.cache.remember('foreignServiceWarning', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					id: 'foreignServiceWarning',
					description: null,
					fields: [new landing_ui_card_messagecard.MessageCard({
						selector: 'warningForeign',
						context: 'warning',
						description: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_MESSAGE_WARNING_FOREIGN'),
						angle: false,
						closeable: false
					})]
				});
			});
		}
		getRecaptchaForm() {
			return this.cache.remember('recaptchaForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					id: 'type',
					description: null,
					fields: [new landing_ui_card_messagecard.MessageCard({
						selector: 'warningCaptcha',
						context: 'warning',
						description: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_MESSAGE_WARNING_RECAPTCHA').replace('#URL_POLICIES_PRIVACY#', 'https://policies.google.com/privacy').replace('#URL_POLICIES_TERMS#', 'https://policies.google.com/terms'),
						angle: false,
						closeable: false
					}), new landing_ui_field_radiobuttonfield.RadioButtonField({
						selector: 'recaptchaUse',
						title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TABS_TITLE'),
						value: main_core.Text.toBoolean(this.options.formOptions.captcha.recaptcha.use) ? 'hidden' : 'disabled',
						items: [{
							id: 'disabled',
							title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TAB_DISABLED'),
							icon: 'landing-ui-spam-protection-icon-disabled'
						}, {
							id: 'hidden',
							title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TAB_HIDDEN'),
							icon: 'landing-ui-spam-protection-icon-hidden'
						}]
					})]
				});
			});
		}
		getYandexCaptchaForm() {
			return this.cache.remember('yandexCaptchaForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					id: 'yandexType',
					description: null,
					fields: [new landing_ui_field_radiobuttonfield.RadioButtonField({
						selector: 'yandexUse',
						title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TABS_TITLE_YANDEX'),
						value: main_core.Text.toBoolean(this.options.formOptions.captcha.yandexCaptcha.use) ? 'hidden' : 'disabled',
						items: [{
							id: 'disabled',
							title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TAB_DISABLED'),
							icon: 'landing-ui-spam-protection-icon-disabled'
						}, {
							id: 'hidden',
							title: landing_loc.Loc.getMessage('LANDING_SPAM_PROTECTION_TAB_HIDDEN'),
							icon: 'landing-ui-spam-protection-icon-hidden'
						}]
					})]
				});
			});
		}
		hasDefaultYandexKeys() {
			return main_core.Text.toBoolean(this.options.formOptions.captcha.yandexCaptcha.hasDefaults);
		}
		hasCustomYandexKeys() {
			return main_core.Text.toBoolean(this.options.dictionary.captcha.yandexCaptcha.hasKeys);
		}
		onYandexTypeChange() {
			main_core.Dom.remove(this.getYandexKeysSettingsForm().getLayout());
			main_core.Dom.remove(this.getYandexRequiredKeysForm().getLayout());
			if (this.getValue().captcha.service === YANDEX_CAPTCHA_SERVICE && this.getValue().captcha.yandexCaptcha.use) {
				if (!this.hasDefaultYandexKeys() && !this.hasCustomYandexKeys()) {
					this.addItem(this.getYandexRequiredKeysForm());
				} else if (this.hasCustomYandexKeys()) {
					this.addItem(this.getYandexKeysSettingsForm());
				} else if (this.hasDefaultYandexKeys() && !this.hasCustomYandexKeys()) {
					this.addItem(this.getYandexCustomKeysForm());
				}
			}
		}
		getYandexCustomKeysForm() {
			return this.cache.remember('yandexCustomKeysForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_YANDEX_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_CUSTOM_BUTTON_LABEL'),
					type: YANDEX_CAPTCHA_SERVICE
				});
			});
		}
		getYandexRequiredKeysForm() {
			return this.cache.remember('yandexRequiredKeysForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_YANDEX_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_BUTTON_LABEL'),
					description: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_YANDEX_KEYS_FORM_REQUIRED_DESCRIPTION'),
					type: YANDEX_CAPTCHA_SERVICE
				});
			});
		}
		getYandexKeysSettingsForm() {
			return this.cache.remember('yandexCustomKeysForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_YANDEX_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_CHANGE_BUTTON_LABEL'),
					type: YANDEX_CAPTCHA_SERVICE
				});
			});
		}
		hasDefaultRecaptchaKeys() {
			return main_core.Text.toBoolean(this.options.formOptions.captcha.recaptcha.hasDefaults);
		}
		hasRecaptchaCustomKeys() {
			return main_core.Text.toBoolean(this.options.dictionary.captcha.recaptcha.hasKeys);
		}
		onRecaptchaTypeChange() {
			main_core.Dom.remove(this.getRecaptchaCustomKeysForm().getLayout());
			main_core.Dom.remove(this.getRecaptchaRequiredKeysForm().getLayout());
			main_core.Dom.remove(this.getRecaptchaKeysSettingsForm().getLayout());
			if ((this.getValue().captcha.service === GOOGLE_CAPTCHA_SERVICE || !this.getValue().captcha.service) && this.getValue().captcha.recaptcha.use) {
				if (!this.hasDefaultRecaptchaKeys() && !this.hasRecaptchaCustomKeys()) {
					this.addItem(this.getRecaptchaRequiredKeysForm());
				} else if (this.hasRecaptchaCustomKeys()) {
					this.addItem(this.getRecaptchaKeysSettingsForm());
				} else if (this.hasDefaultRecaptchaKeys() && !this.hasRecaptchaCustomKeys()) {
					this.addItem(this.getRecaptchaCustomKeysForm());
				}
			}
		}
		getRecaptchaCustomKeysForm() {
			return this.cache.remember('customKeysForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_CUSTOM_BUTTON_LABEL'),
					type: GOOGLE_CAPTCHA_SERVICE
				});
			});
		}
		getRecaptchaRequiredKeysForm() {
			return this.cache.remember('requiredKeysForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_BUTTON_LABEL'),
					description: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_REQUIRED_DESCRIPTION'),
					type: GOOGLE_CAPTCHA_SERVICE
				});
			});
		}
		getRecaptchaKeysSettingsForm() {
			return this.cache.remember('keysSettingsForm', () => {
				return new KeysForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_TITLE'),
					buttonLabel: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_FORM_CAPTCHA_KEYS_FORM_CHANGE_BUTTON_LABEL'),
					type: GOOGLE_CAPTCHA_SERVICE
				});
			});
		}

		// eslint-disable-next-line class-methods-use-this
		valueReducer(sourceValue) {
			return {
				captcha: {
					service: sourceValue.service,
					recaptcha: {
						use: sourceValue.recaptchaUse ? sourceValue.recaptchaUse === 'hidden' : this.options.formOptions.captcha.recaptcha.use,
						...this.getRecaptchaKeysSettingsForm().serialize(),
						...this.getRecaptchaCustomKeysForm().serialize(),
						...this.getRecaptchaRequiredKeysForm().serialize()
					},
					yandexCaptcha: {
						use: sourceValue.yandexUse ? sourceValue.yandexUse === 'hidden' : this.options.formOptions.captcha.yandexCaptcha.use,
						...this.getYandexRequiredKeysForm().serialize(),
						...this.getYandexKeysSettingsForm().serialize()
					}
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

	exports.Content = SpamProtection;
	exports.SpamProtection = SpamProtection;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.SpamProtection = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.SpamProtection || {}, BX.Landing.UI.Card, BX.Landing, BX.Landing.UI.Form, BX.Landing.UI.Field, BX.Landing.UI.Panel, BX, BX.UI, BX.Landing.UI.Panel, BX.Landing.UI.Card);
//# sourceMappingURL=spam-protection.bundle.js.map
