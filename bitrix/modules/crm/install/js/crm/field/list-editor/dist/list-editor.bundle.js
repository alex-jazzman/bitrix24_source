/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core_events, main_core, ui_notification, ui_draganddrop_draggable, ui_sidepanel_layout, ui_buttons, main_loader, ui_forms, _ui_layoutForm, crm_form_fields_selector) {
	'use strict';

	const {
		MemoryCache: MemoryCache$2
	} = main_core.Cache;
	class Item extends main_core_events.EventEmitter {
		#cache = new MemoryCache$2();
		constructor(options) {
			super();
			this.setEventNamespace('BX.Crm.Field.ListEditor.Item');
			this.subscribeFromOptions(options.events);
			this.setOptions(options);
			this.onFormChange = this.onFormChange.bind(this);
		}
		setOptions(options) {
			this.#cache.set('options', {
				...options
			});
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		getCustomTitleLayout() {
			return this.#cache.remember('customTitleLayout', () => {
				return this.getLayout().querySelector('.crm-field-list-editor-item-text-custom-title');
			});
		}
		getLayout() {
			return this.#cache.remember('layout', () => {
				const {
					data,
					categoryCaption
				} = this.getOptions();
				const {
					sourceData
				} = this.getOptions();
				const label = data.label || sourceData.caption;
				const preparedCategoryCaption = (() => {
					if (main_core.Type.isStringFilled(categoryCaption)) {
						return `&middot; ${main_core.Text.encode(categoryCaption)}`;
					}
					return '';
				})();
				return main_core.Tag.render`
				<div class="crm-field-list-editor-item" data-name="${main_core.Text.encode(sourceData?.name || '')}">
					<div class="crm-field-list-editor-item-header">
						<div class="crm-field-list-editor-item-drag-button"></div>
						<div class="crm-field-list-editor-item-text">
							<div class="crm-field-list-editor-item-text-source-title">
								<span class="crm-field-list-editor-item-text-source-title-inner">${main_core.Text.encode(sourceData?.caption || '')}</span>
								<span class="crm-field-list-editor-item-text-source-title-inner">${preparedCategoryCaption}</span>
							</div>
							<div class="crm-field-list-editor-item-text-custom-title">
								<div class="crm-field-list-editor-item-text-custom-title-inner">${main_core.Text.encode(label)}</div>
							</div>
						</div>
						<div class="crm-field-list-editor-item-actions">
							<div 
								class="crm-field-list-editor-item-button-edit"
								onclick="${this.onEditClick.bind(this)}"
							></div>
							<div 
								class="crm-field-list-editor-item-button-remove"
								onclick="${this.onRemoveClick.bind(this)}"
							></div>
						</div>
					</div>
					<div class="crm-field-list-editor-item-body">
						${this.getFormLayout()}
					</div>
				</div>
			`;
			});
		}
		onEditClick(event) {
			event.preventDefault();
			if (!this.isOpened()) {
				this.open();
			} else {
				this.close();
			}
		}
		onRemoveClick(event) {
			event.preventDefault();
			this.emit('onRemove');
		}
		open() {
			main_core.Dom.addClass(this.getLayout(), 'crm-field-list-editor-item-opened');
		}
		isOpened() {
			return main_core.Dom.hasClass(this.getLayout(), 'crm-field-list-editor-item-opened');
		}
		close() {
			main_core.Dom.removeClass(this.getLayout(), 'crm-field-list-editor-item-opened');
		}
		createTextInput(options) {
			return main_core.Tag.render`
			<div class="ui-form-row crm-field-list-editor-item-form-text-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">${options.label}</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							type="text"
							name="${options.name}"
							value="${options.value}"
							oninput="${this.onFormChange}"
							class="ui-ctl-element">	
					</div>	
				</div>
			</div>
		`;
		}
		createCheckbox(options) {
			return main_core.Tag.render`
			<div class="ui-form-row crm-field-list-editor-item-form-checkbox-row">
				<div class="ui-form-content">
					<label class="ui-ctl ui-ctl-checkbox">
						<input 
							type="checkbox" 
							name="${options.name}"
							class="ui-ctl-element"
							onchange="${this.onFormChange}"
							${options.checked ? 'checked' : ''}
						>
						<div class="ui-ctl-label-text">${options.label}</div>
					</label>	
				</div>
			</div>
		`;
		}
		getAllInputs() {
			return [...this.getLayout().querySelectorAll('.ui-ctl-element')];
		}
		getValue() {
			return this.getAllInputs().reduce((acc, input) => {
				acc[input.name] = input.type === 'checkbox' ? input.checked : input.value;
				return acc;
			}, {
				...this.getOptions().data
			});
		}
		onFormChange() {
			const value = this.getValue();
			this.getCustomTitleLayout().textContent = value.caption || value.label;
			this.emit('onChange');
		}
		getFormControls() {
			return this.#cache.remember('formControls', () => {
				const editableEntries = Object.entries(this.getOptions().editable);
				const {
					data
				} = this.getOptions();
				return editableEntries.map(([name, options]) => {
					if (options.type === 'string') {
						return this.createTextInput({
							name,
							label: options.label,
							value: data[name]
						});
					}
					return this.createCheckbox({
						name,
						label: options.label,
						checked: data[name]
					});
				});
			});
		}
		getFormLayout() {
			return this.#cache.remember('formLayout', () => {
				return main_core.Tag.render`
				<div class="crm-field-list-editor-item-form">
					<div class="ui-form">
						${this.getFormControls()}
					</div>
				</div>
			`;
			});
		}
	}

	const {
		MemoryCache: MemoryCache$1
	} = main_core.Cache;
	class Backend {
		static #instance = null;
		#cache = new MemoryCache$1();
		static getInstance() {
			if (!Backend.#instance) {
				Backend.#instance = new Backend();
			}
			return Backend.#instance;
		}
		getFieldsList(presetId) {
			return this.#cache.remember('fieldsList', () => {
				return new Promise((resolve, reject) => {
					main_core.ajax.runAction('crm.api.form.field.list', {
						json: {
							presetId
						}
					}).then(result => {
						if (main_core.Type.isPlainObject(result?.data?.tree)) {
							resolve(result.data.tree);
						} else {
							reject(result);
						}
					}).catch(error => {
						reject(error);
					});
				});
			});
		}
		getFieldsSet(id) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.api.fieldset.get', {
					json: {
						id
					}
				}).then(result => {
					if (main_core.Type.isPlainObject(result?.data)) {
						resolve(result.data);
					} else {
						reject(result);
					}
				}).catch(error => {
					reject(error);
				});
			});
		}
		saveFieldsSet(options) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.api.fieldset.set', {
					json: {
						options
					}
				}).then(result => {
					if (main_core.Type.isPlainObject(result?.data)) {
						resolve(result);
					} else {
						reject(result);
					}
				}).catch(error => {
					reject(error);
				});
			});
		}
	}

	const {
		MemoryCache
	} = main_core.Cache;

	/**
	 * @memberOf BX.Crm.Field
	 */
	class ListEditor extends main_core_events.EventEmitter {
		#cache = new MemoryCache();
		#loadPromise;
		static #defaultOptions = {
			setId: 0,
			autoSave: true,
			cacheable: true,
			fieldsPanelOptions: {},
			debouncingDelay: 500
		};
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Crm.Field.ListEditor');
			this.subscribeFromOptions(options.events);
			this.setTitle(options.title || '');
			this.onWindowResize = this.onWindowResize.bind(this);
			this.setOptions({
				...ListEditor.#defaultOptions,
				...options
			});
			this.onDebounceChange = main_core.Runtime.debounce(this.onDebounceChange, this.getOptions().debouncingDelay, this);
			this.draggable = new ui_draganddrop_draggable.Draggable({
				container: this.getListContainer(),
				draggable: '.crm-field-list-editor-item',
				dragElement: '.crm-field-list-editor-item-drag-button',
				offset: {
					x: -800
				},
				context: window.top
			});
			this.draggable.subscribe('end', this.onSortEnd.bind(this));
			this.showLoader();
			this.#loadPromise = Promise.all([this.loadFieldsDictionary(), this.loadValue()]).then(([fieldsDictionary, value]) => {
				if (main_core.Type.isPlainObject(fieldsDictionary)) {
					this.setFieldsDictionary(fieldsDictionary);
				} else {
					console.error('BX.Crm.Field.ListEditor: Invalid fields dictionary');
				}
				if (main_core.Type.isPlainObject(value)) {
					this.setClientEntityTypeId(value.clientEntityTypeId);
					this.setEntityTypeId(value.entityTypeId);
					if (main_core.Type.isStringFilled(value.title) && !main_core.Type.isStringFilled(this.getTitle())) {
						this.setTitle(value.title);
					}
					if (main_core.Type.isArrayFilled(value.fields)) {
						value.fields.forEach(itemData => {
							this.addItem({
								sourceData: this.getFieldByName(itemData.name),
								data: itemData
							});
						});
					}
				} else {
					console.error('BX.Crm.Field.ListEditor: Invalid value');
				}
				this.hideLoader();
			});
		}
		setData(data) {
			this.#cache.set('data', {
				...data
			});
		}
		getData() {
			return this.#cache.get('data', {});
		}
		setTitle(title) {
			this.#cache.set('title', title);
		}
		getTitle() {
			return this.#cache.get('title', '');
		}
		setClientEntityTypeId(clientEntityTypeId) {
			this.#cache.set('clientEntityTypeId', clientEntityTypeId);
		}
		getClientEntityTypeId() {
			return this.#cache.get('clientEntityTypeId');
		}
		setEntityTypeId(entityTypeId) {
			this.#cache.set('entityTypeId', entityTypeId);
		}
		getEntityTypeId() {
			return this.#cache.get('entityTypeId');
		}
		getLoader() {
			return this.#cache.remember('loader', () => {
				return new main_loader.Loader({
					target: this.getLayout()
				});
			});
		}
		showLoader() {
			main_core.Dom.addClass(this.getLayout(), 'crm-field-list-editor-state-load');
			void this.getLoader().show();
		}
		hideLoader() {
			main_core.Dom.removeClass(this.getLayout(), 'crm-field-list-editor-state-load');
			void this.getLoader().hide();
		}
		setOptions(options) {
			this.#cache.set('options', {
				...options
			});
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		setFieldsDictionary(fields) {
			this.#cache.set('fieldsDictionary', fields);
		}
		getFieldsDictionary() {
			return this.#cache.get('fieldsDictionary', []);
		}
		getListContainer() {
			return this.#cache.remember('listContainer', () => {
				return main_core.Tag.render`
				<div class="crm-field-list-editor-list"></div>
			`;
			});
		}
		getLayout() {
			return this.#cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="crm-field-list-editor">
					${this.getListContainer()}
					<div class="crm-field-list-editor-footer">
						<span 
							class="ui-link ui-link-dashed"
							onclick="${this.onAddFieldClick.bind(this)}"
						>
							${main_core.Loc.getMessage('CRM_FIELD_LIST_EDITOR_ADD_FIELD_BUTTON_LABEL')}
						</span>
					</div>
				</div>
			`;
			});
		}
		renderTo(target) {
			if (!main_core.Type.isDomNode(target)) {
				console.error('target is not a DOM element');
			}
			main_core.Dom.append(this.getLayout(), target);
		}
		loadFieldsDictionary() {
			const fieldsPanelOptions = {
				...this.getOptions().fieldsPanelOptions,
				disabledFields: this.getValue().map(field => {
					return field.name;
				})
			};
			return Backend.getInstance().getFieldsList(fieldsPanelOptions?.presetId || null);
		}
		loadValue() {
			return Backend.getInstance().getFieldsSet(this.getOptions().setId).then(result => {
				return result.options;
			});
		}
		getItems() {
			return this.#cache.remember('items', []);
		}
		setItems(items) {
			this.#cache.set('items', items);
		}
		addItem(options) {
			const items = this.getItems();
			const hasItem = items.some(item => {
				return item.getOptions().data.name === options.data.name;
			});
			if (!hasItem) {
				const item = new Item({
					...options,
					categoryCaption: this.getCategoryCaption(options.data.name),
					editable: this.getOptions().editable,
					events: {
						onChange: () => {
							this.onChange();
						},
						onRemove: this.onRemoveItemClick.bind(this)
					}
				});
				items.push(item);
				main_core.Dom.append(item.getLayout(), this.getListContainer());
			}
		}
		onRemoveItemClick(event) {
			const target = event.getTarget();
			main_core.Dom.remove(target.getLayout());
			this.setItems(this.getItems().filter(item => {
				return item !== target;
			}));
			this.onChange();
		}
		getFieldByName(name) {
			const fieldsDictionary = this.getFieldsDictionary();
			return Object.values(fieldsDictionary).reduce((acc, category) => {
				if (!acc) {
					return category.FIELDS.find(field => {
						return field.name === name;
					});
				}
				return acc;
			}, null);
		}
		getCategoryCaption(fieldName) {
			const fieldsDictionary = this.getFieldsDictionary();
			return Object.values(fieldsDictionary).reduce((acc, category) => {
				if (!acc) {
					const hasField = category.FIELDS.some(field => {
						return field.name === fieldName;
					});
					if (hasField) {
						return category.CAPTION;
					}
				}
				return acc;
			}, '');
		}
		onAddFieldClick(event) {
			event.preventDefault();
			const fieldsPanelOptions = {
				...this.getOptions().fieldsPanelOptions,
				disabledFields: this.getValue().map(field => {
					return field.name;
				})
			};
			const selector = new crm_form_fields_selector.Selector(fieldsPanelOptions);
			selector.show().then(result => {
				this.setFieldsDictionary(selector.getFieldsList());
				return result;
			}).then(result => {
				result.forEach(fieldName => {
					const fieldData = this.getFieldByName(fieldName);
					if (!main_core.Type.isString(fieldData.label) && main_core.Type.isString(fieldData.caption)) {
						fieldData.label = fieldData.caption;
					}
					this.addItem({
						sourceData: fieldData,
						data: fieldData
					});
					this.onChange();
				});
			});
		}
		onChange() {
			this.emit('onChange');
			this.onDebounceChange();
		}
		onDebounceChange() {
			if (this.getOptions().autoSave) {
				void this.save();
			}
			this.emit('onDebounceChange');
		}
		save() {
			const fieldsPanelOptions = {
				...this.getOptions().fieldsPanelOptions,
				disabledFields: this.getValue().map(field => {
					return field.name;
				})
			};
			return Backend.getInstance().saveFieldsSet({
				id: this.getOptions().setId,
				presetId: fieldsPanelOptions?.presetId || null,
				entityTypeId: this.getEntityTypeId(),
				clientEntityTypeId: this.getClientEntityTypeId(),
				...this.getData(),
				fields: this.getValue()
			}).then(() => {
				this.emit('onSave');
			});
		}
		getValue() {
			return this.getItems().map(item => {
				return item.getValue();
			});
		}
		#adjustSliderDragAndDropOffsets() {
			const sliderLayout = this.getLayout().closest('.ui-sidepanel-layout');
			if (main_core.Type.isDomNode(sliderLayout)) {
				const offsetLeft = -sliderLayout.getBoundingClientRect().left;
				this.draggable.setOptions({
					...this.draggable.getOptions(),
					offset: {
						x: offsetLeft
					}
				});
			}
		}
		onWindowResize() {
			this.#adjustSliderDragAndDropOffsets();
		}
		showSlider() {
			const buttons = [];
			if (!this.getOptions().autoSave) {
				buttons.push(new ui_buttons.SaveButton({
					onclick: button => {
						button.setWaiting(true);
						this.save().then(() => {
							button.setWaiting(false);
							BX.SidePanel.Instance.close();
						}).catch(data => {
							top.BX.UI.Notification.Center.notify({
								content: data.errors.map(item => main_core.Text.encode(item.message)).join('\n'),
								autoHide: false
							});
							button.setWaiting(false);
						});
					}
				}));
			}
			BX.SidePanel.Instance.open('crm:field-list-editor', {
				width: 600,
				cacheable: this.getOptions().cacheable,
				contentCallback: () => {
					return this.#loadPromise.then(() => ui_sidepanel_layout.Layout.createContent({
						extensions: ['crm.field.list-editor'],
						title: this.getTitle(),
						content: () => this.getLayout(),
						buttons: ({
							cancelButton
						}) => {
							return [...buttons, cancelButton];
						}
					})).catch(({
						errors
					}) => ui_sidepanel_layout.Layout.createContent({
						extensions: ['ui.sidepanel-content'],
						design: {
							section: false
						},
						content: () => {
							const title = main_core.Loc.getMessage('CRM_FIELD_LIST_EDITOR_ERROR_IN_LOAD');
							const msg = ((errors || [])[0] || {}).message || 'Unknown error';
							return main_core.Tag.render`
								<div class="ui-slider-no-access">
									<div class="ui-slider-no-access-inner">
										<div class="ui-slider-no-access-title">${main_core.Text.encode(title)}</div>
										<div class="ui-slider-no-access-subtitle">${main_core.Text.encode(msg)}</div>
										<div class="ui-slider-no-access-img">
											<div class="ui-slider-no-access-img-inner"></div>
										</div>
									</div>
								</div>
							`;
						},
						buttons: ({
							closeButton
						}) => {
							return [closeButton];
						}
					}));
				},
				events: {
					onOpenComplete: () => {
						const timeoutId = setTimeout(() => {
							clearTimeout(timeoutId);
							this.#adjustSliderDragAndDropOffsets();
						}, 500);
						main_core.Event.bind(window, 'resize', this.onWindowResize);
					},
					onClose: () => {
						main_core.Event.unbind(window, 'resize', this.onWindowResize);
					}
				}
			});
		}
		onSortEnd() {
			const listNodes = [...this.getListContainer().children];
			this.getItems().sort((a, b) => {
				const aIndex = listNodes.findIndex(node => {
					return a.getLayout() === node;
				});
				const bIndex = listNodes.findIndex(node => {
					return b.getLayout() === node;
				});
				return aIndex - bIndex;
			});
			this.onChange();
		}
	}

	exports.Backend = Backend;
	exports.ListEditor = ListEditor;

})(this.BX.Crm.Field = this.BX.Crm.Field || {}, BX.Event, BX, BX, BX.UI.DragAndDrop, BX.UI.SidePanel, BX.UI, BX, BX, BX, BX.Crm.Form.Fields);
//# sourceMappingURL=list-editor.bundle.js.map
