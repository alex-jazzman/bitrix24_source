/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, main_loader, main_core_events, booking_const, booking_provider_service_crmFormService, booking_application_skuResourcesEditor, ui_entitySelector) {
	'use strict';

	class ResourceStore {
		#resourcesById = new Map();
		async ensure(ids) {
			if (ids.length === 0) {
				return;
			}
			const needToLoadIds = ids.filter(id => !this.#isLoaded(id));
			if (needToLoadIds.length === 0) {
				return;
			}
			const loaded = await booking_provider_service_crmFormService.crmFormService.getResources(needToLoadIds);
			for (const resource of loaded) {
				this.#resourcesById.set(resource.id, resource);
			}
		}
		#isLoaded(id) {
			return this.#resourcesById.has(id);
		}
		getByIds(ids) {
			return ids.map(id => this.#resourcesById.get(id)).filter(Boolean);
		}
		getAll() {
			return [...this.#resourcesById.values()];
		}
	}
	const resourceStore = new ResourceStore();

	const defaultBookingForm = {
		resourceIds: [],
		label: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_LABEL_DEFAULT'),
		isVisibleHint: true,
		hint: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_DEFAULT_VALUE'),
		hasSlotsAllAvailableResources: false
	};
	const defaultSkuBookingForm = {
		resources: [],
		skuLabel: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKU_FIELD_LABEL_DEFAULT'),
		skuTextHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKU_FIELD_PLACEHOLDER_DEFAULT_VALUE'),
		isVisibleSkuHint: true,
		skuHint: ''
	};
	const defaultBookingDefaultForm = {
		...defaultBookingForm,
		resourceIds: [],
		textHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER_DEFAULT_VALUE')
	};
	const defaultBookingAutoSelectionForm = {
		...defaultBookingForm,
		resourceIds: [],
		hasSlotsAllAvailableResources: false,
		textHeader: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER_AUTO_SELECT_DEFAULT_VALUE')
	};

	class BookingSettingsDataModel {
		#isAutoSelectionOn;
		#settingsData;
		constructor(settingsData, isAutoSelectionOn, templateId) {
			this.#isAutoSelectionOn = isAutoSelectionOn;
			const autoSelectionData = settingsData[booking_const.CrmFormSettingsDataPropName.autoSelection] || this.#getAutoSelectionFormByTemplate(templateId);
			const defaultData = settingsData[booking_const.CrmFormSettingsDataPropName.default] || this.#getDefaultFormByTemplate(templateId);
			this.#settingsData = {
				[booking_const.CrmFormSettingsDataPropName.isAutoSelectionOn]: isAutoSelectionOn,
				[booking_const.CrmFormSettingsDataPropName.autoSelection]: autoSelectionData,
				[booking_const.CrmFormSettingsDataPropName.default]: defaultData
			};
		}
		#isTemplateWithSkus(templateId) {
			return booking_const.CrmFormTemplatesWithSku.includes(templateId);
		}
		#getAutoSelectionFormByTemplate(templateId) {
			const form = defaultBookingAutoSelectionForm;
			if (this.#isTemplateWithSkus(templateId)) {
				return {
					...form,
					...defaultSkuBookingForm
				};
			}
			return form;
		}
		#getDefaultFormByTemplate(templateId) {
			let form = {
				...defaultBookingDefaultForm
			};
			if (templateId === booking_const.CrmFormTemplateId.BookingAnyResource || templateId === booking_const.CrmFormTemplateId.BookingAnyResourceSku) {
				form.hasSlotsAllAvailableResources = true;
			}
			if (this.#isTemplateWithSkus(templateId)) {
				form = {
					...form,
					...defaultSkuBookingForm
				};
			}
			return form;
		}
		get dataSettingsProperty() {
			return this.#isAutoSelectionOn ? booking_const.CrmFormSettingsDataPropName.autoSelection : booking_const.CrmFormSettingsDataPropName.default;
		}
		setSettingsData(patch = {}) {
			Object.assign(this.#settingsData[this.dataSettingsProperty], patch);
		}
		get settingsData() {
			return this.#settingsData;
		}
		get form() {
			return this.#settingsData[this.dataSettingsProperty];
		}
	}

	class BookingBaseField {
		#field;
		constructor(field) {
			this.#field = field;
		}
		getValue() {
			return this.#field.getValue();
		}
		setValue(value) {
			this.#field.setValue(value);
		}
		getField() {
			return this.#field;
		}
		getLayout() {
			return this.#field.layout;
		}
	}

	const DATA_HINT = 'data-hint';
	const DATA_HINT_NO_ICON = 'data-hint-no-icon';
	class HasSlotsAllAvailableResourcesField extends BookingBaseField {
		#disabled;
		constructor(value, onChange, disabled = false) {
			super(new BX.Landing.UI.Field.Checkbox({
				selector: 'hasSlotsAllAvailableResources',
				compact: true,
				multiple: false,
				items: []
			}));
			this.#addItem(disabled);
			this.#disabled = disabled;
			if (main_core.Type.isFunction(onChange)) {
				this.getField().subscribe('onChange', () => {
					onChange(Boolean(this.getField().getValue()));
				});
			}
			this.setValue(value);
		}
		#addItem(disabled = false) {
			const hintMessage = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES_HELP_HINT', {
				'#NBSP# ': '&nbsp;'
			});
			this.getField().addItem({
				name: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES'),
				html: `
				${main_core.Text.encode(main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES'))}
				<span
					class="landing-ui-form-help booking--crm-forms-settins--show-slots-all-available-resources-help-hint"
					title=""
					${DATA_HINT}="${hintMessage}"
					onclick="return false;"
				>
					<div></div>
				</span>
			`,
				value: 'hasSlotsAllAvailableResources',
				disabled
			});
		}
		setValue(value) {
			super.setValue(value ? ['hasSlotsAllAvailableResources'] : false);
		}
		#updateLayoutDataAttrs(layout) {
			if (this.#disabled) {
				layout.setAttribute(DATA_HINT, main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SHOW_SLOTS_ALL_AVAILABLE_RESOURCES_DISABLED_HINT'));
				layout.setAttribute(DATA_HINT_NO_ICON, true);
			} else {
				layout.removeAttribute(DATA_HINT);
				layout.removeAttribute(DATA_HINT_NO_ICON);
			}
			return layout;
		}
		getLayout() {
			return this.#updateLayoutDataAttrs(super.getLayout());
		}
	}

	class HintField extends BookingBaseField {
		constructor(value, onChange) {
			super(new BX.Landing.UI.Field.Text({
				title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_LABEL'),
				textOnly: true,
				content: value
			}));
			if (main_core.Type.isFunction(onChange)) {
				this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
			}
			this.setValue(value);
		}
		setValue(value) {
			super.setValue(value);
		}
	}

	class HintVisibilityField extends BookingBaseField {
		constructor(value, onChange) {
			super(new BX.Landing.UI.Field.Checkbox({
				selector: 'isVisibleHint',
				compact: true,
				multiple: false,
				items: [{
					name: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_IS_VISIBLE_HINT_LABEL'),
					value: 'isVisibleHint'
				}]
			}));
			if (main_core.Type.isFunction(onChange)) {
				this.getField().subscribe('onChange', () => onChange(Boolean(this.getValue())));
			}
			this.setValue(value);
		}
		setValue(value) {
			super.setValue(value ? ['isVisibleHint'] : false);
		}
	}

	class LabelField extends BookingBaseField {
		constructor(value, onChange) {
			super(new BX.Landing.UI.Field.Text({
				title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_LABEL'),
				textOnly: true,
				content: value
			}));
			if (main_core.Type.isFunction(onChange)) {
				this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
			}
			this.setValue(value);
		}
		setValue(value) {
			super.setValue(value);
		}
	}

	class PlaceholderField extends BookingBaseField {
		constructor(value, onChange) {
			super(new BX.Landing.UI.Field.Text({
				title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_FIELD_PLACEHOLDER'),
				textOnly: true,
				content: value
			}));
			if (main_core.Type.isFunction(onChange)) {
				this.getField().subscribe('onChange', () => onChange(this.getValue() || ''));
			}
			this.setValue(value);
		}
		setValue(value) {
			super.setValue(value);
		}
	}

	class SkusResourcesManager {
		#editor;
		#catalogSkuEntityOptions = null;
		#onUpdateResources = Function;
		constructor(catalogSkuEntityOptions, onUpdateResources) {
			this.#catalogSkuEntityOptions = catalogSkuEntityOptions;
			this.#onUpdateResources = onUpdateResources;
		}
		open(resources) {
			this.#editor = new booking_application_skuResourcesEditor.SkuResourcesEditor({
				title: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_TITLE'),
				description: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_RESOURCES_EDITOR_DESCRIPTION'),
				options: {
					editMode: true,
					catalogSkuEntityOptions: this.#catalogSkuEntityOptions
				},
				loadData: () => this.loadResources(resources),
				save: data => this.saveResources(data)
			});
			this.#editor.open();
		}
		async loadResources(resources) {
			await this.#loadResourcesTypes();
			return booking_provider_service_crmFormService.crmFormService.getResourceSkuRelations(resources);
		}
		async #loadResourcesTypes() {
			await booking_provider_service_crmFormService.crmFormService.getResourceTypeList();
		}
		async saveResources(data = []) {
			if (main_core.Type.isNil(data) || !main_core.Type.isArray(data.resources)) {
				return;
			}
			const resources = data.resources.map(({
				id,
				skus
			}) => {
				return {
					id,
					skus: skus.map(sku => sku.id)
				};
			});
			this.#onUpdateResources(resources);
		}
	}

	class SkusAndResourcesField {
		#skusEditorButton = null;
		#getResources;
		#getBodyContainer;
		#onUpdateResources;
		#skuResourcesManager;
		constructor(options) {
			this.#skuResourcesManager = new SkusResourcesManager(options.catalogSkuEntityOptions, this.#onUpdate.bind(this));
			this.#getBodyContainer = options.getBodyContainer;
			this.#getResources = options.getResources;
			this.#onUpdateResources = options.onUpdateResources;
		}
		get #skusAndResourcesCounterClassName() {
			return 'crm-form--booking-skus-and-resources-count';
		}
		get #skusCounterClassName() {
			return 'crm-form--booking-skus-count';
		}
		get #resourcesCounterClassName() {
			return 'crm-form--booking-resources-count';
		}
		render(isEmpty = false) {
			const buttonLabel = isEmpty ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_ADD_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_CHANGE_BUTTON');
			this.#skusEditorButton = main_core.Tag.render`
			<button
				id="booking--crm-forms--services-editor-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${this.#showSkusResourcesEditor.bind(this)}"
			>
				${buttonLabel}
			</button>
		`;
			return main_core.Tag.render`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_LABEL')}
					</div>
					<div class="${this.#skusAndResourcesCounterClassName}">
						<div class="${this.#skusCounterClassName}"></div>
						<span>&#8226;</span>
						<div class="${this.#resourcesCounterClassName}"></div>
					</div>
				</div>
				<div style="align-self: flex-end">
					${this.#skusEditorButton}
				</div>
			</div>
		`;
		}
		updateCounter() {
			const counterEl = this.#getBodyContainer().querySelector(`.${this.#skusAndResourcesCounterClassName}`);
			if (!main_core.Type.isDomNode(counterEl)) {
				return;
			}
			const resources = this.#getResources();
			const skus = resources.reduce((skusSet, {
				skus: skuIds
			}) => {
				skuIds.forEach(skuId => skusSet.add(skuId));
				return skusSet;
			}, new Set());
			if (skus.size === 0 && resources.length === 0) {
				counterEl.innerText = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_SKUS_FIELD_EMPTY');
				return;
			}
			const skusCount = main_core.Loc.getMessagePlural('BOOKING_CRM_FORMS_SETTINGS_SKUS_COUNT', skus.size, {
				'#COUNT#': skus.size
			});
			const resourcesCount = main_core.Loc.getMessagePlural('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_COUNT', resources.length, {
				'#COUNT#': resources.length
			});
			const counterContent = main_core.Tag.render`
			<div class="${this.#skusAndResourcesCounterClassName}">
				<div>${skusCount}</div>
				<span>&#8226;</span>
				<div>${resourcesCount}</div>
			</div>
		`;
			main_core.Dom.replace(counterEl, counterContent);
		}
		#showSkusResourcesEditor() {
			this.#skuResourcesManager.open(this.#getResources());
		}
		#onUpdate(resources) {
			this.#onUpdateResources(resources);
			this.updateCounter();
		}
	}

	class ContentHeader extends ui_entitySelector.BaseHeader {
		constructor(...props) {
			super(...props);
			this.getContainer();
		}
		render() {
			return this.options.content;
		}
	}

	class ResourceSelectorDialogFooter extends ui_entitySelector.BaseFooter {
		#resources = [];
		#onClose = null;
		#onSave = null;
		constructor(tab, options) {
			super(tab, options);
			this.#resources = [];
			this.#onClose = options.onClose || null;
			this.#onSave = options.onSave || null;
			this.getDialog().subscribe('Item:onSelect', this.#handleOnTagAdd.bind(this));
			this.getDialog().subscribe('Item:onDeselect', this.#handleOnTagRemove.bind(this));
		}
		render() {
			const {
				footer,
				footerAddButton,
				footerCloseButton
			} = main_core.Tag.render`
			<div ref="footer" class="crm-forms--booking--resource-selector-dialog__footer">
				<button
					ref="footerAddButton"
					class="ui-btn ui-btn ui-btn-sm ui-btn-primary ui-btn-round crm-forms--booking--resource-selector-dialog__footer-btn-width"
				>
					${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_SELECTOR_DIALOG_ADD_BUTTON')}
				</button>
				<button ref="footerCloseButton" class="ui-btn ui-btn ui-btn-sm ui-btn-light-border ui-btn-round crm-forms--booking--resource-selector-dialog__footer-btn-width">
					${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_SELECTOR_DIALOG_CANCEL_BUTTON')}
				</button>
			</div>
		`;
			this.footerAddButton = footerAddButton;
			main_core.Event.bind(footerAddButton, 'click', this.#add.bind(this));
			this.footerCloseButton = footerCloseButton;
			main_core.Event.bind(this.footerCloseButton, 'click', this.#close.bind(this));
			return footer;
		}
		get resourcesCount() {
			return this.#resources.length;
		}
		#add() {
			const resources = this.dialog.getSelectedItems();
			const resourceIds = resources.map(resource => resource.id);
			if (main_core.Type.isFunction(this.#onSave)) {
				this.#onSave({
					resourceIds
				});
			}
			this.#close();
		}
		#close() {
			if (main_core.Type.isFunction(this.#onClose)) {
				this.#onClose();
			}
			this.dialog?.hide();
		}
		destroyDialog() {
			main_core.Event.unbindAll(this.footerAddButton, 'click');
			main_core.Event.unbindAll(this.footerCloseButton, 'click');
			this.getDialog().destroy();
		}
		#handleOnTagAdd(event) {
			const {
				item
			} = event.getData();
			this.#onResourceToggle(item, true);
		}
		#handleOnTagRemove(event) {
			const {
				item
			} = event.getData();
			this.#onResourceToggle(item, false);
		}
		#onResourceToggle(item, isSelected = false) {
			if (isSelected) {
				this.#resources = [...this.#resources, item];
			} else {
				this.#resources = this.#resources.filter(resource => resource.id !== item.id);
			}
		}
	}

	class ResourcesSelector {
		#selector = null;
		#targetNode;
		#selectedIds;
		#selectedItems = [];
		#onClose = null;
		#onSave = null;
		constructor(options) {
			this.#targetNode = options.targetNode;
			this.#selectedIds = options.selectedIds || [];
			this.#selectedItems = [];
			this.#onClose = options.onClose;
			this.#onSave = options.onSave;
		}
		getSelectedItems() {
			return this.#selectedItems;
		}
		createSelector() {
			this.#selector = new ui_entitySelector.Dialog({
				id: 'crm-forms--booking--booking-setting--resources-selector',
				preselectedItems: this.#selectedIds.map(id => [booking_const.EntitySelectorEntity.Resource, id]),
				width: 400,
				enableSearch: true,
				dropdownMode: true,
				context: 'crmFormsBookingResourcesSelector',
				multiple: true,
				cacheable: true,
				showAvatars: false,
				footer: ResourceSelectorDialogFooter,
				footerOptions: {
					onSave: this.#onSave,
					onClose: this.#onClose
				},
				entities: [{
					id: booking_const.EntitySelectorEntity.Resource,
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						shortSlotsOnly: true
					}
				}],
				searchOptions: {
					allowCreateItem: false
				},
				popupOptions: {
					overlay: {
						opacity: 40
					}
				},
				events: {
					onHide: this.hide.bind(this),
					onLoad: this.#changeSelected.bind(this)
				}
			});
			return this.#selector;
		}
		getSelectedIds() {
			return this.#selectedItems.map(({
				id
			}) => id);
		}
		hide() {
			if (main_core.Type.isFunction(this.#onClose)) {
				this.#onClose();
			}
		}
		#changeSelected() {
			this.#selectedItems = this.#selector.getSelectedItems();
		}
	}

	const subHeaderClassName = 'crm-form--booking--resources-manager--header-resources-section';
	class ResourcesManager {
		dialog = null;
		#targetNode;
		#selectedIds;
		#resourcesIds;
		#loadingResources = false;
		#options;
		#btnDeleteResources;
		#btnChangeResources;
		constructor(options) {
			this.#resourcesIds = options.selectedIds || [];
			this.#selectedIds = [];
			this.#targetNode = options.target;
			this.#options = options;
		}
		async show() {
			if (!this.dialog) {
				this.#initDialog();
				await this.#loadResources(this.#resourcesIds);
				const renderInitialContent = this.#resourcesIds.length > 0 ? this.#addSelectedItems.bind(this) : this.#appendEmptyState.bind(this);
				renderInitialContent();
			}
			this.dialog.show();
			main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
		}
		close() {
			if (this.dialog) {
				this.#options.onUpdateResourceIds(this.#resourcesIds);
				if (main_core.Type.isFunction(this.#options.onClose)) {
					this.#options.onClose(this.#resourcesIds);
				}
				this.dialog.destroy();
				main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
			}
		}
		adjustPosition() {
			if (this.dialog) {
				this.dialog.adjustPosition();
			}
		}
		get selectedResources() {
			if (this.#resourcesIds.length === 0) {
				return [];
			}
			return resourceStore.getByIds(this.#resourcesIds);
		}
		#initDialog() {
			this.dialog = new ui_entitySelector.Dialog({
				targetNode: this.#targetNode,
				id: 'booking-crm-form-resource-selector',
				height: Math.max(window.innerHeight - 300, 500),
				width: 356,
				offsetLeft: this.#targetNode.offsetWidth + 5,
				offsetTop: -300,
				addTagOnSelect: false,
				showAvatars: false,
				focusOnFirst: false,
				dropdownMode: true,
				enableSearch: true,
				searchOptions: {
					allowCreateItem: false
				},
				header: ContentHeader,
				headerOptions: {
					content: this.#getHeaderContent()
				},
				popupOptions: {
					className: 'crm-form--booking--resource-manager-popup',
					angle: {
						position: 'left'
					}
				},
				tagSelectorOptions: {
					textBoxWidth: '90%',
					placeholder: main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_SEARCH_PLACEHOLDER')
				},
				events: {
					onHide: () => this.#options.onClose?.(this.#resourcesIds),
					'Item:onSelect': event => {
						this.#selectItem(event.getData().item);
					},
					'Item:onDeselect': event => {
						this.#deselectItem(event.getData().item);
					}
				}
			});
			if (this.#resourcesIds.length > 0) {
				this.#appendSubHeaderContent();
			}
			this.dialog.removeItems();
		}
		#selectItem(item) {
			this.#selectedIds.push(item.id);
			if (this.#selectedIds.length > 0) {
				this.#showDeleteButton();
			}
		}
		#deselectItem(item) {
			this.#selectedIds = this.#selectedIds.filter(id => id !== item.id);
			if (this.#selectedIds.length === 0) {
				this.#hideDeleteButton();
			}
		}
		#deleteResources() {
			if (this.#selectedIds.length === 0) {
				return;
			}
			this.#setResourceIds(this.#resourcesIds.filter(id => !this.#selectedIds.includes(id)));
			this.#selectedIds = [];
			this.#hideDeleteButton();
		}
		#appendEmptyState() {
			const container = this.dialog.getPopup().getContentContainer();
			if (main_core.Type.isDomNode(container.querySelector('.crm-forms--booking--resources-manager-empty-state'))) {
				return;
			}
			const emptyState = main_core.Tag.render`
			<div class="crm-forms--booking--resources-manager-empty-state d-flex h-100 w-100 justify-content-center">
				<div class="d-flex flex-column align-items-center p-4">
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_icon"></div>
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_title fw-medium fs-6 lh-base">
						${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_EMPTY_TITLE')}
					</div>
					<div class="mb-3 crm-forms--booking--resources-manager-empty-state_text fw-normal">
						${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_EMPTY_MESSAGE')}
					</div>
					<div>
						<button
							class="btn btn-primary g-btn-size-l crm-forms--booking--resources-manager__empty-state-btn-add"
							type="button"
							onclick="${this.#openResourceSelector.bind(this)}"
						>
							${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_ADD_RESOURCES_BUTTON')}
						</button>
					</div>
				</div>
			</div>
		`;
			main_core.Dom.insertBefore(emptyState, container.querySelector('.ui-selector-items'));
		}
		#removeEmptyState() {
			const emptyStateEl = this.dialog.getPopup().getContentContainer().querySelector('.crm-forms--booking--resources-manager-empty-state');
			removeElement(emptyStateEl);
		}
		#updateResourcesCount(resourcesCount) {
			const resourcesCountEl = this.dialog.getPopup().getContentContainer().querySelector('.crm-form--booking--resources-manager--header-resources-count');
			if (main_core.Type.isDomNode(resourcesCountEl)) {
				resourcesCountEl.innerText = resourcesCount;
			}
		}
		async #loadResources(ids) {
			if (ids.length === 0) {
				return;
			}
			this.#setLoadingResources(true);
			await resourceStore.ensure(ids);
			this.#setLoadingResources(false);
		}
		#addSelectedItems() {
			this.dialog.removeItems();
			const resources = resourceStore.getByIds(this.#resourcesIds);
			for (const resource of resources) {
				this.dialog.addItem({
					id: resource.id,
					entityId: booking_const.EntitySelectorEntity.Resource,
					title: resource.name,
					subtitle: resource.typeName,
					tabs: booking_const.EntitySelectorTab.Recent
				});
			}
		}
		#setLoadingResources(loading) {
			this.#loadingResources = loading;
			if (this.#loadingResources) {
				this.dialog.showLoader();
			} else {
				this.dialog.hideLoader();
			}
		}
		#setResourceIds(selectedIds) {
			this.#resourcesIds = selectedIds;
			this.#addSelectedItems();
			this.#updateResourcesCount(selectedIds.length);
			this.#options.onUpdateResourceIds(selectedIds);
			if (selectedIds.length > 0) {
				this.#appendSubHeaderContent();
				this.#removeEmptyState();
			} else {
				this.#appendEmptyState();
				this.#removeSubHeadContent();
			}
		}
		#openResourceSelector(event) {
			const resourceSelector = new ResourcesSelector({
				targetNode: event?.target || null,
				selectedIds: this.#resourcesIds,
				onSave: this.#saveResourceSelector.bind(this),
				onClose: this.#closeResourceSelector.bind(this)
			}).createSelector();
			this.dialog.freeze();
			resourceSelector.show();
		}
		async #saveResourceSelector({
			resourceIds
		}) {
			await this.#loadResources(resourceIds);
			this.#setResourceIds(resourceIds);
		}
		#closeResourceSelector() {
			this.dialog.unfreeze();
		}
		#getHeaderContent() {
			return main_core.Tag.render`
			<div class="w-100 pt-3 px-3">
				<div class="d-flex align-items-end w-100">
					<h5 class="flex-grow-1">
						${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_TITLE')}
					</h5>
					<div
						class="landing-ui-button-icon-remove" 
						role="button"
						tabindex="0"
						onclick="${this.close.bind(this)}"
					></div>
				</div>
			</div>
		`;
		}
		#appendSubHeaderContent() {
			if (this.dialog.getPopup().getPopupContainer().querySelector(`.${subHeaderClassName}`)) {
				return;
			}
			const buttonChangeResourcesLabel = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_ADD_RESOURCES_BUTTON', {
				'#PLUS#': '+'
			});
			const buttonDeleteResourcesLabel = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_HEADER_DELETE_RESOURCES_BUTTON', {
				'#ICON#': '×'
			});
			const resourcesCount = main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCE_MANAGER_RESOURCES_COUNT', {
				'#COUNT#': `<span class="crm-form--booking--resources-manager--header-resources-count">${this.#resourcesIds.length}</span>`
			});
			const {
				root,
				btnDeleteResources,
				btnChangeResources
			} = main_core.Tag.render`
			<div class="${subHeaderClassName} d-flex align-items-center">
				<div class="crm-form--booking--resources-manager--header-resources flex-grow-1">
					<span class="pr-2 crm-form--booking--resources-manager--header-resources-title">
						${resourcesCount}
					</span>
				</div>
				<div>
					<button
						ref="btnDeleteResources"
						class="crm-form--booking--resources-manager--header__btn --none btn btn-outline-danger g-btn-size-sm"
						type="button"
						onclick="${this.#deleteResources.bind(this)}"
					>
						${buttonDeleteResourcesLabel}
					</button>
					<button
						ref="btnChangeResources"
						class="crm-form--booking--resources-manager--header__btn btn btn-primary g-btn-size-sm"
						type="button"
						onclick="${this.#openResourceSelector.bind(this)}"
					>
						${buttonChangeResourcesLabel}
					</button>
				</div>
			</div>
		`;
			this.#btnChangeResources = btnChangeResources;
			this.#btnDeleteResources = btnDeleteResources;
			const searchEl = this.dialog.getPopup().getPopupContainer().querySelector('.ui-selector-search');
			main_core.Dom.insertAfter(root, searchEl);
		}
		#showDeleteButton() {
			if (main_core.Type.isDomNode(this.#btnDeleteResources) && main_core.Type.isDomNode(this.#btnChangeResources)) {
				main_core.Dom.addClass(this.#btnChangeResources, '--none');
				main_core.Dom.removeClass(this.#btnDeleteResources, '--none');
			}
		}
		#hideDeleteButton() {
			if (main_core.Type.isDomNode(this.#btnDeleteResources) && main_core.Type.isDomNode(this.#btnChangeResources)) {
				main_core.Dom.removeClass(this.#btnChangeResources, '--none');
				main_core.Dom.addClass(this.#btnDeleteResources, '--none');
			}
		}
		#removeSubHeadContent() {
			const subHeadEl = document.querySelector(`.${subHeaderClassName}`);
			removeElement(subHeadEl);
		}
	}
	function removeElement(el) {
		if (main_core.Type.isDomNode(el)) {
			main_core.Dom.remove(el);
		}
	}

	class ResourcesField {
		#getResourceIds;
		#getBodyContainer;
		#onUpdateResourceIds;
		#resourcesManagerButton = null;
		constructor({
			getResourceIds,
			onUpdateResourceIds,
			getBodyContainer
		}) {
			this.#getBodyContainer = getBodyContainer;
			this.#getResourceIds = getResourceIds;
			this.#onUpdateResourceIds = onUpdateResourceIds;
		}
		get #counterClassName() {
			return 'crm-form--booking-resources-count';
		}
		render() {
			const buttonLabel = this.#getResourceIds().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');
			this.#resourcesManagerButton = main_core.Tag.render`
			<button
				id="booking--crm-forms--resource-manager-button"
				type="button"
				class="btn btn-primary g-btn-size-l"
				onclick="${this.#showResourcesManager.bind(this)}"
			>
				${buttonLabel}
			</button>
		`;
			return main_core.Tag.render`
			<div class="landing-ui-field d-flex">
				<div class="flex-grow-1">
					<div class="g-line-height-1_7 g-font-size-18 g-font-weight-500 g-color-gray-dark-v2">
						${main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_LABEL')}
					</div>
					<div class="crm-form--booking-resources-count"></div>
				</div>
				<div style="align-self: flex-end">
					${this.#resourcesManagerButton}
				</div>
			</div>
		`;
		}
		updateCounter() {
			const counterEl = (this.#getBodyContainer() || document).querySelector(`.${this.#counterClassName}`);
			if (main_core.Type.isDomNode(counterEl)) {
				counterEl.innerText = this.#getResourceIds().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_TEXT', {
					'#COUNT#': this.#getResourceIds().length
				}) : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_EMPTY');
			}
		}
		#showResourcesManager() {
			const resourcesManager = new ResourcesManager({
				target: this.#resourcesManagerButton,
				selectedIds: this.#getResourceIds(),
				onUpdateResourceIds: resourceIds => {
					this.#onUpdateResourceIds(resourceIds);
					this.updateCounter();
					this.#updateResourceManagerButton();
				}
			});
			resourcesManager.show();
		}
		#updateResourceManagerButton() {
			if (main_core.Type.isDomNode(this.#resourcesManagerButton)) {
				this.#resourcesManagerButton.innerText = this.#getResourceIds().length > 0 ? main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_CHANGE_BUTTON') : main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_RESOURCES_FIELD_ADD_BUTTON');
			}
		}
	}

	class BookingSettingsPopup extends main_core_events.EventEmitter {
		#options;
		#layout;
		#bookingSettingsDataModel;
		#isAutoSelectionOn;
		#templateId;
		#resourceLoader = null;
		#loadingResources = false;
		#catalogSkuEntityOptions = null;
		#managerField;
		constructor({
			listItemOptions,
			isAutoSelectionOn,
			templateId
		}) {
			super();
			this.setEventNamespace('BX.Booking.CrmForm.PublicForm.BookingSettingsPopup');
			this.#options = listItemOptions;
			this.#isAutoSelectionOn = isAutoSelectionOn;
			this.#templateId = templateId;
			this.#bookingSettingsDataModel = new BookingSettingsDataModel(listItemOptions.sourceOptions.settingsData || {}, isAutoSelectionOn, templateId);
			this.#initFields(this.#bookingSettingsDataModel.form);
		}
		#initFields(settingsData) {
			const changeField = field => {
				this.#updateSettings(field);
			};
			this.#layout = {};
			this.#layout.label = new LabelField(settingsData.label || '', label => changeField({
				label
			}));
			this.#layout.placeholder = new PlaceholderField(settingsData.textHeader || '', textHeader => changeField({
				textHeader
			}));
			this.#layout.hint = new HintField(settingsData.hint || '', hint => changeField({
				hint
			}));
			this.#layout.isVisibleHint = new HintVisibilityField(Boolean(settingsData?.isVisibleHint), isVisibleHint => changeField({
				isVisibleHint
			}));
			this.#layout.hasSlotsAllAvailableResources = new HasSlotsAllAvailableResourcesField(Boolean(settingsData?.hasSlotsAllAvailableResources), hasSlotsAllAvailableResources => changeField({
				hasSlotsAllAvailableResources
			}), this.#isAutoSelectionOn);
			this.#layout.sku = {};
			this.#layout.sku.label = new LabelField(settingsData.skuLabel || '', skuLabel => changeField({
				skuLabel
			}));
			this.#layout.sku.placeholder = new PlaceholderField(settingsData.skuTextHeader || '', skuTextHeader => changeField({
				skuTextHeader
			}));
			this.#layout.sku.hint = new HintField(settingsData.skuHint || '', skuHint => changeField({
				skuHint
			}));
			this.#layout.sku.isVisibleHint = new HintVisibilityField(Boolean(settingsData?.isVisibleSkuHint), isVisibleSkuHint => changeField({
				isVisibleSkuHint
			}));
		}
		get #templateWithSkus() {
			return booking_const.CrmFormTemplatesWithSku.includes(this.#templateId);
		}
		async show() {
			await this.#loadResources(this.#getResourceIds());
			if (this.#templateWithSkus) {
				await this.#loadSkus();
			}
			const container = this.#getBodyContainer();
			main_core.Dom.append(this.#renderContent(), container);
			BX.UI.Hint.init(container);
			this.#managerField.updateCounter();
			main_core.Dom.style(container, 'display', 'block');
		}
		async #loadResources(ids) {
			if (ids.length === 0) {
				return;
			}
			this.#setLoadingResources(true);
			await resourceStore.ensure(this.#getResourceIds());
			this.#setResourceIds(this.#filterAvailableResourceIds(ids));
			this.#setLoadingResources(false);
		}
		async #loadSkus() {
			this.#setLoadingResources(true);
			this.#catalogSkuEntityOptions = await booking_provider_service_crmFormService.crmFormService.getCatalogSkuEntityOptions();
			this.#setLoadingResources(false);
		}
		#setLoadingResources(loading) {
			const container = this.#getHeaderContainer();
			this.#loadingResources = loading;
			if (this.#loadingResources) {
				this.#resourceLoader ??= new main_loader.Loader({
					size: 40
				});
				main_core.Dom.style(container, 'opacity', 0.8);
				void this.#resourceLoader.show(container);
			} else {
				main_core.Dom.style(container, 'opacity', 1);
				void this.#resourceLoader.hide();
			}
		}
		#filterAvailableResourceIds(ids) {
			const availableResources = resourceStore.getAll();
			const availableResourceIds = new Set(availableResources.map(resource => resource.id));
			return ids.filter(id => availableResourceIds.has(id));
		}
		close() {
			const container = this.#getBodyContainer();
			this.emit('onClose');
			main_core.Dom.style(container, 'display', 'none');
			main_core.Dom.clean(container);
		}
		getSettings() {
			this.#updateSettings();
			return this.#options.sourceOptions.settingsData;
		}
		#getHeaderContainer() {
			return document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-header`);
		}
		#getBodyContainer() {
			return document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-body`);
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="landing-ui-form landing-ui-form-form-settings booking-crm-forms-settings">
				<div class="landing-ui-form-description"></div>
				${this.#templateWithSkus ? this.#renderSkuField() : this.#renderResourceField()}
				${this.#renderSkuLabelField()}
				${this.#renderSkuPlaceholderField()}
				${this.#renderSkuHintField()}
				${this.#renderIsVisibleSkuHint()}
				${this.#templateWithSkus ? '<div class="booking-crm-forms-settings-field-divider"></div>' : ''}
				${this.#renderLabelField()}
				${this.#renderPlaceholderField()}
				${this.#renderHintField()}
				${this.#renderIsVisibleHint()}
				${this.#renderHasSlotsAllAvailableResources()}
			</div>
		`;
		}
		#renderSkuField() {
			this.#managerField = new SkusAndResourcesField({
				catalogSkuEntityOptions: this.#catalogSkuEntityOptions,
				getResources: this.#getResources.bind(this),
				getBodyContainer: this.#getBodyContainer.bind(this),
				onUpdateResources: resources => {
					this.#setResources(resources);
					this.#updateSettings();
				}
			});
			return this.#managerField.render();
		}
		#renderResourceField() {
			this.#managerField = new ResourcesField({
				getResourceIds: this.#getResourceIds.bind(this),
				getBodyContainer: this.#getBodyContainer.bind(this),
				onUpdateResourceIds: resourceIds => {
					this.#setResourceIds(resourceIds);
					this.#updateSettings();
				}
			});
			return this.#managerField.render();
		}
		#getResourceIds() {
			return this.#bookingSettingsDataModel.form.resourceIds;
		}
		#getResources() {
			return this.#bookingSettingsDataModel.form.resources;
		}
		#setResourceIds(resourceIds) {
			this.#bookingSettingsDataModel.setSettingsData({
				resourceIds: main_core.Type.isArray(resourceIds) ? resourceIds : []
			});
			this.#updateSettings();
		}
		#setResources(resources) {
			this.#bookingSettingsDataModel.setSettingsData({
				resources: main_core.Type.isArray(resources) ? resources : []
			});
			this.#updateSettings();
		}
		#renderLabelField() {
			return this.#layout.label.getLayout();
		}
		#renderPlaceholderField() {
			return this.#layout.placeholder.getLayout();
		}
		#renderHintField() {
			if (this.#isAutoSelectionOn && !this.#bookingSettingsDataModel.form.hint) {
				this.#layout.hint.setValue(main_core.Loc.getMessage('BOOKING_CRM_FORMS_SETTINGS_HINT_DEFAULT_VALUE'));
			}
			return this.#layout.hint.getLayout();
		}
		#renderIsVisibleHint() {
			return this.#layout.isVisibleHint.getLayout();
		}
		#renderHasSlotsAllAvailableResources() {
			return this.#layout.hasSlotsAllAvailableResources.getLayout();
		}
		#renderSkuLabelField() {
			if (!this.#templateWithSkus) {
				return null;
			}
			return this.#layout.sku.label.getLayout();
		}
		#renderSkuPlaceholderField() {
			if (!this.#templateWithSkus) {
				return null;
			}
			return this.#layout.sku.placeholder.getLayout();
		}
		#renderSkuHintField() {
			if (!this.#templateWithSkus) {
				return null;
			}
			if (this.#isAutoSelectionOn && !this.#bookingSettingsDataModel.form.skuHint) {
				this.#layout.sku.hint.setValue('');
			}
			return this.#layout.sku.hint.getLayout();
		}
		#renderIsVisibleSkuHint() {
			return this.#layout.sku.isVisibleHint.getLayout();
		}
		#updateSettings(settings = null) {
			this.#bookingSettingsDataModel.setSettingsData(settings);
			this.#options.sourceOptions.settingsData = {
				...this.#options.sourceOptions.settingsData,
				isAutoSelectionOn: this.#isAutoSelectionOn,
				...this.#bookingSettingsDataModel.settingsData
			};
			this.emit('onChange');
			this.#options.form.emit('onChange');
		}
	}

	class Settings {
		#isAutoSelectionOn;
		#options;
		constructor(listItemOptions, formOptions = {}) {
			this.#options = listItemOptions;
			this.#isAutoSelectionOn = Boolean(formOptions?.bookingResourceAutoSelection?.use);
			this.settingsPopup = new BookingSettingsPopup({
				listItemOptions,
				isAutoSelectionOn: this.#isAutoSelectionOn,
				templateId: formOptions?.templateId
			});
		}
		getSettings() {
			return this.settingsPopup.getSettings();
		}
		showSettingsPopup() {
			const isToolDisabled = main_core.Extension.getSettings('booking.crm-forms.settings').isToolDisabled;
			if (isToolDisabled) {
				main_core.Runtime.loadExtension('ui.info-helper').then(({
					InfoHelper
				}) => {
					InfoHelper.show('limit_v2_booking_off');
				}).catch(err => {
					console.error(err);
				});
				return;
			}
			const container = document.querySelector(`.landing-ui-component-list-item[data-id="${this.#options.id}"] .landing-ui-component-list-item-body`);
			if (main_core.Dom.style(container, 'display') === 'block') {
				this.settingsPopup.close();
			} else {
				this.settingsPopup.show();
			}
		}
	}

	exports.Settings = Settings;

})(this.BX.Booking.CrmForms = this.BX.Booking.CrmForms || {}, BX, BX, BX.Event, BX.Booking.Const, BX.Booking.Provider.Service, BX.Booking.Application, BX.UI.EntitySelector);
//# sourceMappingURL=settings.bundle.js.map
