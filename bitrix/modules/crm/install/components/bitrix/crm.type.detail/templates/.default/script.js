/* eslint-disable */
(function (crm_integration_analytics, crm_router, crm_toolbarComponent, crm_typeModel, main_core, main_core_events, main_loader, ui_analytics, ui_dialogs_messagebox, ui_entitySelector, ui_alerts) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Component');
	let instance = null;

	/**
	 * @memberOf BX.Crm.Component
	 */
	class TypeDetail {
		isProgress = false;
		tabs = new Map();
		isRestricted = false;
		isExternal = false;
		isSaveFromTypeDetail = true;
		isCreateSectionsViaAutomatedSolutionDetails = false;
		canEditAutomatedSolution = false;
		permissionsUrl = null;
		#isCancelEventRegistered = false;
		constructor(params) {
			if (main_core.Type.isPlainObject(params)) {
				this.type = params.type;
				this.isNew = !this.type.isSaved();
				this.form = params.form;
				this.container = params.container;
				this.errorsContainer = params.errorsContainer;
				this.presets = params.presets;
				this.relations = params.relations;
				this.isRestricted = Boolean(params.isRestricted);
				this.restrictionErrorMessage = main_core.Type.isStringFilled(params.restrictionErrorMessage) ? params.restrictionErrorMessage : '';
				this.restrictionSliderCode = main_core.Type.isStringFilled(params.restrictionSliderCode) && this.isRestricted ? params.restrictionSliderCode : null;
				this.isExternal = Boolean(params.isExternal);
				this.isCreateSectionsViaAutomatedSolutionDetails = Boolean(params.isCreateSectionsViaAutomatedSolutionDetails);
				this.canEditAutomatedSolution = Boolean(params.canEditAutomatedSolution);
				if (main_core.Type.isStringFilled(params.permissionsUrl)) {
					this.permissionsUrl = params.permissionsUrl;
				}
			}
			this.buttonsPanel = document.getElementById('ui-button-panel');
			this.saveButton = document.getElementById('ui-button-panel-save');
			this.cancelButton = document.getElementById('ui-button-panel-cancel');
			this.deleteButton = document.getElementById('ui-button-panel-remove');

			// eslint-disable-next-line unicorn/no-this-assignment
			instance = this;
		}
		init() {
			this.bindEvents();
			this.fillTabs();
			if (this.type.getId()) {
				// const customPreset = this.getPresetById('bitrix:empty');
				// const presetSelector = document.querySelector('[data-role="crm-type-preset-selector"]');
				// if (customPreset && presetSelector)
				// {
				// 	presetSelector.textContent = customPreset.fields.title;
				// }
				this.disablePresetsView();
				const presetSelectorContainer = document.querySelector('[data-role="preset-selector-container"]');
				if (presetSelectorContainer) {
					main_core.Dom.addClass(presetSelectorContainer, 'crm-type-hidden');
				}
			} else {
				this.enablePresetsView();
			}
			main_core.Dom.removeClass(document.querySelector('body'), 'crm-type-hidden');
			this.initRelations();
			this.initCustomSections();
		}
		bindEvents() {
			main_core.Event.bind(this.saveButton, 'click', event => {
				this.save(event);
			}, {
				passive: false
			});
			if (this.deleteButton) {
				main_core.Event.bind(this.deleteButton, 'click', event => {
					this.delete(event);
				});
			}
			const userFieldOption = this.getBooleanFieldNodeByName('isUseInUserfieldEnabled');
			if (userFieldOption) {
				main_core.Event.bind(userFieldOption, 'click', this.disableLinkedUserFieldsIfNotAvailable.bind(this));
			}
			this.form.querySelectorAll('[data-name*="linkedUserFields"]').forEach(linkedUserFieldNode => {
				main_core.Event.bind(linkedUserFieldNode, 'click', this.enableUserFieldIfAnyLinkedChecked.bind(this));
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', event => {
				const [sliderEvent] = event.getData();
				const slider = sliderEvent.getSlider();
				if (slider === this.getSlider()) {
					this.#registerCancelEvent(crm_integration_analytics.Dictionary.ELEMENT_ESC_BUTTON);
				}
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => {
				const [sliderEvent] = event.getData();
				const slider = sliderEvent.getSlider();
				if (slider === this.getSlider()) {
					this.#registerCancelEvent(null);
				}
			});
			this.handleSliderDestroy = this.handleSliderDestroy.bind(this);
			top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
		}
		handleSliderDestroy(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (slider.getFrameWindow() === window) {
				// if we add event handler from iframe to the main page, they will live forever, even after slider destroys
				// sometimes it causes errors, like in this case
				this.destroy();
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		#registerCancelEvent(element) {
			if (this.#isCancelEventRegistered) {
				return;
			}
			this.#isCancelEventRegistered = true;
			ui_analytics.sendData(this.#getAnalyticsBuilder().setElement(element).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
		}
		destroy() {
			this.customSectionController?.destroy();
		}
		enablePresetsView() {
			main_core.Dom.addClass(document.querySelector('body'), 'crm-type-settings-presets');
			const activeTab = this.container.querySelector('.crm-type-tab-current');
			if (activeTab) {
				main_core.Dom.removeClass(activeTab, 'crm-type-tab-current');
			}
			const presetsTab = this.container.querySelector('[data-tab="presets"]');
			if (presetsTab) {
				main_core.Dom.addClass(presetsTab, 'crm-type-tab-current');
			}
			const presetSelectorContainer = document.querySelector('[data-role="preset-selector-container"]');
			if (presetSelectorContainer) {
				main_core.Dom.addClass(presetSelectorContainer, 'crm-type-hidden');
			}
			main_core.Dom.removeClass(document.getElementById('pagetitle'), 'crm-type-hidden');
			main_core.Dom.addClass(this.buttonsPanel, 'crm-type-hidden');
			this.hideErrors();
		}
		disablePresetsView() {
			main_core.Dom.removeClass(document.querySelector('body'), 'crm-type-settings-presets');
			(this.#findActiveTabButton() ?? this.#findFirstTabButton()).click();
			const presetSelectorContainer = document.querySelector('[data-role="preset-selector-container"]');
			if (presetSelectorContainer) {
				main_core.Dom.removeClass(presetSelectorContainer, 'crm-type-hidden');
			}
			main_core.Dom.addClass(document.getElementById('pagetitle'), 'crm-type-hidden');
			main_core.Dom.removeClass(this.buttonsPanel, 'crm-type-hidden');
		}
		#findActiveTabButton() {
			return document.querySelector('.ui-sidepanel-menu-item.ui-sidepanel-menu-active > [data-role^=tab-]');
		}
		#findFirstTabButton() {
			return document.querySelector('.ui-sidepanel-menu-item > [data-role^=tab-]');
		}
		disableLinkedUserFieldsIfNotAvailable() {
			const userFieldOption = this.getBooleanFieldNodeByName('isUseInUserfieldEnabled');
			if (!this.isBooleanFieldChecked(userFieldOption)) {
				this.form.querySelectorAll('[data-name*="linkedUserFields"]').forEach(linkedUserFieldNode => {
					this.setBooleanFieldCheckedState(linkedUserFieldNode, false);
				});
			}
		}
		enableUserFieldIfAnyLinkedChecked() {
			const userFieldOption = this.getBooleanFieldNodeByName('isUseInUserfieldEnabled');
			if (!this.isBooleanFieldChecked(userFieldOption)) {
				this.form.querySelectorAll('[data-name*="linkedUserFields"]').forEach(linkedUserFieldNode => {
					if (this.isBooleanFieldChecked(linkedUserFieldNode)) {
						this.setBooleanFieldCheckedState(userFieldOption, true);
					}
				});
			}
		}
		getLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					size: 150
				});
			}
			return this.loader;
		}
		startProgress() {
			this.isProgress = true;
			if (!this.getLoader().isShown()) {
				this.getLoader().show(this.form);
			}
			this.hideErrors();
		}
		stopProgress() {
			this.isProgress = false;
			this.getLoader().hide();
			setTimeout(() => {
				main_core.Dom.removeClass(this.saveButton, 'ui-btn-wait');
				main_core.Dom.removeClass(this.cancelButton, 'ui-btn-wait');
				if (this.deleteButton) {
					main_core.Dom.removeClass(this.deleteButton, 'ui-btn-wait');
				}
			}, 200);
		}
		save(event) {
			if (this.isRestricted) {
				if (main_core.Type.isStringFilled(this.restrictionSliderCode) && main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
					BX.UI.InfoHelper.show(this.restrictionSliderCode);
				} else {
					this.showErrors([this.restrictionErrorMessage]);
				}
				this.stopProgress();
				return;
			}
			event.preventDefault();
			if (!this.form) {
				return;
			}
			if (this.isProgress) {
				return;
			}
			if (!this.type) {
				return;
			}
			this.startProgress();
			this.type.setTitle(this.form.querySelector('[name="title"]').value);
			crm_typeModel.TypeModel.getBooleanFieldNames().forEach(fieldName => {
				const fieldNode = this.getBooleanFieldNodeByName(fieldName);
				if (fieldNode) {
					this.type.data[fieldName] = this.isBooleanFieldChecked(fieldNode);
				}
			});
			// this.type.setConversionMap({
			// 	sourceTypes: this.collectEntityTypeIds('conversion-source'),
			// 	destinationTypes: this.collectEntityTypeIds('conversion-destination'),
			// });
			const linkedUserFields = {};
			this.form.querySelectorAll('[data-name*="linkedUserFields"]').forEach(linkedUserFieldNode => {
				const name = linkedUserFieldNode.dataset.name.slice('linkedUserFields['.length).replace(']', '');
				linkedUserFields[name] = this.isBooleanFieldChecked(linkedUserFieldNode);
			});
			this.type.setLinkedUserFields(linkedUserFields);
			this.type.setRelations({
				parent: this.parentRelationsController.getData(),
				child: this.childRelationsController.getData()
			});
			if (this.customSectionController) {
				const customSectionData = this.customSectionController.getData();
				this.type.setCustomSectionId(customSectionData.customSectionId);
				this.type.setCustomSections(customSectionData.customSections);
				this.type.setIsExternalDynamicalType(this.isExternal);
				this.type.setIsSaveFromTypeDetail(this.isSaveFromTypeDetail);
			}
			const analyticsBuilder = this.#getAnalyticsBuilder().setElement(crm_integration_analytics.Dictionary.ELEMENT_CREATE_BUTTON);
			ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ATTEMPT).buildData());
			this.type.save().then(response => {
				ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).setId(this.type.getId()).buildData());
				this.#isCancelEventRegistered = true;
				this.stopProgress();
				this.afterSave(response);
				this.isNew = false;
			}).catch(errors => {
				ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).setId(this.type.getId()).buildData());
				this.showErrors(errors);
				this.stopProgress();
			});
		}
		#getAnalyticsBuilder() {
			const builder = this.isNew ? new crm_integration_analytics.Builder.Automation.Type.CreateEvent() : new crm_integration_analytics.Builder.Automation.Type.EditEvent();
			builder.setIsExternal(this.isExternal);
			if (main_core.Type.isStringFilled(this.selectedPresetId)) {
				builder.setPreset(this.selectedPresetId);
			}
			if (this.type.getId() > 0) {
				builder.setId(this.type.getId());
			}
			const currentUrl = new main_core.Uri(decodeURI(window.location.href));
			if (currentUrl.getQueryParam('c_sub_section') && builder instanceof crm_integration_analytics.Builder.Automation.Type.EditEvent) {
				builder.setSubSection(currentUrl.getQueryParam('c_sub_section'));
			}
			return builder;
		}
		collectEntityTypeIds(role) {
			const entityTypeIds = [];
			const checkboxes = this.container.querySelectorAll(`[data-role="${role}"]`);
			[...checkboxes].forEach(checkbox => {
				if (checkbox.checked) {
					entityTypeIds.push(checkbox.dataset.entityTypeId);
				}
			});
			return entityTypeIds;
		}
		afterSave(response) {
			this.addDataToSlider('response', response);
			if (Object.hasOwn(response.data, 'urlTemplates')) {
				crm_router.Router.Instance.setUrlTemplates(response.data.urlTemplates);
			}
			this.getSlider()?.close();
			this.emitTypeUpdatedEvent({
				isUrlChanged: response.data.isUrlChanged === true
			});
		}
		getSlider() {
			return BX.SidePanel?.Instance?.getSliderByWindow(window);
		}
		emitTypeUpdatedEvent(data) {
			crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent(data);
		}
		addDataToSlider(key, data) {
			if (main_core.Type.isString(key) && main_core.Type.isPlainObject(data)) {
				const slider = this.getSlider();
				if (slider) {
					slider.data.set(key, data);
				}
			}
		}
		showErrors(errors) {
			let text = '';
			errors.forEach(message => {
				text += message;
			});
			if (main_core.Type.isDomNode(this.errorsContainer)) {
				this.errorsContainer.innerText = text;
				main_core.Dom.style(this.errorsContainer.parentNode, 'display', 'block');
			} else {
				console.error(text);
			}
		}
		hideErrors() {
			if (main_core.Type.isDomNode(this.errorsContainer)) {
				main_core.Dom.style(this.errorsContainer.parentNode, 'display', 'none');
				this.errorsContainer.innerText = '';
			}
		}
		delete(event) {
			event.preventDefault();
			if (!this.form) {
				return;
			}
			if (this.isProgress) {
				return;
			}
			if (!this.type) {
				return;
			}
			const currentUrl = new main_core.Uri(decodeURI(window.location.href));
			const analyticsBuilder = new crm_integration_analytics.Builder.Automation.Type.DeleteEvent().setElement(crm_integration_analytics.Dictionary.ELEMENT_DELETE_BUTTON).setIsExternal(this.isExternal).setSubSection(currentUrl.getQueryParam('c_sub_section')).setId(this.type.getId());
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('CRM_TYPE_DETAIL_DELETE_CONFIRM'), () => {
				return new Promise(resolve => {
					ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ATTEMPT).buildData());
					this.startProgress();
					this.type.delete().then(response => {
						ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).buildData());
						this.#isCancelEventRegistered = true;
						this.stopProgress();
						const isUrlChanged = main_core.Type.isObject(response.data) && response.data.isUrlChanged === true;
						this.emitTypeUpdatedEvent({
							isUrlChanged
						});
						crm_router.Router.Instance.closeSliderOrRedirect(crm_router.Router.Instance.getTypeListUrl());
					}).catch(errors => {
						ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).buildData());
						this.showErrors(errors);
						this.stopProgress();
						resolve();
					});
				});
			}, null, box => {
				ui_analytics.sendData(analyticsBuilder.setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
				this.stopProgress();
				box.close();
			});
		}
		fillTabs() {
			if (this.container) {
				this.container.querySelectorAll('.crm-type-tab').forEach(tabNode => {
					if (tabNode.dataset.tab) {
						this.tabs.set(tabNode.dataset.tab, tabNode);
					}
				});
			}
		}
		showTab(tabNameToShow) {
			[...this.tabs.keys()].forEach(tabName => {
				if (tabName === tabNameToShow) {
					main_core.Dom.addClass(this.tabs.get(tabName), 'crm-type-tab-current');
				} else {
					main_core.Dom.removeClass(this.tabs.get(tabName), 'crm-type-tab-current');
				}
			});
		}
		applyPreset(presetId) {
			this.disablePresetsView();
			const presetSelector = document.querySelector('[data-role="crm-type-preset-selector"]');
			const currentPresetNode = this.container.querySelector('[data-role="preset"].crm-type-preset-active');
			if (currentPresetNode) {
				const currentPreset = this.getPresetById(currentPresetNode.dataset.presetId);
				if (currentPreset && currentPreset.data.title && this.form.querySelector('[name="title"]').value === currentPreset.data.title) {
					this.form.querySelector('[name="title"]').value = '';
				}
			}
			const presets = this.container.querySelectorAll('[data-role="preset"]');
			presets.forEach(presetNode => {
				main_core.Dom.removeClass(presetNode, 'crm-type-preset-active');
				if (presetNode.dataset.presetId === presetId) {
					main_core.Dom.addClass(presetNode, 'crm-type-preset-active');
					const preset = this.getPresetById(presetId);
					if (preset) {
						this.updateInputs(preset.data);
						if (presetSelector) {
							presetSelector.textContent = main_core.Text.encode(preset.fields.title);
						}
					}
				}
			});
			this.selectedPresetId = presetId;
		}
		getPresetById(presetId) {
			for (const preset of this.presets) {
				if (preset.fields.id === presetId) {
					return preset;
				}
			}
			return null;
		}
		updateInputs(data) {
			if (this.form.querySelector('[name="title"]').value.length <= 0) {
				this.form.querySelector('[name="title"]').value = data.title || '';
			}
			crm_typeModel.TypeModel.getBooleanFieldNames().forEach(fieldName => {
				const node = this.getBooleanFieldNodeByName(fieldName);
				if (node) {
					this.setBooleanFieldCheckedState(node, data[fieldName]);
				}
			});
			this.disableLinkedUserFieldsIfNotAvailable();
		}
		toggleBooleanField(fieldName) {
			const node = this.getBooleanFieldNodeByName(fieldName);
			if (!node) {
				return;
			}
			if (node.nodeName === 'INPUT') {
				node.checked = !node.checked;
			} else {
				main_core.Dom.toggleClass(node, 'crm-type-field-button-item-active');
			}
		}
		getBooleanFieldNodeByName(fieldName) {
			return this.container.querySelector(`[data-name="${fieldName}"]`);
		}
		isBooleanFieldChecked(node) {
			if (node.nodeName === 'INPUT') {
				return node.checked;
			}
			return main_core.Dom.hasClass(node, 'crm-type-field-button-item-active');
		}
		setBooleanFieldCheckedState(node, isChecked) {
			if (node.nodeName === 'INPUT') {
				// eslint-disable-next-line no-param-reassign
				node.checked = isChecked;
				return;
			}
			if (isChecked) {
				main_core.Dom.addClass(node, 'crm-type-field-button-item-active');
			} else {
				main_core.Dom.removeClass(node, 'crm-type-field-button-item-active');
			}
		}
		initRelations() {
			this.parentRelationsController = new RelationsController({
				switcher: BX.UI.Switcher.getById('crm-type-relation-parent-switcher'),
				container: this.container.querySelector('[data-role="crm-type-relation-parent-items"]'),
				typeSelectorContainer: this.container.querySelector('[data-role="crm-type-relation-parent-items-selector"]'),
				tabsContainer: this.container.querySelector('[data-role="crm-type-relation-parent-items-tabs"]'),
				tabsCheckbox: this.container.querySelector('[data-name="isRelationParentShowChildrenEnabled"]'),
				tabsSelectorContainer: this.container.querySelector('[data-role="crm-type-relation-parent-items-tabs-selector"]'),
				relations: this.relations.parent
			});
			this.childRelationsController = new RelationsController({
				switcher: BX.UI.Switcher.getById('crm-type-relation-child-switcher'),
				container: this.container.querySelector('[data-role="crm-type-relation-child-items"]'),
				typeSelectorContainer: this.container.querySelector('[data-role="crm-type-relation-child-items-selector"]'),
				tabsContainer: this.container.querySelector('[data-role="crm-type-relation-child-items-tabs"]'),
				tabsCheckbox: this.container.querySelector('[data-name="isRelationChildShowChildrenEnabled"]'),
				tabsSelectorContainer: this.container.querySelector('[data-role="crm-type-relation-child-items-tabs-selector"]'),
				relations: this.relations.child
			});
		}
		initCustomSections() {
			this.customSectionController = new CustomSectionsController({
				switcher: BX.UI.Switcher.getById('crm-type-custom-section-switcher'),
				container: this.container.querySelector('[data-role="crm-type-custom-section-container"]'),
				selectorContainer: this.container.querySelector('[data-role="crm-type-custom-section-selector"]'),
				customSections: this.type.getCustomSections() || [],
				isCreateSectionsViaAutomatedSolutionDetails: this.isCreateSectionsViaAutomatedSolutionDetails,
				canEditAutomatedSolution: this.canEditAutomatedSolution,
				isNew: this.isNew,
				permissionsUrl: this.permissionsUrl
			});
		}
		static handleLeftMenuClick(tabName) {
			if (instance) {
				instance.showTab(tabName);
			}
		}
		static handlePresetClick(presetId) {
			if (instance) {
				instance.applyPreset(presetId);
			}
		}
		static handleHideDescriptionClick(target) {
			main_core.Dom.style(target.parentNode, 'display', 'none');
		}
		static handleBooleanFieldClick(fieldName) {
			instance?.toggleBooleanField(fieldName);
		}
		static handlePresetSelectorClick() {
			instance?.enablePresetsView();
		}
		static handleCancelButtonClick() {
			// if we just add click event handler to cancel button node, that handler will be called after slider close
			// to capture click before that, we need to add handler directly to markup
			instance?.#registerCancelEvent(crm_integration_analytics.Dictionary.ELEMENT_CANCEL_BUTTON);
		}
	}
	namespace.TypeDetail = TypeDetail;
	class RelationsController {
		constructor(options) {
			this.switcher = options.switcher;
			this.container = options.container;
			this.typeSelectorContainer = options.typeSelectorContainer;
			this.tabsContainer = options.tabsContainer;
			this.tabsCheckbox = options.tabsCheckbox;
			this.tabsSelectorContainer = options.tabsSelectorContainer;
			this.relations = options.relations;
			this.initSelectors();
			this.adjustInitialState();
			this.bindEvents();
			this.adjust();
		}
		initSelectors() {
			const unselectedTypes = [];
			const selectedTypes = [];
			const unselectedTabs = [];
			const selectedTabs = [];
			this.relations.forEach(relation => {
				const item = {
					id: relation.entityTypeId,
					entityId: 'crmType',
					title: relation.title,
					tabs: 'recents'
				};
				if (relation.isChecked) {
					selectedTypes.push(item);
					if (relation.isChildrenListEnabled) {
						selectedTabs.push(item);
					} else {
						unselectedTabs.push(item);
					}
				} else {
					unselectedTypes.push(item);
				}
			});
			this.typeSelector = new ui_entitySelector.TagSelector({
				dialogOptions: {
					enableSearch: false,
					multiple: false,
					items: unselectedTypes,
					selectedItems: selectedTypes,
					dropdownMode: true,
					height: 200,
					showAvatars: false
				},
				events: {
					onAfterTagAdd: this.adjust.bind(this),
					onAfterTagRemove: this.adjust.bind(this)
				}
			});
			this.typeSelector.renderTo(this.typeSelectorContainer);
			this.tabsSelector = new ui_entitySelector.TagSelector({
				dialogOptions: {
					enableSearch: false,
					multiple: false,
					items: unselectedTabs,
					selectedItems: selectedTabs,
					dropdownMode: true,
					height: 200,
					showAvatars: false
				}
			});
			this.tabsSelector.renderTo(this.tabsSelectorContainer);
		}
		adjustInitialState() {
			const selectedTypes = this.typeSelector.getDialog().getSelectedItems();
			if (selectedTypes.length > 0) {
				this.switcher.check(true);
			}
			this.tabsCheckbox.checked = this.tabsSelector.getDialog().getSelectedItems().length > 0;
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe(this.switcher, 'toggled', this.adjust.bind(this));
			main_core.Event.bind(this.tabsCheckbox, 'click', this.adjust.bind(this));
		}
		adjust() {
			if (this.switcher.isChecked()) {
				main_core.Dom.removeClass(this.container, 'crm-type-hidden');
			} else {
				main_core.Dom.addClass(this.container, 'crm-type-hidden');
			}
			const selectedTypes = this.typeSelector.getDialog().getSelectedItems();
			if (selectedTypes.length > 0) {
				main_core.Dom.removeClass(this.tabsContainer, 'crm-type-hidden');
			} else {
				main_core.Dom.addClass(this.tabsContainer, 'crm-type-hidden');
			}
			if (this.tabsCheckbox.checked) {
				main_core.Dom.removeClass(this.tabsSelectorContainer, 'crm-type-hidden');
			} else {
				main_core.Dom.addClass(this.tabsSelectorContainer, 'crm-type-hidden');
			}
			this.tabsSelector.getDialog().getItems().forEach(item => {
				if (!this.isItemSelected(item, selectedTypes)) {
					item.deselect();
					this.tabsSelector.getDialog().removeItem(item);
					this.tabsSelector.removeTag({
						id: item.getId(),
						entityId: item.getEntityId()
					});
				}
			});
			selectedTypes.forEach(item => {
				const itemData = {
					id: item.getId(),
					entityId: item.getEntityId(),
					title: item.getTitle(),
					tabs: 'recents'
				};
				const tabItem = this.tabsSelector.getDialog().getItem(itemData);
				if (!tabItem) {
					const newItem = this.tabsSelector.getDialog().addItem(itemData);
					newItem.select();
				}
			});
		}
		isItemSelected(item, selectedItems) {
			return selectedItems.some(selectedItem => {
				return item.id === selectedItem.id;
			});
		}
		getData() {
			const data = [];
			if (!this.switcher.isChecked()) {
				return [];
			}
			const isTabsCheckboxChecked = this.tabsCheckbox.checked;
			const selectedTypes = this.typeSelector.getDialog().getSelectedItems();
			selectedTypes.forEach(selectedType => {
				const type = {
					entityTypeId: selectedType.getId(),
					isChildrenListEnabled: false
				};
				if (isTabsCheckboxChecked && this.isItemSelected(selectedType, this.tabsSelector.getDialog().getSelectedItems())) {
					type.isChildrenListEnabled = true;
				}
				data.push(type);
			});
			return data;
		}
	}
	class CustomSectionsController {
		permissionsResetAlert = null;
		isPermissionsResetAlertShown = false;
		permissionsUrl = null;
		constructor(options) {
			this.switcher = options.switcher;
			this.container = options.container;
			this.selectorContainer = options.selectorContainer;
			if (main_core.Type.isArray(options.customSections)) {
				this.customSections = options.customSections;
			} else {
				this.customSections = [];
			}
			this.originallySelectedCustomSection = this.customSections.find(section => section.isSelected) ?? null;
			this.isNew = main_core.Type.isBoolean(options.isNew) ? options.isNew : false;
			if (main_core.Type.isBoolean(options.isCreateSectionsViaAutomatedSolutionDetails)) {
				this.isCreateSectionsViaAutomatedSolutionDetails = options.isCreateSectionsViaAutomatedSolutionDetails;
			}
			if (main_core.Type.isBoolean(options.canEditAutomatedSolution)) {
				this.canEditAutomatedSolution = options.canEditAutomatedSolution;
			}
			if (main_core.Type.isStringFilled(options.permissionsUrl)) {
				this.permissionsUrl = options.permissionsUrl;
			}
			this.initSelector();
			this.settingsContainer = main_core.Tag.render`
			<div class="crm-type-hidden crm-type-custom-sections-settings-container">
				<div class="crm-type-relation-subtitle">${main_core.Loc.getMessage('CRM_TYPE_DETAIL_CUSTOM_SECTION_LIST_MSGVER_1')}</div>
			</div>
		`;
			this.container.append(this.settingsContainer);
			this.adjustInitialState();
			this.bindEvents();
			this.adjust();
		}
		destroy() {
			this.unbindEvents();
			this.selector?.unsubscribeAll();
		}
		initSelector() {
			const items = [];
			const selectedItems = [];
			this.customSections.forEach(section => {
				const item = {
					id: section.id,
					entityId: 'custom-section',
					title: section.title,
					tabs: 'recents'
				};
				items.push(item);
				if (section.isSelected) {
					selectedItems.push(item);
				}
			});
			const adjustResetPermissionsAlertDebounce = main_core.Runtime.debounce(this.adjustResetPermissionsAlert.bind(this), 200);
			const tagSelectorOptions = {
				multiple: false,
				dialogOptions: {
					items,
					selectedItems,
					dropdownMode: true,
					height: 200,
					showAvatars: false
				},
				events: {
					onAfterTagRemove: adjustResetPermissionsAlertDebounce,
					onAfterTagAdd: adjustResetPermissionsAlertDebounce
				}
			};
			if (this.isCreateSectionsViaAutomatedSolutionDetails) {
				tagSelectorOptions.showCreateButton = false;
				tagSelectorOptions.dialogOptions.footer = main_core.Tag.render`
				<a
					onclick="${this.onOpenAutomatedSolutionCreationSliderClick.bind(this)}"
					class="ui-selector-footer-link ui-selector-footer-link-add"
				>${main_core.Loc.getMessage('CRM_COMMON_ACTION_CREATE')}</a>
			`;
			} else {
				tagSelectorOptions.showCreateButton = true;
				tagSelectorOptions.createButtonCaption = main_core.Loc.getMessage('CRM_COMMON_ACTION_CONFIG');
				tagSelectorOptions.events = {
					onCreateButtonClick: this.onCreateButtonClick.bind(this)
				};
			}
			if (!this.canEditAutomatedSolution) {
				tagSelectorOptions.locked = true;
			}
			this.selector = new ui_entitySelector.TagSelector(tagSelectorOptions);
			this.selector.renderTo(this.selectorContainer);
		}
		adjustResetPermissionsAlert() {
			if (!FeatureManager.getInstance().isPermissionsLayoutV2Enabled() || this.permissionsUrl === null || this.isNew) {
				return;
			}
			const selectedItems = this.selector.getDialog().getSelectedItems();
			const item = selectedItems[0] ?? null;
			const alert = this.getPermissionsResetAlert();
			const isItemChanged = item?.getId() !== this.originallySelectedCustomSection?.id && this.switcher.isChecked();
			const isDetachCustomSection = this.originallySelectedCustomSection && !this.switcher.isChecked();
			const isShow = isItemChanged || isDetachCustomSection;
			if (isShow) {
				if (!this.isPermissionsResetAlertShown) {
					this.isPermissionsResetAlertShown = true;
					alert.renderTo(this.container.parentNode);
					alert.show();
				}
				return;
			}
			if (this.isPermissionsResetAlertShown) {
				this.isPermissionsResetAlertShown = false;
				alert.hide();
			}
		}
		getPermissionsResetAlert() {
			if (this.permissionsResetAlert === null) {
				const text = main_core.Loc.getMessage('CRM_TYPE_DETAIL_PERMISSIONS_WILL_BE_RESET_ALERT').replace('#LINK#', this.permissionsUrl);
				this.permissionsResetAlert = new ui_alerts.Alert({
					size: ui_alerts.AlertSize.MD,
					color: ui_alerts.AlertColor.WARNING,
					customClass: 'crm-type-permissions-reset-alert',
					text
				});
			}
			return this.permissionsResetAlert;
		}
		reInitSelector() {
			this.selector.getDialog().destroy();
			this.selector.unsubscribeAll();
			this.selector = null;
			main_core.Dom.clean(this.selectorContainer);
			this.initSelector();
		}
		showSelector() {
			main_core.Dom.removeClass(this.selectorContainer, 'crm-type-hidden');
		}
		hideSelector() {
			main_core.Dom.addClass(this.selectorContainer, 'crm-type-hidden');
		}
		adjustInitialState() {
			const selectedSection = this.selector.getDialog().getSelectedItems();
			if (selectedSection.length > 0) {
				this.switcher.check(true);
			}
		}
		bindEvents() {
			this.adjust = this.adjust.bind(this);
			this.onAutomatedSolutionUpdate = this.onAutomatedSolutionUpdate.bind(this);
			main_core_events.EventEmitter.subscribe(this.switcher, 'toggled', this.adjust);
			main_core_events.EventEmitter.subscribe(this.switcher, 'toggled', this.adjustResetPermissionsAlert.bind(this));
			if (this.isCreateSectionsViaAutomatedSolutionDetails) {
				crm_toolbarComponent.ToolbarComponent.Instance.subscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
			}
		}
		unbindEvents() {
			main_core_events.EventEmitter.unsubscribe(this.switcher, 'toggled', this.adjust);
			crm_toolbarComponent.ToolbarComponent.Instance.unsubscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
		}
		onAutomatedSolutionUpdate(event) {
			const id = main_core.Text.toInteger(event.getData().intranetCustomSectionId);
			const title = String(event.getData().title);
			if (id <= 0 || !main_core.Type.isStringFilled(title)) {
				return;
			}
			const currentCustomSection = this.customSections.find(section => main_core.Text.toInteger(section.id) === id);
			if (currentCustomSection) {
				currentCustomSection.title = title;
			} else {
				this.customSections.push({
					id,
					title
				});
			}
			this.reInitSelector();
			this.selectCustomSectionById(id);
		}
		selectCustomSectionById(id) {
			const dialog = this.selector.getDialog();
			dialog.deselectAll();
			dialog.getItem({
				entityId: 'custom-section',
				id
			})?.select();
		}
		onOpenAutomatedSolutionCreationSliderClick() {
			void crm_router.Router.Instance.openAutomatedSolutionDetail();
		}
		onCreateButtonClick() {
			this.hideSelector();
			this.showSectionsList();
		}
		renderSectionsConfig() {
			if (!this.sectionsListContainer) {
				this.sectionsListContainer = main_core.Tag.render`<div class="crm-type-custom-sections-list-container"></div>`;
				this.settingsContainer.append(this.sectionsListContainer);
			}
			this.renderSectionsList(this.sectionsListContainer);
			if (!this.addSectionItemButton) {
				this.addSectionItemButton = main_core.Tag.render`
				<div class="crm-type-custom-section-add-item-container">
					<span
						class="crm-type-custom-section-add-item-button"
						onclick="${() => this.sectionsListContainer.append(this.renderSectionItem())}"
					>
						${main_core.Loc.getMessage('CRM_COMMON_ACTION_CREATE')}
					</span>
				</div>
			`;
				this.settingsContainer.append(this.addSectionItemButton);
			}
			if (!this.buttonsContainer) {
				this.settingsContainer.append(main_core.Tag.render`<hr class="crm-type-custom-sections-line">`);
				this.buttonsContainer = main_core.Tag.render`<div class="crm-type-custom-sections-buttons-container"></div>`;
				this.settingsContainer.append(this.buttonsContainer);
			}
			if (!this.saveButton) {
				this.saveButton = main_core.Tag.render`<span class="ui-btn ui-btn-primary" onclick="${this.onSaveConfigHandler.bind(this)}">${main_core.Loc.getMessage('CRM_COMMON_ACTION_SAVE')}</span>`;
				this.buttonsContainer.append(this.saveButton);
			}
			if (!this.cancelButton) {
				this.cancelButton = main_core.Tag.render`<span class="ui-btn ui-btn-light-border" onclick="${this.onCancelConfigHandler.bind(this)}">${main_core.Loc.getMessage('CRM_COMMON_ACTION_CANCEL')}</span>`;
				this.buttonsContainer.append(this.cancelButton);
			}
		}
		onSaveConfigHandler(event) {
			event.preventDefault();
			const selectedSection = this.getSelectedSection();
			const newCustomSections = [];
			[...this.sectionsListContainer.children].forEach(node => {
				const idInput = node.querySelector('[name="id"]');
				const valueInput = node.querySelector('[name="value"]');
				if (!idInput || !valueInput) {
					return;
				}
				const id = idInput.value;
				const title = valueInput.value;
				let isSelected = false;
				if (selectedSection && selectedSection.id === id) {
					isSelected = true;
				}
				if (title) {
					newCustomSections.push({
						id,
						title,
						isSelected
					});
				}
			});
			this.customSections = newCustomSections;
			this.reInitSelector();
			this.showSelector();
			this.hideSectionsList();
		}
		onCancelConfigHandler(event) {
			event.preventDefault();
			this.showSelector();
			this.hideSectionsList();
		}
		renderSectionsList(listContainer) {
			main_core.Dom.clean(listContainer);
			this.customSections.forEach(section => {
				listContainer.append(this.renderSectionItem(section));
			});
			listContainer.append(this.renderSectionItem());
		}
		renderSectionItem(section) {
			const item = new CustomSectionItem(section);
			const node = main_core.Tag.render`
			<div style="margin-bottom: 10px;" class="ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-row">
				<input type="hidden" name="id" value="${item.getId()}" />
				<input class="ui-ctl-element" name="value" type="text" value="${main_core.Text.encode(item.getValue())}">
				<div
					class="crm-type-custom-section-remove-item"
					onclick="${event => {
			event.preventDefault();
			this.sectionsListContainer.removeChild(item.getNode());
		}}">
				</div>
			</div>
		`;
			item.setNode(node);
			return node;
		}
		showSectionsList() {
			this.renderSectionsConfig();
			main_core.Dom.removeClass(this.settingsContainer, 'crm-type-hidden');
		}
		hideSectionsList() {
			main_core.Dom.clean(this.sectionsListContainer);
			main_core.Dom.addClass(this.settingsContainer, 'crm-type-hidden');
		}
		adjust() {
			if (this.switcher.isChecked()) {
				main_core.Dom.removeClass(this.container, 'crm-type-hidden');
			} else {
				main_core.Dom.addClass(this.container, 'crm-type-hidden');
			}
		}
		getSelectedSection() {
			const selectedItems = this.selector.getDialog().getSelectedItems();
			if (selectedItems.length > 0) {
				return {
					id: selectedItems[0].getId(),
					title: selectedItems[0].getTitle()
				};
			}
			return null;
		}
		getData() {
			const data = {
				customSectionId: 0,
				customSections: this.customSections
			};
			if (this.switcher.isChecked()) {
				const selectedSection = this.getSelectedSection();
				if (selectedSection) {
					data.customSectionId = selectedSection.id;
				}
			}
			return data;
		}
	}
	class CustomSectionItem {
		constructor(customSection = null) {
			this.id = customSection ? customSection.id : `new_${main_core.Text.getRandom()}`;
			this.value = customSection ? customSection.title : '';
		}
		setNode(node) {
			this.node = node;
		}
		getId() {
			return this.id;
		}
		getNode() {
			return this.node;
		}
		getInput() {
			const node = this.getNode();
			if (!node) {
				return null;
			}
			if (node instanceof HTMLInputElement) {
				return node;
			}
			return node.querySelector('input');
		}
		getValue() {
			const input = this.getInput();
			if (input && input.value) {
				return input.value;
			}
			return this.value || '';
		}
	}
	class FeatureManager {
		static #instance = null;
		#isPermissionsLayoutV2Enabled = false;
		static getInstance() {
			if (this.#instance === null) {
				this.#instance = new FeatureManager();
			}
			return this.#instance;
		}
		setPermissionsLayoutV2Enabled(isEnabled) {
			this.#isPermissionsLayoutV2Enabled = isEnabled;
			return this;
		}
		isPermissionsLayoutV2Enabled() {
			return this.#isPermissionsLayoutV2Enabled;
		}
	}
	namespace.FeatureManager = FeatureManager;

})(BX.Crm.Integration.Analytics, BX.Crm, BX.Crm, BX.Crm.Models, BX, BX.Event, BX, BX.UI.Analytics, BX.UI.Dialogs, BX.UI.EntitySelector, BX.UI);
//# sourceMappingURL=script.js.map
