/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, landing_ui_panel_basepresetpanel, landing_pageobject, landing_loc, main_core, landing_backend, main_loader, crm_form_client, ui_buttons, landing_env, landing_ui_panel_stylepanel, ui_dialogs_messagebox, ui_alerts, landing_ui_button_sidebarbutton, ui_tour, landing_ui_panel_fieldspanel, bitrix24_phoneverify, ui_switcher, ui_hint, ui_fonts_opensans, landing_history) {
	'use strict';

	const PHONE_VERIFY_FORM_ENTITY = 'crm_webform';

	/**
	 * @memberOf BX.Landing.UI.Panel
	 */
	class FormSettingsPanel extends landing_ui_panel_basepresetpanel.BasePresetPanel {
		static getInstance() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			const rootWindowPanel = rootWindow.BX.Landing.UI.Panel.FormSettingsPanel;
			if (!rootWindowPanel.instance && !FormSettingsPanel.instance) {
				rootWindowPanel.instance = new FormSettingsPanel();
			}
			return rootWindowPanel.instance || FormSettingsPanel.instance;
		}
		adjustActionsPanels = false;
		#phoneDoesntVerifiedResponseCode = 'PHONE_NOT_VERIFIED';
		constructor() {
			super();
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel');
			this.setTitle(landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_TITLE'));
			this.lsCache = new main_core.Cache.LocalStorageCache();
			main_core.Dom.addClass(this.layout, 'landing-ui-panel-form-settings');
			this.subscribe('onCancel', () => {
				BX.onCustomEvent(this, 'BX.Landing.Block:onFormSettingsClose', [this.getCurrentBlock().id]);
			});
			this.disableOverlay();
			if (this.isCrmFormPage()) {
				const {
					dictionary
				} = landing_env.Env.getInstance().getOptions().formEditorData;
				const preparedSidebarButtons = dictionary.sidebarButtons.map(buttonOptions => {
					return new landing_ui_button_sidebarbutton.SidebarButton({
						...buttonOptions,
						child: true
					});
				});
				this.setSidebarButtons(preparedSidebarButtons);
				const preparedPresets = dictionary.scenarios.map(presetOptions => {
					return new landing_ui_panel_basepresetpanel.Preset(presetOptions);
				});
				this.setPresets(preparedPresets);
				const preparedPresetCategories = dictionary.scenarioCategories.map(categoryOptions => {
					return new landing_ui_panel_basepresetpanel.PresetCategory(categoryOptions);
				});
				this.setCategories(preparedPresetCategories);
			} else {
				main_core.Dom.append(this.getBlockSettingsButton().render(), this.getRightHeaderControls());
			}
			this.subscribe('onCancel', this.onCancelClick.bind(this));
			main_core.Dom.append(this.getExpertSwitcherLayout(), this.layout);
		}
		getExpertSwitcherLayout() {
			return this.cache.remember('switcherLayout', () => {
				const onClick = () => {
					this.getExpertModeSwitcher().node.click();
				};
				return main_core.Tag.render`
				<div class="landing-ui-expert-switcher">
					${this.getExpertModeSwitcher().node}
					<span onclick="${onClick}" class="landing-ui-expert-switcher-label">
						${landing_loc.Loc.getMessage('LANDING_FORM_EXPERT_MODE_SWITCHER_LABEL')}
					</span>
				</div>
			`;
			});
		}
		getExpertModeSwitcher() {
			return this.cache.remember('expertModeSwitcher', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				const switcher = new rootWindow.BX.UI.Switcher({
					checked: this.isExpertModeEnabled()
				});
				main_core.Dom.addClass(switcher.node, 'ui-switcher-size-sm ui-switcher-color-green');
				main_core.Event.bind(switcher.node, 'click', this.onExpertSwitcherClick.bind(this));
				return switcher;
			});
		}
		onExpertSwitcherClick() {
			this.lsCache.set('formEditorExpertMode', this.getExpertModeSwitcher().isChecked());
			this.onExpertModeChange();
		}
		getCurrentPreset() {
			const {
				templateId
			} = this.getFormOptions();
			const preset = this.getPresets().find(currentPreset => {
				return currentPreset.options.id === templateId;
			});
			if (preset) {
				return preset;
			}
			return this.getPresets().find(currentPreset => {
				return currentPreset.options.id === 'expert';
			});
		}
		onExpertModeChange() {
			const currentPreset = this.getCurrentPreset();
			if (this.getExpertModeSwitcher().isChecked() && main_core.Type.isArrayFilled(currentPreset.options.expertModeItems)) {
				this.clearSidebar();
				this.getSidebarButtons().filter(button => {
					return currentPreset.options.expertModeItems.includes(button.id);
				}).forEach(button => {
					if (!currentPreset.options.items.includes(button.id)) {
						button.deactivate();
					}
					this.appendSidebarButton(button);
				});
			} else {
				const currentSidebarButton = this.getSidebarButtons().find(button => {
					return button.isActive();
				});
				const buttons = this.getSidebarButtons().filter(button => {
					return currentPreset.options.items.includes(button.id);
				});
				this.clearSidebar();
				buttons.forEach(button => {
					this.appendSidebarButton(button);
				});
				if (currentSidebarButton && !currentPreset.options.items.includes(currentSidebarButton.id)) {
					const defaultSection = (() => {
						if (main_core.Type.isStringFilled(currentPreset.options.defaultSection)) {
							return currentPreset.options.defaultSection;
						}
						return 'fields';
					})();
					const defaultSectionButton = this.getSidebarButtons().find(button => {
						return button.id === defaultSection;
					});
					if (defaultSectionButton) {
						defaultSectionButton.getLayout().click();
					}
				}
			}
		}
		isExpertModeEnabled() {
			return this.lsCache.get('formEditorExpertMode', false);
		}

		// eslint-disable-next-line class-methods-use-this
		isCrmFormPage() {
			return landing_env.Env.getInstance().getSpecialType() === 'crm_forms';
		}
		getFormDesignButton() {
			return this.cache.remember('formDesignButton', () => {
				return new ui_buttons.Button({
					text: landing_loc.Loc.getMessage('LANDING_FORM_DESIGN_BUTTON'),
					color: ui_buttons.Button.Color.LIGHT_BORDER,
					round: true,
					className: 'landing-ui-panel-top-button',
					onclick: this.onFormDesignButtonClick.bind(this)
				});
			});
		}
		getBlockSettingsButton() {
			return this.cache.remember('blockSettingsButton', () => {
				return new ui_buttons.Button({
					text: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_BLOCK_SETTINGS_BUTTON_TEXT'),
					color: ui_buttons.Button.Color.LIGHT_BORDER,
					round: true,
					className: 'landing-ui-panel-top-button',
					onclick: this.onBlockSettingsButtonClick.bind(this)
				});
			});
		}
		onBlockSettingsButtonClick() {
			if (this.getCurrentBlock()) {
				this.hide().then(() => {
					this.getCurrentBlock().showContentPanel();
				});
			}
		}
		onFormDesignButtonClick() {
			if (this.getCurrentBlock()) {
				this.getCurrentBlock().onFormDesignClick();
			}
		}
		getLoader() {
			return this.cache.remember('loader', () => {
				return new main_loader.Loader({
					target: this.body
				});
			});
		}
		showLoader() {
			main_core.Dom.addClass(this.layout, 'landing-ui-panel-state-content-load');
			void this.getLoader().show();
			main_core.Dom.hide(this.sidebar);
			main_core.Dom.hide(this.content);
			main_core.Dom.hide(this.getExpertSwitcherLayout());
		}
		hideLoader() {
			main_core.Dom.removeClass(this.layout, 'landing-ui-panel-state-content-load');
			this.getLoader().hide();
			main_core.Dom.show(this.sidebar);
			main_core.Dom.show(this.content);
			if (main_core.Type.isArrayFilled(this.getCurrentPreset().options.expertModeItems)) {
				main_core.Dom.show(this.getExpertSwitcherLayout());
			}
		}
		showContentLoader() {
			main_core.Dom.addClass(this.layout, 'landing-ui-panel-state-body-load');
			super.showContentLoader();
		}
		hideContentLoader() {
			main_core.Dom.removeClass(this.layout, 'landing-ui-panel-state-body-load');
			super.hideContentLoader();
		}
		load(options = {}) {
			if (options.showWithOptions) {
				const editorData = landing_env.Env.getInstance().getOptions().formEditorData;
				const {
					dictionary
				} = editorData;
				const preparedSidebarButtons = dictionary.sidebarButtons.map(buttonOptions => {
					return new landing_ui_button_sidebarbutton.SidebarButton({
						...buttonOptions,
						child: true
					});
				});
				this.setSidebarButtons(preparedSidebarButtons);
				const preparedPresets = dictionary.scenarios.map(presetOptions => {
					return new landing_ui_panel_basepresetpanel.Preset(presetOptions);
				});
				this.setPresets(preparedPresets);
				const preparedPresetCategories = dictionary.scenarioCategories.map(categoryOptions => {
					return new landing_ui_panel_basepresetpanel.PresetCategory(categoryOptions);
				});
				this.setCategories(preparedPresetCategories);
				this.setCrmFields(editorData.crmFields);
				this.setCrmCompanies(editorData.crmCompanies);
				this.setCrmCategories(editorData.crmCategories);
				this.setAgreements(editorData.agreements);
				const currentOptions = main_core.Runtime.clone(editorData.formOptions);
				if (currentOptions.agreements.use !== true) {
					currentOptions.agreements.use = true;
					currentOptions.data.agreements = [];
				}
				this.setFormOptions(currentOptions);
				this.setFormDictionary(editorData.dictionary);
				return Promise.resolve();
			}
			const crmData = landing_backend.Backend.getInstance().batch('Form::getCrmFields', {
				crmFields: {
					action: 'Form::getCrmFields',
					data: null
				},
				crmCompanies: {
					action: 'Form::getCrmCompanies',
					data: null
				},
				crmCategories: {
					action: 'Form::getCrmCategories',
					data: null
				},
				agreements: {
					action: 'Form::getAgreements',
					data: null
				}
			}).then(result => {
				this.setCrmFields(result.crmFields.result);
				this.setCrmCompanies(result.crmCompanies.result);
				this.setCrmCategories(result.crmCategories.result);
				this.setAgreements(result.agreements.result);
			});
			const formOptions = crm_form_client.FormClient.getInstance().getOptions(this.getCurrentFormId()).then(options => {
				const currentOptions = main_core.Runtime.clone(options);
				if (currentOptions.agreements.use !== true) {
					currentOptions.agreements.use = true;
					currentOptions.data.agreements = [];
				}
				this.setFormOptions(currentOptions);
			});
			const formDictionary = crm_form_client.FormClient.getInstance().getDictionary().then(dictionary => {
				this.setFormDictionary(dictionary);
				const preparedSidebarButtons = dictionary.sidebarButtons.map(buttonOptions => {
					return new landing_ui_button_sidebarbutton.SidebarButton({
						...buttonOptions,
						child: true
					});
				});
				this.setSidebarButtons(preparedSidebarButtons);
				const preparedPresets = dictionary.scenarios.map(presetOptions => {
					return new landing_ui_panel_basepresetpanel.Preset(presetOptions);
				});
				this.setPresets(preparedPresets);
				const preparedPresetCategories = dictionary.scenarioCategories.map(categoryOptions => {
					return new landing_ui_panel_basepresetpanel.PresetCategory(categoryOptions);
				});
				this.setCategories(preparedPresetCategories);
			});
			return Promise.all([crmData, formOptions, formDictionary]);
		}
		setAgreements(agreements) {
			this.cache.set('agreements', main_core.Runtime.orderBy(agreements, ['id'], ['asc']));
		}
		getAgreements() {
			return this.cache.get('agreements');
		}
		isLeadEnabled() {
			return this.getFormDictionary().document.lead.enabled;
		}
		setCurrentBlock(block) {
			this.cache.set('currentBlock', block);
		}
		getCurrentBlock() {
			return this.cache.get('currentBlock');
		}
		getSaveOriginalFileNameAlert() {
			return this.cache.remember('saveOriginalFileNameAlert', () => {
				const alert = new ui_alerts.Alert({
					text: landing_loc.Loc.getMessage('LANDING_CRM_FORM_MAIN_OPTION_WARNING'),
					color: ui_alerts.AlertColor.WARNING
				});
				return alert.render();
			});
		}
		show(options = {
			formOptions: {}
		}) {
			if (!this.layout.parentNode) {
				this.enableToggleMode();
			}
			if (!this.isFormCreated()) {
				this.disableTransparentMode();
			}
			const {
				mainOptions
			} = landing_env.Env.getInstance().getOptions();
			if (mainOptions.saveOriginalFileName === false) {
				this.prependContent(this.getSaveOriginalFileNameAlert());
				const closeButtonTop = main_core.Text.toNumber(main_core.Dom.style(this.closeButton.getLayout(), 'top'));
				const alertHeight = this.getSaveOriginalFileNameAlert().getBoundingClientRect().height;
				main_core.Dom.style(this.closeButton.getLayout(), 'top', `${closeButtonTop + alertHeight}px`);
			}
			this.setCurrentBlock(options.block);
			this.setCurrentFormId(options.formId);
			this.setCurrentFormInstanceId(options.instanceId);
			this.showLoader();
			this.load(options).then(() => {
				this.hideLoader();
				const formOptions = this.getFormOptions();
				if (main_core.Type.isPlainObject(options.formOptions)) {
					const formOptions = main_core.Runtime.merge(this.getFormOptions(), options.formOptions);
					this.setFormOptions(formOptions);
				}
				if (options.state === 'presets') {
					const presetFromRequest = this.getPresetIdFromRequest();
					let preset = false;
					if (presetFromRequest) {
						preset = this.getPresets().find(item => {
							return item.options.id === presetFromRequest;
						});
					}
					if (preset) {
						this.applyPreset(preset);
					} else {
						this.onPresetFieldClick();
						this.activatePreset(formOptions.templateId);
					}
				} else {
					let preset = this.getPresets().find(item => {
						return item.options.id === formOptions.templateId;
					});
					if (!preset) {
						preset = this.getPresets().find(item => {
							return item.options.id === 'expert';
						});
					}
					if (this.isFormCreated()) {
						this.applyPreset(preset);
						this.onPresetFieldClick();
					} else {
						this.applyPreset(preset, true);
					}
				}
				this.setInitialFormOptions(main_core.Runtime.clone(this.getFormOptions()));
				if (!this.isFormCreated()) {
					this.onExpertModeChange();
				}
			}).catch(error => {
				if (main_core.Type.isArrayFilled(error)) {
					const accessDeniedCode = 510;
					const isAccessDenied = error.some(errorItem => {
						return String(errorItem.code) === String(accessDeniedCode);
					});
					if (isAccessDenied) {
						this.getLoader().hide();
						main_core.Dom.show(this.sidebar);
						main_core.Dom.show(this.content);
						main_core.Dom.hide(this.footer);
						main_core.Dom.append(this.getAccessError(), this.content);
					}
				}
				console.error(error);
			});
			const editorWindow = landing_pageobject.PageObject.getEditorWindow();
			main_core.Dom.addClass(editorWindow.document.body, 'landing-ui-hide-action-panels-form');
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			main_core.Dom.addClass(rootWindow.document.body, 'landing-ui-hide-action-panels-form');
			void landing_ui_panel_stylepanel.StylePanel.getInstance().hide();
			this.disableHistory();
			return super.show(options).then(() => {
				setTimeout(() => {
					const y = this.getCurrentBlock().node.offsetTop;
					landing_pageobject.PageObject.getEditorWindow().scrollTo(0, y);
				}, 300);
				BX.onCustomEvent(this, 'BX.Landing.Block:onFormSettingsOpen', [this.getCurrentBlock().id]);
				return Promise.resolve(true);
			});
		}
		getHistoryHint() {
			return this.cache.remember('historyHint', () => {
				const layout = main_core.Tag.render`
				<span 
					class="landing-ui-history-hint"
					data-hint="${main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_FORM_HISTORY_DISABLED_HINT'))}"
					data-hint-no-icon
				></span>
			`;
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				rootWindow.BX.UI.Hint.initNode(layout);
				return layout;
			});
		}
		disableHistory() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			const TopPanel = rootWindow.BX.Landing.UI.Panel.Top;
			if (TopPanel) {
				const {
					undoButton,
					redoButton
				} = TopPanel.getInstance();
				main_core.Dom.addClass(undoButton, 'landing-ui-disabled-from-form');
				main_core.Dom.addClass(redoButton, 'landing-ui-disabled-from-form');
				main_core.Dom.append(this.getHistoryHint(), undoButton.parentElement);
			}
		}
		enableHistory() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			const TopPanel = rootWindow.BX.Landing.UI.Panel.Top;
			if (TopPanel) {
				const {
					undoButton,
					redoButton
				} = TopPanel.getInstance();
				main_core.Dom.removeClass(undoButton, 'landing-ui-disabled-from-form');
				main_core.Dom.removeClass(redoButton, 'landing-ui-disabled-from-form');
				main_core.Dom.remove(this.getHistoryHint());
			}
		}
		getAccessError() {
			return this.cache.remember('accessErrorMessage', () => {
				return main_core.Tag.render`
				<div class="landing-ui-access-error-message">
					<div class="landing-ui-access-error-message-text">
						${landing_loc.Loc.getMessage('LANDING_CRM_ACCESS_ERROR_MESSAGE')}
					</div>
				</div>
			`;
			});
		}

		// eslint-disable-next-line class-methods-use-this
		getPresetIdFromRequest() {
			const uri = new main_core.Uri(window.top.location.href);
			return uri.getQueryParam('preset');
		}

		// eslint-disable-next-line class-methods-use-this
		isFormCreated() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			const uri = new main_core.Uri(rootWindow.location.href);
			return main_core.Text.toBoolean(uri.getQueryParam('formCreated'));
		}
		setCurrentFormId(formId) {
			this.cache.set('currentFormId', main_core.Text.toNumber(formId));
		}
		getCurrentFormId() {
			return this.cache.get('currentFormId');
		}
		setCurrentFormInstanceId(formId) {
			this.cache.set('currentFormInstanceId', formId);
		}
		getCurrentFormInstanceId() {
			return this.cache.get('currentFormInstanceId');
		}
		setCrmFields(fields) {
			this.cache.set('fields', fields);
		}
		getCrmFields() {
			return this.cache.get('fields') || {};
		}
		setCrmCompanies(companies) {
			this.cache.set('companies', companies);
		}
		getCrmCompanies() {
			return this.cache.get('companies') || [];
		}
		setCrmCategories(categories) {
			this.cache.set('crmCategories', categories);
		}
		getCrmCategories() {
			return this.cache.get('crmCategories') || [];
		}
		setFormOptions(options) {
			this.cache.set('formOptions', options);
		}
		getFormOptions() {
			return main_core.Runtime.clone(this.cache.get('formOptions') || {});
		}
		setFormDictionary(dictionary) {
			this.cache.set('formDictionary', dictionary);
		}
		getFormDictionary() {
			return this.cache.get('formDictionary') || {};
		}
		setInitialFormOptions(options) {
			this.cache.set('initialFormOptions', main_core.Runtime.clone(options));
		}
		getInitialFormOptions() {
			return this.cache.get('initialFormOptions');
		}

		// eslint-disable-next-line
		getCrmForm() {
			const formApp = main_core.Reflection.getClass('b24form.App');
			if (formApp) {
				if (this.getCurrentFormInstanceId()) {
					return formApp.get(this.getCurrentFormInstanceId());
				}
				let tmpIndex = -1;
				const currentFormIndex = [...this.getCurrentBlock().node.parentElement.childNodes].reduce((acc, item) => {
					if (main_core.Dom.attr(item, 'data-subtype') === 'form') {
						tmpIndex += 1;
						if (item === this.getCurrentBlock().node) {
							return tmpIndex;
						}
					}
					return acc;
				}, 0);
				return formApp.list()[currentFormIndex];
			}
			return null;
		}
		onChange(event) {
			const eventData = event.getData();
			const eventTargetValue = event.getTarget().getValue();
			Promise.resolve(eventTargetValue).then(value => {
				if (eventData.skipPrepare) {
					const formOptions = this.getFormOptions();
					if (Reflect.has(value, 'presetFields') || Reflect.has(value, 'document') || Reflect.has(value, 'result')) {
						const additionalValue = {};
						if (Reflect.has(value, 'document')) {
							additionalValue.payment = value.document.payment;
							delete value.document.payment;
						}
						return {
							...formOptions,
							...value,
							...additionalValue
						};
					}
					if (Reflect.has(value, 'embedding') || Reflect.has(value, 'callback') || Reflect.has(value, 'whatsapp') || Reflect.has(value, 'bookingResourceAutoSelection') || Reflect.has(value, 'name') && Reflect.has(value, 'data') && Reflect.has(value.data, 'useSign')) {
						const mergedOptions = main_core.Runtime.merge(formOptions, value);
						if (Reflect.has(value, 'responsible')) {
							mergedOptions.responsible.users = value.responsible.users;
						}
						return mergedOptions;
					}
					if (Reflect.has(value, 'captcha')) {
						const recaptcha = {};
						const captcha = {};
						const yandexCaptcha = {};
						if (value.captcha?.recaptcha) {
							const {
								key,
								secret,
								use
							} = value.captcha.recaptcha;
							// eslint-disable-next-line no-param-reassign
							delete value.captcha.recaptcha.key;
							// eslint-disable-next-line no-param-reassign
							delete value.captcha.recaptcha.secret;
							if (!main_core.Type.isNil(key)) {
								recaptcha.key = key;
							}
							if (!main_core.Type.isNil(secret)) {
								recaptcha.secret = secret;
							}
							if (!main_core.Type.isNil(use)) {
								recaptcha.use = use;
							}
						}
						if (value.captcha?.yandexCaptcha) {
							const {
								key,
								secret,
								use
							} = value.captcha.yandexCaptcha;
							// eslint-disable-next-line no-param-reassign
							delete value.captcha.yandexCaptcha.key;
							// eslint-disable-next-line no-param-reassign
							delete value.captcha.yandexCaptcha.secret;
							if (!main_core.Type.isNil(key)) {
								yandexCaptcha.key = key;
							}
							if (!main_core.Type.isNil(secret)) {
								yandexCaptcha.secret = secret;
							}
							if (!main_core.Type.isNil(use)) {
								yandexCaptcha.use = use;
							}
						}
						if (value.captcha) {
							const {
								service
							} = value.captcha;
							if (!main_core.Type.isNil(service)) {
								captcha.service = service;
							}
						}
						captcha.recaptcha = {
							...formOptions.captcha.recaptcha,
							...recaptcha
						};
						captcha.yandexCaptcha = {
							...formOptions.captcha.yandexCaptcha,
							...yandexCaptcha
						};
						return {
							...formOptions,
							captcha: {
								...formOptions.captcha,
								...captcha
							},
							data: {
								...formOptions.data,
								...value
							}
						};
					}
					return {
						...formOptions,
						data: {
							...formOptions.data,
							...value
						}
					};
				}
				return crm_form_client.FormClient.getInstance().prepareOptions(this.getFormOptions(), value).then(result => {
					if (value.agreements) {
						result.data = main_core.Runtime.merge(result.data, value);
					}
					if (value.integration) {
						result.integration = value.integration;
					}
					if (value.fields) {
						result.data.fields = result.data.fields.map((field, index) => {
							return main_core.Runtime.merge(field, value.fields[index]);
						});
					}
					return result;
				});
			}).then(result => {
				BX.Landing.UI.Panel.Top.getInstance().setFormName(result.name);
				this.setFormOptions(result);
				this.getCrmForm().adjust(main_core.Runtime.clone(result.data));
			});
		}
		static sanitize(value) {
			if (main_core.Type.isStringFilled(value)) {
				return main_core.Text.decode(value).replace(/<style[^>]*>.*<\/style>/gm, '').replace(/<script[^>]*>.*<\/script>/gm, '').replace(/<[^>]+>/gm, '');
			}
			return value;
		}
		getPersonalizationVariables() {
			return this.cache.remember('personalizationVariables', () => {
				return this.getFormDictionary().personalization.list.map(item => {
					return {
						name: item.name,
						value: item.id
					};
				});
			});
		}
		getDefaultValuesVariables() {
			return this.cache.remember('personalizationVariables', () => {
				const {
					properties
				} = this.getFormDictionary();
				if (main_core.Type.isPlainObject(properties) && main_core.Type.isArrayFilled(properties.list)) {
					return properties.list.map(item => {
						return {
							name: item.name,
							value: item.id
						};
					});
				}
				return [];
			});
		}
		getContent(id) {
			const currentButton = this.getSidebarButtons().find(button => {
				return id === button.options.id;
			});
			const {
				extension
			} = currentButton.options.data;
			const contentExtension = this.cache.remember(extension, () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				return rootWindow.BX.Runtime.loadExtension(extension).then(exports => {
					return exports.default;
				});
			});
			return contentExtension.then(ContentWrapperClass => {
				if (main_core.Type.isFunction(ContentWrapperClass)) {
					return new ContentWrapperClass({
						formOptions: this.getFormOptions(),
						dictionary: this.getFormDictionary(),
						crmFields: this.getCrmFields(),
						companies: this.getCrmCompanies(),
						categories: this.getCrmCategories(),
						agreements: this.getAgreements(),
						isLeadEnabled: this.isLeadEnabled(),
						form: this.getCrmForm()
					});
				}
				return null;
			});
		}
		onPresetClick(event) {
			if (event.getTarget().options.openable) {
				this.disableTransparentMode();
			}
			const uri = new main_core.Uri(window.top.location.toString());
			uri.removeQueryParam('formCreated');
			uri.removeQueryParam('preset');
			window.top.history.replaceState(null, document.title, uri.toString());
			this.applyPreset(event.getTarget());
		}
		getCheckActionConfirm() {
			return this.cache.remember('checkActionConfirm', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				return new rootWindow.BX.UI.Dialogs.MessageBox({
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					useAirDesign: true
				});
			});
		}
		applyPreset(preset, skipOptions = false) {
			const lastPreset = this.getPresets().find(currentPreset => {
				return main_core.Dom.hasClass(currentPreset.getLayout(), 'landing-ui-panel-preset-active');
			});
			this.getPresets().forEach(currentPreset => {
				currentPreset.deactivate();
			});
			if (!skipOptions) {
				const runAction = (() => {
					if (main_core.Type.isArrayFilled(preset.options.actions)) {
						return Promise.all(preset.options.actions.map(action => {
							if (action.id === 'showTour') {
								const rootWindow = landing_pageobject.PageObject.getRootWindow();
								const guide = new rootWindow.BX.UI.Tour.Guide({
									onEvents: false,
									steps: action.data.steps
								});
								guide.start();
							}
							if (action.id === 'showHelp') {
								if (window.top.BX.Helper) {
									window.top.BX.Helper.show(action.data.href);
								}
							}
							if (action.id === 'check') {
								return crm_form_client.FormClient.getInstance().check({
									templateId: preset.options.id
								}).then(result => {
									if (result.success === false) {
										const checkActionConfirm = this.getCheckActionConfirm();
										checkActionConfirm.setTitle(result.message.title);
										checkActionConfirm.setMessage(result.message.description);
										checkActionConfirm.setOkCaption(result.message.confirmButton);
										checkActionConfirm.setCancelCaption(result.message.cancelButton);
										return new Promise(resolve => {
											checkActionConfirm.setOkCallback(() => {
												checkActionConfirm.getOkButton().setDisabled(false);
												checkActionConfirm.getCancelButton().setDisabled(false);
												checkActionConfirm.close();
												resolve(true);
											});
											checkActionConfirm.setCancelCallback(() => {
												checkActionConfirm.getOkButton().setDisabled(false);
												checkActionConfirm.getCancelButton().setDisabled(false);
												checkActionConfirm.close();
												resolve(false);
											});
											checkActionConfirm.show();
										});
									}
									return Promise.resolve(true);
								});
							}
							return Promise.resolve();
						}));
					}
					return Promise.resolve();
				})();
				if (preset.options.openable) {
					this.showLoader();
					void runAction.then(actions => {
						const actionsResult = (() => {
							if (main_core.Type.isArrayFilled(preset.options.actions)) {
								return preset.options.actions.reduce((acc, item, index) => {
									return {
										...acc,
										[item.id]: actions[index]
									};
								}, {});
							}
							return {};
						})();
						if (Reflect.has(actionsResult, 'check') && actionsResult.check === true || !Reflect.has(actionsResult, 'check')) {
							this.getPresets().forEach(currentPreset => {
								currentPreset.deactivate();
							});
							preset.activate();
							crm_form_client.FormClient.getInstance().prepareOptions(this.getFormOptions(), {
								templateId: preset.options.id
							}).then(result => {
								return landing_backend.Backend.getInstance().action('Form::getCrmFields').then(crmFields => {
									this.setCrmFields(crmFields);
									landing_ui_panel_fieldspanel.FieldsPanel.getInstance().setCrmFields(crmFields);
									return result;
								});
							}).then(result => {
								BX.Landing.UI.Panel.Top.getInstance().setFormName(result.name);
								this.setFormOptions({
									...result,
									templateId: preset.options.id
								});
								this.getCrmForm().adjust(main_core.Runtime.clone(result.data));
								if (this.isFormCreated()) {
									this.onPresetFieldClick();
									this.activatePreset(preset.options.id);
								} else {
									super.applyPreset(preset);
									if (main_core.Type.isArrayFilled(preset.options.expertModeItems)) {
										main_core.Dom.show(this.getExpertSwitcherLayout());
										this.onExpertModeChange();
									} else {
										main_core.Dom.hide(this.getExpertSwitcherLayout());
									}
								}
								this.hideLoader();
							});
						} else {
							this.hideLoader();
							this.enableTransparentMode();
							if (lastPreset) {
								lastPreset.activate();
								preset.deactivate();
							}
						}
					});
				}
			} else {
				if (preset.options.openable) {
					super.applyPreset(preset);
					if (main_core.Type.isArrayFilled(preset.options.expertModeItems)) {
						main_core.Dom.show(this.getExpertSwitcherLayout());
						this.onExpertModeChange();
					} else {
						main_core.Dom.hide(this.getExpertSwitcherLayout());
					}
					this.hideLoader();
				}
				preset.activate();
			}
		}
		getFormNode() {
			return this.cache.remember('formNode', () => {
				return this.getCurrentBlock().node.querySelector('[data-b24form-use-style]');
			});
		}
		useBlockDesign() {
			return this.cache.remember('useBlockDesign', () => {
				return main_core.Text.toBoolean(main_core.Dom.attr(this.getFormNode(), 'data-b24form-use-style'));
			});
		}
		getCurrentCrmEntityName() {
			const {
				scheme
			} = this.getFormOptions().document;
			const schemeItem = this.getFormDictionary().document.schemes.find(item => {
				return String(scheme) === String(item.id);
			});
			return schemeItem.name;
		}
		getNotSynchronizedFields() {
			return crm_form_client.FormClient.getInstance().checkFields(this.getFormOptions()).then(result => {
				return result;
			});
		}
		showSynchronizationPopup(notSynchronizedFields) {
			return new Promise(resolve => {
				const onOk = messageBox => {
					messageBox.close();
					resolve(true);
				};
				const onCancel = messageBox => {
					messageBox.close();
					resolve(false);
				};
				const messageDescription = (() => {
					const entityName = landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_ENTITY_TEMPLATE').replace('{entityName}', main_core.Text.encode(this.getCurrentCrmEntityName()));
					return landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_DESCRIPTION').replace('{entityName}', main_core.Text.encode(entityName));
				})();
				const messageText = (() => {
					const fields = [...notSynchronizedFields].map(field => {
						return landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_FIELD_TEMPLATE').replace('{fieldName}', main_core.Text.encode(field));
					});
					if (notSynchronizedFields.length > 1) {
						const lastField = fields.pop();
						return landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_TEXT').replace('{fieldsList}', fields.join(', ')).replace('{lastField}', lastField);
					}
					return landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_TEXT_1').replace('{field}', fields.join(', '));
				})();
				window.top.BX.UI.Dialogs.MessageBox.confirm(`${messageDescription}<br><br>${messageText}`, landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_TITLE'), onOk, landing_loc.Loc.getMessage('LANDING_SYNCHRONIZATION_POPUP_OK_BUTTON_LABEL'), onCancel, null, true);
			});
		}
		showSynchronizationErrorPopup(errors) {
			const message = errors.reduce((acc, item) => {
				return `${acc}\n\n${item}`;
			}, '');
			window.top.BX.UI.Dialogs.MessageBox.show({
				message,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
				useAirDesign: true
			});
		}
		getErrorAlert() {
			return this.cache.remember('errorAlert', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				return new rootWindow.BX.UI.Dialogs.MessageBox({
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
					okCaption: landing_loc.Loc.getMessage('LANDING_FORM_SAVE_CAPTCHA_ALERT_OK_TEXT'),
					useAirDesign: true,
					popupOptions: {
						maxHeight: 310
					}
				});
			});
		}
		onSaveClick() {
			const dictionary = this.getFormDictionary();
			BX.onCustomEvent(this, 'BX.Landing.Block:onFormSave', [this.getCurrentBlock().id]);
			if (main_core.Type.isPlainObject(dictionary.permissions) && main_core.Type.isPlainObject(dictionary.permissions.tariff) && dictionary.permissions.tariff.restricted === true) {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				rootWindow.BX.UI.InfoHelper.show('limit_crm_webform_edit');
				return;
			}
			if (main_core.Type.isPlainObject(dictionary.permissions) && main_core.Type.isPlainObject(dictionary.permissions.form) && dictionary.permissions.form.edit === false) {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				rootWindow.BX.UI.Dialogs.MessageBox.show({
					message: landing_loc.Loc.getMessage('LANDING_FORM_SAVE_PERMISSION_DENIED'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
					useAirDesign: true
				});
				return;
			}
			main_core.Dom.addClass(this.getSaveButton().layout, 'ui-btn-wait');
			this.getNotSynchronizedFields().then(result => {
				if (main_core.Type.isPlainObject(result.sync)) {
					if (main_core.Type.isArrayFilled(result.sync.errors)) {
						this.showSynchronizationErrorPopup(result.sync.errors);
						return false;
					}
					if (main_core.Type.isArrayFilled(result.sync.fields)) {
						const fieldLabels = result.sync.fields.map(field => {
							return field.label;
						});
						return this.showSynchronizationPopup(fieldLabels);
					}
				}
				return true;
			}).then(isConfirmed => {
				if (isConfirmed) {
					const uri = new main_core.Uri(window.top.location.toString());
					uri.removeQueryParam('formCreated');
					window.top.history.replaceState(null, document.title, uri.toString());
					const initialOptions = this.getInitialFormOptions();
					const currentOptions = this.getFormOptions();
					const options = (() => {
						if (!this.isCrmFormPage()) {
							const clonedOptions = main_core.Runtime.clone(currentOptions);
							clonedOptions.data.design = main_core.Runtime.clone(initialOptions.data.design);
							return clonedOptions;
						}
						return currentOptions;
					})();
					void crm_form_client.FormClient.getInstance().saveOptions(options).then(result => {
						BX.onCustomEvent(this, 'BX.Landing.Block:onAfterFormSave', [this.getCurrentBlock().id]);
						this.setFormOptions(result);
						this.setInitialFormOptions(result);
						crm_form_client.FormClient.getInstance().resetCache(result.id);
						main_core.Dom.removeClass(this.getSaveButton().layout, 'ui-btn-wait');
						const activeButton = this.getSidebarButtons().find(button => {
							return button.isActive();
						});
						return landing_backend.Backend.getInstance().action('Form::getCrmFields').then(crmFields => {
							this.setCrmFields(crmFields);
							landing_ui_panel_fieldspanel.FieldsPanel.getInstance().setCrmFields(crmFields);
							if (activeButton && !main_core.Dom.hasClass(this.layout, 'landing-ui-panel-mode-transparent')) {
								activeButton.getLayout().click();
							}
							return result;
						});
					}).catch(errors => {
						if (main_core.Type.isArrayFilled(errors)) {
							if (this.#isPhoneValidationError(errors)) {
								this.#showPhoneVerifySlider();
							} else {
								const errorMessage = errors.map(item => {
									return main_core.Text.encode(item.message);
								}).join('<br><br>');
								const errorAlert = this.getErrorAlert();
								errorAlert.setMessage(errorMessage);
								errorAlert.show();
							}
						} else {
							const rootWindow = landing_pageobject.PageObject.getRootWindow();
							rootWindow.BX.UI.Dialogs.MessageBox.show({
								message: landing_loc.Loc.getMessage('LANDING_FORM_SAVE_UNKNOWN_ERROR_ALERT_TEXT'),
								title: landing_loc.Loc.getMessage('LANDING_FORM_SAVE_ERROR_ALERT_TITLE'),
								buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
								useAirDesign: true
							});
						}
						main_core.Dom.removeClass(this.getSaveButton().layout, 'ui-btn-wait');
					});
					if (this.useBlockDesign() && this.isCrmFormPage()) {
						this.disableUseBlockDesign();
					}
				} else {
					main_core.Dom.removeClass(this.getSaveButton().layout, 'ui-btn-wait');
				}
			});
		}
		#isPhoneValidationError(errors) {
			return errors.some(error => {
				return error.code === this.#phoneDoesntVerifiedResponseCode;
			});
		}
		#showPhoneVerifySlider() {
			if (typeof bitrix24_phoneverify.PhoneVerify !== 'undefined') {
				bitrix24_phoneverify.PhoneVerify.getInstance().setEntityType(PHONE_VERIFY_FORM_ENTITY).setEntityId(this.getCurrentFormId()).startVerify({
					sliderTitle: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_PHONE_VERIFY_CUSTOM_SLIDER_TITLE'),
					title: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_PHONE_VERIFY_CUSTOM_TITLE'),
					description: landing_loc.Loc.getMessage('LANDING_FORM_EDITOR_PHONE_VERIFY_CUSTOM_DESCRIPTION')
				});
			}
		}
		isChanged() {
			return JSON.stringify(this.getFormOptions()) !== JSON.stringify(this.getInitialFormOptions());
		}
		disableUseBlockDesign() {
			main_core.Dom.attr(this.getFormNode(), 'data-b24form-use-style', 'N');
			this.cache.set('useBlockDesign', false);
			landing_backend.Backend.getInstance().action('Landing\\Block::updateNodes', {
				block: this.getCurrentBlock().id,
				data: {
					'.bitrix24forms': {
						attrs: {
							'data-b24form-use-style': 'N'
						}
					}
				},
				lid: this.getCurrentBlock().lid,
				siteId: this.getCurrentBlock().siteId
			}, {
				code: this.getCurrentBlock().manifest.code
			}).then(result => {
				return landing_history.History.getInstance().push();
			});
		}
		onCancelClick() {
			const initialFormOptions = this.getInitialFormOptions();
			this.getCrmForm().adjust(initialFormOptions.data);
			BX.Landing.UI.Panel.Top.getInstance().setFormName(initialFormOptions.name);
			void this.hide();
		}
		hide() {
			const editorWindow = landing_pageobject.PageObject.getEditorWindow();
			main_core.Dom.removeClass(editorWindow.document.body, 'landing-ui-hide-action-panels-form');
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			main_core.Dom.removeClass(rootWindow.document.body, 'landing-ui-hide-action-panels-form');
			this.enableHistory();
			return super.hide();
		}
		onSidebarButtonClick(event) {
			const target = event.getTarget();
			if (target.options.id === 'design') {
				this.onFormDesignButtonClick();
			} else {
				super.onSidebarButtonClick(event);
			}
		}
	}

	exports.FormSettingsPanel = FormSettingsPanel;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX.Landing.UI.Panel, BX.Landing, BX.Landing, BX, BX.Landing, BX, BX.Crm.Form, BX.UI, BX.Landing, BX.Landing.UI.Panel, BX.UI.Dialogs, BX.UI, BX.Landing.UI.Button, BX.UI.Tour, BX.Landing.UI.Panel, BX.Bitrix24, BX.UI, BX.UI, BX, BX.Landing);
//# sourceMappingURL=formsettingspanel.bundle.js.map
