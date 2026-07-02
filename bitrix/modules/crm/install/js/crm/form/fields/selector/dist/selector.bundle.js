/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Form = this.BX.Crm.Form || {};
(function (exports, main_core_events, main_core, ui_sidepanel_layout, ui_userfieldfactory, ui_buttons) {
	'use strict';

	class Backend extends main_core_events.EventEmitter {
		constructor(options) {
			super();
			this.setEventNamespace('BX.Crm.Form.Fields.Selector.Backend');
			this.subscribeFromOptions(options.events);
		}
		#request(requestOptions) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction(`crm.api.form.fields.selector.${requestOptions.action}`, {
					json: requestOptions.data
				}).then(resolve).catch(reject);
			});
		}
		getData(requestOptions = {}) {
			return this.#request({
				action: 'getData',
				data: requestOptions
			});
		}
	}

	class Search extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Crm.Form.Fields.Selector.Search');
			this.subscribeFromOptions(options.events);
			this.#setOptions(options);
		}
		#setOptions(options) {
			this.#cache.set('options', {
				...options
			});
		}
		#getOptions() {
			return this.#cache.get('options', {});
		}
		#onInput() {
			this.emit('onChange', {
				value: this.#getInput().value
			});
			this.#getDebounceWrapper()();
		}
		#getDebounceWrapper() {
			return this.#cache.remember('debounceWrapper', () => {
				return main_core.Runtime.debounce(() => {
					this.emit('onDebouncedChange', {
						value: this.#getInput().value
					});
				}, 50);
			});
		}
		#getInput() {
			return this.#cache.remember('input', () => {
				const initialValue = (() => {
					if (main_core.Type.isStringFilled(this.#getOptions().initialValue)) {
						return this.#getOptions().initialValue;
					}
					return '';
				})();
				return main_core.Tag.render`
				<input 
					type="text" 
					class="ui-ctl-element" 
					oninput="${this.#onInput.bind(this)}"
					value="${main_core.Text.encode(initialValue)}"
					placeholder="${main_core.Loc.getMessage('CRM_FORM_FIELDS_SELECTOR_SEARCH_PLACEHOLDER')}"
				>
			`;
			});
		}
		getValue() {
			return this.#getInput().value;
		}
		#onClearClick(event) {
			event.preventDefault();
			this.#getInput().value = '';
			this.#onInput();
		}
		setValue(value) {
			this.#getInput().value = value;
			this.#onInput();
		}
		#getClearButton() {
			return this.#cache.remember('clearButton', () => {
				return main_core.Tag.render`
				<button 
					class="ui-ctl-after ui-ctl-icon-clear" 
					onclick="${this.#onClearClick.bind(this)}"
				></button>
			`;
			});
		}
		getLayout() {
			return this.#cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="crm-form-fields-selector-search">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-before-icon ui-ctl-after-icon">
						<div class="ui-ctl-before ui-ctl-icon-search"></div>
						${this.#getClearButton()}
						${this.#getInput()}
					</div>
				</div>
			`;
			});
		}
	}

	class ListItem extends main_core_events.EventEmitter {
		static Type = {
			CHECKBOX: 'checkbox',
			RADIO: 'radio'
		};
		#cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Crm.Form.Field.Selector.ListItem');
			this.subscribeFromOptions(options.events);
			this.#setOptions(options);
			const {
				targetContainer
			} = options;
			if (main_core.Type.isDomNode(targetContainer)) {
				this.renderTo(targetContainer);
			}
		}
		#setOptions(options) {
			this.#cache.set('options', {
				type: ListItem.Type.CHECKBOX,
				...options
			});
		}
		#getOptions() {
			return this.#cache.get('options', {});
		}
		getField() {
			return this.#getOptions().field;
		}
		#onChange() {
			this.emit('onChange');
		}
		#getCheckbox() {
			return this.#cache.remember('checkbox', () => {
				return main_core.Tag.render`
				<input 
					type="${main_core.Text.encode(this.#getOptions().type)}" 
					class="ui-ctl-element"
					onchange="${this.#onChange.bind(this)}"
					name="CRM_FIELDS_SELECTOR_ITEM"
					${this.#getOptions().selected ? 'checked' : ''}
				>
			`;
			});
		}
		isSelected() {
			return this.#getCheckbox().checked;
		}
		#isDisabled() {
			return this.#getOptions().disabled ?? false;
		}
		getLayout() {
			return this.#cache.remember(`layout`, () => {
				const fieldDisabledClassName = 'crm-form-fields-selector-field--disabled';
				return main_core.Tag.render`
				<div class="crm-form-fields-selector-field${this.#isDisabled() ? " " + fieldDisabledClassName : ''}">
					<label class="ui-ctl ui-ctl-checkbox crm-form-fields-selector-field-checkbox">
						${this.#getCheckbox()}
						<div class="ui-ctl-label-text">${main_core.Text.encode(this.#getOptions().field.caption)}</div>
					</label>
				</div>
			`;
			});
		}
		renderTo(targetContainer) {
			if (main_core.Type.isDomNode(targetContainer)) {
				main_core.Dom.append(this.getLayout(), targetContainer);
			}
		}
	}

	/**
	 * @memberOf BX.Crm.Form.Fields
	 */
	class Selector extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		static #defaultFilter = {
			'-categories': ['CATALOG', 'ACTIVITY', 'INVOICE'],
			'-fields': [{
				name: 'CONTACT_ORIGIN_VERSION'
			}, {
				name: 'CONTACT_LINK'
			}]
		};
		static #defaultFieldsFactoryFilter = {
			'-types': ['employee', 'datetime']
		};
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Crm.Form.Fields.Selector');
			this.subscribeFromOptions(options.events);
			this.#setOptions(options);
		}
		#setOptions(options) {
			this.#cache.set('options', {
				filter: {},
				multiple: true,
				...options
			});
		}
		#getOptions() {
			return main_core.Runtime.clone(this.#cache.get('options', {
				filter: {}
			}));
		}
		#getBackend() {
			return this.#cache.remember('backend', () => {
				return new Backend({
					events: {
						onError: this.#onBackendError.bind(this)
					}
				});
			});
		}
		#setFieldsList(fieldsList) {
			this.#cache.set('fieldsList', {
				...fieldsList
			});
		}
		#applyCategoriesFilter(fieldsList, filter) {
			const fieldsEntries = Object.entries(fieldsList);
			return fieldsEntries.reduce((acc, [categoryId, category]) => {
				if ((!main_core.Type.isArrayFilled(filter['+categories']) || filter['+categories'].includes(categoryId)) && (!main_core.Type.isArrayFilled(filter['-categories']) || !filter['-categories'].includes(categoryId))) {
					acc[categoryId] = category;
				}
				return acc;
			}, {});
		}
		#applyFieldsFilter(fieldsList, filter) {
			const fieldsEntries = Object.entries(fieldsList);
			return fieldsEntries.reduce((acc, [categoryId, category]) => {
				const filteredFields = category.FIELDS.filter(field => {
					const allowed = !main_core.Type.isArrayFilled(filter['+fields']) || filter['+fields'].some(condition => {
						if (main_core.Type.isStringFilled(condition)) {
							return field.type === condition;
						}
						if (main_core.Type.isFunction(condition)) {
							return condition(field);
						}
						if (main_core.Type.isPlainObject(condition)) {
							return Object.entries(condition).every(([key, value]) => {
								return field[key] === value;
							});
						}
						return false;
					});
					const disallowed = main_core.Type.isArrayFilled(filter['-fields']) && filter['-fields'].some(condition => {
						if (main_core.Type.isStringFilled(condition)) {
							return field.type === condition;
						}
						if (main_core.Type.isFunction(condition)) {
							return condition(field);
						}
						if (main_core.Type.isPlainObject(condition)) {
							return Object.entries(condition).every(([key, value]) => {
								return field[key] === value;
							});
						}
						return false;
					});
					return allowed && !disallowed;
				});
				if (main_core.Type.isArrayFilled(filteredFields)) {
					acc[categoryId] = {
						...category,
						FIELDS: filteredFields
					};
				}
				return acc;
			}, {});
		}
		#applySearchFilter(fieldsList, query) {
			const fieldsEntries = Object.entries(fieldsList);
			if (main_core.Type.isStringFilled(query)) {
				const preparedQuery = String(query).toLowerCase();
				return fieldsEntries.reduce((acc, [categoryId, category]) => {
					const filteredFields = category.FIELDS.filter(field => {
						return main_core.Type.isStringFilled(field.caption) && String(field.caption).toLowerCase().includes(preparedQuery);
					});
					if (main_core.Type.isArrayFilled(filteredFields)) {
						acc[categoryId] = {
							...category,
							FIELDS: filteredFields
						};
					}
					return acc;
				}, {});
			}
			return fieldsList;
		}
		getFieldsList() {
			const fieldsList = this.#cache.get('fieldsList', {});
			const filter = this.#getFilter();
			if (main_core.Type.isPlainObject(filter)) {
				const query = this.#getSearch().getValue();
				return this.#applySearchFilter(this.#applyFieldsFilter(this.#applyCategoriesFilter(fieldsList, filter), filter), query);
			}
			if (main_core.Type.isFunction(filter)) {
				const defaultFilter = main_core.Runtime.clone(Selector.#defaultFilter);
				if (!this.#isLeadEnabled()) {
					defaultFilter['-categories'].push('LEAD');
				}
				const prefilteredFieldsList = this.#applyFieldsFilter(this.#applyCategoriesFilter(fieldsList, defaultFilter), filter);
				return filter(main_core.Runtime.clone(prefilteredFieldsList));
			}
			return fieldsList;
		}
		#load() {
			const {
				controllerOptions = {}
			} = this.#getOptions();
			return this.#getBackend().getData({
				options: controllerOptions
			}).then(({
				data
			}) => {
				this.#setFieldsList(data.fields);
				this.#setIsLeadEnabled(data.options.isLeadEnabled);
				this.#setIsAllowedCreateField(data.options.permissions.userField.add);
			});
		}
		#setIsLeadEnabled(value) {
			this.#cache.set('isLeadEnabled', value);
		}
		#isLeadEnabled() {
			return this.#cache.get('isLeadEnabled');
		}
		#setIsAllowedCreateField(value) {
			this.#cache.set('isAllowedCreateField', value);
		}
		#isAllowedCreateField() {
			return this.#cache.get('isAllowedCreateField', false);
		}
		#getSidebarItems() {
			return Object.entries(this.getFieldsList()).map(([categoryId, category]) => {
				return {
					label: category.CAPTION,
					id: categoryId,
					onclick: this.#onSidebarItemClick.bind(this, categoryId)
				};
			});
		}
		#getFilter() {
			const customFilter = this.#getOptions().filter;
			if (main_core.Type.isPlainObject(customFilter)) {
				const defaultFilter = Selector.#defaultFilter;
				if (main_core.Type.isArray(customFilter['-categories'])) {
					customFilter['-categories'] = [...customFilter['-categories'], ...defaultFilter['-categories']];
				} else {
					customFilter['-categories'] = [...defaultFilter['-categories']];
				}
				if (!this.#isLeadEnabled()) {
					customFilter['-categories'].push('LEAD');
				}
				if (main_core.Type.isArray(customFilter['-fields'])) {
					customFilter['-fields'] = [...customFilter['-fields'], ...defaultFilter['-fields']];
				} else {
					customFilter['-fields'] = [...defaultFilter['-fields']];
				}
			}
			return customFilter;
		}
		#cleanFieldsList() {
			main_core.Dom.clean(this.#getFieldsListLayout());
		}
		#getSelectedFields() {
			return this.#cache.get('selectedFields', []);
		}
		#addSelectedField(field) {
			const selectedFields = this.#getSelectedFields();
			const hasField = selectedFields.some(currentField => {
				return currentField.name === field.name;
			});
			if (!hasField) {
				selectedFields.push(field);
				this.#setSelectedFields(selectedFields);
			}
		}
		#removeSelectedField(field) {
			const selectedFields = this.#getSelectedFields().filter(currentField => {
				return currentField.name !== field.name;
			});
			this.#setSelectedFields(selectedFields);
		}
		#setSelectedFields(fields) {
			this.#cache.set('selectedFields', fields);
		}
		#isMultiple() {
			return this.#getOptions().multiple;
		}
		#renderCategoryFields(categoryId) {
			this.#cleanFieldsList();
			const fields = this.getFieldsList()[categoryId].FIELDS;
			if (main_core.Type.isArrayFilled(fields)) {
				fields.forEach(field => {
					void new ListItem({
						field,
						targetContainer: this.#getFieldsListLayout(),
						events: {
							onChange: this.#onListItemChange.bind(this)
						},
						selected: this.#getSelectedFields().some(selectedField => {
							return selectedField.name === field.name;
						}),
						type: this.#isMultiple() ? ListItem.Type.CHECKBOX : ListItem.Type.RADIO,
						disabled: this.#isFieldDisabled(field)
					});
				});
			}
		}
		#getDisabledFields() {
			return this.#getOptions().disabledFields ?? null;
		}
		#isFieldDisabled(field) {
			const disabledFields = this.#getDisabledFields();
			if (main_core.Type.isNull(disabledFields)) {
				return false;
			}
			return disabledFields.some(fieldRule => main_core.Type.isString(fieldRule) && field.name === fieldRule || main_core.Type.isFunction(fieldRule) && fieldRule(field));
		}
		#onListItemChange(event) {
			const listItem = event.getTarget();
			if (this.#isMultiple()) {
				if (listItem.isSelected()) {
					this.#addSelectedField(listItem.getField());
				} else {
					this.#removeSelectedField(listItem.getField());
				}
			} else {
				this.#setSelectedFields([listItem.getField()]);
			}
		}
		#onSidebarItemClick(categoryId) {
			this.#renderCategoryFields(categoryId);
		}
		#onBackendError(error) {
			console.error(error);
			this.emit('onError', {
				error
			});
		}
		#getLayout() {
			return main_core.Tag.render`
			<div class="crm-form-fields-selector">
				${this.#getFieldsListLayout()}
			</div>
		`;
		}
		async #onSearchChange() {
			const sliderLayout = await this.#getSliderLayout();
			const sidebarItems = this.#getSidebarItems();
			sliderLayout.getMenu().setItems(sidebarItems);
			this.#cleanFieldsList();
			const [firstSidebarItem] = sidebarItems;
			if (firstSidebarItem) {
				this.#onSidebarItemClick(firstSidebarItem.id);
				sliderLayout.getMenu().setActiveFirstItem();
				if (this.#isAllowedCreateField()) {
					this.#getCreateFieldButton().setDisabled(false);
				}
			} else {
				if (this.#isAllowedCreateField()) {
					this.#getCreateFieldButton().setDisabled(true);
				}
			}
		}
		#getSearch() {
			return this.#cache.remember('search', () => {
				return new Search({
					events: {
						onChange: this.#onSearchChange.bind(this)
					}
				});
			});
		}
		#getFieldsListLayout() {
			return this.#cache.remember('fieldsListLayout', () => {
				return main_core.Tag.render`
				<div class="crm-form-fields-selector-fields-list"></div>
			`;
			});
		}
		#getCreateFieldButton() {
			return this.#cache.remember('createFieldButton', () => {
				return new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_FORM_FIELDS_SELECTOR_CREATE_BUTTON_LABEL'),
					color: ui_buttons.Button.Color.SUCCESS,
					onclick: this.#onCreateFieldClick.bind(this)
				});
			});
		}
		async #onCreateFieldClick() {
			const sliderLayout = await this.#getSliderLayout();
			const sliderMenu = sliderLayout.getMenu();
			if (sliderMenu.hasActive()) {
				const currentCategoryId = sliderMenu.getActiveItem().getId();
				const factory = this.#getUserFieldFactory(currentCategoryId);
				const menu = factory.getMenu();
				menu.open(selectedType => {
					const configurator = factory.getConfigurator({
						userField: factory.createUserField(selectedType),
						onSave: userField => {
							main_core.Dom.addClass(configurator.saveButton, 'ui-btn-wait');
							return userField.save().then(() => {
								return this.#load();
							}).then(() => {
								main_core.Dom.removeClass(configurator.saveButton, 'ui-btn-wait');
								this.#onSidebarItemClick(currentCategoryId);
								this.#getSearch().setValue(userField.getData().editFormLabel[main_core.Loc.getMessage('LANGUAGE_ID')]);
							});
						},
						onCancel: () => {
							this.#onSidebarItemClick(currentCategoryId);
						}
					});
					this.#cleanFieldsList();
					main_core.Dom.append(configurator.render(), this.#getFieldsListLayout());
				});
			}
		}
		#getPreparedCategoryId(categoryId) {
			if (categoryId.startsWith('DYNAMIC_')) {
				const fieldsList = this.getFieldsList();
				if (main_core.Type.isPlainObject(fieldsList[categoryId])) {
					return fieldsList[categoryId].DYNAMIC_ID;
				}
			}
			return `CRM_${categoryId}`;
		}
		#getFieldsFactoryTypesFilter() {
			const defaultFilter = main_core.Runtime.clone(Selector.#defaultFieldsFactoryFilter);
			const customFilter = this.#getOptions()?.fieldsFactory?.filter;
			if (main_core.Type.isPlainObject(customFilter)) {
				if (main_core.Type.isArrayFilled(customFilter['-types'])) {
					customFilter['-types'] = [...defaultFilter['-types'], ...customFilter['-types']];
				} else {
					customFilter['-types'] = [...defaultFilter['-types']];
				}
				return customFilter;
			}
			if (main_core.Type.isFunction(customFilter)) {
				return customFilter;
			}
			return defaultFilter;
		}
		#applyFieldsFactoryTypesFilter(types, filter) {
			if (main_core.Type.isPlainObject(filter)) {
				return types.filter(type => {
					const allowed = !main_core.Type.isArrayFilled(filter['+types']) || filter['+types'].some(condition => {
						if (main_core.Type.isStringFilled(condition)) {
							return type.name === condition;
						}
						if (main_core.Type.isFunction(condition)) {
							return condition(type);
						}
						return false;
					});
					const disallowed = main_core.Type.isArrayFilled(filter['-types']) && filter['-types'].some(condition => {
						if (main_core.Type.isStringFilled(condition)) {
							return type.name === condition;
						}
						if (main_core.Type.isFunction(condition)) {
							return condition(type);
						}
						return false;
					});
					return allowed && !disallowed;
				});
			}
			return types;
		}
		#getUserFieldFactory(categoryId) {
			return this.#cache.remember(`factory_${categoryId}`, () => {
				const rootWindow = window.top;
				const Factory = (() => {
					if (rootWindow.BX.UI.UserFieldFactory) {
						return rootWindow.BX.UI.UserFieldFactory.Factory;
					}
					return BX.UI.UserFieldFactory.Factory;
				})();
				const factory = new Factory(this.#getPreparedCategoryId(categoryId), {
					moduleId: 'crm',
					bindElement: this.#getCreateFieldButton().render()
				});
				const filter = this.#getFieldsFactoryTypesFilter();
				if (main_core.Type.isFunction(filter)) {
					factory.types = this.#applyFieldsFactoryTypesFilter(factory.types, Selector.#defaultFieldsFactoryFilter);
					factory.types = filter(factory.types);
				}
				if (main_core.Type.isPlainObject(filter)) {
					factory.types = this.#applyFieldsFactoryTypesFilter(factory.types, filter);
				}
				return factory;
			});
		}
		#getSliderLayout() {
			return this.#cache.remember('sliderLayout', () => {
				return new Promise(resolve => {
					ui_sidepanel_layout.Layout.createLayout({
						extensions: ['crm.form.fields.selector'],
						title: main_core.Loc.getMessage('CRM_FORM_FIELDS_SELECTOR_SLIDER_TITLE'),
						content: () => {
							return this.#getLayout();
						},
						menu: {
							items: this.#getSidebarItems()
						},
						toolbar: () => {
							return [this.#getSearch().getLayout(), this.#getCreateFieldButton()];
						},
						buttons: ({
							SaveButton,
							closeButton
						}) => {
							return [new SaveButton({
								text: main_core.Loc.getMessage('CRM_FORM_FIELDS_SELECTOR_APPLY_BUTTON_LABEL'),
								onclick: this.#onSaveClick.bind(this)
							}), closeButton];
						}
					}).then(result => {
						resolve(result);
					});
				});
			});
		}
		#getRenderedSliderLayout() {
			return this.#cache.remember('renderedSliderLayout', () => {
				return this.#getSliderLayout().then(layout => {
					return layout.render();
				});
			});
		}
		#onSaveClick() {
			const selectedFields = this.#getSelectedFields();
			const result = (() => {
				const {
					resultModifier
				} = this.#getOptions();
				if (main_core.Type.isFunction(resultModifier)) {
					return resultModifier(selectedFields);
				}
				return selectedFields.map(field => {
					return field.name;
				});
			})();
			this.#getPromiseResolver()(result);
			this.hide();
		}
		#setPromiseResolver(resolver) {
			this.#cache.set('promiseResolver', resolver);
		}
		#getPromiseResolver() {
			return this.#cache.get('promiseResolver', () => {});
		}
		#selectFirstCategory() {
			const [firstSidebarItem] = this.#getSidebarItems();
			if (main_core.Type.isPlainObject(firstSidebarItem)) {
				this.#onSidebarItemClick(firstSidebarItem.id);
			}
		}
		hide() {
			const SidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (SidePanel.Instance) {
				SidePanel.Instance.close();
			}
		}
		#getSliderId() {
			return this.#cache.remember('sliderId', () => {
				return `crm.form.fields.selector-${main_core.Text.getRandom()}`;
			});
		}
		show() {
			const SidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (SidePanel.Instance) {
				const createFieldButton = this.#getCreateFieldButton();
				createFieldButton.setDisabled(!this.#isAllowedCreateField());
				SidePanel.Instance.open(this.#getSliderId(), {
					width: 740,
					contentCallback: () => {
						return this.#load().then(() => {
							createFieldButton.setDisabled(!this.#isAllowedCreateField());
							this.#selectFirstCategory();
							return this.#getRenderedSliderLayout();
						}).catch(({
							errors
						}) => {
							return main_core.Tag.render`
									<div class="ui-alert ui-alert-danger">
										<span class="ui-alert-message">${errors.map(item => main_core.Text.encode(item.message)).join('\n')}</span>
									</div>
								`;
						});
					},
					events: {
						onCloseComplete: () => this.#onSliderCloseComplete()
					}
				});
			}
			return new Promise(resolve => {
				this.#setPromiseResolver(resolve);
			});
		}
		#onSliderCloseComplete() {
			this.emit('onSliderCloseComplete');
			this.#setSelectedFields([]);
		}
	}

	exports.Selector = Selector;

})(this.BX.Crm.Form.Fields = this.BX.Crm.Form.Fields || {}, BX.Event, BX, BX.UI.SidePanel, BX.UI.UserFieldFactory, BX.UI);
//# sourceMappingURL=selector.bundle.js.map
