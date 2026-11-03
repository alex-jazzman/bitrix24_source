/* eslint-disable */
(function (main_core, main_loader, ui_dialogs_messagebox, ui_userfield, ui_buttons) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Main.UserField');

	/**
	 * @memberOf BX.Main.UserField
	 */
	class Config {
		static #instances = new Map();
		id = 0;
		inputs = new Map();
		tabs = new Map();
		container = null;
		settingsContainer = null;
		settingsTable = null;
		errorsContainer = null;
		saveButton = null;
		cancelButton = null;
		deleteButton = null;
		constructor(params) {
			this.tabs = new Map();
			this.inputs = new Map();
			const saveButtonNode = document.getElementById('ui-button-panel-save');
			if (saveButtonNode) {
				this.saveButton = ui_buttons.ButtonManager.createFromNode(saveButtonNode);
			}
			const cancelButtonNode = document.getElementById('ui-button-panel-cancel');
			if (cancelButtonNode) {
				this.cancelButton = ui_buttons.ButtonManager.createFromNode(cancelButtonNode);
			}
			const deleteButtonNode = document.getElementById('ui-button-panel-remove');
			if (deleteButtonNode) {
				this.deleteButton = ui_buttons.ButtonManager.createFromNode(deleteButtonNode);
			}
			if (main_core.Type.isPlainObject(params)) {
				this.id = main_core.Text.toInteger(params.id);
				if (main_core.Type.isDomNode(params.container)) {
					this.container = params.container;
				}
				if (main_core.Type.isDomNode(params.errorsContainer)) {
					this.errorsContainer = params.errorsContainer;
				}
				this.moduleId = params.moduleId;
			}
			this.bindEvents();
			this.fillTabs();
			this.constructor.#instances.set(this.id, this);
			this.adjustVisibility();
			this.syncEnumDefaultSelector();
		}
		getBooleanInputNames() {
			return ['multiple', 'mandatory', 'showFilter', 'isSearchable'];
		}
		getSettingsContainer() {
			if (this.container && !this.settingsContainer) {
				this.settingsContainer = this.container.querySelector('[data-role="main-user-field-settings-container"]');
			}
			return this.settingsContainer;
		}
		getSettingsTable() {
			if (!this.settingsTable) {
				const settingsContainer = this.getSettingsContainer();
				if (settingsContainer) {
					this.settingsTable = settingsContainer.querySelector('[data-role="main-user-field-settings-table"]');
				}
			}
			return this.settingsTable;
		}
		fillTabs() {
			const tabNames = ['common', 'labels', 'tooltips', 'additional', 'list'];
			if (this.container) {
				tabNames.forEach(name => {
					const tab = this.container.querySelector('[data-tab="' + name + '"]');
					if (tab) {
						this.tabs.set(name, tab);
					}
				});
			}
		}
		showTab(name) {
			Array.from(this.tabs.keys()).forEach(tabName => {
				if (tabName === name) {
					this.tabs.get(tabName).classList.add('main-user-field-edit-tab-current');
					if (name === 'list') {
						this.syncEnumDefaultSelector();
					}
				} else {
					this.tabs.get(tabName).classList.remove('main-user-field-edit-tab-current');
				}
			});
		}
		getInput(name) {
			if (this.container && !this.inputs.has(name)) {
				const input = this.container.querySelector('[data-role="main-user-field-' + name + '"]');
				if (input) {
					this.inputs.set(name, input);
				}
			}
			return this.inputs.get(name);
		}
		getInputValue(name) {
			if (name === 'userTypeId') {
				return this.getSelectedUserTypeId();
			}
			const input = this.getInput(name);
			if (input) {
				if (this.getBooleanInputNames().includes(name)) {
					return input.checked ? 'Y' : 'N';
				}
				return input.value;
			}
			return '';
		}
		bindEvents() {
			const userTypeIdSelector = this.getInput('userTypeId');
			if (userTypeIdSelector) {
				main_core.Event.bind(userTypeIdSelector, 'change', this.handleUserTypeChange.bind(this));
			}
			const commonLabelInput = this.getInput('editFormLabel');
			if (commonLabelInput && commonLabelInput.parentElement && commonLabelInput.parentElement.parentElement) {
				const languageId = commonLabelInput.parentElement.parentElement.dataset['language'];
				const currentLanguageLabelInput = this.getInput('editFormLabel-' + languageId);
				if (currentLanguageLabelInput) {
					main_core.Event.bind(commonLabelInput, 'change', () => {
						this.syncInputs(commonLabelInput, currentLanguageLabelInput);
					});
					main_core.Event.bind(currentLanguageLabelInput, 'change', () => {
						this.syncInputs(currentLanguageLabelInput, commonLabelInput);
					});
				}
			}
			const commonTooltipInput = this.getInput('editFormTooltip');
			if (commonTooltipInput && !main_core.Type.isNull(commonTooltipInput.parentElement) && !main_core.Type.isNull(commonTooltipInput.parentElement.parentElement)) {
				const languageId = commonTooltipInput.parentElement.parentElement.dataset['language'];
				const currentLanguageTooltipInput = this.getInput('editFormTooltip-' + languageId);
				if (!main_core.Type.isNull(currentLanguageTooltipInput)) {
					main_core.Event.bind(commonTooltipInput, 'change', () => this.syncInputs(commonTooltipInput, currentLanguageTooltipInput));
					main_core.Event.bind(currentLanguageTooltipInput, 'change', () => this.syncInputs(currentLanguageTooltipInput, commonTooltipInput));
				}
			}
			const addEnum = this.container.querySelector('[data-role="main-user-field-enum-add"]');
			if (addEnum) {
				main_core.Event.bind(addEnum, 'click', this.addEnumRow.bind(this));
			}
			const deleteButtons = Array.from(this.container.querySelectorAll('[data-role="main-user-field-enum-delete"]'));
			deleteButtons.forEach(target => {
				main_core.Event.bind(target, 'click', this.deleteEnumRow.bind(this));
			});
			const enumRows = Array.from(this.container.querySelectorAll('[data-role="main-user-field-enum-row"]'));
			enumRows.forEach(row => {
				const input = row.querySelector('[data-role="main-user-field-enum-value"]');
				if (input) {
					main_core.Event.bind(input, 'change', this.syncEnumDefaultSelector.bind(this));
				}
			});
			main_core.Event.bind(this.saveButton.getContainer(), 'click', event => {
				event.preventDefault();
				this.save();
			}, {
				passive: false
			});
			if (this.deleteButton) {
				main_core.Event.bind(this.deleteButton.getContainer(), 'click', event => {
					event.preventDefault();
					this.delete();
				});
			}
		}
		getSelectedUserTypeId() {
			const option = this.getSelectedOption('userTypeId');
			if (option) {
				return option.value;
			}
			return null;
		}
		getSelectedOption(inputName) {
			const input = this.getInput(inputName);
			if (input) {
				const options = Array.from(input.querySelectorAll('option'));
				const index = input.selectedIndex;
				return options[index];
			}
			return null;
		}
		getSelectedOptions(inputName) {
			const input = this.getInput(inputName);
			if (input && input instanceof HTMLSelectElement) {
				return input.selectedOptions;
			}
			return null;
		}
		handleUserTypeChange() {
			if (this.isProgress) {
				return;
			}
			const settingsTable = this.getSettingsTable();
			if (!settingsTable) {
				return;
			}
			const userTypeId = this.getSelectedUserTypeId();
			if (!userTypeId) {
				return;
			}
			this.startProgress();
			main_core.ajax.runComponentAction('bitrix:main.field.config.detail', 'getSettings', {
				data: {
					userTypeId,
					entityId: this.getInputValue('entityId'),
					moduleId: this.moduleId
				},
				analyticsLabel: 'mainUserFieldConfigGetSettings',
				mode: 'class'
			}).then(response => {
				this.stopProgress();
				let html = '';
				if (response.data.html && response.data.html.length > 0) {
					html = response.data.html;
				}
				main_core.Runtime.html(settingsTable, html).then(() => {
					this.adjustVisibility();
				});
			}).catch(response => {
				this.stopProgress();
				this.showErrors(response.errors);
			});
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
				this.getLoader().show(this.container);
			}
			this.hideErrors();
		}
		stopProgress() {
			this.isProgress = false;
			this.getLoader().hide();
			setTimeout(() => {
				this.saveButton.setWaiting(false);
				main_core.Dom.removeClass(this.saveButton.getContainer(), 'ui-btn-wait');
				if (this.deleteButton) {
					this.deleteButton.setWaiting(false);
					main_core.Dom.removeClass(this.deleteButton.getContainer(), 'ui-btn-wait');
				}
			}, 200);
		}
		showErrors(errors) {
			let text = '';
			errors.forEach(message => {
				text += message;
			});
			if (main_core.Type.isDomNode(this.errorsContainer)) {
				this.errorsContainer.innerText = text;
				this.errorsContainer.parentElement.style.display = 'block';
			} else {
				console.error(text);
			}
		}
		hideErrors() {
			if (main_core.Type.isDomNode(this.errorsContainer)) {
				this.errorsContainer.innerText = '';
				this.errorsContainer.parentElement.style.display = 'none';
			}
		}
		getSettings() {
			const settings = {};
			const settingsForm = this.container.querySelector('[data-role="main-user-field-settings"]');
			if (settingsForm) {
				const formData = new FormData(settingsForm);
				for (let pair of formData.entries()) {
					const name = pair[0].substr(9, pair[0].length - 10);
					settings[name] = pair[1];
				}
			}
			return settings;
		}
		prepareFieldData() {
			if (!this.container) {
				return {};
			}
			const editFormLabel = {};
			const labelInputs = Array.from(this.container.querySelectorAll('[data-role="main-user-field-label-container"]'));
			labelInputs.forEach(labelContainer => {
				const languageId = labelContainer.dataset['language'];
				editFormLabel[languageId] = this.getInputValue('editFormLabel-' + languageId);
			});
			const helpMessage = {};
			const tooltipInputs = Array.from(this.container.querySelectorAll('[data-role="main-user-field-label-container"]'));
			tooltipInputs.forEach(tooltipContainer => {
				const languageId = tooltipContainer.dataset['language'];
				helpMessage[languageId] = this.getInputValue('editFormTooltip-' + languageId);
			});
			const list = [];
			const userTypeId = this.getInputValue('userTypeId');
			if (userTypeId === 'enumeration') {
				this.syncEnumDefaultSelector();
				const selectedAttributes = this.getSelectedEnumDefaultAttributes();
				const sortStep = 100;
				let sort = 0;
				const rows = Array.from(this.container.querySelectorAll('[data-role="main-user-field-enum-row"]'));
				rows.forEach(row => {
					const input = row.querySelector('[data-role="main-user-field-enum-value"]');
					if (!input) {
						return;
					}
					const id = main_core.Text.toInteger(row.dataset['id']);
					const value = input.value;
					let def = 'N';
					if (id > 0 && selectedAttributes.id.includes(id) || selectedAttributes.value.includes(value)) {
						def = 'Y';
					}
					sort += sortStep;
					list.push({
						value: input.value,
						def,
						sort,
						id
					});
				});
			}
			const id = main_core.Text.toInteger(this.getInputValue('id'));
			let fieldName = this.getInputValue('fieldName');
			if (id <= 0) {
				fieldName = this.getInputValue('fieldPrefix') + fieldName;
			}
			return {
				id,
				editFormLabel,
				helpMessage,
				entityId: this.getInputValue('entityId'),
				fieldName: fieldName,
				sort: this.getInputValue('sort'),
				multiple: this.getInputValue('multiple'),
				mandatory: this.getInputValue('mandatory'),
				showFilter: this.getInputValue('showFilter'),
				isSearchable: this.getInputValue('isSearchable'),
				userTypeId,
				settings: this.getSettings(),
				enum: list
			};
		}
		save() {
			if (this.isProgress) {
				return;
			}
			if (!this.moduleId) {
				return;
			}
			this.startProgress();
			const fieldData = this.prepareFieldData();
			let languageId = null;
			const commonLabelInput = this.getInput('editFormLabel');
			if (commonLabelInput && commonLabelInput.parentElement && commonLabelInput.parentElement.parentElement) {
				languageId = commonLabelInput.parentElement.parentElement.dataset['language'];
			}
			const userField = new ui_userfield.UserField(fieldData, {
				languageId,
				moduleId: this.moduleId
			});
			userField.save().then(() => {
				this.afterSave(userField);
				this.stopProgress();
			}).catch(errors => {
				this.showErrors(errors);
				this.stopProgress();
			});
		}
		delete() {
			if (this.isProgress) {
				return;
			}
			if (!this.moduleId) {
				return;
			}
			const id = main_core.Text.toInteger(this.getInputValue('id'));
			if (id <= 0) {
				return;
			}
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('MAIN_FIELD_CONFIG_DELETE_CONFIRM'), () => {
				return new Promise(resolve => {
					const userField = new ui_userfield.UserField(this.prepareFieldData(), {
						moduleId: this.moduleId
					});
					this.startProgress();
					userField.delete().then(() => {
						this.stopProgress();
						const slider = this.getSlider();
						if (slider) {
							this.addDataToSlider('userFieldData', userField.serialize());
							slider.close();
						} else {
							ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('MAIN_FIELD_CONFIG_DELETE_SUCCESS'));
						}
						resolve();
					}).catch(errors => {
						this.stopProgress();
						this.showErrors(errors);
						resolve();
					});
				});
			}, null, box => {
				this.stopProgress();
				box.close();
			});
		}
		adjustVisibility() {
			const settingsTable = this.getSettingsTable();
			const settingsTab = document.querySelector('[data-role="tab-additional"]');
			const listTab = document.querySelector('[data-role="tab-list"]');
			if (!settingsTable || !settingsTab || !listTab) {
				return;
			}
			if (settingsTable.childElementCount <= 0) {
				settingsTab.style.display = 'none';
			} else {
				settingsTab.style.display = 'block';
			}
			const userTypeId = this.getSelectedUserTypeId();
			if (userTypeId === 'enumeration') {
				listTab.style.display = 'flex';
			} else {
				listTab.style.display = 'none';
			}
			if (userTypeId === 'boolean') {
				this.changeInputVisibility('multiple', 'none');
				this.changeInputVisibility('mandatory', 'none');
			} else {
				this.changeInputVisibility('multiple', 'block');
				this.changeInputVisibility('mandatory', 'block');
			}
		}
		changeInputVisibility(inputName, display) {
			const input = this.getInput(inputName);
			if (input && input.parentElement && input.parentElement.parentElement) {
				input.parentElement.parentElement.style.display = display;
			}
		}
		afterSave(userField) {
			this.addDataToSlider('userFieldData', userField.serialize());
			const slider = this.getSlider();
			if (slider) {
				slider.close();
			} else {
				const id = main_core.Text.toInteger(this.getInputValue('id'));
				if (id <= 0) {
					if (!!userField.getDetailUrl()) {
						location.href = userField.getDetailUrl();
						return;
					}
					this.getInput('id').value = userField.getId();
					const prefixInput = this.getInput('fieldPrefix');
					if (prefixInput && prefixInput.parentElement && prefixInput.parentElement.parentElement) {
						prefixInput.parentElement.parentElement.classList.remove('main-user-field-name-with-prefix');
						main_core.Dom.remove(prefixInput.parentElement);
					}
					this.getInput('fieldName').value = userField.getName();
					this.getInput('fieldName').disabled = true;
					this.getInput('fieldName').parentElement.classList.remove('ui-ctl-inline');
				}
			}
		}
		getSlider() {
			if (main_core.Reflection.getClass('BX.SidePanel')) {
				return BX.SidePanel.Instance.getSliderByWindow(window);
			}
			return null;
		}
		addDataToSlider(key, data) {
			if (main_core.Type.isString(key)) {
				let slider = this.getSlider();
				if (slider) {
					slider.getData().set(key, data);
					BX.SidePanel.Instance.postMessage(slider, 'userfield-list-update');
				}
			}
		}
		static handleLeftMenuClick(id, tabName) {
			if (Config.#instances) {
				const instance = Config.#instances.get(id);
				if (instance) {
					instance.showTab(tabName);
				}
			}
		}
		syncInputs(fromInput, toInput) {
			const tab = fromInput.closest('.main-user-field-edit-tab');
			if (tab && tab.classList.contains('main-user-field-edit-tab-current')) {
				toInput.value = fromInput.value;
			}
		}
		addEnumRow() {
			const addEnum = this.container.querySelector('[data-role="main-user-field-enum-add"]');
			if (addEnum) {
				const input = main_core.Tag.render`<input class="ui-ctl-element" type="text" name="ENUM[][VALUE]" value=""
								 data-role="main-user-field-enum-value"
								 onchange="${this.syncEnumDefaultSelector.bind(this)}">`;
				const row = main_core.Tag.render`
					<div class="main-user-field-enum-row" data-role="main-user-field-enum-row">
						<div class="main-user-field-enum-row-inner ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-row">
							<span class="main-user-field-enum-row-draggable" style=""></span>
							${input}
							<div class="main-user-field-enum-delete" onclick="${this.deleteEnumRow.bind(this)}"></div>
						</div>
					</div>`;
				main_core.Dom.append(row, document.querySelector('.main-user-field-enum-row-list'));
				input.focus();
				let item = new DragDropItem();
				item.init(row);
			}
		}
		deleteEnumRow({
			target
		}) {
			main_core.Dom.remove(target.parentElement);
			this.syncEnumDefaultSelector();
		}
		getSelectedEnumDefaultAttributes() {
			const result = {
				id: [],
				value: []
			};
			const selectedDefaultOptions = this.getSelectedOptions('enumDefault');
			if (selectedDefaultOptions) {
				Array.from(selectedDefaultOptions).forEach(option => {
					if (option.dataset['id'] && option.dataset['id'] > 0) {
						result['id'].push(main_core.Text.toInteger(option.dataset['id']));
					} else {
						result['value'].push(option.value);
					}
				});
			}
			return result;
		}
		syncEnumDefaultSelector() {
			const userTypeId = this.getInputValue('userTypeId');
			if (userTypeId === 'enumeration') {
				const selector = this.getInput('enumDefault');
				if (!selector) {
					return;
				}
				const isMultiple = this.getInputValue('multiple');
				if (isMultiple === 'Y') {
					selector.multiple = true;
					selector.size = 3;
					selector.parentElement.classList.add('ui-ctl-multiple-select');
					selector.parentElement.classList.remove('ui-ctl-after-icon');
					selector.parentElement.classList.remove('ui-ctl-dropdown');
				} else {
					selector.multiple = false;
					selector.parentElement.classList.remove('ui-ctl-multiple-select');
					selector.parentElement.classList.add('ui-ctl-after-icon');
					selector.parentElement.classList.add('ui-ctl-dropdown');
				}
				const selectedAttributes = this.getSelectedEnumDefaultAttributes();
				const options = Array.from(selector.querySelectorAll('option'));
				options.forEach(option => {
					if (option.value !== 'empty') {
						main_core.Dom.remove(option);
					}
				});
				const rows = Array.from(this.container.querySelectorAll('[data-role="main-user-field-enum-row"]'));
				rows.forEach(row => {
					const id = main_core.Text.toInteger(row.dataset['id']);
					const input = row.querySelector('[data-role="main-user-field-enum-value"]');
					if (!input) {
						return;
					}
					const value = input.value;
					const selected = id > 0 && selectedAttributes.id.includes(id) || selectedAttributes.value.includes(value);
					if (value.length > 0) {
						selector.appendChild(main_core.Tag.render`<option ${selected ? 'selected="selected"' : ''} value="${main_core.Text.encode(value)}" data-id="${id}">${main_core.Text.encode(value)}</option>`);
					}
				});
			}
		}
	}
	class DragDropItem {
		constructor() {
			this.itemContainer = null;
			this.draggableItemContainer = null;
			this.dragElement = null;
		}
		init(item) {
			this.itemContainer = item;
			const dragButton = this.itemContainer.querySelector('.main-user-field-enum-row-draggable');
			if (jsDD) {
				dragButton.onbxdragstart = this.onDragStart.bind(this);
				dragButton.onbxdrag = this.onDrag.bind(this);
				dragButton.onbxdragstop = this.onDragStop.bind(this);
				jsDD.registerObject(dragButton);
				this.itemContainer.onbxdestdraghover = this.onDragEnter.bind(this);
				this.itemContainer.onbxdestdraghout = this.onDragLeave.bind(this);
				this.itemContainer.onbxdestdragfinish = this.onDragDrop.bind(this);
				jsDD.registerDest(this.itemContainer, 30);
			}
		}
		onDragStart() {
			main_core.Dom.addClass(this.itemContainer, "main-user-field-enum-row-disabled");
			if (!this.dragElement) {
				this.dragElement = this.itemContainer.cloneNode(true);
				this.dragElement.style.position = "absolute";
				this.dragElement.style.width = this.itemContainer.offsetWidth + "px";
				this.dragElement.className = "main-user-field-enum-row-drag";
				main_core.Dom.append(this.dragElement, document.body);
			}
		}
		onDrag(x, y) {
			if (this.dragElement) {
				this.dragElement.style.left = x + "px";
				this.dragElement.style.top = y + "px";
			}
		}
		onDragStop() {
			main_core.Dom.removeClass(this.itemContainer, "main-user-field-enum-row-disabled");
			main_core.Dom.remove(this.dragElement);
			this.dragElement = null;
		}
		onDragEnter(draggableItem) {
			this.draggableBtnContainer = draggableItem.closest('.main-user-field-enum-row');
			if (this.draggableBtnContainer !== this.itemContainer) {
				this.showDragTarget();
			}
		}
		onDragLeave() {
			this.hideDragTarget();
		}
		onDragDrop() {
			if (this.draggableBtnContainer !== this.itemContainer) {
				this.hideDragTarget();
				main_core.Dom.remove(this.draggableBtnContainer);
				main_core.Dom.insertBefore(this.draggableBtnContainer, this.itemContainer);
			}
		}
		showDragTarget() {
			main_core.Dom.addClass(this.itemContainer, 'main-user-field-enum-row-target-shown');
			this.getDragTarget().style.height = this.itemContainer.offsetHeight + "px";
		}
		hideDragTarget() {
			main_core.Dom.removeClass(this.itemContainer, "main-user-field-enum-row-target-shown");
			this.getDragTarget().style.height = 0;
		}
		getDragTarget() {
			if (!this.dragTarget) {
				this.dragTarget = main_core.Tag.render`<div class="main-user-field-enum-row-drag-target"></div>`;
				main_core.Dom.prepend(this.dragTarget, this.itemContainer);
			}
			return this.dragTarget;
		}
	}
	class DragDropBtnContainer {
		constructor() {
			this.container = document.querySelector('.main-user-field-enum-row-list');
			this.height = null;
		}
		init() {
			this.container.onbxdestdraghover = BX.delegate(this.onDragEnter, this);
			this.container.onbxdestdraghout = BX.delegate(this.onDragLeave, this);
			this.container.onbxdestdragfinish = BX.delegate(this.onDragDrop, this);
			jsDD.registerDest(this.container, 40);
		}
		onDragEnter(draggableItem) {
			this.draggableBtnContainer = draggableItem.closest('.main-user-field-enum-row');
			this.height = this.draggableBtnContainer.offsetHeight;
			this.showDragTarget();
		}
		onDragLeave() {
			this.hideDragTarget();
		}
		onDragDrop() {
			this.hideDragTarget();
			main_core.Dom.remove(this.draggableBtnContainer);
			main_core.Dom.insertBefore(this.draggableBtnContainer, this.dragTarget);
		}
		showDragTarget() {
			main_core.Dom.addClass(this.container, 'main-user-field-enum-row-list-target-shown');
			this.getDragTarget().style.height = this.height + "px";
		}
		hideDragTarget() {
			main_core.Dom.removeClass(this.container, "main-user-field-enum-row-list-target-shown");
			this.getDragTarget().style.height = 0;
		}
		getDragTarget() {
			if (!this.dragTarget) {
				this.dragTarget = main_core.Tag.render`<div class="main-user-field-enum-row-list-target"></div>`;
				main_core.Dom.append(this.dragTarget, this.container);
			}
			return this.dragTarget;
		}
	}
	namespace.Config = Config;
	namespace.DragDropItem = DragDropItem;
	namespace.DragDropBtnContainer = DragDropBtnContainer;

})(BX, BX, BX.UI.Dialogs, BX.UI.UserField, BX.UI);
//# sourceMappingURL=script.js.map
