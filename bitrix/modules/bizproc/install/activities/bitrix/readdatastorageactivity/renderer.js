/* eslint-disable */
(function (exports, main_core, bizproc_automation, main_core_events) {
	'use strict';

	const GET_ACTIVITY_FIELDS_MAP_ACTION = 'bizproc.v2.StorageField.getActivityFieldsMap';
	class ReadDataStorageActivityRenderer {
		#form = null;
		#options = null;
		#dialog;
		#documentType;
		#document;
		#storageIdDependentElements;
		#returnFieldsMap = new Map();
		#returnFieldsIds = [];
		#systemReturnFields = new Map();
		#filterFieldsContainer = null;
		#filteringFieldsPrefix = '';
		#filterFieldsMap = new Map();
		#conditionGroup = null;
		#conditionGroupSelector = null;
		#currentStorageId = '';
		#storageBlocks = [];
		getControlRenderers() {
			return {
				filterFields: field => {
					this.#options = field.property.Options || {};
					this.#options.headCaption = field.property.Name || '';
					this.#options.requiredMark = Boolean(field.property.RequiredMark);
					return main_core.Tag.render`
					<div data-role="bpa-sra-storage-id-dependent">
						<div data-role="bpa-sra-filter-fields-container"></div>
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
					this.#currentStorageId = resolveCurrentStorageId(this.#form);
					this.#storageIdDependentElements = form.querySelectorAll('#row_return_fields, #row_filter_fields');
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
					this.#initFilterFields(this.#options, mapStorageBlocksToFilterFields);
					this.#initReturnFields(this.#options);
					this.#render();
				});
				this.#initAutomationContext();
				this.#initStorageSelector(StorageSelector);
				this.#render();
			}
		}
		#initStorageSelector(StorageSelector) {
			this.#dialog = new StorageSelector({
				dialogId: 'entityselector_storage_id',
				onStateChange: this.#onStorageStateChange.bind(this),
				initialValue: this.#currentStorageId,
				storageCodeInput: this.#form?.querySelector('[name="storage_code"]')
			});
			this.#dialog.init();
		}
		#initFilterFields(options, mapStorageBlocksToFilterFields) {
			this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sra-filter-fields-container"]');
			this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
			this.#filterFieldsMap = new Map(Object.entries(options.filterFieldsMap).map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]));
			this.#filterFieldsMap = mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);
			this.#conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
			this.#conditionGroupSelector = null;
		}
		#initReturnFields(options) {
			this.#returnFieldsIds = main_core.Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];
			const storageInput = this.#form.querySelector('input[name="storage_id"]');
			const storageIdValue = storageInput?.value || '';
			if (!storageIdValue || storageIdValue === '0') {
				const inputs = this.#form.querySelectorAll('[name="return_fields_by_storage_code[]"]');
				const values = [...inputs].map(input => input.value).filter(Boolean);
				if (values.length > 0) {
					this.#returnFieldsIds = values;
				}
			}
			this.#returnFieldsMap = new Map();
			Object.entries(options.returnFieldsMap).forEach(([storageId, fieldsMap]) => {
				this.#returnFieldsMap.set(String(storageId), new Map(Object.entries(fieldsMap)));
			});
			this.#systemReturnFields = new Map();
			if (main_core.Type.isPlainObject(options.systemReturnFields)) {
				Object.entries(options.systemReturnFields).forEach(([fieldId, field]) => {
					this.#systemReturnFields.set(String(fieldId), {
						Name: field.Name
					});
				});
			}
			this.#populateDynamicStorageReturnFields();
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
		#populateDynamicStorageReturnFields() {
			for (const block of this.#storageBlocks) {
				const properties = block.activity?.Properties;
				if (!properties?.StorageCode || !main_core.Type.isArrayFilled(properties.SelectedFields)) {
					continue;
				}
				const fieldsMap = new Map(this.#systemReturnFields);
				for (const field of properties.SelectedFields) {
					fieldsMap.set(String(field.code), {
						Name: field.name
					});
				}
				this.#returnFieldsMap.set(String(properties.StorageCode), fieldsMap);
			}
		}
		async #onStorageStateChange(newStorageId) {
			const storageId = String(newStorageId ?? '');
			if (this.#currentStorageId !== storageId) {
				this.#currentStorageId = storageId;
				this.#conditionGroupSelector = null;
				this.#conditionGroup = new bizproc_automation.ConditionGroup();
				this.#returnFieldsIds = [];
			}
			await this.#loadStorageFieldsMaps(storageId);
			if (this.#currentStorageId !== storageId) {
				return;
			}
			this.#render();
		}
		async #loadStorageFieldsMaps(storageId) {
			const numericStorageId = main_core.Text.toInteger(storageId);
			const isPersistedStorage = numericStorageId > 0 && String(numericStorageId) === storageId;
			if (!isPersistedStorage || this.#filterFieldsMap.has(storageId) && this.#returnFieldsMap.has(storageId)) {
				return;
			}
			try {
				const response = await main_core.ajax.runAction(GET_ACTIVITY_FIELDS_MAP_ACTION, {
					data: {
						storageId: numericStorageId
					}
				});
				if (response.status !== 'success') {
					return;
				}
				this.#filterFieldsMap.set(storageId, response.data.filterFields ?? []);
				this.#returnFieldsMap.set(storageId, new Map(Object.entries(response.data.returnFields ?? {})));
			} catch (error) {
				console.error('Failed to load storage fields', error);
			}
		}
		#render() {
			if (!this.#currentStorageId || this.#currentStorageId === '0') {
				this.#storageIdDependentElements?.forEach(element => main_core.Dom.hide(element));
			} else {
				this.#storageIdDependentElements?.forEach(element => main_core.Dom.show(element));
				this.#renderFilterFields();
				this.#renderReturnFields();
			}
		}
		#showFieldSelector(targetInputId) {
			window.BPAShowSelector(targetInputId, 'string', '');
		}
		#renderFilterFields() {
			if (!main_core.Type.isNil(this.#conditionGroup) && main_core.Type.isNil(this.#conditionGroupSelector)) {
				this.#conditionGroupSelector = new bizproc_automation.ConditionGroupSelector(this.#conditionGroup, {
					fields: Object.values(this.#filterFieldsMap.get(this.#currentStorageId) || {}),
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
				const selectorNode = this.#conditionGroupSelector.createNode();
				if (this.#options.requiredMark) {
					const titleNode = selectorNode.querySelector('.bizproc-automation-popup-settings__condition-header > .bizproc-automation-popup-settings-title');
					if (titleNode) {
						main_core.Dom.addClass(titleNode, '--required');
					}
				}
				main_core.Dom.clean(this.#filterFieldsContainer);
				main_core.Dom.append(selectorNode, this.#filterFieldsContainer);
			}
		}
		#getFilterExpandedState() {
			return this.#form.is_expanded?.value === 'Y';
		}
		#saveFilterExpandedState(isExpanded) {
			if (this.#form.is_expanded) {
				this.#form.is_expanded.value = isExpanded ? 'Y' : 'N';
			}
		}
		destroy() {
			if (this.#dialog) {
				this.#dialog.destroy();
				this.#dialog = null;
			}
		}
		#renderReturnFields() {
			const storageId = this.#currentStorageId;
			const fieldsMap = this.#returnFieldsMap?.get(storageId);
			if (!main_core.Type.isNil(fieldsMap)) {
				const fieldOptions = {};
				fieldsMap.forEach((field, fieldId) => {
					fieldOptions[fieldId] = field.Name;
				});
				const selectElement = this.#form.id_return_fields;
				if (!selectElement) {
					return;
				}
				main_core.Dom.clean(selectElement);
				for (const [value, text] of Object.entries(fieldOptions)) {
					const isSelected = this.#returnFieldsIds?.includes(value) || this.#returnFieldsIds?.includes(Number(value));
					selectElement.add(main_core.Tag.render`
						<option value="${main_core.Text.encode(value)}" ${isSelected ? 'selected' : ''}>
							${main_core.Text.encode(text)}
						</option>
					`);
				}
			}
		}
	}

	exports.ReadDataStorageActivityRenderer = ReadDataStorageActivityRenderer;

})(this.window = this.window || {}, BX, BX.Bizproc.Automation, BX.Event);
//# sourceMappingURL=renderer.js.map
