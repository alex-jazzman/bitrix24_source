/* eslint-disable */
(function (exports, main_core, bizproc_automation, main_core_events, main_popup) {
	'use strict';

	class FilterFieldsManager {
		#form;
		#options;
		#currentStorageId;
		#storageBlocks = [];
		#mapStorageBlocksToFilterFields;
		#filterFieldsContainer = null;
		#filteringFieldsPrefix = '';
		#filterFieldsMap = new Map();
		#conditionGroup = null;
		#conditionGroupSelector = null;
		constructor({
			form,
			options,
			currentStorageId,
			storageBlocks,
			mapStorageBlocksToFilterFields
		}) {
			this.#form = form;
			this.#options = options;
			this.#currentStorageId = currentStorageId;
			this.#storageBlocks = storageBlocks || [];
			this.#mapStorageBlocksToFilterFields = mapStorageBlocksToFilterFields;
			this.#initFilterFields();
		}
		render() {
			if (!main_core.Type.isNil(this.#conditionGroup) && main_core.Type.isNil(this.#conditionGroupSelector)) {
				const fields = Object.values(this.#filterFieldsMap.get(this.#currentStorageId) || {});
				this.#conditionGroupSelector = new bizproc_automation.ConditionGroupSelector(this.#conditionGroup, {
					fields,
					fieldPrefix: this.#filteringFieldsPrefix,
					customSelector: main_core.Type.isFunction(window.BPAShowSelector) ? this.#showFieldSelector : null,
					caption: {
						head: this.#options.headCaption,
						collapsed: this.#options.collapsedCaption
					},
					isExpanded: this.#getFilterExpandedState()
				});
				this.#conditionGroupSelector.subscribe('onToggleGroupViewClick', event => {
					const data = event.getData();
					this.#saveFilterExpandedState(data.isExpanded);
				});
				main_core.Dom.clean(this.#filterFieldsContainer);
				main_core.Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
			}
		}
		resetConditions() {
			this.#conditionGroupSelector = null;
			this.#conditionGroup = new bizproc_automation.ConditionGroup();
		}
		setCurrentStorageId(id) {
			this.#currentStorageId = id;
		}
		#initFilterFields() {
			this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sra-filter-fields-container"]');
			this.#filteringFieldsPrefix = this.#options.filteringFieldsPrefix;
			this.#filterFieldsMap = new Map(Object.entries(this.#options.filterFieldsMap).map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]));
			this.#filterFieldsMap = this.#mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);
			this.#conditionGroup = new bizproc_automation.ConditionGroup(this.#options.conditions);
		}
		#getFilterExpandedState() {
			return this.#form.is_expanded?.value === 'Y';
		}
		#saveFilterExpandedState(isExpanded) {
			if (this.#form.is_expanded) {
				this.#form.is_expanded.value = isExpanded ? 'Y' : 'N';
			}
		}
		#showFieldSelector(targetInputId) {
			window.BPAShowSelector(targetInputId, 'string', '');
		}
	}

	const Action = {
		GET_FIELDS: 'bizproc.v2.StorageField.getFieldsByStorageId',
		DELETE_FIELD: 'bizproc.v2.StorageField.delete'
	};

	class FieldRowRenderer {
		#documentType;
		#currentValues;
		#getStorageIdValue;
		#onFieldEdited;
		#onFieldDeleted;
		#onRowRemoved;
		constructor({
			documentType,
			currentValues,
			getStorageIdValue,
			onFieldEdited,
			onFieldDeleted,
			onRowRemoved
		}) {
			this.#documentType = documentType;
			this.#currentValues = currentValues;
			this.#getStorageIdValue = getStorageIdValue;
			this.#onFieldEdited = onFieldEdited;
			this.#onFieldDeleted = onFieldDeleted;
			this.#onRowRemoved = onRowRemoved;
		}
		renderStaticFieldRow(row, field) {
			const editBtn = this.#getEditButton(row, field.Id);
			const deleteBtn = this.#getDeleteButton(row);
			const {
				root,
				valueContainer
			} = main_core.Tag.render`
			<div ref="root" class="bizproc-write-activity__field-row">
				<div class="bizproc-write-activity__field-row-content">
					<div class="bizproc-write-activity__field-label">${main_core.Text.encode(field.Name)}</div>
					<div class="bizproc-write-activity__value-row">
						<div ref="valueContainer"></div>
						${editBtn || ''}
						${deleteBtn}
					</div>
				</div>
			</div>
		`;
			const keys = main_core.Tag.render`
			<input type="hidden" name="field_keys[]" value="${main_core.Text.encode(field.FieldName)}" />
		`;
			main_core.Dom.append(this.#getWriteField(field), valueContainer);
			main_core.Dom.append(keys, valueContainer);
			main_core.Dom.append(root, row);
		}
		openFieldEdit(fieldId = null) {
			return new Promise(resolve => {
				main_core.Runtime.loadExtension('bizproc.router').then(({
					Router
				}) => {
					Router.openStorageFieldEdit({
						events: {
							onCloseComplete: event => {
								const slider = event.getSlider();
								const dictionary = slider ? slider.getData() : null;
								let data = null;
								if (dictionary && dictionary.has('data')) {
									data = dictionary.get('data');
								}
								resolve(data);
							}
						},
						requestMethod: 'get',
						requestParams: {
							storageId: this.#getStorageIdValue(),
							fieldId
						}
					});
				}).catch(e => {
					console.error(e);
					resolve(null);
				});
			});
		}
		#getWriteField(field, value = null) {
			let currentValue = this.#currentValues[field.FieldName] ?? null;
			if (!main_core.Type.isNil(value)) {
				currentValue = value;
			}
			return BX.Bizproc.FieldType.renderControl(this.#documentType, field, `field_values_${field.FieldName}__bpctl`, currentValue, 'designer');
		}
		#getDeleteButton(row) {
			const button = main_core.Tag.render`
			<div class="bizproc-automation-popup-settings__condition-item_close">
				<div class="ui-icon-set --cross-m"></div>
			</div>
		`;
			main_core.Event.bind(button, 'click', event => {
				event.preventDefault();
				main_core.Dom.remove(row);
				this.#onRowRemoved();
			});
			return button;
		}
		#getEditButton(row, fieldId) {
			if (!fieldId && fieldId !== 0) {
				return null;
			}
			if (!(Number(this.#getStorageIdValue()) > 0)) {
				return null;
			}
			const button = main_core.Tag.render`
			<div
				class="bizproc-automation-popup-settings__condition-item_close"
			>
				<div class="ui-icon-set --edit-s"></div>
			</div>
		`;
			main_core.Event.bind(button, 'click', async event => {
				event.preventDefault();
				const field = await this.openFieldEdit(fieldId);
				if (!field) {
					return;
				}
				const isDeleteAction = field.action === Action.DELETE_FIELD && field.id;
				if (isDeleteAction) {
					this.#onFieldDeleted(Number(field.id));
				} else {
					this.#onFieldEdited(field);
				}
			});
			return button;
		}
	}

	class FieldMenu {
		#addFieldButton;
		#fieldsContainer;
		#getStorageFields;
		#onAddStaticField;
		#fieldMenu = null;
		constructor({
			addFieldButton,
			fieldsContainer,
			getStorageFields,
			onAddStaticField
		}) {
			this.#addFieldButton = addFieldButton;
			this.#fieldsContainer = fieldsContainer;
			this.#getStorageFields = getStorageFields;
			this.#onAddStaticField = onAddStaticField;
		}
		show() {
			this.#showFieldSelectionMenu();
		}
		destroy() {
			if (this.#fieldMenu && this.#fieldMenu.getId()) {
				main_popup.PopupMenu.destroy(this.#fieldMenu.getId());
				this.#fieldMenu = null;
			}
		}
		#showFieldSelectionMenu() {
			const addedFieldIds = this.#getAddedFieldIds();
			const menuItems = this.#buildMenuItems(addedFieldIds);
			this.destroy();
			this.#fieldMenu = this.#createFieldMenu(menuItems);
			this.#fieldMenu.show();
		}
		#buildMenuItems(addedFieldIds) {
			const menuItems = [];
			const storageFields = this.#getStorageFields();
			for (const field of storageFields) {
				const fieldId = String(field.Id);
				if (!addedFieldIds.has(fieldId) && main_core.Type.isStringFilled(field.Name)) {
					menuItems.push({
						text: main_core.Text.encode(field.Name),
						onclick: async (event, menuItem) => {
							menuItem.getMenuWindow().close();
							this.#onAddStaticField(field);
						}
					});
				}
			}
			return menuItems;
		}
		#createFieldMenu(menuItems) {
			return main_popup.PopupMenu.create({
				id: `bp_wsa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
				bindElement: this.#addFieldButton,
				autoHide: true,
				items: menuItems,
				events: {
					onPopupClose: () => {
						this.destroy();
					}
				}
			});
		}
		#getAddedFieldIds() {
			const fieldRows = [...this.#fieldsContainer.querySelectorAll('[data-id]')];
			return new Set(fieldRows.map(row => row.dataset.id));
		}
	}

	class WriteFieldsManager {
		#form;
		#writeFieldsOptions;
		#documentType;
		#currentStorageId;
		#storageBlocks = [];
		#fieldsContainer = null;
		#storageIdField = null;
		#addFieldButton = null;
		#createFieldButton = null;
		#outerBlock = null;
		#storageFields = [];
		#currentValues = {};
		#fieldsCache = new Map();
		#writeFieldsMap = new Map();
		#fieldRowRenderer = null;
		#fieldMenu = null;
		#onAddButtonClickHandler;
		#onCreateButtonClickHandler;
		#onAfterFieldRendererHandler;
		#onStorageRemoveHandler;
		constructor({
			form,
			writeFieldsOptions,
			documentType,
			currentStorageId,
			storageBlocks
		}) {
			this.#form = form;
			this.#writeFieldsOptions = writeFieldsOptions;
			this.#documentType = documentType;
			this.#currentStorageId = currentStorageId;
			this.#storageBlocks = storageBlocks || [];
			this.#onAddButtonClickHandler = this.#onAddButtonClick.bind(this);
			this.#onCreateButtonClickHandler = this.#onCreateButtonClick.bind(this);
			this.#onAfterFieldRendererHandler = this.#onAfterFieldRenderer.bind(this);
			this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);
		}
		setStorageBlocks(blocks) {
			this.#storageBlocks = blocks || [];
			this.#populateDynamicStorageWriteFields();
		}
		init() {
			if (!main_core.Type.isPlainObject(this.#writeFieldsOptions)) {
				return;
			}
			const block = this.#form.querySelector('[data-role="bpa-write-fields-block"]');
			const fieldsContainer = block?.querySelector('#fieldsContainer');
			const addFieldButton = block?.querySelector('#add_field');
			const createFieldButton = block?.querySelector('#create_field');
			const outerBlock = block?.querySelector('[data-role="bpa-write-fields-outer"]');
			const storageIdField = this.#form.storage_id ?? this.#form.querySelector('[name="storage_id"]');
			if (!fieldsContainer || !addFieldButton || !outerBlock || !storageIdField) {
				return;
			}
			this.#fieldsContainer = fieldsContainer;
			this.#storageIdField = storageIdField;
			this.#addFieldButton = addFieldButton;
			this.#createFieldButton = createFieldButton;
			this.#outerBlock = outerBlock;
			this.#currentValues = this.#writeFieldsOptions.currentFieldValues || {};
			this.#fieldRowRenderer = new FieldRowRenderer({
				documentType: this.#documentType,
				currentValues: this.#currentValues,
				getStorageIdValue: () => this.#currentStorageId || this.#storageIdField?.value,
				onFieldEdited: field => {
					this.#editStorageField(field);
					this.#editField(field);
					this.#fieldsCache.delete(this.#currentStorageId);
				},
				onFieldDeleted: fieldId => {
					this.#deleteFieldRow(fieldId);
					this.#storageFields = this.#storageFields.filter(f => f.Id !== fieldId);
					this.#fieldsCache.delete(this.#currentStorageId);
				},
				onRowRemoved: () => {
					main_core.Dom.show(this.#addFieldButton);
				}
			});
			this.#fieldMenu = new FieldMenu({
				addFieldButton: this.#addFieldButton,
				fieldsContainer: this.#fieldsContainer,
				getStorageFields: () => this.#storageFields,
				onAddStaticField: field => {
					this.#addStorageField(field);
					this.#addField(field);
				}
			});
			this.#bindEvents();
			this.#writeFieldsMap = new Map(Object.entries(this.#writeFieldsOptions.writeFieldsMap || {}).map(([storageId, fields]) => [String(storageId), fields]));
			this.#populateDynamicStorageWriteFields();
			const initialFields = this.#writeFieldsMap.get(this.#currentStorageId) || [];
			this.#initializeFields(initialFields);
		}
		async onStorageChange(newStorageId) {
			this.#currentStorageId = newStorageId;
			if (!this.#fieldsContainer) {
				return;
			}
			if (Number(newStorageId) > 0) {
				if (this.#createFieldButton) {
					main_core.Dom.show(this.#createFieldButton);
				}
				await this.#resetFieldContainer(newStorageId);
			} else if (main_core.Type.isStringFilled(newStorageId)) {
				const dynamicFields = this.#getDynamicStorageFields(newStorageId);
				if (this.#createFieldButton) {
					main_core.Dom.hide(this.#createFieldButton);
				}
				main_core.Dom.clean(this.#fieldsContainer);
				this.#storageFields = [...dynamicFields];
				this.#restoreSavedFieldValues();
				main_core.Dom.show(this.#addFieldButton);
				main_core.Dom.show(this.#outerBlock);
			} else {
				this.#clearWriteFields();
			}
		}
		destroy() {
			if (this.#addFieldButton) {
				main_core.Event.unbind(this.#addFieldButton, 'click', this.#onAddButtonClickHandler);
			}
			if (this.#createFieldButton) {
				main_core.Event.unbind(this.#createFieldButton, 'click', this.#onCreateButtonClickHandler);
			}
			this.#fieldsCache.clear();
			main_core_events.EventEmitter.unsubscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.#onAfterFieldRendererHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
			if (this.#fieldMenu) {
				this.#fieldMenu.destroy();
			}
		}
		#bindEvents() {
			main_core.Event.bind(this.#addFieldButton, 'click', this.#onAddButtonClickHandler);
			if (this.#createFieldButton) {
				main_core.Event.bind(this.#createFieldButton, 'click', this.#onCreateButtonClickHandler);
			}
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onDesignerRenderControlFinished', this.#onAfterFieldRendererHandler);
			main_core_events.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
		}
		#initializeFields(fields) {
			if (Number(this.#currentStorageId) > 0) {
				this.#initializeStaticStorageFields(fields);
			} else if (main_core.Type.isStringFilled(this.#currentStorageId)) {
				const dynamicFields = this.#getDynamicStorageFields(this.#currentStorageId);
				const mergedFields = this.#mergeDynamicFieldsWithSavedValues(dynamicFields);
				if (this.#createFieldButton) {
					main_core.Dom.hide(this.#createFieldButton);
				}
				this.#initializeStaticStorageFields(mergedFields);
			}
			if (!this.#currentStorageId || this.#currentStorageId === '0') {
				main_core.Dom.hide(this.#outerBlock);
			}
		}
		#initializeStaticStorageFields(fields) {
			if (!main_core.Type.isArrayFilled(fields)) {
				return;
			}
			this.#storageFields = [...fields];
			this.#restoreSavedFieldValues();
		}
		#restoreSavedFieldValues() {
			for (const [fieldName, value] of Object.entries(this.#currentValues)) {
				if (!main_core.Type.isNil(value) && (!main_core.Type.isArray(value) || value.length > 0)) {
					const field = this.#storageFields.find(item => item.FieldName === fieldName);
					if (field) {
						field.Value = value;
						this.#addField(field);
					}
				}
			}
		}
		async #resetFieldContainer(storageId) {
			const fields = await this.#getFields(storageId);
			if (this.#currentStorageId !== storageId) {
				return;
			}
			this.#storageFields = [...fields];
			main_core.Dom.clean(this.#fieldsContainer);
			main_core.Dom.show(this.#addFieldButton);
			main_core.Dom.show(this.#outerBlock);
		}
		#clearWriteFields() {
			main_core.Dom.clean(this.#fieldsContainer);
			main_core.Dom.hide(this.#outerBlock);
		}
		#getStorageId() {
			return this.#storageIdField.value || null;
		}
		async #getFields(storageId) {
			if (this.#fieldsCache.has(storageId)) {
				return this.#fieldsCache.get(storageId);
			}
			try {
				const response = await main_core.ajax.runAction(Action.GET_FIELDS, {
					data: {
						storageId,
						format: true
					}
				});
				if (response.status === 'success') {
					this.#fieldsCache.set(storageId, response.data);
					return response.data;
				}
			} catch (error) {
				console.error('Failed to load storage fields', error);
			}
			return [];
		}
		#getDynamicStorageFields(storageCode) {
			const block = this.#storageBlocks.find(b => b.activity?.Properties?.StorageCode === storageCode);
			return (block?.activity?.Properties?.SelectedFields || []).map(field => ({
				Id: field.code,
				Name: field.name,
				FieldName: field.code,
				Type: field.type,
				Multiple: field.multiple === true || field.multiple === 'Y',
				Required: field.mandatory === true || field.mandatory === 'Y',
				Options: field.settings || {},
				AllowSelection: true
			}));
		}
		#mergeDynamicFieldsWithSavedValues(dynamicFields) {
			const knownFieldNames = new Set(dynamicFields.map(f => f.FieldName));
			const extraFields = [];
			for (const fieldName of Object.keys(this.#currentValues)) {
				if (!knownFieldNames.has(fieldName)) {
					extraFields.push({
						Id: fieldName,
						Name: fieldName,
						FieldName: fieldName,
						Type: 'string',
						Required: false,
						AllowSelection: true
					});
				}
			}
			return [...dynamicFields, ...extraFields];
		}
		#populateDynamicStorageWriteFields() {
			for (const block of this.#storageBlocks) {
				const properties = block.activity?.Properties;
				if (!properties?.StorageCode || !main_core.Type.isArrayFilled(properties.SelectedFields)) {
					continue;
				}
				const dynamicFields = properties.SelectedFields.map(field => ({
					Id: field.code,
					Name: field.name,
					FieldName: field.code,
					Type: field.type,
					Multiple: field.multiple === true || field.multiple === 'Y',
					Required: field.mandatory === true || field.mandatory === 'Y',
					Options: field.settings || {},
					AllowSelection: true
				}));
				this.#writeFieldsMap.set(String(properties.StorageCode), dynamicFields);
			}
		}
		#addStorageField(field) {
			const exists = this.#storageFields.some(f => f.Id === field.Id);
			if (!exists) {
				this.#storageFields.push(field);
			}
		}
		#addField(field) {
			const row = main_core.Tag.render`<div data-id="${field.Id}" class="bizproc-write-activity__field"></div>`;
			main_core.Dom.append(row, this.#fieldsContainer);
			this.#fieldRowRenderer.renderStaticFieldRow(row, field);
			const addedFieldIds = new Set([...this.#fieldsContainer.querySelectorAll('[data-id]')].map(el => String(el.dataset.id)));
			const notAddedFields = this.#storageFields.filter(f => !addedFieldIds.has(String(f.Id)));
			if (notAddedFields.length === 0) {
				main_core.Dom.hide(this.#addFieldButton);
			}
		}
		#editStorageField(field) {
			const index = this.#storageFields.findIndex(f => f.Id === field.Id);
			if (index !== -1) {
				this.#storageFields[index] = field;
			}
		}
		#editField(field) {
			const row = this.#fieldsContainer.querySelector(`[data-id="${CSS.escape(String(field.Id))}"]`);
			if (row) {
				main_core.Dom.clean(row);
				this.#fieldRowRenderer.renderStaticFieldRow(row, field);
			}
		}
		#deleteFieldRow(fieldId) {
			const rowToRemove = this.#fieldsContainer.querySelector(`[data-id="${CSS.escape(String(fieldId))}"]`);
			if (rowToRemove) {
				main_core.Dom.remove(rowToRemove);
			}
		}
		#onAddButtonClick(event) {
			event.preventDefault();
			this.#fieldMenu.show();
		}
		async #onCreateButtonClick(event) {
			event.preventDefault();
			const field = await this.#fieldRowRenderer.openFieldEdit();
			if (field) {
				this.#fieldsCache.delete(this.#currentStorageId);
				this.#addStorageField(field);
				this.#addField(field);
			}
		}
		#onAfterFieldRenderer(event) {
			const node = event.data.node;
			const textarea = node.querySelector('textarea[name^="field_values_"], textarea[name="field_keys[]"]');
			if (!textarea) {
				return;
			}
			const isFieldValues = textarea.name.startsWith('field_values_');
			const randString = Math.random().toString(36).slice(2, 11);
			const uniqueId = `field_${isFieldValues ? 'values' : 'keys'}_${randString}`;
			textarea.id = uniqueId;
			const button = node.querySelector('[data-role="bp-selector-button"]');
			if (!button) {
				return;
			}
			const oldOnclick = button.getAttribute('onclick');
			if (oldOnclick) {
				const newOnclick = oldOnclick.replace(/BPAShowSelector\('([^']+)'(\s*,\s*[^)]+)\)/, `BPAShowSelector('${uniqueId}'$2)`);
				button.setAttribute('onclick', newOnclick);
			}
		}
		#onStorageRemove(event) {
			const storageId = Number(event.getData().storageId);
			if (storageId <= 0) {
				return;
			}
			const currentStorageId = this.#getStorageId();
			if (currentStorageId === String(storageId)) {
				this.#storageIdField.value = '';
				this.#clearWriteFields();
			}
		}
	}

	class WriteDataStorageActivityRenderer {
		#form = null;
		#options = null;
		#writeFieldsOptions = null;
		#documentType = [];
		#currentStorageId = '';
		#rewriteModeElement = null;
		#rewriteModeSelect = null;
		#currentRewriteMode = '';
		#document = null;
		#storageSelector;
		#onRewriteModeChangeHandler;
		#storageBlocks = [];
		#filterFieldsManager = null;
		#writeFieldsManager = null;
		constructor() {
			this.#onRewriteModeChangeHandler = this.#onRewriteModeChange.bind(this);
		}
		getControlRenderers() {
			return {
				filterFields: field => {
					this.#options = field.property.Options || {};
					this.#options.headCaption = field.property.Name;
					return main_core.Tag.render`
					<div data-role="bpa-sra-storage-id-dependent">
						<div data-role="bpa-sra-filter-fields-container"></div>
					</div>
				`;
				},
				writeFields: field => {
					this.#writeFieldsOptions = field.property.Options || {};
					const addFieldCaption = this.#writeFieldsOptions.addFieldCaption || '';
					const newFieldCaption = this.#writeFieldsOptions.newFieldCaption || '';
					return main_core.Tag.render`
					<div data-role="bpa-write-fields-block">
						<div data-role="bpa-write-fields-outer" class="bizproc-write-activity__outer-block">
							<div id="fieldsContainer" class="bizproc-write-activity__fields-container"></div>
							<div id="add_field" class="node-settings-add-item-button"><div class="ui-icon-set --plus-m node-settings-add-item-button__plus bizproc-write-activity__icon-plus"></div><span>${addFieldCaption}</span></div>
							<div id="create_field" class="add-construction-field create-field-card"><div class="ui-icon-set --plus-m bizproc-write-activity__icon-plus"></div><span>${newFieldCaption}</span></div>
						</div>
					</div>
				`;
				}
			};
		}
		async afterFormRender(form) {
			const {
				StorageSelector,
				mapStorageBlocksToFilterFields,
				resolveCurrentStorageId
			} = await main_core.Runtime.loadExtension('bizproc.storage-selector');
			this.#form = form;
			if (main_core.Type.isPlainObject(this.#options)) {
				this.#documentType = this.#options.documentType;
				if (!main_core.Type.isNil(this.#form)) {
					this.#currentStorageId = resolveCurrentStorageId(this.#form, 'StorageCode');
					this.#rewriteModeElement = this.#form.querySelector('[data-role="bpa-sra-storage-id-dependent"]');
					this.#rewriteModeSelect = this.#form.RewriteMode ?? this.#form.rewrite_mode ?? null;
					this.#currentRewriteMode = this.#rewriteModeSelect?.value || '';
				}
				this.#document = new bizproc_automation.Document({
					rawDocumentType: this.#documentType,
					documentFields: [],
					title: 'document'
				});
				main_core_events.EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', event => {
					const {
						blocks
					} = event.getData();
					this.#storageBlocks = (blocks || []).filter(block => block.activity?.Type === 'CreateStorageNode');
					this.#filterFieldsManager = new FilterFieldsManager({
						form: this.#form,
						options: this.#options,
						currentStorageId: this.#currentStorageId,
						storageBlocks: this.#storageBlocks,
						mapStorageBlocksToFilterFields
					});
					if (this.#writeFieldsManager) {
						this.#writeFieldsManager.setStorageBlocks(this.#storageBlocks);
					}
					this.#writeFieldsManager = new WriteFieldsManager({
						form: this.#form,
						writeFieldsOptions: this.#writeFieldsOptions,
						documentType: this.#documentType,
						currentStorageId: this.#currentStorageId,
						storageBlocks: this.#storageBlocks
					});
					this.#writeFieldsManager.init();
					this.#render();
				});
				this.#initAutomationContext();
				this.#initStorageSelector(StorageSelector);
				if (this.#rewriteModeSelect) {
					main_core.Event.bind(this.#rewriteModeSelect, 'change', this.#onRewriteModeChangeHandler);
				}
				this.#render();
			}
		}
		destroy() {
			if (this.#rewriteModeSelect) {
				main_core.Event.unbind(this.#rewriteModeSelect, 'change', this.#onRewriteModeChangeHandler);
			}
			if (this.#writeFieldsManager) {
				this.#writeFieldsManager.destroy();
			}
			if (this.#storageSelector) {
				this.#storageSelector.destroy();
				this.#storageSelector = null;
			}
		}
		#initAutomationContext() {
			try {
				bizproc_automation.getGlobalContext();
			} catch {
				bizproc_automation.setGlobalContext(new bizproc_automation.Context({
					document: this.#document
				}));
			}
		}
		#initStorageSelector(StorageSelector) {
			this.#storageSelector = new StorageSelector({
				dialogId: 'entityselector_storage_id',
				onStateChange: this.#onStorageStateChange.bind(this),
				initialValue: this.#currentStorageId,
				storageCodeInput: this.#form?.querySelector('[name="StorageCode"]'),
				footerOptions: {
					label: this.#writeFieldsOptions?.newStorageCaption || '',
					itemLink: '/bitrix/components/bitrix/bizproc.storage.item.list/?storageId='
				}
			});
			this.#storageSelector.init();
		}
		async #onStorageStateChange(newStorageId) {
			if (this.#currentStorageId !== String(newStorageId)) {
				this.#currentStorageId = String(newStorageId);
				if (this.#filterFieldsManager) {
					this.#filterFieldsManager.resetConditions();
					this.#filterFieldsManager.setCurrentStorageId(this.#currentStorageId);
				}
				this.#render();
				if (this.#writeFieldsManager) {
					await this.#writeFieldsManager.onStorageChange(this.#currentStorageId);
				}
			}
		}
		#onRewriteModeChange() {
			this.#currentRewriteMode = this.#rewriteModeSelect?.value || '';
			this.#render();
		}
		#render() {
			const hasStorage = this.#currentStorageId && this.#currentStorageId !== '0';
			const isMergeOrRewrite = ['mergeFields', 'rewriteFields'].includes(this.#currentRewriteMode);
			if (hasStorage && isMergeOrRewrite) {
				main_core.Dom.show(this.#rewriteModeElement);
				this.#filterFieldsManager?.render();
			} else {
				main_core.Dom.hide(this.#rewriteModeElement);
			}
		}
	}

	exports.WriteDataStorageActivityRenderer = WriteDataStorageActivityRenderer;

})(this.window = this.window || {}, BX, BX.Bizproc.Automation, BX.Event, BX.Main);
//# sourceMappingURL=renderer.js.map
