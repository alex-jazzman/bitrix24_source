/* eslint-disable */
(function (exports, main_core, bizproc_automation, main_core_events) {
	'use strict';

	class DeleteDataStorageActivityRenderer {
		#form = null;
		#options = null;
		#documentType = [];
		#currentStorageId = '';
		#deleteModeElement = null;
		#deleteModeSelect = null;
		#currentDeleteMode = '';
		#document = null;
		#conditionGroup = null;
		#filterFieldsContainer = null;
		#filteringFieldsPrefix = '';
		#filterFieldsMap = new Map();
		#onDeleteModeChangeHandler;
		#dialog;
		#conditionGroupSelector = null;
		#storageBlocks = [];
		constructor() {
			this.#onDeleteModeChangeHandler = this.#onDeleteModeChange.bind(this);
		}
		getControlRenderers() {
			return {
				filterFields: field => {
					this.#options = field.property.Options || {};
					this.#options.headCaption = field.property.Name;
					return main_core.Tag.render`
					<div data-role="bpa-sda-delete-mode-dependent">
						<div data-role="bpa-sda-filter-fields-container"></div>
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
					this.#deleteModeElement = this.#form.querySelector('[data-role="bpa-sda-delete-mode-dependent"]');
					this.#deleteModeSelect = this.#form.delete_mode;
					this.#currentDeleteMode = this.#deleteModeSelect?.value || '';
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
					this.#render();
				});
				this.#initAutomationContext();
				this.#initStorageSelector(StorageSelector);
				if (this.#deleteModeSelect) {
					main_core.Event.bind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
				}
				this.#render();
			}
		}
		#initStorageSelector(StorageSelector) {
			const dialogId = 'entityselector_storage_id';
			this.#dialog = new StorageSelector({
				dialogId,
				onStateChange: this.#onStorageStateChange.bind(this),
				initialValue: this.#currentStorageId,
				storageCodeInput: this.#form?.querySelector('[name="storage_code"]')
			});
			this.#dialog.init();
		}
		#onStorageStateChange(newStorageId) {
			if (this.#currentStorageId !== String(newStorageId)) {
				this.#currentStorageId = String(newStorageId);
				this.#conditionGroupSelector = null;
				this.#conditionGroup = new bizproc_automation.ConditionGroup();
			}
			this.#render();
		}
		#onDeleteModeChange() {
			this.#currentDeleteMode = this.#deleteModeSelect.value;
			this.#render();
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
				main_core.Dom.clean(this.#filterFieldsContainer);
				main_core.Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
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
		#showFieldSelector(targetInputId) {
			window.BPAShowSelector(targetInputId, 'string', '');
		}
		#render() {
			if (this.#currentStorageId && this.#currentDeleteMode === 'multiple') {
				main_core.Dom.show(this.#deleteModeElement);
				this.#renderFilterFields();
			} else {
				main_core.Dom.hide(this.#deleteModeElement);
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
		#initFilterFields(options, mapStorageBlocksToFilterFields) {
			this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sda-filter-fields-container"]');
			this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
			this.#filterFieldsMap = new Map(Object.entries(options.filterFieldsMap).map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]));
			this.#filterFieldsMap = mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);
			this.#conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
			this.#conditionGroupSelector = null;
		}
		destroy() {
			if (this.#deleteModeSelect) {
				main_core.Event.unbind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
			}
			if (this.#dialog) {
				this.#dialog.destroy();
				this.#dialog = null;
			}
		}
	}

	exports.DeleteDataStorageActivityRenderer = DeleteDataStorageActivityRenderer;

})(this.window = this.window || {}, BX, BX.Bizproc.Automation, BX.Event);
//# sourceMappingURL=renderer.js.map
