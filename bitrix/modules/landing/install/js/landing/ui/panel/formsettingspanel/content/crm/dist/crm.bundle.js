/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_loc, ui_buttons, landing_ui_card_headercard, landing_ui_panel_basepresetpanel, landing_ui_field_radiobuttonfield, main_core_events, landing_ui_form_formsettingsform, main_core, ui_dialogs_messagebox, landing_ui_field_basefield, landing_ui_panel_formsettingspanel_content_crm_schememanager) {
	'use strict';

	const fetchId = item => {
		return !main_core.Type.isNil(item.ID) ? item.ID : item.id;
	};
	const fetchName = item => {
		return !main_core.Type.isNil(item.NAME) ? item.NAME : item.name;
	};
	class StageField extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			main_core.Dom.replace(this.input, this.getInner());
		}
		getInner() {
			return this.cache.remember('inner', () => {
				return main_core.Tag.render`
				<div class="landing-ui-field-stages">
					${this.getCategoriesDropdown().getLayout()}
				</div>
			`;
			});
		}
		getCategoriesDropdown() {
			return this.cache.remember('categoriesDropdown', () => {
				return new BX.Landing.UI.Field.Dropdown({
					title: this.options.listTitle || landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CATEGORIES_FIELD_TITLE'),
					content: this.options.value.category,
					items: this.options.categories.map(category => {
						return {
							name: fetchName(category),
							value: fetchId(category)
						};
					}),
					onChange: this.onCategoryChange.bind(this)
				});
			});
		}
		getCurrentCategory() {
			const currentCategoryId = this.getCategoriesDropdown().getValue();
			return this.options.categories.find(category => {
				return String(fetchId(category)) === String(currentCategoryId);
			});
		}
		onCategoryChange() {
			this.emit('onChange');
		}
		getValue() {
			return {
				category: this.getCategoriesDropdown().getValue(),
				stage: ''
			};
		}
		setValue(value, preventEvent = false) {
			this.getCategoriesDropdown().setValue(value.category);
			if (!preventEvent) {
				this.emit('onChange');
			}
		}
	}

	class CrmContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		#schemeManager;
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.CrmContent');
			this.#schemeManager = new landing_ui_panel_formsettingspanel_content_crm_schememanager.SchemeManager([...options.dictionary.document.schemes]);
			this.addItem(this.getHeader());
			this.addItem(this.getTypesField());
			if (this.isDynamicAvailable()) {
				this.addItem(this.getDynamicEntitySettingsForm());
			}
			this.addItem(this.getExpertSettingsForm());
			this.addItem(this.getOrderSettingsForm());
			this.setLastScheme(this.options.formOptions.document.scheme);
			this.setLastDealCategory(this.options.formOptions.document.deal.category);
		}
		isDynamicAvailable() {
			return main_core.Type.isArrayFilled(this.options.dictionary.document.dynamic);
		}
		getHeader() {
			return this.cache.remember('header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TITLE')
				});
			});
		}
		getDuplicatesField() {
			return this.cache.remember('duplicatesField', () => {
				return new BX.Landing.UI.Field.Radio({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DUPLICATES_FIELD_TITLE'),
					selector: 'duplicateMode',
					value: [this.options.formOptions.document.duplicateMode ? this.options.formOptions.document.duplicateMode : 'ALLOW'],
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DUPLICATES_ALLOW'),
						value: 'ALLOW'
					}, {
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DUPLICATES_REPLACE'),
						value: 'REPLACE'
					}, {
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_DUPLICATES_MERGE'),
						value: 'MERGE'
					}]
				});
			});
		}
		getOrderSettingsForm() {
			return this.cache.remember('formSettingsForm', () => {
				const scheme = this.getSchemeById(this.options.formOptions.document.scheme);
				const isOpened = (() => {
					if (scheme && scheme.dynamic === true) {
						return String(scheme.id).endsWith('1');
					}
					return main_core.Text.toNumber(this.options.formOptions.document.scheme) > 4;
				})();
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ORDER_HEADER'),
					toggleable: true,
					opened: isOpened,
					fields: []
				});
			});
		}
		getType1Header() {
			return this.cache.remember('type1header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_1').replace('&nbsp;', ' '),
					level: 2
				});
			});
		}
		getType2Header() {
			return this.cache.remember('type2header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_2').replace('&nbsp;', ' '),
					level: 2
				});
			});
		}
		getType3Header() {
			return this.cache.remember('type3header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_3').replace('&nbsp;', ' '),
					level: 2
				});
			});
		}
		getType4Header() {
			return this.cache.remember('type4header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_4_MSGVER_1').replace('&nbsp;', ' '),
					level: 2
				});
			});
		}
		getType6Header() {
			return this.cache.remember('type6header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_310').replace('&nbsp;', ' '),
					level: 2
				});
			});
		}
		getDynamicHeader(headerText) {
			const header = this.cache.remember('dynamicHeader', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: '',
					level: 2
				});
			});
			if (main_core.Type.isString(headerText)) {
				header.setTitle(headerText);
			}
			return header;
		}
		getDynamicEntitiesField() {
			return this.cache.remember('dynamicEntitiesField', () => {
				const currentScheme = this.getSchemeById(this.options.formOptions.document.scheme);
				return new BX.Landing.UI.Field.Dropdown({
					selector: 'dynamicScheme',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_SMART_ENTITY_LIST'),
					items: this.options.dictionary.document.dynamic.map(scheme => {
						return {
							name: scheme.name,
							value: scheme.id
						};
					}),
					content: currentScheme.mainEntity,
					onChange: () => {
						this.onTypeChange(new main_core_events.BaseEvent({
							data: {
								item: {
									id: this.getSelectedSchemeId()
								}
							}
						}));
					}
				});
			});
		}
		getDynamicEntitySettingsForm() {
			return this.cache.remember('dynamicEntitySettingsForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					opened: true,
					hidden: true,
					fields: [this.getDynamicEntitiesField()]
				});
			});
		}
		getExpertSettingsForm() {
			return this.cache.remember('expertSettingsForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_EXPERT_MODE'),
					toggleable: true,
					toggleableType: landing_ui_form_formsettingsform.FormSettingsForm.ToggleableType.Link,
					opened: false,
					fields: [new landing_ui_card_headercard.HeaderCard({
						title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_1').replace('&nbsp;', ' '),
						level: 2
					}), this.getDuplicatesField()]
				});
			});
		}
		getTypesField() {
			return this.cache.remember('typesField', () => {
				setTimeout(() => {
					this.onTypeChange(new main_core_events.BaseEvent({
						data: {
							item: {
								id: this.options.formOptions.document.scheme
							}
						}
					}));
				});
				const items = [{
					id: '2',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_2'),
					icon: 'landing-ui-crm-entity-type2'
				}, {
					id: '3',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_3'),
					icon: 'landing-ui-crm-entity-type3'
				}, {
					id: '4',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_4_MSGVER_1'),
					icon: 'landing-ui-crm-entity-type4'
				}, {
					id: '310',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_310'),
					icon: 'landing-ui-crm-entity-type310'
				}];
				if (this.isDynamicAvailable()) {
					items.push({
						id: 'smart',
						title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_5'),
						icon: 'landing-ui-crm-entity-type5'
					});
				}
				if (this.options.isLeadEnabled) {
					items.unshift({
						id: '1',
						title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_TYPE_1'),
						icon: 'landing-ui-crm-entity-type1'
					});
				}
				return new landing_ui_field_radiobuttonfield.RadioButtonField({
					selector: 'scheme',
					value: (() => {
						const schemeId = main_core.Text.toNumber(this.options.formOptions.document.scheme);
						if (this.#schemeManager.isDefaultScheme(schemeId) && this.#schemeManager.isInvoice(schemeId)) {
							return this.#schemeManager.getSpecularSchemeId(schemeId);
						}
						if (String(this.options.formOptions.document.scheme) === '310') {
							return 310;
						}
						const scheme = this.getSchemeById(this.options.formOptions.document.scheme);
						if (main_core.Type.isPlainObject(scheme) && scheme.dynamic === true) {
							return 'smart';
						}
						return String(schemeId);
					})(),
					items,
					onChange: this.onTypeChange.bind(this)
				});
			});
		}
		getDealCategoryField() {
			return this.cache.remember('dealCategoryField', () => {
				return new StageField({
					categories: this.options.categories,
					value: {
						category: this.options.formOptions.document.deal.category
					}
				});
			});
		}
		getDynamicCategoriesField(schemeId) {
			return this.cache.remember(`dynamicCategories#${schemeId}`, () => {
				const scheme = this.getDynamicSchemeById(schemeId);
				return new StageField({
					listTitle: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_SMART_STAGES_FIELD_TITLE'),
					categories: scheme.categories,
					value: {
						category: this.options.formOptions.document.dynamic.category
					}
				});
			});
		}
		getDuplicatesEnabledField() {
			return this.cache.remember('duplicatesEnabledField', () => {
				return new BX.Landing.UI.Field.Checkbox({
					selector: 'duplicatesEnabled',
					compact: true,
					value: [this.options.formOptions.document.deal.duplicatesEnabled || 'Y'],
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_CRM_DUPLICATES_ENABLED'),
						value: true
					}]
				});
			});
		}
		#setDuplicatesEnabledFieldDependency() {
			const allowType = 'ALLOW';
			const duplicatesField = this.getDuplicatesField();
			const duplicatesEnabledField = this.getDuplicatesEnabledField();
			const isDuplicatesFieldAllowed = () => {
				return this.getDuplicatesField().getValue()[0] === allowType;
			};
			if (isDuplicatesFieldAllowed()) {
				main_core.Dom.hide(duplicatesEnabledField.layout);
			}
			duplicatesField.subscribe('onchange', () => {
				if (isDuplicatesFieldAllowed()) {
					main_core.Dom.hide(duplicatesEnabledField.layout);
					return;
				}
				main_core.Dom.show(duplicatesEnabledField.layout);
			});
		}
		getSchemeById(id) {
			return this.options.dictionary.document.schemes.find(scheme => {
				return String(scheme.id) === String(id) || id === 'smart' && scheme.dynamic && String(scheme.id) === String(this.getSelectedSchemeId());
			});
		}
		getDynamicSchemeById(id) {
			const {
				mainEntity
			} = this.getSchemeById(id);
			return this.options.dictionary.document.dynamic.find(scheme => {
				return String(scheme.id) === String(mainEntity);
			});
		}
		setLastScheme(schemeId) {
			this.cache.set('lastScheme', schemeId);
		}
		getLastScheme() {
			return this.cache.get('lastScheme');
		}
		setLastDealCategory(categoryId) {
			this.cache.set('lastDealCategory', categoryId);
		}
		getLastDealCategory() {
			return this.cache.get('lastDealCategory', null);
		}
		onTypeChange(event) {
			const {
				item
			} = event.getData();
			const scheme = this.getSchemeById(item.id);
			this.clear();
			this.addItem(this.getHeader());
			this.addItem(this.getTypesField());
			if (this.isDynamicAvailable()) {
				this.addItem(this.getDynamicEntitySettingsForm());
				this.getDynamicEntitySettingsForm().hide();
			}
			const expertSettingsForm = this.getExpertSettingsForm();
			expertSettingsForm.clear();
			if (String(item.id) === '1' || String(item.id) === '8') {
				expertSettingsForm.addField(this.getType1Header());
				expertSettingsForm.addField(this.getDuplicatesField());
			}
			if (String(item.id) === '2' || String(item.id) === '5') {
				expertSettingsForm.addField(this.getType2Header());
				expertSettingsForm.addField(this.getDuplicatesField());
			}
			if (String(item.id) === '3' || String(item.id) === '6') {
				expertSettingsForm.addField(this.getType3Header());
				expertSettingsForm.addField(this.getDealCategoryField());
				expertSettingsForm.addField(this.getDuplicatesField());
				expertSettingsForm.addField(this.getDuplicatesEnabledField());
				this.#setDuplicatesEnabledFieldDependency();
			}
			if (String(item.id) === '4' || String(item.id) === '7') {
				expertSettingsForm.addField(this.getType4Header());
				expertSettingsForm.addField(this.getDuplicatesField());
			}
			if (String(item.id) === '310') {
				expertSettingsForm.addField(this.getType6Header());
				expertSettingsForm.addField(this.getDuplicatesField());
			}
			if (main_core.Text.toNumber(item.id) > 4 && main_core.Type.isPlainObject(scheme) && scheme.dynamic !== true && String(item.id) !== '9' || this.getOrderSettingsForm().isOpened()) {
				this.getOrderSettingsForm().onSwitchChange(true);
			}
			if (main_core.Type.isPlainObject(scheme) && (String(item.id) === 'smart' || scheme.dynamic === true) && this.isDynamicAvailable()) {
				expertSettingsForm.addField(this.getDynamicHeader(scheme.name));
				const dynamicScheme = this.getDynamicSchemeById(scheme.id);
				if (dynamicScheme && dynamicScheme.categories) {
					expertSettingsForm.addField(this.getDynamicCategoriesField(scheme.id));
				}
				expertSettingsForm.addField(this.getDuplicatesField());
				if (String(scheme.id).endsWith('1')) {
					this.getOrderSettingsForm().onSwitchChange(true);
				}
				this.getDynamicEntitySettingsForm().show();
			}
			this.addItem(expertSettingsForm);
			if (String(item.id) !== '310') {
				this.addItem(this.getOrderSettingsForm());
			}
		}
		setAdditionalValue(value) {
			this.cache.set('additionalValue', value);
		}
		getAdditionalValue() {
			return this.cache.get('additionalValue', {});
		}
		getEntityChangeConfirm() {
			return this.cache.remember('entityChangeConfirm', () => {
				return new ui_dialogs_messagebox.MessageBox({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_SCHEME_CHANGE_CONFIRM_TITLE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					useAirDesign: true
				});
			});
		}
		getDealCategoryChangeConfirm() {
			return this.cache.remember('dealCategoryChangeConfirm', () => {
				return new ui_dialogs_messagebox.MessageBox({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_SCHEME_CHANGE_CONFIRM_TITLE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					useAirDesign: true
				});
			});
		}
		getCreateOrderChangeConfirm() {
			return this.cache.remember('createOrderChangeConfirm', () => {
				return new ui_dialogs_messagebox.MessageBox({
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_SCHEME_CREATE_ORDER_CHANGE_CONFIRM_TITLE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					message: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_CREATE_ORDER_MESSAGE_BOX_TITLE_1'),
					useAirDesign: true
				});
			});
		}
		onChange(event) {
			const value = this.getValue();
			const scheme = this.getSchemeById(value.document.scheme);
			if (main_core.Type.isPlainObject(scheme)) {
				const allowedEntities = scheme.entities;
				const removedFields = this.options.formOptions.presetFields.filter(presetField => {
					return !allowedEntities.includes(presetField.entityName);
				}).map(presetField => {
					return this.getCrmFieldById(`${presetField.entityName}_${presetField.fieldName}`);
				});
				if (main_core.Type.isArrayFilled(removedFields)) {
					const itemTemplate = landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_ITEM_TEMPLATE');
					const entityName = main_core.Text.encode(itemTemplate.replace('{text}', scheme.name));
					const messageText = (() => {
						const fields = removedFields.map(field => {
							return itemTemplate.replace('{text}', main_core.Text.encode(field.caption));
						});
						if (removedFields.length > 1) {
							const lastField = fields.pop();
							return landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_SCHEME_CHANGE_CONFIRM_TEXT').replace('{fieldsList}', fields.join(', ')).replace('{lastField}', main_core.Text.encode(lastField)).replaceAll('{entityName}', entityName);
						}
						return landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_SCHEME_CHANGE_CONFIRM_TEXT_1').replace('{fieldName}', fields.join(', ')).replaceAll('{entityName}', entityName);
					})();
					const entityChangeConfirm = this.getEntityChangeConfirm();
					entityChangeConfirm.setOkCallback(() => {
						entityChangeConfirm.close();
						entityChangeConfirm.getOkButton().setDisabled(false);
						entityChangeConfirm.getCancelButton().setDisabled(false);
						const filteredFields = this.options.formOptions.presetFields.filter(presetField => {
							return allowedEntities.includes(presetField.entityName);
						});
						this.setLastScheme(scheme.id);
						this.setAdditionalValue({
							presetFields: filteredFields
						});
						this.options.formOptions.presetFields = filteredFields;
						this.emit('onChange', {
							...event.getData(),
							skipPrepare: true
						});
						this.setAdditionalValue({});
					});
					entityChangeConfirm.setCancelCallback(() => {
						entityChangeConfirm.close();
						entityChangeConfirm.getOkButton().setDisabled(false);
						entityChangeConfirm.getCancelButton().setDisabled(false);
						const lastScheme = this.getSchemeById(this.getLastScheme());
						if (lastScheme.dynamic) {
							this.getTypesField().setValue('smart', true);
							this.getDynamicEntitiesField().setValue(lastScheme.mainEntity, true);
						} else {
							this.getTypesField().setValue(lastScheme.id);
						}
						this.onTypeChange(new main_core_events.BaseEvent({
							data: {
								item: {
									id: lastScheme.id
								}
							}
						}));
					});
					entityChangeConfirm.setMessage(messageText);
					entityChangeConfirm.show();
					return;
				}
				if (String(scheme.id) === '3' || String(scheme.id) === '6') {
					const lastDealCategory = this.getLastDealCategory();
					if (main_core.Text.toNumber(value.document.deal.category) !== main_core.Text.toNumber(lastDealCategory)) {
						const dealStageField = this.options.formOptions.presetFields.find(presetField => {
							return presetField.entityName === 'DEAL' && presetField.fieldName === 'STAGE_ID';
						});
						if (dealStageField) {
							const crmField = this.getCrmFieldById('DEAL_STAGE_ID');
							const dealCategoryChangeConfirm = this.getDealCategoryChangeConfirm();
							const fieldName = landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_ITEM_TEMPLATE').replace('{text}', main_core.Text.encode(crmField.caption));
							const messageText = landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_CATEGORY_CHANGE_CONFIRM_TEXT').replace('{fieldName}', fieldName);
							dealCategoryChangeConfirm.setMessage(messageText);
							dealCategoryChangeConfirm.setOkCallback(() => {
								dealCategoryChangeConfirm.close();
								dealCategoryChangeConfirm.getOkButton().setDisabled(false);
								dealCategoryChangeConfirm.getCancelButton().setDisabled(false);
								const filteredFields = this.options.formOptions.presetFields.filter(presetField => {
									return presetField !== dealStageField;
								});
								this.options.formOptions.presetFields = filteredFields;
								this.setLastDealCategory(value.document.deal.category);
								this.setAdditionalValue({
									presetFields: filteredFields
								});
								this.emit('onChange', {
									...event.getData(),
									skipPrepare: true
								});
								this.setAdditionalValue({});
							});
							dealCategoryChangeConfirm.setCancelCallback(() => {
								dealCategoryChangeConfirm.close();
								dealCategoryChangeConfirm.getOkButton().setDisabled(false);
								dealCategoryChangeConfirm.getCancelButton().setDisabled(false);
								this.getDealCategoryField().setValue({
									category: this.getLastDealCategory()
								});
								this.setAdditionalValue({});
							});
							dealCategoryChangeConfirm.show();
							return;
						}
					}
				}
			}
			if (!this.#schemeManager.isInvoice(scheme.id) && value.document.payment.use) {
				const createOrderMessageBox = this.getCreateOrderChangeConfirm();
				createOrderMessageBox.setButtons([new ui_buttons.Button().setColor(ui_buttons.ButtonColor.PRIMARY).setText(landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_CREATE_ORDER_MESSAGE_BOX_CANCEL')).setNoCaps(true).bindEvent('click', button => {
					createOrderMessageBox.close();
					button.setDisabled(false);
					const orderSettingsSwitch = this.getOrderSettingsForm().getSwitch();
					orderSettingsSwitch.setValue(true);
					orderSettingsSwitch.onChange();
					this.onChange(event);
				}), new ui_buttons.Button().setColor(ui_buttons.ButtonColor.LIGHT).setText(landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_PANEL_CRM_CREATE_ORDER_MESSAGE_BOX_OK')).setNoCaps(true).bindEvent('click', button => {
					createOrderMessageBox.close();
					button.setDisabled(false);
					this.options.formOptions.payment.use = false;
					this.onChange(event);
				})]);
				createOrderMessageBox.show();
			}
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
		getCrmFieldById(id) {
			return Object.values(this.options.crmFields).reduce((acc, category) => {
				return [...acc, ...category.FIELDS];
			}, []).find(currentField => {
				return currentField.name === id;
			});
		}
		getSelectedSchemeId() {
			const typeId = this.getTypesField().getValue();
			if (String(typeId) === 'smart') {
				const entityId = this.getDynamicEntitiesField().getValue();
				if (this.getOrderSettingsForm().isOpened()) {
					return `${entityId}1`;
				}
				return `${entityId}0`;
			}
			return typeId;
		}
		valueReducer(value) {
			const duplicateMode = this.getDuplicatesField().getValue()[0];
			const reducedValue = {
				duplicateMode: duplicateMode === 'ALLOW' ? '' : duplicateMode,
				scheme: this.getSelectedSchemeId(),
				deal: {
					duplicatesEnabled: main_core.Text.toBoolean(this.getDuplicatesEnabledField().getValue()[0])
				},
				payment: {
					use: this.options.formOptions.payment.use,
					payer: this.options.formOptions.payment.payer,
					disabledSystems: this.options.formOptions.payment.disabledSystems
				},
				dynamic: {
					category: null
				}
			};
			if (this.getOrderSettingsForm().isOpened()) {
				if (String(reducedValue.scheme) === '1') {
					reducedValue.scheme = '8';
				}
				if (String(reducedValue.scheme) === '2') {
					reducedValue.scheme = '5';
				}
				if (String(reducedValue.scheme) === '3') {
					reducedValue.scheme = '6';
				}
				if (String(reducedValue.scheme) === '4') {
					reducedValue.scheme = '7';
				}
			}
			if (String(reducedValue.scheme) === '3' || String(reducedValue.scheme) === '6') {
				reducedValue.deal.category = this.getDealCategoryField().getValue().category;
			}
			const scheme = this.getSchemeById(reducedValue.scheme);
			const dynamicScheme = this.getDynamicSchemeById(reducedValue.scheme);
			if (main_core.Type.isPlainObject(scheme) && scheme.dynamic && dynamicScheme && dynamicScheme.categories) {
				reducedValue.dynamic.category = this.getDynamicCategoriesField(scheme.id).getValue().category;
			}
			return {
				document: reducedValue,
				...this.getAdditionalValue()
			};
		}
	}

	exports.Content = CrmContent;
	exports.CrmContent = CrmContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm || {}, BX.Landing, BX.UI, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX.Landing.UI.Field, BX.Event, BX.Landing.UI.Form, BX, BX.UI.Dialogs, BX.Landing.UI.Field, BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm.SchemeManager);
//# sourceMappingURL=crm.bundle.js.map
