/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_ui_panel_content, main_loader, landing_backend, landing_pageobject, landing_ui_button_sidebarbutton, landing_loc, landing_ui_form_formsettingsform, landing_ui_button_basebutton, landing_ui_field_textfield, landing_ui_panel_formsettingspanel, crm_form_client) {
	'use strict';

	/**
	 * @memberOf BX.Landing.UI.Panel
	 */
	class FieldsPanel extends landing_ui_panel_content.Content {
		static staticCache = new main_core.Cache.MemoryCache();
		static isEditorContext() {
			return FieldsPanel.staticCache.remember('isEditorContext', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				const viewContainer = rootWindow.document.body.querySelector('.landing-ui-view');
				return main_core.Type.isDomNode(viewContainer);
			});
		}
		static getRootWindow() {
			return FieldsPanel.staticCache.remember('rootWindow', () => {
				if (FieldsPanel.isEditorContext()) {
					return landing_pageobject.PageObject.getRootWindow();
				}
				return window;
			});
		}
		static getInstance(options) {
			const rootWindow = FieldsPanel.getRootWindow();
			const rootWindowPanel = rootWindow.BX.Landing.UI.Panel.FieldsPanel;
			if (!rootWindowPanel.instance && !FieldsPanel.instance) {
				rootWindowPanel.instance = new FieldsPanel(options);
			}
			const instance = rootWindowPanel.instance || FieldsPanel.instance;
			instance.options = options;
			return instance;
		}
		adjustActionsPanels = false;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Landing.UI.Panel.FieldsPanel');
			this.setLayoutClass('landing-ui-panel-fields');
			this.setOverlayClass('landing-ui-panel-fields-overlay');
			this.setTitle(landing_loc.Loc.getMessage('LANDING_FIELDS_PANEL_TITLE'));
			this.onSaveClick = this.onSaveClick.bind(this);
			this.onCancelClick = this.onCancelClick.bind(this);
			this.options = options;
			this.cache = new main_core.Cache.MemoryCache();
			main_core.Dom.append(this.layout, this.getViewContainer());
			main_core.Dom.append(this.overlay, this.getViewContainer());
			main_core.Dom.insertAfter(this.getSearchContainer(), this.header);
			main_core.Dom.append(this.getCreateFieldLayout(), this.body);
			this.appendFooterButton(new landing_ui_button_basebutton.BaseButton('save_settings', {
				text: landing_loc.Loc.getMessage('LANDING_FIELDS_PANEL_ADD_SELECTED_BUTTON'),
				onClick: this.onSaveClick,
				className: 'landing-ui-button-content-save',
				attrs: {
					title: landing_loc.Loc.getMessage('LANDING_TITLE_OF_SLIDER_SAVE')
				}
			}));
			this.appendFooterButton(new landing_ui_button_basebutton.BaseButton('cancel_settings', {
				text: landing_loc.Loc.getMessage('BLOCK_CANCEL'),
				onClick: this.onCancelClick,
				className: 'landing-ui-button-content-cancel',
				attrs: {
					title: landing_loc.Loc.getMessage('LANDING_TITLE_OF_SLIDER_CANCEL')
				}
			}));
		}
		isMultiple() {
			return this.cache.get('multiple', true);
		}
		setMultiple(mode) {
			this.cache.set('multiple', mode);
		}
		setAllowedTypes(types) {
			this.cache.set('allowedTypes', types);
		}
		getAllowedTypes() {
			return this.cache.get('allowedTypes', []);
		}
		setDisabledFields(fields) {
			this.cache.set('disabledFields', fields);
		}
		getDisabledFields() {
			return this.cache.get('disabledFields', []);
		}
		setAllowedCategories(categories) {
			this.cache.set('allowedCategories', categories);
		}
		getAllowedCategories() {
			return this.cache.get('allowedCategories', []);
		}
		setDisabledCategories(categories) {
			this.cache.set('disabledCategories', categories);
		}
		getDisabledCategories() {
			return this.cache.get('disabledCategories', []);
		}
		resetFactoriesCache() {
			this.cache.keys().forEach(key => {
				if (key.startsWith('userFieldFactory_')) {
					this.cache.delete(key);
				}
			});
		}
		#setShowLock(value) {
			this.cache.set('showLock', value);
		}
		#getShowLock() {
			return this.cache.get('showLock', false);
		}
		setLoadOptions(options) {
			this.cache.set('loadOptions', {
				...options
			});
		}
		getLoadOptions() {
			return this.cache.get('loadOptions', {});
		}
		show(options = {}) {
			if (this.#getShowLock()) {
				return Promise.resolve();
			}
			this.#setShowLock(true);
			this.getSearchField().input.textContent = '';
			this.setMultiple(true);
			this.setAllowedTypes([]);
			this.setDisabledFields([]);
			this.setAllowedCategories([]);
			this.setDisabledCategories([]);
			this.resetFactoriesCache();
			if (main_core.Type.isArrayFilled(options.disabledFields)) {
				this.setDisabledFields(options.disabledFields);
			}
			if (main_core.Type.isArrayFilled(options.allowedCategories)) {
				this.setAllowedCategories(options.allowedCategories);
			}
			if (main_core.Type.isArrayFilled(options.disabledCategories)) {
				this.setDisabledCategories(options.disabledCategories);
			}
			if (main_core.Type.isArrayFilled(options.allowedTypes)) {
				this.setAllowedTypes(options.allowedTypes);
			}
			if (main_core.Type.isBoolean(options.multiple)) {
				this.setMultiple(options.multiple);
			}
			main_core.Dom.style(this.layout, 'position', options.position ?? null);
			const allowedLoadOptions = ['hideVirtual', 'hideRequisites', 'hideSmartDocument', 'presetId'];
			const loadOptions = Object.entries(options).reduce((acc, [key, value]) => {
				if (allowedLoadOptions.includes(key)) {
					acc[key] = value;
				}
				return acc;
			}, {});
			this.setLoadOptions(loadOptions);
			this.showLoader();
			this.load(loadOptions).then(() => {
				this.hideLoader();
				this.clearSidebar();
				Object.entries(this.getCrmFields()).forEach(([categoryId, category]) => {
					if (categoryId !== 'CATALOG' && category !== 'BOOKING' && categoryId !== 'ACTIVITY' && categoryId !== 'INVOICE') {
						if (main_core.Type.isPlainObject(this.options) && main_core.Type.isBoolean(this.options.isLeadEnabled) && !this.options.isLeadEnabled && categoryId === 'LEAD') {
							return;
						}
						const button = new landing_ui_button_sidebarbutton.SidebarButton({
							id: categoryId,
							text: category.CAPTION,
							child: true,
							onClick: () => {
								this.onSidebarButtonClick(button);
							}
						});
						this.appendSidebarButton(button);
					}
				});
			}).then(() => {
				const filteredFieldsTree = this.getFilteredFieldsTree();
				const categories = Object.keys(filteredFieldsTree);
				this.sidebarButtons.forEach(button => {
					button.deactivate();
					if (categories.includes(button.id)) {
						main_core.Dom.show(button.getLayout());
					} else {
						main_core.Dom.hide(button.getLayout());
					}
				});
				if (this.sidebarButtons.length > 0) {
					this.resetState();
					const firstShowedButton = this.sidebarButtons.find(button => {
						return button.getLayout().hidden !== true;
					});
					if (firstShowedButton) {
						firstShowedButton.getLayout().click();
					}
				}
			});
			main_core.Dom.append(this.overlay, this.layout.parentElement);
			super.show(options).then(() => {
				this.#setShowLock(false);
				this.getSearchField().enableEdit();
				this.getSearchField().input.focus();
			});
			return new Promise(resolve => {
				this.promiseResolver = resolve;
			});
		}
		#setHideLock(value) {
			this.cache.set('hideLock', value);
		}
		#getHideLock() {
			return this.cache.get('hideLock', false);
		}
		hide() {
			this.setCrmFields(this.getOriginalCrmFields());
			return super.hide();
		}
		onSaveClick() {
			const selectedFields = Object.values(this.getState()).reduce((acc, fields) => {
				return [...acc, ...fields];
			}, []);
			this.promiseResolver(selectedFields);
			void this.hide();
			this.resetState();
		}
		onCancelClick() {
			void this.hide();
			this.resetState();
		}
		getViewContainer() {
			return this.cache.remember('viewContainer', () => {
				if (FieldsPanel.isEditorContext()) {
					const rootWindow = FieldsPanel.getRootWindow();
					return rootWindow.document.querySelector('.landing-ui-view-container');
				}
				return document.body;
			});
		}
		getLoader() {
			return this.cache.remember('loader', () => {
				return new main_loader.Loader({
					target: this.body
				});
			});
		}
		showLoader() {
			this.hideCreateFieldButton();
			void this.getLoader().show();
		}
		hideLoader() {
			this.showCreateFieldButton();
			void this.getLoader().hide();
		}
		setHideVirtual(value) {
			this.cache.set('hideVirtual', value);
		}
		getHideVirtual() {
			return this.cache.get('hideVirtual', null);
		}
		setHideRequisites(value) {
			this.cache.set('hideRequisites', value);
		}
		getHideRequisites() {
			return this.cache.get('hideRequisites', null);
		}
		setHideSmartDocuments(value) {
			this.cache.set('hideSmartDocument', value);
		}
		getHideSmartDocuments() {
			return this.cache.get('hideSmartDocument', true);
		}
		load(options = {}) {
			return landing_backend.Backend.getInstance().action('Form::getCrmFields', {
				options
			}).then(result => {
				this.setOriginalCrmFields(result);
				this.setCrmFields(result);
				if (FieldsPanel.isEditorContext()) {
					Object.assign(landing_ui_panel_formsettingspanel.FormSettingsPanel.getInstance().getCrmFields(), result);
				}
				return crm_form_client.FormClient.getInstance().getDictionary().then(dictionary => {
					this.setFormDictionary(dictionary);
				});
			});
		}
		setFormDictionary(dictionary) {
			this.cache.set('formDictionary', dictionary);
		}
		getFormDictionary() {
			return this.cache.get('formDictionary', {});
		}
		setOriginalCrmFields(fields) {
			this.cache.set('originalFields', fields);
		}
		getOriginalCrmFields() {
			return this.cache.get('originalFields') || {};
		}
		setCrmFields(fields) {
			this.cache.set('fields', fields);
		}
		getCrmFields() {
			return this.cache.get('fields') || {};
		}
		setState(state) {
			this.cache.set('state', state);
		}
		getState() {
			return this.cache.get('state') || {};
		}
		resetState() {
			this.cache.delete('state');
		}
		onSidebarButtonClick(button) {
			const activeButton = this.sidebarButtons.getActive();
			if (activeButton) {
				activeButton.deactivate();
			}
			button.activate();
			const activatedCategoryId = button.id;
			if (this.shouldHideCreateButton(activatedCategoryId)) {
				this.hideCreateFieldButton();
			} else {
				this.showCreateFieldButton();
			}
			const crmFields = this.getCrmFields();
			if (Reflect.has(crmFields, button.id)) {
				this.clearContent();
				const form = this.createFieldsListForm(button.id);
				this.appendForm(form);
			}
		}
		shouldHideCreateButton(activatedCategoryId) {
			const categoriesWithoutCreateButton = ['BOOKING'];
			const hideCreateButtonForCategory = categoriesWithoutCreateButton.includes(activatedCategoryId);
			if (hideCreateButtonForCategory) {
				return true;
			}
			const hideCreateButton = this.getAllowedTypes().every(type => {
				return main_core.Type.isPlainObject(type);
			});
			return main_core.Type.isArrayFilled(this.getAllowedTypes()) && hideCreateButton;
		}
		getFilteredFieldsTree() {
			const searchString = String(this.getSearchField().getValue()).toLowerCase().trim();
			const allowedCategories = this.getAllowedCategories();
			const disabledCategories = this.getDisabledCategories();
			const allowedTypes = this.getAllowedTypes();
			return Object.entries(this.getCrmFields()).reduce((acc, [categoryId, category]) => {
				if (categoryId !== 'CATALOG' && categoryId !== 'ACTIVITY' && categoryId !== 'INVOICE' && (!main_core.Type.isArrayFilled(allowedCategories) || allowedCategories.includes(categoryId)) && !disabledCategories.includes(categoryId)) {
					const filteredFields = category.FIELDS.filter(field => {
						if (field.name === 'CONTACT_ORIGIN_VERSION' || field.name === 'CONTACT_LINK') {
							return false;
						}
						const fieldCaption = String(field.caption).toLowerCase().trim();
						if (main_core.Type.isArrayFilled(allowedTypes)) {
							const isTypeAllowed = allowedTypes.some(allowedType => {
								if (!main_core.Type.isPlainObject(allowedType)) {
									allowedType = {
										type: allowedType
									};
								}
								if (allowedType.entityFieldName && allowedType.entityFieldName !== field.entity_field_name) {
									return false;
								}
								if (main_core.Type.isBoolean(allowedType.multiple) && allowedType.multiple !== field.multiple) {
									return false;
								}
								return field.type === allowedType.type;
							});
							if (!isTypeAllowed) {
								return false;
							}
						}
						return !main_core.Type.isStringFilled(searchString) || fieldCaption.includes(searchString);
					});
					if (main_core.Type.isArrayFilled(filteredFields)) {
						acc[categoryId] = {
							...category,
							FIELDS: filteredFields
						};
					}
				}
				return acc;
			}, {});
		}
		createFieldsListForm(category) {
			const fieldsListTree = this.getFilteredFieldsTree();
			const disabledFields = this.getDisabledFields();
			const fieldOptions = {
				items: fieldsListTree[category].FIELDS.map(field => {
					return {
						name: field.caption,
						value: field.name,
						disabled: main_core.Type.isArrayFilled(disabledFields) && disabledFields.includes(field.name)
					};
				}),
				value: this.getState()[category] || [],
				onValueChange: checkbox => {
					const state = {
						...this.getState()
					};
					state[category] = checkbox.getValue();
					this.setState(state);
				}
			};
			return new landing_ui_form_formsettingsform.FormSettingsForm({
				fields: [this.isMultiple() ? new BX.Landing.UI.Field.Checkbox(fieldOptions) : new BX.Landing.UI.Field.Radio(fieldOptions)]
			});
		}
		onSearchChange() {
			const filteredFieldsTree = this.getFilteredFieldsTree();
			const categories = Object.keys(filteredFieldsTree);
			this.sidebarButtons.forEach(button => {
				button.deactivate();
				if (categories.includes(button.id)) {
					main_core.Dom.show(button.getLayout());
				} else {
					main_core.Dom.hide(button.getLayout());
				}
			});
			this.clearContent();
			const [firstCategory] = categories;
			if (firstCategory) {
				const firstCategoryButton = this.sidebarButtons.get(firstCategory);
				if (firstCategoryButton) {
					firstCategoryButton.activate();
				}
				const form = this.createFieldsListForm(firstCategory);
				this.showCreateFieldButton();
				this.appendForm(form);
			} else {
				this.hideCreateFieldButton();
			}
		}
		getSearchField() {
			return this.cache.remember('searchField', () => {
				const rootWindow = FieldsPanel.getRootWindow();
				return new rootWindow.BX.Landing.UI.Field.Text({
					selector: 'search',
					textOnly: true,
					placeholder: landing_loc.Loc.getMessage('LANDING_FIELDS_PANEL_SEARCH'),
					onChange: this.onSearchChange.bind(this)
				});
			});
		}
		getSearchContainer() {
			return this.cache.remember('searchLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-panel-content-element landing-ui-panel-content-search">
					${this.getSearchField().getLayout()}
					<div class="landing-ui-panel-content-search-icon"></div>
				</div>
			`;
			});
		}
		getUserFieldFactory(entityId) {
			const factory = this.cache.remember(`userFieldFactory_${entityId}`, () => {
				const rootWindow = window.top;
				const preparedEntityId = (() => {
					if (entityId.startsWith('DYNAMIC_')) {
						return this.getCrmFields()[entityId].DYNAMIC_ID;
					}
					return `CRM_${entityId}`;
				})();
				const Factory = (() => {
					if (rootWindow.BX.UI.UserFieldFactory) {
						return rootWindow.BX.UI.UserFieldFactory.Factory;
					}
					return BX.UI.UserFieldFactory.Factory;
				})();
				return new Factory(preparedEntityId, {
					moduleId: 'crm',
					bindElement: this.getCreateFieldButton()
				});
			});
			if (main_core.Type.isArrayFilled(this.getAllowedTypes())) {
				factory.types = factory.types.filter(type => {
					return this.getAllowedTypes().includes(type.name);
				});
			} else {
				factory.types = factory.types.filter(type => {
					return type.name !== 'employee';
				});
			}
			return factory;
		}
		onCreateFieldClick(event) {
			event.preventDefault();
			const dictionary = this.getFormDictionary();
			if (main_core.Type.isPlainObject(dictionary.permissions) && main_core.Type.isPlainObject(dictionary.permissions.userField) && dictionary.permissions.userField.add === false) {
				const rootWindow = FieldsPanel.getRootWindow();
				rootWindow.BX.UI.Dialogs.MessageBox.show({
					message: landing_loc.Loc.getMessage('LANDING_FORM_ADD_USER_FIELD_PERMISSION_DENIED'),
					buttons: rootWindow.BX.UI.Dialogs.MessageBoxButtons.OK,
					useAirDesign: true
				});
				return;
			}
			const activeButton = this.sidebarButtons.getActive();
			const currentCategoryId = activeButton.id;
			const factory = this.getUserFieldFactory(currentCategoryId);
			const menu = factory.getMenu();
			menu.open(type => {
				const configurator = factory.getConfigurator({
					userField: factory.createUserField(type),
					onSave: userField => {
						userField.save().then(() => {
							return this.load(this.getLoadOptions());
						}).then(() => {
							this.getSearchField().setValue(userField.getData().editFormLabel[landing_loc.Loc.getMessage('LANGUAGE_ID')]);
							this.showCreateFieldButton();
						});
					},
					onCancel: () => {
						this.showCreateFieldButton();
						this.sidebarButtons.getActive().getLayout().click();
					}
				});
				this.clearContent();
				main_core.Dom.append(configurator.render(), this.content);
				this.hideCreateFieldButton();
			});
			main_core.Dom.style(menu.getPopup().getPopupContainer(), 'z-index', 9999);
		}
		getCreateFieldButton() {
			return this.cache.remember('getCreateFieldButton', () => {
				return main_core.Tag.render`
				<div
					class="landing-ui-panel-content-create-field-button"
					onclick="${this.onCreateFieldClick.bind(this)}"
				>
					${landing_loc.Loc.getMessage('LANDING_FIELDS_PANEL_CREATE_FIELD')}
				</div>
			`;
			});
		}
		getCreateFieldLayout() {
			return this.cache.remember('createFieldLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-panel-content-create-field">
					${this.getCreateFieldButton()}
				</div>
			`;
			});
		}
		isUserFieldEditorShowed() {
			return main_core.Type.isDomNode(this.content.querySelector('.ui-userfieldfactory-configurator'));
		}
		showCreateFieldButton() {
			main_core.Dom.append(this.getCreateFieldLayout(), this.body);
		}
		hideCreateFieldButton() {
			main_core.Dom.remove(this.getCreateFieldLayout(), this.body);
		}
	}

	exports.FieldsPanel = FieldsPanel;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX.Landing.UI.Panel, BX, BX.Landing, BX.Landing, BX.Landing.UI.Button, BX.Landing, BX.Landing.UI.Form, BX.Landing.UI.Button, BX.Landing.UI.Field, BX.Landing.UI.Panel, BX.Crm.Form);
//# sourceMappingURL=fieldspanel.bundle.js.map
