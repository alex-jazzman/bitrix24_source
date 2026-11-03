/* eslint-disable */
(function (main_core_events, main_core, ui_alerts, ui_formElements_view, ui_section, ai_ui_field_selectorfield, ui_formElements_field) {
	'use strict';

	class ScenarioDisableTracker {
		#baseline;
		#pending = null;
		constructor(baseline = {}) {
			this.#baseline = ScenarioDisableTracker.#normalizeBaseline(baseline);
		}
		prepare(aiData = {}) {
			const submitted = {
				...this.#baseline
			};
			const data = main_core.Type.isPlainObject(aiData) ? aiData : {};
			Object.keys(this.#baseline).forEach(code => {
				if (data[code] === 'Y' || data[code] === 'N') {
					submitted[code] = data[code] === 'Y';
				}
			});
			const disabledCodes = Object.keys(this.#baseline).filter(code => this.#baseline[code] && !submitted[code]).sort();
			this.#pending = {
				submitted,
				disabledCodes
			};
		}
		commit() {
			if (!this.#pending) {
				return [];
			}
			const {
				submitted,
				disabledCodes
			} = this.#pending;
			this.#pending = null;
			this.#baseline = submitted;
			return disabledCodes;
		}
		rollback() {
			this.#pending = null;
		}
		static #normalizeBaseline(baseline) {
			const normalized = {};
			Object.entries(baseline).forEach(([code, value]) => {
				if (main_core.Type.isBoolean(value)) {
					normalized[code] = value;
				}
			});
			return normalized;
		}
	}

	const BEFORE_SAVE_EVENT = 'BX.Intranet.Settings:onBeforeSave';
	const SUCCESS_SAVE_EVENT = 'BX.Intranet.Settings:onSuccessSave';
	const FAILED_SAVE_EVENT = 'BX.UI.FormElement.Field:onFailedSave';
	class ScenarioDisableFeedback {
		#settings;
		constructor(settings) {
			this.#settings = {
				enabled: settings?.enabled === true,
				idPrefix: main_core.Type.isString(settings?.idPrefix) ? settings.idPrefix : '',
				forms: main_core.Type.isArray(settings?.forms) ? settings.forms : []
			};
		}
		async open(disabledCodes) {
			if (!this.#settings.enabled || this.#settings.idPrefix === '' || this.#settings.forms.length === 0 || disabledCodes.length === 0) {
				return;
			}
			try {
				const {
					Form
				} = await main_core.Runtime.loadExtension('ui.feedback.form');
				if (!main_core.Type.isFunction(Form?.open)) {
					return;
				}
				Form.open({
					id: `${this.#settings.idPrefix}-${main_core.Text.getRandom(8)}`,
					forms: this.#settings.forms,
					presets: {
						from_domain: window.location.hostname,
						switcher_type: disabledCodes.join(',')
					}
				});
			} catch {
				// Feedback is optional and must not affect a completed settings save.
			}
		}
	}
	function createScenarioDisableFeedbackLifecycle(feedback, eventEmitter = main_core_events.EventEmitter) {
		let tracker = null;
		let isBound = false;
		const handleBeforeSave = event => {
			const eventData = event?.getData();
			tracker?.prepare(eventData?.data?.ai ?? {});
		};
		const handleSuccessSave = () => {
			const disabledCodes = tracker?.commit() ?? [];
			void feedback.open(disabledCodes);
		};
		const handleFailedSave = () => {
			tracker?.rollback();
		};
		return {
			setTracker(newTracker) {
				tracker = newTracker;
			},
			bind() {
				if (isBound) {
					return;
				}
				isBound = true;
				eventEmitter.subscribe(eventEmitter.GLOBAL_TARGET, BEFORE_SAVE_EVENT, handleBeforeSave);
				eventEmitter.subscribe(eventEmitter.GLOBAL_TARGET, SUCCESS_SAVE_EVENT, handleSuccessSave);
				eventEmitter.subscribe(FAILED_SAVE_EVENT, handleFailedSave);
			}
		};
	}

	class AiPage extends ui_formElements_field.BaseSettingsPage {
		static #groupIconDefaultSet = 'ui.icon-set.main';
		static #groupIconDefaultIcon = '--copilot-ai';
		titlePage = '';
		descriptionPage = '';
		#itemRelations = [];
		#itemFields = {};
		#onSaveCheckers = [];
		#agreementCheckers = [];
		#isAgreementAccepted = false;
		#isSwitcherProgrammaticChange = false;
		#scenarioBooleanValues = {};
		#scenarioDisableFeedbackLifecycle;
		constructor() {
			super();
			const extensionSettings = main_core.Extension.getSettings('ai.integration.intranet-settings');
			const copilotName = extensionSettings.copilotName;
			this.#scenarioDisableFeedbackLifecycle = createScenarioDisableFeedbackLifecycle(new ScenarioDisableFeedback(extensionSettings.scenarioDisableFeedback));
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_AI_MSGVER_1', {
				'#COPILOT_NAME#': copilotName
			});
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_AI_DESC_MSGVER_1', {
				'#COPILOT_NAME#': copilotName
			});
		}
		getType() {
			return 'ai';
		}
		appendSections(contentNode) {
			this.#scenarioBooleanValues = {};
			const groups = this.getValue('fields');
			if (groups) {
				this.isOpen = true;
				for (const groupCode in groups) {
					const section = this.#buildGroup(groups[groupCode]);
					if (this.isOpen === true) {
						this.isOpen = false;
					}
					if (section) {
						section.renderTo(contentNode);
					}
					if (groups[groupCode].relations) {
						groups[groupCode].relations.forEach(relation => {
							this.#itemRelations.push(relation);
						});
					}
				}
			}
			this.#scenarioDisableFeedbackLifecycle.setTracker(new ScenarioDisableTracker(this.#scenarioBooleanValues));
			this.#scenarioDisableFeedbackLifecycle.bind();
			this.#bindEvents();
		}
		#buildGroup(group) {
			if (!group.items) {
				return;
			}
			const items = Object.values(group.items);
			if (items.length <= 0) {
				return;
			}
			const {
				title,
				helpdesk,
				icon
			} = group;
			main_core.Runtime.loadExtension(icon.set ?? AiPage.#groupIconDefaultSet);
			const section = new ui_formElements_field.SettingsSection({
				parent: this,
				section: {
					title,
					titleIconClasses: `ui-icon-set ${icon.code ?? AiPage.#groupIconDefaultIcon}`,
					isOpen: this.isOpen
				}
			});
			if (group.description) {
				let description = group.description;
				if (helpdesk) {
					const helpdeskCode = `redirect=detail&code=${helpdesk}`;
					description += ' <a href="javascript: void();"' + ` onclick="BX.PreventDefault(); top.BX.Helper.show('${helpdeskCode}');"` + `>${main_core.Loc.getMessage('INTRANET_SETTINGS_HELPDESK_LINK')}</a>`;
				}
				section.getSectionView().append(new ui_section.Row({
					content: new ui_alerts.Alert({
						row: {
							separator: 'null'
						},
						text: description,
						inline: true,
						size: ui_alerts.AlertSize.SMALL,
						color: ui_alerts.AlertColor.PRIMARY
					}).getContainer()
				}).render());
			}
			items.forEach(item => {
				const row = this.#buildItem(item);
				if (row.getChildrenElements().length > 0) {
					row.setParentElement(section);
				}
			});
			return section;
		}
		#buildItem({
			code,
			header,
			onSave,
			options,
			recommended,
			restriction,
			title,
			type,
			value
		}) {
			const withOnSave = onSave && onSave.switcher;
			const row = new ui_formElements_field.SettingsRow({
				row: {
					className: withOnSave ? '--with-on-save' : ''
				}
			});
			let field = null;
			if (type === 'boolean') {
				const checkerOptions = {
					title,
					inputName: code,
					checked: value,
					hintOn: header,
					hintOff: header
				};
				if (restriction) {
					checkerOptions.isEnable = false;
					checkerOptions.checked = false;
					const messageNode = main_core.Tag.render`<span>${restriction.helpMessage}</span>`;
					checkerOptions.helpMessageProvider = this.helpMessageProviderFactory(messageNode);
					checkerOptions.bannerCode = restriction.bannerCode;
				}
				field = new ui_formElements_view.Checker(checkerOptions);
				this.#scenarioBooleanValues[code] = field.isChecked();
				if (!restriction) {
					this.#agreementCheckers.push(field);
				}
			} else if (type === 'list' && options && value) {
				const items = [];
				const additionalItems = [];
				for (const option in options) {
					if (main_core.Type.isString(options[option])) {
						items.push({
							name: options[option],
							value: option,
							selected: option === value
						});
					} else if (main_core.Type.isPlainObject(options[option])) {
						additionalItems.push(options[option]);
					}
				}
				if (items.length > 0) {
					field = new ai_ui_field_selectorfield.SelectorField({
						inputName: code,
						label: title,
						name: code,
						items,
						additionalItems,
						recommendedItems: recommended,
						current: value
					});
				}
			}
			if (field) {
				this.#addField(code, field, row);
			}
			if (withOnSave) {
				const onSaveField = new ui_formElements_view.Checker({
					inputName: `${code}_onsave`,
					title: onSave.switcher,
					checked: false,
					size: 'extra-small',
					noMarginBottom: true
				});
				this.#addField(code, onSaveField, row);
				this.#onSaveCheckers.push(onSaveField);
			}
			return row;
		}
		#addField(code, field, row) {
			row.addChild(new ui_formElements_field.SettingsField({
				fieldView: field
			}));
			this.#itemFields[code] = {
				code,
				field,
				row
			};
		}
		#setCheckerState(checker, isChecked) {
			this.#isSwitcherProgrammaticChange = true;
			checker.switcher?.check(isChecked);
			this.#isSwitcherProgrammaticChange = false;
		}
		#showBitrixGptAgreementPopup(checker) {
			main_core.Runtime.loadExtension('ai.bitrixgpt-agreement-popup').then(({
				showBitrixGptAgreementPopup
			}) => main_core.ajax.runAction('ai.bitrixgptagreement.getPopupData').then(response => {
				const data = response?.data;
				if (!main_core.Type.isPlainObject(data) || !main_core.Type.isNumber(data.attempt)) {
					this.#isAgreementAccepted = true;
					return;
				}
				this.#setCheckerState(checker, false);
				showBitrixGptAgreementPopup({
					...data,
					useQueue: false,
					showSkip: false,
					messages: {
						accept: main_core.Loc.getMessage('INTRANET_SETTINGS_AI_ENABLE_BUTTON')
					},
					onAccept: () => {
						this.#isAgreementAccepted = true;
						this.#setCheckerState(checker, true);
					},
					onDecline: () => {
						this.#setCheckerState(checker, false);
					}
				});
			}));
		}
		#bindEvents() {
			if (this.#agreementCheckers.length > 0) {
				this.#agreementCheckers.forEach(checker => {
					main_core_events.EventEmitter.subscribe(checker, 'change', event => {
						if (this.#isSwitcherProgrammaticChange || this.#isAgreementAccepted || event.getData() !== true) {
							return;
						}
						this.#showBitrixGptAgreementPopup(checker);
					});
				});
			}
			if (this.#onSaveCheckers.length > 0) {
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onBeforeSave', () => {
					this.#onSaveCheckers.forEach(field => {
						field.switcher?.check(false, false);
					});
				});
			}
			if (this.#itemRelations.length > 0) {
				this.#itemRelations.forEach(relation => {
					const parent = this.#itemFields[relation.parent];
					if (parent && parent.field && parent.field instanceof ui_formElements_view.Checker) {
						if (!parent.field.isChecked()) {
							relation.children.forEach(child => {
								const node = this.#itemFields[child]?.row?.getRowView();
								if (node) {
									node.hide();
								}
							});
						}
						main_core_events.EventEmitter.subscribe(parent.field, 'change', event => {
							const isActive = event.getData();
							relation.children.forEach(child => {
								const node = this.#itemFields[child]?.row?.getRowView();
								if (node) {
									isActive ? node.show() : node.hide();
								}
							});
						});
					}
				});
			}
		}
	}

	main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onExternalPageLoaded:ai', () => new AiPage());

})(BX.Event, BX, BX.UI, BX.UI.FormElements, BX.UI, BX.AI.UI.Field, BX.UI.FormElements);
//# sourceMappingURL=index.bundle.js.map
