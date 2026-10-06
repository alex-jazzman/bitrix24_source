/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons, ui_entitySelector, socialnetwork_limit, im_public_iframe, ui_alerts, ui_lottie) {
	'use strict';

	class Util {
		static cssClass = {
			selectorActive: '--active',
			selectorDisabled: '--disabled'
		};
		static initExpandSwitches() {
			const expandSwitchers = document.querySelectorAll('[data-role="socialnetwork-group-create-ex__expandable"]');
			expandSwitchers.forEach(switcher => {
				switcher.addEventListener('click', e => {
					const targetId = e.currentTarget.getAttribute('for');
					const target = document.getElementById(targetId);
					const switcherWrapper = target.firstElementChild;
					if (target.offsetHeight === 0) {
						this.#sendAnalytics();
						target.style.height = switcherWrapper.offsetHeight + 'px';
						target.classList.add('--open');
						const scrollToTarget = () => {
							let elementRealTop = target.getBoundingClientRect().top / 100;
							let time = 400;
							let currentTime = 0;
							let scrollBySvs = () => {
								window.scrollBy(0, elementRealTop);
							};
							while (currentTime <= time) {
								window.setTimeout(scrollBySvs, currentTime, elementRealTop);
								currentTime += time / 100;
							}
							target.removeEventListener('transitionend', scrollToTarget);
						};
						const adjustHeight = () => {
							target.style.height = 'auto';
							target.removeEventListener('transitionend', adjustHeight);
						};
						target.addEventListener('transitionend', adjustHeight);
						target.addEventListener('transitionend', scrollToTarget);
					}
					if (target.offsetHeight > 0) {
						target.style.height = target.offsetHeight + 'px';
						setTimeout(() => {
							target.style.removeProperty('height');
							target.classList.remove('--open');
						});
					}
				});
			});
		}
		static #sendAnalytics() {
			const workgroupForm = WorkgroupForm.getInstance();
			let analyticsData = {};
			const isScrumForm = workgroupForm.isScrumForm;
			if (isScrumForm) {
				const isScrumTrialEnabled = workgroupForm.isScrumTrialEnabled;
				analyticsData = {
					event: 'scrum_edit_settings',
					category: 'scrum',
					c_section: 'scrum',
					c_sub_section: 'scrum_grid',
					c_element: 'settings_button',
					tool: 'tasks',
					status: 'success',
					p1: `isDemo_${isScrumTrialEnabled ? 'Y' : 'N'}`
				};
			} else {
				const isProjectsTrialEnabled = workgroupForm.isProjectsTrialEnabled;
				analyticsData = {
					event: 'project_edit_settings',
					category: 'project',
					c_section: 'project',
					c_sub_section: 'project_grid',
					c_element: 'settings_button',
					tool: 'tasks',
					status: 'success',
					p1: `isDemo_${isProjectsTrialEnabled ? 'Y' : 'N'}`
				};
			}
			if (BX.UI.Analytics) {
				BX.UI.Analytics.sendData(analyticsData);
			} else {
				// eslint-disable-next-line promise/catch-or-return
				BX.Runtime.loadExtension('ui.analytics').then(() => {
					BX.UI.Analytics.sendData(analyticsData);
				});
			}
		}
		static initDropdowns() {
			const dropdownAreaList = document.querySelectorAll('[data-role="soc-net-dropdown"]');
			dropdownAreaList.forEach(dropdownArea => {
				dropdownArea.addEventListener('click', e => {
					const dropdownArea = e.currentTarget;
					const dropdownItemsData = this.getDropdownItems(dropdownArea);
					const items = [];
					Object.entries(dropdownItemsData).forEach(([key, value]) => {
						items.push({
							text: value,
							onclick: () => {
								dropdownMenu.close();
								this.setDropdownValue(dropdownArea.querySelector('.ui-ctl-element'), value, dropdownArea);
								this.setInputValue(dropdownArea.querySelector('input'), key, dropdownArea);
								let neighbourDropdownArea = null;
								if (dropdownArea.classList.contains('--nonproject')) {
									neighbourDropdownArea = dropdownArea.parentNode.querySelector('.--project');
								} else if (dropdownArea.classList.contains('--project')) {
									neighbourDropdownArea = dropdownArea.parentNode.querySelector('.--nonproject');
								}
								if (main_core.Type.isDomNode(neighbourDropdownArea)) {
									this.setDropdownValue(neighbourDropdownArea.querySelector('.ui-ctl-element'), value, neighbourDropdownArea);
									this.setInputValue(neighbourDropdownArea.querySelector('input'), key, neighbourDropdownArea);
								}
							}
						});
					});
					const dropdownMenu = new BX.PopupMenuWindow({
						autoHide: true,
						cacheable: false,
						bindElement: dropdownArea,
						width: dropdownArea.offsetWidth,
						closeByEsc: true,
						animation: 'fading-slide',
						items: items
					});
					dropdownMenu.params.width = dropdownArea.offsetWidth;
					dropdownMenu.show();
				});
			});
		}
		static setDropdownValue(node, value, containerNode) {
			const dropdownItemsData = this.getDropdownItems(containerNode);
			Object.entries(dropdownItemsData).forEach(([, itemValue]) => {
				if (value === itemValue) {
					node.innerText = value;
				}
			});
		}
		static setInputValue(node, value, containerNode) {
			const dropdownItemsData = this.getDropdownItems(containerNode);
			Object.entries(dropdownItemsData).forEach(([itemKey]) => {
				if (value === itemKey) {
					node.value = value;
				}
			});
		}
		static getDropdownItems(node) {
			let dropdownItemsData = {};
			try {
				dropdownItemsData = JSON.parse(node.getAttribute('data-items'));
			} catch (e) {
				return {};
			}
			if (!main_core.Type.isPlainObject(dropdownItemsData)) {
				return {};
			}
			return dropdownItemsData;
		}
		static recalcFormPartProject(isChecked) {
			isChecked = !!isChecked;
			const projectCheckboxNode = document.getElementById('GROUP_PROJECT');
			if (projectCheckboxNode) {
				this.setCheckedValue(projectCheckboxNode, isChecked);
			}
			document.querySelectorAll('.socialnetwork-group-create-ex__create--switch-project, .socialnetwork-group-create-ex__create--switch-nonproject').forEach(node => {
				if (isChecked) {
					node.classList.add('--project');
				} else {
					node.classList.remove('--project');
				}
			});
			this.recalcNameInput();
		}
		static recalcNameInput() {
			const inputNode = document.getElementById('GROUP_NAME_input');
			if (!inputNode) {
				return;
			}
			let placeholderText = main_core.Loc.getMessage('SONET_GCE_T_NAME3');
			const formInstance = WorkgroupForm.getInstance();
			if (main_core.Type.isPlainObject(formInstance.projectTypes[formInstance.selectedProjectType])) {
				if (main_core.Type.isStringFilled(formInstance.projectTypes[formInstance.selectedProjectType].SCRUM_PROJECT) && formInstance.projectTypes[formInstance.selectedProjectType].SCRUM_PROJECT === 'Y') {
					placeholderText = main_core.Loc.getMessage('SONET_GCE_T_NAME3_SCRUM');
				} else if (main_core.Type.isStringFilled(formInstance.projectTypes[formInstance.selectedProjectType].PROJECT) && formInstance.projectTypes[formInstance.selectedProjectType].PROJECT === 'Y') {
					placeholderText = main_core.Loc.getMessage('SONET_GCE_T_NAME3_PROJECT');
				}
			}
			inputNode.placeholder = placeholderText;
		}
		static setCheckedValue(node, value) {
			if (!main_core.Type.isDomNode(node)) {
				return;
			}
			value = !!value;
			if (node.type === 'checkbox') {
				node.checked = value;
			} else {
				node.value = value ? 'Y' : 'N';
			}
		}
		static getCheckedValue(node) {
			let result = false;
			if (!main_core.Type.isDomNode(node)) {
				return result;
			}
			if (node.type == 'hidden') {
				result = node.value === 'Y';
			} else if (node.type == 'checkbox') {
				result = node.checked;
			}
			return result;
		}
		static unselectAllSelectorItems(container, selectorClass) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			container.querySelectorAll(`.${selectorClass}`).forEach(selector => {
				selector.classList.remove(this.cssClass.selectorActive);
			});
		}
		static selectSelectorItem(node) {
			node.classList.add(this.cssClass.selectorActive);
		}
		static disableAllSelectorItems(container, selectorClass) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			container.querySelectorAll(`.${selectorClass}`).forEach(selector => {
				selector.classList.add(this.cssClass.selectorDisabled);
			});
		}
		static enableAllSelectorItems(container, selectorClass) {
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			container.querySelectorAll(`.${selectorClass}`).forEach(selector => {
				selector.classList.remove(this.cssClass.selectorDisabled);
			});
		}
		static enableSelectorItem(node) {
			node.classList.remove(this.cssClass.selectorDisabled);
		}
		static recalcInputValue(params) {
			const selectedItems = params.selectedItems || [];
			const multiple = main_core.Type.isBoolean(params.multiple) ? params.multiple : true;
			const inputContainerNodeId = params.inputContainerNodeId || '';
			let inputNodeName = params.inputNodeName || '';
			if (!main_core.Type.isArray(selectedItems) || !main_core.Type.isStringFilled(inputNodeName) || !main_core.Type.isStringFilled(inputContainerNodeId)) {
				return;
			}
			const inputContainerNode = document.getElementById(inputContainerNodeId);
			if (!inputContainerNode) {
				return;
			}
			if (multiple) {
				inputNodeName = `${inputNodeName}[]`;
			}
			inputContainerNode.querySelectorAll(`input[name="${inputNodeName}"]`).forEach(node => {
				main_core.Dom.remove(node);
			});
			selectedItems.forEach(item => {
				let prefix = null;
				switch (item.entityId) {
					case 'department':
						prefix = 'DR';
						break;
					case 'user':
						prefix = 'U';
						break;
				}
				if (prefix) {
					inputContainerNode.appendChild(main_core.Tag.render`<input type="hidden" name="${inputNodeName}" value="${prefix}${item.id}" \>`);
				}
			});
		}
	}

	class ConfidentialitySelector {
		static cssClass = {
			container: 'socialnetwork-group-create-ex__type-confidentiality-wrapper',
			selector: 'socialnetwork-group-create-ex__group-selector'
		};
		constructor() {
			let firstItemSelected = false;
			ConfidentialitySelector.getItems().forEach(selector => {
				selector.addEventListener('click', e => {
					const selector = e.currentTarget;
					if (selector.classList.contains(Util.cssClass.selectorDisabled)) {
						return;
					}
					Util.unselectAllSelectorItems(ConfidentialitySelector.getContainer(), ConfidentialitySelector.cssClass.selector);
					Util.selectSelectorItem(selector);
					WorkgroupForm.getInstance().recalcForm({
						selectedConfidentialityType: selector.getAttribute('data-bx-confidentiality-type')
					});
				});
				const confidentialityType = selector.getAttribute('data-bx-confidentiality-type');
				if (main_core.Type.isStringFilled(WorkgroupForm.getInstance().selectedConfidentialityType)) {
					if (WorkgroupForm.getInstance().selectedConfidentialityType === confidentialityType) {
						this.selectItem(selector);
					}
				} else if (!firstItemSelected) {
					this.selectItem(selector);
					firstItemSelected = true;
				}
			});
			this.bindEvents();
		}
		bindEvents() {
			WorkgroupForm.getInstance().subscribe('onSwitchExtranet', ConfidentialitySelector.onSwitchExtranet);
		}
		static onSwitchExtranet(event) {
			const data = event.getData();
			if (!main_core.Type.isBoolean(data.isChecked)) {
				return;
			}
			if (data.isChecked) {
				ConfidentialitySelector.unselectAll();
				ConfidentialitySelector.select('secret');
				ConfidentialitySelector.disableAll();
				ConfidentialitySelector.enable('secret');
			} else {
				ConfidentialitySelector.enableAll();
			}
		}
		selectItem(selector) {
			Util.selectSelectorItem(selector);
			WorkgroupForm.getInstance().recalcForm({
				selectedConfidentialityType: selector.getAttribute('data-bx-confidentiality-type')
			});
		}
		static getContainer() {
			return document.querySelector(`.${this.cssClass.container}`);
		}
		static getItems() {
			const container = this.getContainer();
			if (!container) {
				return [];
			}
			return container.querySelectorAll(`.${this.cssClass.selector}`);
		}
		static unselectAll() {
			Util.unselectAllSelectorItems(this.getContainer(), this.cssClass.selector);
		}
		static select(accessCode) {
			this.getItems().forEach(selector => {
				if (selector.getAttribute('data-bx-confidentiality-type') !== accessCode) {
					return;
				}
				Util.selectSelectorItem(selector);
			});
		}
		static disableAll() {
			Util.disableAllSelectorItems(this.getContainer(), this.cssClass.selector);
		}
		static enableAll() {
			Util.enableAllSelectorItems(this.getContainer(), this.cssClass.selector);
		}
		static enable(accessCode) {
			this.getItems().forEach(selector => {
				if (selector.getAttribute('data-bx-confidentiality-type') !== accessCode) {
					return;
				}
				Util.enableSelectorItem(selector);
			});
		}
	}

	class Scrum {
		constructor(params) {
			this.isScrumProject = params.isScrumProject;
		}
		makeAdditionalCustomizationForm() {
			if (this.isScrumProject) {
				this.createHiddenInputs();
				this.showScrumBlocks();
				if (!main_core.Type.isStringFilled(WorkgroupForm.getInstance().selectedConfidentialityType)) {
					ConfidentialitySelector.unselectAll();
					ConfidentialitySelector.select('open');
					WorkgroupForm.getInstance().recalcForm({
						selectedConfidentialityType: 'open'
					});
				}
				const landingCheckbox = document.getElementById('GROUP_LANDING');
				if (landingCheckbox) {
					landingCheckbox.disabled = true;
					landingCheckbox.checked = false;
				}
				this.toggleFeatures(true);
			} else {
				this.removeHiddenInputs();
				this.hideScrumBlocks();
				const landingCheckbox = document.getElementById('GROUP_LANDING');
				if (landingCheckbox) {
					landingCheckbox.disabled = false;
				}
				this.toggleFeatures(false);
			}
			Util.recalcNameInput();
		}
		hideScrumBlocks() {
			document.querySelectorAll('.socialnetwork-group-create-ex__create--switch-scrum, .socialnetwork-group-create-ex__create--switch-nonscrum').forEach(scrumBlock => {
				scrumBlock.classList.remove('--scrum');
			});
			const moderatorsBlock = document.getElementById('expandable-moderator-block');
			if (moderatorsBlock) {
				moderatorsBlock.classList.add('socialnetwork-group-create-ex__content-expandable');
			}
			const moderatorsSwitch = document.getElementById('GROUP_MODERATORS_PROJECT_switch');
			if (moderatorsSwitch) {
				moderatorsSwitch.classList.add('ui-ctl-file-link');
			}
			const ownerBlock = document.getElementById('GROUP_OWNER_block');
			if (ownerBlock) {
				ownerBlock.classList.remove('--space-bottom');
			}
		}
		showScrumBlocks() {
			document.querySelectorAll('.socialnetwork-group-create-ex__create--switch-scrum, .socialnetwork-group-create-ex__create--switch-nonscrum').forEach(scrumBlock => {
				scrumBlock.classList.add('--scrum');
			});
			const moderatorsBlock = document.getElementById('expandable-moderator-block');
			if (moderatorsBlock) {
				moderatorsBlock.classList.remove('socialnetwork-group-create-ex__content-expandable');
			}
			const moderatorsSwitch = document.getElementById('GROUP_MODERATORS_PROJECT_switch');
			if (moderatorsSwitch) {
				moderatorsSwitch.classList.remove('ui-ctl-file-link');
			}
			const ownerBlock = document.getElementById('GROUP_OWNER_block');
			if (ownerBlock) {
				ownerBlock.classList.add('--space-bottom');
			}
		}
		createHiddenInputs() {
			document.forms['sonet_group_create_popup_form'].appendChild(main_core.Dom.create('input', {
				attrs: {
					type: 'hidden',
					name: 'SCRUM_PROJECT',
					value: 'Y'
				}
			}));
		}
		removeHiddenInputs() {
			document.forms['sonet_group_create_popup_form'].querySelectorAll('input[name="SCRUM_PROJECT"]').forEach(input => {
				main_core.Dom.remove(input);
			});
		}
		toggleFeatures(isScrum) {
			const featuresNode = document.querySelector('.socialnetwork-group-create-ex__project-instruments');
			if (featuresNode) {
				featuresNode.querySelectorAll('input[type="checkbox"][name="tasks_active"], input[type="checkbox"][name="calendar_active"]').forEach(featuresCheckboxNode => {
					if (isScrum) {
						featuresCheckboxNode.disabled = true;
						featuresCheckboxNode.checked = true;
						featuresCheckboxNode.parentNode.insertBefore(main_core.Dom.create('input', {
							attrs: {
								type: 'hidden',
								name: featuresCheckboxNode.name,
								value: 'Y'
							}
						}), featuresCheckboxNode);
					} else {
						featuresCheckboxNode.disabled = false;
						document.forms['sonet_group_create_popup_form'].querySelectorAll(`input[type="hidden"][name="${featuresCheckboxNode.name}"]`).forEach(hiddenInput => {
							main_core.Dom.remove(hiddenInput);
						});
					}
				});
			}
		}
	}

	class Avatar {
		static classList = {
			hidden: '--hidden',
			selected: '--selected'
		};
		constructor(params) {
			this.confirmPopup = null;
			if (!main_core.Type.isStringFilled(params.componentName) || main_core.Type.isUndefined(params.signedParameters)) {
				return;
			}
			this.componentName = params.componentName;
			this.signedParameters = params.signedParameters;
			this.groupId = !main_core.Type.isUndefined(params.groupId) ? parseInt(params.groupId) : 0;
			const container = document.querySelector('[data-role="group-avatar-cont"]');
			if (!container) {
				return;
			}
			this.selectorNode = container.querySelector('[data-role="group-avatar-selector"]');
			this.imageNode = container.querySelector('[data-role="group-avatar-image"]');
			this.inputNode = container.querySelector('[data-role="group-avatar-input"]');
			this.typeInputNode = container.querySelector('[data-role="group-avatar-type-input"]');
			this.removeNode = container.querySelector('[data-role="group-avatar-remove"]');
			if (!main_core.Type.isDomNode(this.imageNode) || !main_core.Type.isDomNode(this.inputNode) || !main_core.Type.isDomNode(this.typeInputNode) || !main_core.Type.isDomNode(this.removeNode)) {
				return;
			}
			this.recalc();
			const avatarEditor = new BX.AvatarEditor({
				enableCamera: false
			});
			this.selectorNode.addEventListener('click', e => {
				if (e.target.getAttribute('data-role') === 'group-avatar-remove' && this.imageNode.style.backgroundImage !== '') {
					this.showConfirmPopup(main_core.Loc.getMessage('SONET_GCE_T_IMAGE_DELETE_CONFIRM'), this.deletePhoto.bind(this));
				} else if (e.target.getAttribute('data-role') === 'group-avatar-type') {
					this.clearType();
					this.setType(e.target.getAttribute('data-avatar-type'));
				} else if (e.target.getAttribute('data-role') === 'group-avatar-image') {
					avatarEditor.show('file');
				}
			});
			main_core_events.EventEmitter.subscribe('onApply', event => {
				const [file] = event.getCompatData();
				const formData = new FormData();
				if (!file.name) {
					file.name = 'tmp.png';
				}
				formData.append('newPhoto', file, file.name);
				this.changePhoto(formData);
			});
		}
		recalc() {
			if (this.getFileId() <= 0) {
				this.removeNode.classList.add(Avatar.classList.hidden);
				this.imageNode.classList.remove(Avatar.classList.selected);
			} else {
				this.removeNode.classList.remove(Avatar.classList.hidden);
				this.imageNode.classList.add(Avatar.classList.selected);
			}
		}
		changePhoto(formData) {
			const loader = this.showLoader({
				node: this.imageNode,
				loader: null,
				size: 78
			});
			main_core.ajax.runComponentAction(this.componentName, 'loadPhoto', {
				signedParameters: this.signedParameters,
				mode: 'ajax',
				data: formData
			}).then(response => {
				if (main_core.Type.isPlainObject(response.data) && parseInt(response.data.fileId) > 0 && main_core.Type.isStringFilled(response.data.fileUri)) {
					this.clearType();
					this.inputNode.value = parseInt(response.data.fileId);
					this.typeInputNode.value = '';
					this.imageNode.style = `background-image: url('${encodeURI(response.data.fileUri)}'); background-size: cover;`;
					this.recalc();
				}
				this.hideLoader({
					loader: loader
				});
			}, response => {
				this.hideLoader({
					loader: loader
				});
				this.showErrorPopup(response["errors"][0].message);
			});
		}
		deletePhoto() {
			const fileId = this.getFileId();
			if (fileId < 0) {
				return;
			}
			const loader = this.showLoader({
				node: this.imageNode,
				loader: null,
				size: 78
			});
			main_core.ajax.runComponentAction(this.componentName, 'deletePhoto', {
				signedParameters: this.signedParameters,
				mode: 'ajax',
				data: {
					fileId: fileId,
					groupId: this.groupId
				}
			}).then(response => {
				this.imageNode.style = '';
				this.inputNode.value = '';
				this.recalc();
				this.hideLoader({
					loader: loader
				});
			}, response => {
				this.hideLoader({
					loader: loader
				});
				this.showErrorPopup(response.errors[0].message);
			});
		}
		clearType() {
			this.selectorNode.querySelectorAll('[data-role="group-avatar-type"]').forEach(typeItemNode => {
				typeItemNode.classList.remove(Avatar.classList.selected);
			});
		}
		setType(avatarType) {
			this.inputNode.value = '';
			this.imageNode.style = '';
			this.typeInputNode.value = avatarType;
			this.imageNode.classList.remove(Avatar.classList.selected);
			this.selectorNode.querySelectorAll('[data-role="group-avatar-type"]').forEach(typeItemNode => {
				if (typeItemNode.getAttribute('data-avatar-type') !== avatarType) {
					return;
				}
				typeItemNode.classList.add(Avatar.classList.selected);
			});
			this.recalc();
		}
		getFileId() {
			return main_core.Type.isStringFilled(this.inputNode.value) ? parseInt(this.inputNode.value) : 0;
		}
		showLoader(params) {
			let loader = null;
			if (main_core.Type.isDomNode(params.node)) {
				if (main_core.Type.isNull(params.loader)) {
					loader = new BX.Loader({
						target: params.node,
						size: params.hasOwnProperty('size') ? params.size : 40
					});
				} else {
					loader = params.loader;
				}
				loader.show();
			}
			return loader;
		}
		hideLoader(params) {
			if (!main_core.Type.isNull(params.loader)) {
				params.loader.hide();
				params.loader = null;
			}
			if (main_core.Type.isDomNode(params.node)) {
				main_core.Dom.clean(params.node);
			}
		}
		showErrorPopup(error) {
			if (!error) {
				return;
			}
			new main_popup.Popup('gce-image-upload-error', null, {
				autoHide: true,
				closeByEsc: true,
				offsetLeft: 0,
				offsetTop: 0,
				draggable: true,
				bindOnResize: false,
				closeIcon: true,
				content: error,
				events: {},
				cacheable: false
			}).show();
		}
		showConfirmPopup(text, confirmCallback) {
			this.confirmPopup = new main_popup.Popup('gce-image-delete-confirm', null, {
				autoHide: true,
				closeByEsc: true,
				offsetLeft: 0,
				offsetTop: 0,
				draggable: true,
				bindOnResize: false,
				closeIcon: true,
				content: text,
				events: {
					onPopupClose: () => {
						this.confirmPopup.destroy();
					}
				},
				cacheable: false,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('SONET_GCE_T_IMAGE_DELETE_CONFIRM_YES'),
					events: {
						click: button => {
							button.setWaiting(true);
							this.confirmPopup.close();
							confirmCallback();
						}
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('SONET_GCE_T_IMAGE_DELETE_CONFIRM_NO'),
					events: {
						click: () => {
							this.confirmPopup.close();
						}
					}
				})]
			});
			this.confirmPopup.show();
		}
	}

	class DateCorrector {
		#dateStartInput;
		#dateEndInput;
		#culture;
		constructor(params) {
			this.#dateStartInput = this.#getDateInput('PROJECT_DATE_START');
			this.#dateEndInput = this.#getDateInput('PROJECT_DATE_FINISH');
			this.#culture = params.culture;
			this.#bindHandlers();
		}
		#getDateInput(name) {
			if (document.getElementsByName(name)[0]) {
				return document.getElementsByName(name)[0];
			}
			return null;
		}
		#bindHandlers() {
			if (this.#dateStartInput) {
				main_core.Event.bind(this.#dateStartInput, 'change', this.#adjustDates.bind(this, true));
			}
			if (this.#dateEndInput) {
				main_core.Event.bind(this.#dateEndInput, 'change', this.#adjustDates.bind(this, false));
			}
		}
		#adjustDates(startChanged) {
			const start = this.#getTimeStamp(this.#dateStartInput.value);
			const end = this.#getTimeStamp(this.#dateEndInput.value);
			const startDate = start ? new Date(start * 1000) : null;
			const endDate = end ? new Date(end * 1000) : null;
			if (startDate && endDate) {
				if (startDate >= endDate) {
					const defaultOffset = 86400 * 1000;
					if (startChanged) {
						const newEndDate = new Date(startDate.getTime() + defaultOffset);
						this.#dateEndInput.value = this.#getFormatDate(newEndDate.getTime() / 1000);
					} else {
						const newStartDate = new Date(endDate.getTime() - defaultOffset);
						this.#dateStartInput.value = this.#getFormatDate(newStartDate.getTime() / 1000);
					}
				}
			}
		}
		#getTimeStamp(date) {
			if (date.toString().length > 0) {
				// eslint-disable-next-line bitrix-rules/no-bx
				const parsedValue = BX.parseDate(date, true);
				if (parsedValue === null) {
					return null;
				}
				return this.#convertToSeconds(parsedValue.getTime());
			}
			return null;
		}
		#convertToSeconds(value) {
			return Math.floor(parseInt(value) / 1000);
		}
		#getFormatDate(timeStamp) {
			const date = new Date(timeStamp * 1000);
			return BX.date.format(this.#culture.shortDateFormat, date);
		}
	}

	class ThemePicker {
		constructor(params) {
			this.container = params.container;
			this.theme = params.theme;
			this.draw(this.theme);
			const previewImageNode = this.getNode('image');
			if (previewImageNode) {
				previewImageNode.addEventListener('click', this.open);
			}
			const titleNode = this.getNode('title');
			if (titleNode) {
				titleNode.addEventListener('click', this.open);
			}
			const deleteNode = this.getNode('delete');
			if (deleteNode) {
				deleteNode.addEventListener('click', () => {
					this.select({});
				});
			}
			main_core_events.EventEmitter.subscribe('Intranet.ThemePicker:onSave', event => {
				const [data] = event.getData();
				this.select(data);
			});
		}
		select(data) {
			const theme = main_core.Type.isPlainObject(data.theme) ? data.theme : {};
			this.draw(theme);
		}
		draw(theme) {
			const previewImageNode = this.getNode('image');
			if (previewImageNode) {
				previewImageNode.style.backgroundImage = main_core.Type.isStringFilled(theme.previewImage) ? `url('${encodeURI(theme.previewImage)}')` : '';
				previewImageNode.style.backgroundColor = main_core.Type.isStringFilled(theme.previewColor) ? theme.previewColor : 'transparent';
			}
			const titleNode = this.getNode('title');
			if (titleNode) {
				titleNode.innerHTML = main_core.Type.isStringFilled(theme.title) ? theme.title : '';
			}
			const inputNode = this.getNode('id');
			if (inputNode) {
				inputNode.value = main_core.Type.isStringFilled(theme.id) ? theme.id : '';
			}
		}
		open(event) {
			BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(true);
			event.preventDefault();
		}
		getNode(name) {
			const result = null;
			if (!main_core.Type.isStringFilled(name)) {
				return result;
			}
			return this.container.querySelector(`[bx-group-edit-theme-node="${name}"]`);
		}
		getContainer() {
			return this.container;
		}
	}

	class Tags {
		constructor(params) {
			const containerNode = document.getElementById(params.containerNodeId);
			if (!containerNode) {
				return;
			}
			this.hiddenFieldNode = document.getElementById(params.hiddenFieldId);
			const tagSelector = new ui_entitySelector.TagSelector({
				addButtonCaption: main_core.Loc.getMessage('SONET_GCE_T_TAG_ADD'),
				addButtonCaptionMore: main_core.Loc.getMessage('SONET_GCE_T_KEYWORDS_ADD_TAG'),
				dialogOptions: {
					width: 350,
					height: 300,
					offsetLeft: 50,
					compactView: true,
					preload: true,
					context: 'PROJECT_TAG',
					searchTabOptions: {
						stubOptions: {
							title: main_core.Loc.getMessage('SONET_GCE_T_TAG_SEARCH_FAILED'),
							subtitle: main_core.Loc.getMessage('SONET_GCE_T_TAG_SEARCH_ADD_HINT'),
							arrow: true
						}
					},
					entities: [{
						id: 'project-tag',
						options: {
							groupId: params.groupId
						}
					}],
					searchOptions: {
						allowCreateItem: true,
						footerOptions: {
							label: main_core.Loc.getMessage('SONET_GCE_T_TAG_SEARCH_ADD_FOOTER_LABEL')
						}
					},
					events: {
						'Item:onSelect': event => {
							this.recalcinputValue(event.getTarget().getSelectedItems());
						},
						'Item:onDeselect': event => {
							this.recalcinputValue(event.getTarget().getSelectedItems());
						},
						'Search:onItemCreateAsync': event => {
							return new Promise(resolve => {
								const {
									searchQuery
								} = event.getData();
								const name = searchQuery.getQuery().toLowerCase();
								const dialog = event.getTarget();
								setTimeout(() => {
									const tagsList = name.split(',');
									tagsList.forEach(tag => {
										const item = dialog.addItem({
											id: tag,
											entityId: 'project-tag',
											title: tag,
											tabs: ['all', 'recents']
										});
										if (item) {
											item.select();
										}
									});
									resolve();
								}, 1000);
							});
						}
					}
				}
			});
			tagSelector.renderTo(containerNode);
		}
		recalcinputValue(items) {
			if (!main_core.Type.isArray(items) || !main_core.Type.isDomNode(this.hiddenFieldNode)) {
				return;
			}
			const tagsList = [];
			items.forEach(item => {
				tagsList.push(item.id);
			});
			this.hiddenFieldNode.value = tagsList.join(',');
		}
	}

	class FieldsManager {
		static mandatoryFieldsByStep = {
			2: [{
				id: 'GROUP_NAME_input',
				type: 'string',
				bindNodeId: 'GROUP_NAME_input'
			}],
			4: [{
				id: 'SCRUM_MASTER_CODE_container',
				type: 'input_hidden_container',
				bindNodeId: 'SCRUM_MASTER_selector',
				condition: () => {
					return !!WorkgroupForm.getInstance().scrumManager.isScrumProject;
				}
			}]
		};
		static async check() {
			if (WorkgroupForm.getInstance().wizardManager.stepsCount === 1) {
				return await this.checkAll();
			}
			return await this.checkStep(WorkgroupForm.getInstance().wizardManager.currentStep);
		}
		static async checkStep(step) {
			step = parseInt(step);
			const errorDataList = [];
			if (main_core.Type.isArray(this.mandatoryFieldsByStep[step])) {
				for (const fieldData of this.mandatoryFieldsByStep[step]) {
					let fieldNode = document.getElementById(fieldData.id);
					if (!main_core.Type.isDomNode(fieldNode)) {
						continue;
					}
					if (fieldNode.tagName.toLowerCase() !== 'input') {
						if (fieldData.type === 'string') {
							fieldNode = fieldNode.querySelector('input[type="text"]');
							if (!main_core.Type.isDomNode(fieldNode)) {
								continue;
							}
						}
					}
					fieldData.fieldNode = fieldNode;
					// eslint-disable-next-line no-await-in-loop
					const errorText = await this.checkField(fieldData);
					if (main_core.Type.isStringFilled(errorText)) {
						const bindNode = document.getElementById(fieldData.bindNodeId);
						errorDataList.push({
							bindNode: main_core.Type.isDomNode(bindNode) ? bindNode : fieldNode,
							message: errorText
						});
					}
				}
			}
			return errorDataList;
		}
		static async checkAll() {
			let errorDataList = [];
			for (const stepData of Object.entries(this.mandatoryFieldsByStep)) {
				errorDataList = errorDataList.concat(await this.checkStep(parseInt(stepData[0])));
			}
			return errorDataList;
		}
		static async checkField(fieldData) {
			let errorText = '';
			if (!main_core.Type.isPlainObject(fieldData) && !main_core.Type.isDomNode(fieldData.fieldNode)) {
				return errorText;
			}
			if (main_core.Type.isFunction(fieldData.condition)) {
				if (!fieldData.condition()) {
					return errorText;
				}
			}
			const fieldNode = fieldData.fieldNode;
			const fieldType = main_core.Type.isStringFilled(fieldData.type) ? fieldData.type : 'string';
			const fieldId = fieldData.id;
			const groupId = WorkgroupForm.getInstance()?.groupId;
			const type = WorkgroupForm.getInstance()?.selectedProjectType;
			switch (fieldType) {
				case 'string':
					if (fieldNode.value.trim() === '') {
						errorText = main_core.Loc.getMessage('SONET_GCE_T_STRING_FIELD_ERROR');
						break;
					}
					if (groupId <= 0 && fieldId === 'GROUP_NAME_input') {
						const exists = await FieldsManager.checkSameGroupExists(fieldNode.value);
						if (exists) {
							errorText = type === 'project' ? main_core.Loc.getMessage('SONET_GCE_T_GROUP_NAME_EXISTS_PROJECT') : main_core.Loc.getMessage('SONET_GCE_T_GROUP_NAME_EXISTS');
						}
						break;
					}
					errorText = '';
					break;
				case 'input_hidden_container':
					let empty = true;
					fieldNode.querySelectorAll('input[type="hidden"]').forEach(hiddenNode => {
						if (!empty) {
							return;
						}
						if (main_core.Type.isStringFilled(hiddenNode.value)) {
							empty = false;
						}
					});
					errorText = empty ? main_core.Loc.getMessage('SONET_GCE_T_STRING_FIELD_ERROR') : '';
					break;
				default:
					errorText = '';
			}
			return errorText;
		}
		static showError(errorData) {
			if (!main_core.Type.isPlainObject(errorData) || !main_core.Type.isStringFilled(errorData.message) || !main_core.Type.isDomNode(errorData.bindNode)) {
				return;
			}
			WorkgroupForm.getInstance().alertManager.showAlert(errorData.message, errorData.bindNode.parentNode);
		}
		static async checkSameGroupExists(groupName) {
			const response = await main_core.ajax.runAction('socialnetwork.api.workgroup.isExistingGroup', {
				data: {
					name: groupName
				}
			});
			return response?.data?.exists;
		}
	}

	class Buttons {
		static cssClass = {
			hidden: 'socialnetwork-group-create-ex__button-invisible'
		};
		constructor() {
			this.submitButton = document.getElementById('sonet_group_create_popup_form_button_submit');
			if (!this.submitButton) {
				return;
			}
			this.initCollabCreateButton();
			this.submitButtonClickHandler = this.submitButtonClickHandler.bind(this);
			this.submitButton.addEventListener('click', this.submitButtonClickHandler);
			this.backButton = document.getElementById('sonet_group_create_popup_form_button_step_2_back');
			if (this.backButton) {
				this.backButton.addEventListener('click', e => {
					const button = ui_buttons.ButtonManager.createFromNode(e.currentTarget);
					if (button && button.isDisabled()) {
						return;
					}
					if (WorkgroupForm.getInstance().wizardManager.currentStep > 1) {
						WorkgroupForm.getInstance().wizardManager.currentStep--;
						if (WorkgroupForm.getInstance().wizardManager.currentStep === 3 && Object.entries(WorkgroupForm.getInstance().confidentialityTypes) <= 1)
							// skip confidentiality step
							{
								WorkgroupForm.getInstance().wizardManager.currentStep--;
							}
						WorkgroupForm.getInstance().wizardManager.showCurrentStep();
					}
					return e.preventDefault();
				});
			}
			this.cancelButton = document.getElementById('sonet_group_create_popup_form_button_step_2_cancel');
			if (this.cancelButton) {
				this.cancelButton.addEventListener('click', e => {
					const button = ui_buttons.ButtonManager.createFromNode(e.currentTarget);
					if (button && button.isDisabled()) {
						return;
					}
					const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
					if (currentSlider) {
						const event = new main_core_events.BaseEvent({
							compatData: [currentSlider.getEvent('onClose')],
							data: currentSlider.getEvent('onClose')
						});
						main_core_events.EventEmitter.emit(window.top, 'SidePanel.Slider:onClose', event);
					} else {
						const url = e.currentTarget.getAttribute('bx-url');
						if (main_core.Type.isStringFilled(url)) {
							window.location = url;
						}
					}
					const event = new main_core_events.BaseEvent({
						compatData: [false],
						data: false
					});
					main_core_events.EventEmitter.emit(window.top, 'BX.Bitrix24.PageSlider:close', event);
					main_core_events.EventEmitter.emit(window.top, 'onSonetIframeCancelClick');
					return e.preventDefault();
				});
			}
		}
		async submitButtonClickHandler(e) {
			e.preventDefault();
			const button = ui_buttons.ButtonManager.createFromNode(e.currentTarget);
			if (button && button.isDisabled()) {
				return;
			}
			WorkgroupForm.getInstance().alertManager.hideAllAlerts();
			const errorDataList = (await FieldsManager.check()).filter(errorData => {
				return main_core.Type.isPlainObject(errorData) && main_core.Type.isStringFilled(errorData.message) && main_core.Type.isDomNode(errorData.bindNode);
			});
			if (errorDataList.length > 0) {
				errorDataList.forEach(errorData => {
					FieldsManager.showError(errorData);
				});
			} else if (WorkgroupForm.getInstance().wizardManager.currentStep < WorkgroupForm.getInstance().wizardManager.stepsCount) {
				WorkgroupForm.getInstance().wizardManager.currentStep++;
				if (WorkgroupForm.getInstance().wizardManager.currentStep === 3 && Object.entries(WorkgroupForm.getInstance().confidentialityTypes) <= 1)
					// skip confidentiality step
					{
						WorkgroupForm.getInstance().wizardManager.currentStep++;
					}
				WorkgroupForm.getInstance().wizardManager.showCurrentStep();
			} else {
				const submitFunction = function (event) {
					WorkgroupForm.getInstance().submitForm(event);
				}.bind(WorkgroupForm.getInstance());
				submitFunction(e);
			}
			return e.preventDefault();
		}
		static showWaitSubmitButton(disable) {
			disable = !!disable;
			const buttonNode = document.getElementById('sonet_group_create_popup_form_button_submit');
			if (!buttonNode) {
				return;
			}
			const button = ui_buttons.ButtonManager.createFromNode(buttonNode);
			if (disable) {
				if (button) {
					button.setWaiting(true);
				}
				buttonNode.removeEventListener('click', WorkgroupForm.getInstance().submitButtonClickHandler);
			} else {
				if (button) {
					button.setWaiting(false);
				}
				buttonNode.addEventListener('click', WorkgroupForm.getInstance().submitButtonClickHandler);
			}
		}
		static disableButton(buttonNode, disable) {
			if (!main_core.Type.isDomNode(buttonNode)) {
				return;
			}
			const button = ui_buttons.ButtonManager.createFromNode(buttonNode);
			if (!button) {
				return;
			}
			button.setDisabled(disable);
		}
		static showButton(buttonNode) {
			if (!main_core.Type.isDomNode(buttonNode)) {
				return;
			}
			buttonNode.classList.remove(this.cssClass.hidden);
		}
		static hideButton(buttonNode) {
			if (!main_core.Type.isDomNode(buttonNode)) {
				return;
			}
			buttonNode.classList.add(this.cssClass.hidden);
		}
		initCollabCreateButton() {
			this.collabCreateButton = document.getElementById('sonet_group_create_popup_form_button_collab');
			if (!this.collabCreateButton) {
				return;
			}
			this.collabCreateButton.onclick = e => {
				e.preventDefault();
				this.#sendCollabCreateButtonAnalytics();
				im_public_iframe.Messenger.openChatCreation('collab');
			};
		}
		#sendCollabCreateButtonAnalytics() {
			const analyticsData = {
				event: 'click_create_new',
				category: 'collab',
				c_section: 'project',
				tool: 'im',
				p2: `user_${WorkgroupForm.getInstance().currentUserType}`
			};
			if (BX.UI.Analytics) {
				BX.UI.Analytics.sendData(analyticsData);
			} else {
				// eslint-disable-next-line promise/catch-or-return
				BX.Runtime.loadExtension('ui.analytics').then(() => {
					BX.UI.Analytics.sendData(analyticsData);
				});
			}
		}
		updateButtonsByProject(projectType) {
			if (projectType === 'collab') {
				Buttons.hideButton(this.submitButton);
				Buttons.showButton(this.collabCreateButton);
			} else {
				Buttons.hideButton(this.collabCreateButton);
				Buttons.showButton(this.submitButton);
			}
		}
	}

	class TypePresetSelector {
		constructor(buttonsInstance = null) {
			this.cssClass = {
				container: 'socialnetwork-group-create-ex__type-preset-wrapper',
				selector: 'socialnetwork-group-create-ex__type-preset-selector'
			};
			this.buttonsInstance = buttonsInstance;
			this.container = document.querySelector(`.${this.cssClass.container}`);
			if (!this.container) {
				return;
			}
			let firstItemSelected = false;
			const selectors = this.container.querySelectorAll(`.${this.cssClass.selector}`);
			selectors.forEach(selector => {
				selector.addEventListener('click', e => {
					const selector = e.currentTarget;
					if (selector.classList.contains(Util.cssClass.selectorDisabled)) {
						return;
					}
					const limitFeature = selector.getAttribute('data-bx-project-limit');
					if (limitFeature?.length > 0) {
						socialnetwork_limit.Limit.showInstance({
							featureId: limitFeature
						});
						return;
					}
					Util.unselectAllSelectorItems(this.container, this.cssClass.selector);
					Util.selectSelectorItem(selector);
					const projectType = selector.getAttribute('data-bx-project-type');
					WorkgroupForm.getInstance().recalcForm({
						selectedProjectType: projectType
					});
					this.buttonsInstance?.updateButtonsByProject(projectType);
					WorkgroupForm.getInstance().wizardManager.setProjectType(projectType);
				});
				const projectType = selector.getAttribute('data-bx-project-type');
				if (main_core.Type.isStringFilled(WorkgroupForm.getInstance().selectedProjectType)) {
					if (WorkgroupForm.getInstance().selectedProjectType === projectType) {
						this.selectItem(selector);
					}
				} else if (!firstItemSelected) {
					this.selectItem(selector);
					firstItemSelected = true;
				}
			});
		}
		selectItem(selector) {
			const projectType = selector.getAttribute('data-bx-project-type');
			Util.selectSelectorItem(selector);
			WorkgroupForm.getInstance().recalcForm({
				selectedProjectType: projectType
			});
			WorkgroupForm.getInstance().wizardManager.setProjectType(projectType);
		}
	}

	class Wizard {
		static cssClass = {
			step1Backgroud: 'socialnetwork-group-create-ex__background-gif',
			breadcrumbsContainer: 'socialnetwork-group-create-ex__breadcrumbs',
			breadcrumbsItem: 'socialnetwork-group-create-ex__breadcrumbs-item',
			bodyContainer: 'socialnetwork-group-create-ex__content',
			bodyItem: 'socialnetwork-group-create-ex__content-body',
			activeBodyItem: '--active',
			activeBreadcrumbsItem: '--active'
		};
		static getFirstStepNumber() {
			return Object.entries(WorkgroupForm.getInstance().projectTypes).length > 1 ? 1 : 2;
		}
		constructor(params) {
			this.processedStep = 0;
			this.currentStep = params.currentStep;
			this.stepsCount = params.stepsCount;
			this.step1BackgroudNode = document.querySelector(`.${Wizard.cssClass.step1Backgroud}`);
			this.bodyContainer = document.querySelector(`.${Wizard.cssClass.bodyContainer}`);
			this.breadcrumbsContainer = document.querySelector(`.${Wizard.cssClass.breadcrumbsContainer}`);
		}
		showCurrentStep() {
			if (main_core.Type.isDomNode(this.bodyContainer)) {
				this.bodyContainer.querySelectorAll(`.${Wizard.cssClass.bodyItem}`).forEach(bodyItem => {
					if (bodyItem.classList.contains(`--step-${this.currentStep}`)) {
						bodyItem.classList.add(Wizard.cssClass.activeBodyItem);
					} else {
						bodyItem.classList.remove(Wizard.cssClass.activeBodyItem);
					}
				});
			}
			if (main_core.Type.isDomNode(this.breadcrumbsContainer)) {
				this.breadcrumbsContainer.querySelectorAll(`.${Wizard.cssClass.breadcrumbsItem}`).forEach(breadcrumbsItem => {
					if (breadcrumbsItem.classList.contains(`--step-${this.currentStep}`)) {
						breadcrumbsItem.classList.add(Wizard.cssClass.activeBreadcrumbsItem);
					} else {
						breadcrumbsItem.classList.remove(Wizard.cssClass.activeBreadcrumbsItem);
					}
				});
			}
			if (this.currentStep === Wizard.getFirstStepNumber() || this.currentStep <= this.processedStep + 1) {
				Buttons.hideButton(WorkgroupForm.getInstance().buttonsInstance.backButton);
			} else {
				if (main_core.Type.isDomNode(this.step1BackgroudNode)) {
					this.step1BackgroudNode.classList.add(`--stop`);
				}
				Buttons.showButton(WorkgroupForm.getInstance().buttonsInstance.backButton);
			}
			this.#sendAnalytics();
		}
		setProjectType(projectType) {
			if (main_core.Type.isDomNode(this.step1BackgroudNode)) {
				['project', 'scrum', 'group', 'collab'].forEach(projectType => {
					this.step1BackgroudNode.classList.remove(`--${projectType}`);
				});
				this.step1BackgroudNode.classList.remove('--stop');
				this.step1BackgroudNode.classList.add(`--${projectType}`);
			}
		}
		recalcAfterSubmit(params) {
			const processedStep = main_core.Type.isStringFilled(params.processedStep) ? params.processedStep : '';
			const createdGroupId = parseInt(!main_core.Type.isUndefined(params.createdGroupId) ? params.createdGroupId : 0);
			const tabInputNode = document.getElementById('TAB');
			const tabGroupIdNode = document.getElementById('SONET_GROUP_ID');
			if (!tabInputNode || !main_core.Type.isStringFilled(processedStep) || createdGroupId <= 0) {
				return;
			}
			tabGroupIdNode.value = createdGroupId;
			if (processedStep === 'create') {
				this.processedStep = 1;
				tabInputNode.value = 'edit';
			} else if (processedStep === 'edit') {
				this.processedStep = 3;
				tabInputNode.value = 'invite';
				this.bodyContainer.querySelectorAll('.socialnetwork-group-create-ex__create--switch-notinviteonly').forEach(selector => {
					selector.classList.add('--inviteonly');
				});
			}
			this.showCurrentStep();
		}
		#sendAnalytics() {
			let event = '';
			let analyticsData = {};
			if (this.currentStep === 3) {
				if (WorkgroupForm.getInstance().isScrumForm) {
					event = 'scrum_create_step2';
					analyticsData = {
						event,
						category: 'scrum',
						c_section: 'scrum',
						c_sub_section: 'scrum_grid',
						c_element: 'continue_button',
						tool: 'tasks',
						status: 'success',
						p1: `isDemo_${WorkgroupForm.getInstance().isScrumTrialEnabled ? 'Y' : 'N'}`
					};
				} else {
					event = 'project_create_step2';
					analyticsData = {
						event,
						category: 'project',
						c_section: 'project',
						c_sub_section: 'project_grid',
						c_element: 'continue_button',
						tool: 'tasks',
						status: 'success',
						p1: `isDemo_${WorkgroupForm.getInstance().isProjectsTrialEnabled ? 'Y' : 'N'}`
					};
				}
			}
			if (!main_core.Type.isStringFilled(event)) {
				return;
			}
			if (BX.UI.Analytics) {
				BX.UI.Analytics.sendData(analyticsData);
			} else {
				// eslint-disable-next-line promise/catch-or-return
				BX.Runtime.loadExtension('ui.analytics').then(() => {
					BX.UI.Analytics.sendData(analyticsData);
				});
			}
		}
	}

	class AlertManager {
		constructor(params) {
			if (!main_core.Type.isStringFilled(params.errorContainerId)) {
				return;
			}
			this.globalErrorContainer = document.getElementById(params.errorContainerId);
			this.nodeAlerts = new Map();
		}
		showAlert(text, targetNode) {
			if (main_core.Type.isDomNode(targetNode)) {
				targetNode.classList.add('ui-ctl-danger');
			} else {
				targetNode = this.globalErrorContainer;
			}
			const textAlert = new ui_alerts.Alert({
				color: ui_alerts.Alert.Color.DANGER,
				animate: true
			});
			this.nodeAlerts.set(targetNode, textAlert);
			setTimeout(() => {
				targetNode.parentNode.insertBefore(textAlert.getContainer(), targetNode.nextSibling);
				textAlert.setText(text);
				window.scrollTo({
					top: main_core.Dom.getPosition(targetNode).top,
					behavior: 'smooth'
				});
			}, 500);
		}
		hideAllAlerts() {
			this.nodeAlerts.forEach((textAlert, targetNode) => {
				textAlert.hide();
				if (main_core.Type.isDomNode(targetNode)) {
					targetNode.classList.remove('ui-ctl-danger');
				}
			});
			this.nodeAlerts.clear();
		}
	}

	class TeamManager {
		static instance = null;
		static contextList = {
			owner: 'GROUP_INVITE_OWNER',
			scrumMaster: 'GROUP_INVITE_SCRUM_MASTER',
			moderators: 'GROUP_INVITE_MODERATORS',
			users: 'GROUP_INVITE'
		};
		static getInstance() {
			return TeamManager.instance;
		}
		constructor(params) {
			this.groupId = parseInt(params.groupId, 10);
			this.ownerSelector = null;
			this.scrumMasterSelector = null;
			this.moderatorsSelector = null;
			this.usersSelector = null;
			this.ownerOptions = params.ownerOptions || {};
			this.scrumMasterOptions = params.scrumMasterOptions || {};
			this.moderatorsOptions = params.moderatorsOptions || {};
			this.usersOptions = params.usersOptions || {};
			this.ownerContainerNode = document.getElementById('GROUP_OWNER_selector');
			this.scrumMasterContainerNode = document.getElementById('SCRUM_MASTER_selector');
			this.moderatorsContainerNode = document.getElementById('GROUP_MODERATORS_selector');
			this.usersContainerNode = document.getElementById('GROUP_USERS_selector');
			this.isCurrentUserAdmin = main_core.Type.isBoolean(params.isCurrentUserAdmin) ? params.isCurrentUserAdmin : false;
			this.extranetInstalled = main_core.Type.isBoolean(params.extranetInstalled) ? params.extranetInstalled : false;
			this.allowExtranet = main_core.Type.isBoolean(params.allowExtranet) ? params.allowExtranet : false;
			TeamManager.instance = this;
			this.buildOwnerSelector();
			this.buildScrumMasterSelector();
			this.buildModeratorsSelector();
			this.buildUsersSelector();
			this.bindEvents();
		}
		buildOwnerSelector() {
			if (!main_core.Type.isDomNode(this.ownerContainerNode)) {
				return;
			}
			main_core.Dom.clean(this.ownerContainerNode);
			const selectorOptions = this.ownerOptions;
			this.ownerSelector = new ui_entitySelector.TagSelector({
				id: selectorOptions.selectorId || 'group_create_owner',
				dialogOptions: {
					id: selectorOptions.selectorId || 'group_create_owner',
					offsetLeft: 78,
					context: TeamManager.contextList.owner,
					preselectedItems: selectorOptions.value,
					events: {
						onLoad: this.onLoad.bind(this),
						'Item:onSelect': TeamManager.onOwnerSelect,
						'Item:onDeselect': TeamManager.onOwnerSelect
					},
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: !this.allowExtranet,
							inviteEmployeeLink: true,
							inviteExtranetLink: true,
							groupId: this.groupId,
							checkWorkgroupWhenInvite: true,
							footerInviteIntranetOnly: !this.allowExtranet,
							collabers: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'usersOnly'
						}
					}]
				},
				multiple: false,
				addButtonCaption: main_core.Loc.getMessage('SONET_GCE_T_ADD_OWNER')
			});
			this.ownerSelector.renderTo(this.ownerContainerNode);
		}
		buildScrumMasterSelector() {
			if (!main_core.Type.isDomNode(this.scrumMasterContainerNode)) {
				return;
			}
			main_core.Dom.clean(this.scrumMasterContainerNode);
			const selectorOptions = this.scrumMasterOptions;
			this.scrumMasterSelector = new ui_entitySelector.TagSelector({
				id: selectorOptions.selectorId || 'group_create_scrum_master',
				dialogOptions: {
					id: selectorOptions.selectorId || 'group_create_scrum_master',
					offsetLeft: 78,
					context: TeamManager.contextList.scrumMaster,
					preselectedItems: selectorOptions.value,
					events: {
						onLoad: this.onLoad.bind(this),
						'Item:onSelect': TeamManager.onScrumMasterSelect,
						'Item:onDeselect': TeamManager.onScrumMasterSelect
					},
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: !this.allowExtranet,
							inviteEmployeeLink: true,
							footerInviteIntranetOnly: !this.allowExtranet,
							collabers: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'usersOnly'
						}
					}]
				},
				multiple: false,
				addButtonCaption: main_core.Loc.getMessage('SONET_GCE_T_CHANGE_SCRUM_MASTER'),
				addButtonCaptionMore: main_core.Loc.getMessage('SONET_GCE_T_CHANGE_SCRUM_MASTER_MORE')
			});
			this.scrumMasterSelector.renderTo(this.scrumMasterContainerNode);
		}
		buildModeratorsSelector() {
			if (!main_core.Type.isDomNode(this.moderatorsContainerNode)) {
				return;
			}
			main_core.Dom.clean(this.moderatorsContainerNode);
			const selectorOptions = this.moderatorsOptions;
			this.moderatorsSelector = new ui_entitySelector.TagSelector({
				id: selectorOptions.selectorId || 'group_create_moderators',
				dialogOptions: {
					id: selectorOptions.selectorId || 'group_create_moderators',
					offsetLeft: 78,
					context: TeamManager.contextList.moderators,
					preselectedItems: selectorOptions.value,
					events: {
						onLoad: this.onLoad.bind(this),
						'Item:onSelect': TeamManager.onModeratorsSelect,
						'Item:onDeselect': TeamManager.onModeratorsSelect
					},
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: !this.allowExtranet,
							inviteEmployeeLink: true,
							groupId: this.groupId,
							checkWorkgroupWhenInvite: true,
							footerInviteIntranetOnly: !this.allowExtranet,
							collabers: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'usersOnly'
						}
					}]
				},
				multiple: true,
				addButtonCaption: main_core.Loc.getMessage('SONET_GCE_T_ADD_USER'),
				addButtonCaptionMore: main_core.Loc.getMessage('SONET_GCE_T_ADD_USER_MORE')
			});
			this.moderatorsSelector.renderTo(this.moderatorsContainerNode);
		}
		buildUsersSelector() {
			if (!main_core.Type.isDomNode(this.usersContainerNode)) {
				return;
			}
			main_core.Dom.clean(this.usersContainerNode);
			const selectorOptions = this.usersOptions;
			this.usersSelector = new ui_entitySelector.TagSelector({
				id: selectorOptions.selectorId || 'group_create_users',
				dialogOptions: {
					id: selectorOptions.selectorId || 'group_create_users',
					offsetLeft: 78,
					context: TeamManager.contextList.users,
					preselectedItems: selectorOptions.value,
					events: {
						onLoad: this.onLoad.bind(this),
						'Item:onSelect': TeamManager.onUsersSelect,
						'Item:onDeselect': TeamManager.onUsersSelect
					},
					entities: [{
						id: 'user',
						options: {
							inviteEmployeeLink: true,
							'!userId': this.isCurrentUserAdmin ? [parseInt(main_core.Loc.getMessage('USER_ID'))] : [],
							intranetUsersOnly: !this.allowExtranet,
							groupId: this.groupId,
							checkWorkgroupWhenInvite: true,
							footerInviteIntranetOnly: !this.allowExtranet,
							collabers: false
						}
					}, {
						id: 'department',
						options: {
							selectMode: selectorOptions.enableSelectDepartment ? 'usersAndDepartments' : 'usersOnly'
						}
					}]
				},
				multiple: true,
				addButtonCaption: main_core.Loc.getMessage('SONET_GCE_T_ADD_USER'),
				addButtonCaptionMore: main_core.Loc.getMessage('SONET_GCE_T_ADD_USER_MORE')
			});
			this.usersSelector.renderTo(this.usersContainerNode);
		}
		bindEvents() {
			WorkgroupForm.getInstance().subscribe('onSwitchExtranet', this.onSwitchExtranet.bind(this));
			main_core_events.EventEmitter.emit('BX.Socialnetwork.WorkgroupFormTeamManager::onEventsBinded');
		}
		onSwitchExtranet(event) {
			const data = event.getData();
			if (!main_core.Type.isBoolean(data.isChecked)) {
				return;
			}
			this.allowExtranet = this.extranetInstalled && data.isChecked;
			if (this.ownerSelector && ['DONE', 'UNSENT'].includes(this.ownerSelector.getDialog().loadState)) {
				this.recalcSelectorByExtranetSwitched({
					selector: this.ownerSelector,
					isChecked: data.isChecked,
					options: this.ownerOptions
				});
				this.buildOwnerSelector();
			}
			if (this.scrumMasterSelector && ['DONE', 'UNSENT'].includes(this.scrumMasterSelector.getDialog().loadState)) {
				this.recalcSelectorByExtranetSwitched({
					selector: this.scrumMasterSelector,
					isChecked: data.isChecked,
					options: this.scrumMasterOptions
				});
				this.buildScrumMasterSelector();
			}
			if (this.moderatorsSelector && ['DONE', 'UNSENT'].includes(this.moderatorsSelector.getDialog().loadState)) {
				this.recalcSelectorByExtranetSwitched({
					selector: this.moderatorsSelector,
					isChecked: data.isChecked,
					options: this.moderatorsOptions
				});
				this.buildModeratorsSelector();
			}
			if (this.usersSelector && ['DONE', 'UNSENT'].includes(this.usersSelector.getDialog().loadState)) {
				this.recalcSelectorByExtranetSwitched({
					selector: this.usersSelector,
					isChecked: data.isChecked,
					options: this.usersOptions
				});
				this.buildUsersSelector();
			}
		}
		recalcSelectorByExtranetSwitched(params) {
			const selector = params.selector;
			const isChecked = params.isChecked;
			const context = selector.getDialog().getContext();
			let selectedItems = selector.getDialog().getSelectedItems();
			if (this.extranetInstalled && !isChecked && main_core.Type.isArray(selectedItems)) {
				selectedItems = selectedItems.filter(item => {
					return !(item.getEntityId() === 'user' && item.getEntityType() === 'extranet');
				});
				switch (context) {
					case TeamManager.contextList.owner:
						Util.recalcInputValue({
							selectedItems: selectedItems,
							inputNodeName: 'OWNER_CODE',
							inputContainerNodeId: 'OWNER_CODE_container',
							multiple: false
						});
						break;
					case TeamManager.contextList.scrumMaster:
						Util.recalcInputValue({
							selectedItems: selectedItems,
							inputNodeName: 'SCRUM_MASTER_CODE',
							inputContainerNodeId: 'SCRUM_MASTER_CODE_container',
							multiple: false
						});
						break;
					case TeamManager.contextList.moderators:
						Util.recalcInputValue({
							selectedItems: selectedItems,
							inputNodeName: 'MODERATOR_CODES',
							inputContainerNodeId: 'MODERATOR_CODES_container',
							multiple: true
						});
						break;
					case TeamManager.contextList.users:
						Util.recalcInputValue({
							selectedItems: selectedItems,
							inputNodeName: 'USER_CODES',
							inputContainerNodeId: 'USER_CODES_container',
							multiple: true
						});
						break;
				}
			}
			params.options.value = selectedItems.map(item => {
				return [item.getEntityId(), item.getId()];
			});
		}
		onLoad(event) {
			switch (event.getTarget().context) {
				case TeamManager.contextList.owner:
					this.recalcSelectorByExtranetSwitched({
						selector: this.ownerSelector,
						isChecked: this.allowExtranet,
						options: this.ownerOptions
					});
					break;
				case TeamManager.contextList.scrumMaster:
					this.recalcSelectorByExtranetSwitched({
						selector: this.scrumMasterSelector,
						isChecked: this.allowExtranet,
						options: this.scrumMasterOptions
					});
					break;
				case TeamManager.contextList.moderators:
					this.recalcSelectorByExtranetSwitched({
						selector: this.moderatorsSelector,
						isChecked: this.allowExtranet,
						options: this.moderatorsOptions
					});
					if (WorkgroupForm.getInstance().initialFocus === 'addModerator') {
						this.moderatorsSelector.getAddButtonLink().click();
					}
					break;
				case TeamManager.contextList.users:
					this.recalcSelectorByExtranetSwitched({
						selector: this.usersSelector,
						isChecked: this.allowExtranet,
						options: this.usersOptions
					});
					break;
			}
		}
		static onOwnerSelect(event) {
			Util.recalcInputValue({
				selectedItems: event.getTarget().getSelectedItems(),
				inputNodeName: 'OWNER_CODE',
				inputContainerNodeId: 'OWNER_CODE_container',
				multiple: false
			});
		}
		static onScrumMasterSelect(event) {
			Util.recalcInputValue({
				selectedItems: event.getTarget().getSelectedItems(),
				inputNodeName: 'SCRUM_MASTER_CODE',
				inputContainerNodeId: 'SCRUM_MASTER_CODE_container',
				multiple: false
			});
		}
		static onModeratorsSelect(event) {
			Util.recalcInputValue({
				selectedItems: event.getTarget().getSelectedItems(),
				inputNodeName: 'MODERATOR_CODES',
				inputContainerNodeId: 'MODERATOR_CODES_container',
				multiple: true
			});
		}
		static onUsersSelect(event) {
			Util.recalcInputValue({
				selectedItems: event.getTarget().getSelectedItems(),
				inputNodeName: 'USER_CODES',
				inputContainerNodeId: 'USER_CODES_container',
				multiple: true
			});
			const hintNode = document.getElementById('GROUP_ADD_DEPT_HINT_block');
			if (hintNode) {
				TeamManager.showDepartmentHint({
					selectedItems: event.getTarget().getSelectedItems(),
					hintNode: hintNode
				});
			}
		}
		static showDepartmentHint(params) {
			const selectedItems = params.selectedItems || {};
			const hintNode = params.hintNode || null;
			if (!main_core.Type.isDomNode(hintNode)) {
				return;
			}
			if (!main_core.Type.isArray(selectedItems)) {
				hintNode.classList.remove('visible');
				return;
			}
			const departmentFound = !main_core.Type.isUndefined(selectedItems.find(item => {
				return item.entityId === 'department';
			}));
			if (departmentFound) {
				hintNode.classList.add('visible');
			} else {
				hintNode.classList.remove('visible');
			}
		}
	}

	class FeaturesManager {
		constructor() {
			const containerNode = document.getElementById('additional-block-features');
			if (!containerNode) {
				return;
			}
			containerNode.querySelectorAll('.socialnetwork-group-create-ex__project-instruments--icon-action.--edit').forEach(editButton => {
				editButton.addEventListener('click', e => {
					const editButton = e.currentTarget;
					const featureNode = editButton.closest('.socialnetwork-group-create-ex__project-instruments--item');
					if (featureNode) {
						featureNode.classList.add('--custom-value');
						const inputNode = featureNode.querySelector('[data-role="feature-input-text"]');
						const textNode = featureNode.querySelector('[data-role="feature-label"]');
						if (inputNode && textNode) {
							inputNode.value = textNode.innerText;
						}
					}
					e.preventDefault();
				});
			});
			containerNode.querySelectorAll('.socialnetwork-group-create-ex__project-instruments--icon-action.--revert').forEach(cancelButton => {
				cancelButton.addEventListener('click', e => {
					const editButton = e.currentTarget;
					const featureNode = editButton.closest('.socialnetwork-group-create-ex__project-instruments--item');
					if (featureNode) {
						featureNode.classList.remove('--custom-value');
						const inputNode = featureNode.querySelector('[data-role="feature-input-text"]');
						if (inputNode) {
							inputNode.value = '';
						}
					}
					e.preventDefault();
				});
			});
		}
	}

	class UFManager {
		constructor(params) {
			if (main_core.Type.isPlainObject(FieldsManager.mandatoryFieldsByStep) && main_core.Type.isArray(FieldsManager.mandatoryFieldsByStep[2]) && main_core.Type.isArray(params.mandatoryUFList)) {
				params.mandatoryUFList.forEach(ufData => {
					if (!main_core.Type.isStringFilled(ufData.id) || !main_core.Type.isStringFilled(ufData.type)) {
						return;
					}
					FieldsManager.mandatoryFieldsByStep[2].push(ufData);
				});
			}
		}
	}

	var fr = 60;
	var v = "5.9.6";
	var ip = 0;
	var op = 228.69199999999998;
	var w = 220;
	var h = 220;
	var nm = "Scrum";
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] Scrum - Null / Frame 386 - Null / Frame 385 - Null / 02 - Null / 02",
			fr: 60,
			id: "lz9or3o0yt7oupgc",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Scrum - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Frame 386 - Null",
					sr: 1,
					parent: 13,
					ks: {
						a: {
							a: 0,
							k: [
								80,
								80
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 15.372,
									s: [
										-19.900000000000006,
										110
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 56.064,
									s: [
										110,
										110
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 176.22,
									s: [
										110,
										110
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 205.458,
									s: [
										246,
										110
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 63.19199999999999,
									s: [
										-1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 170.02800000000002,
									s: [
										-360
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Frame 385 - Null",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								67,
								114
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "02 - Null",
					sr: 1,
					parent: 15,
					ks: {
						a: {
							a: 0,
							k: [
								14.5,
								22.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								16.5,
								24.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "02",
					sr: 1,
					parent: 16,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.5556,
													35.5539
												],
												[
													1.5556,
													28.5712
												],
												[
													4.3672,
													25.8366
												],
												[
													7.1788,
													23.102
												],
												[
													7.1788,
													18.5533
												],
												[
													7.1788,
													14.0046
												],
												[
													4.3287,
													11.2168
												],
												[
													1.4786,
													8.429
												],
												[
													1.4786,
													1.4463
												],
												[
													8.6174,
													1.4463
												],
												[
													12.0844,
													4.8375
												],
												[
													15.5514,
													8.2287
												],
												[
													22.4853,
													15.011
												],
												[
													22.5217,
													15.0463
												],
												[
													24.0002,
													18.5378
												],
												[
													22.5217,
													22.0293
												],
												[
													22.4853,
													22.0646
												],
												[
													15.59,
													28.8093
												],
												[
													12.1423,
													32.1816
												],
												[
													8.6946,
													35.5539
												],
												[
													1.5558,
													35.5539
												]
											],
											i: [
												[
													1.97133,
													1.9282200000000032
												],
												[
													-1.9713,
													1.9282
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.9713,
													1.9282
												],
												[
													-1.9713,
													-1.9282
												],
												[
													-1.3539,
													-1.3243
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-1.2637
												],
												[
													0.9857,
													-0.9642
												],
												[
													0,
													0
												],
												[
													2.6928,
													-2.634
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.9713,
													1.9282
												]
											],
											o: [
												[
													-1.97133,
													-1.9282200000000032
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.97132,
													-1.9282199999999996
												],
												[
													1.9713199999999997,
													-1.92822
												],
												[
													1.35393,
													1.3243299999999998
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.985710000000001,
													0.9641600000000015
												],
												[
													0.00005000000000165983,
													1.2636900000000004
												],
												[
													0,
													0
												],
												[
													-2.692800000000002,
													2.633960000000002
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-1.97131,
													1.9282299999999992
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "[FRAME] Scrum - Null / Frame 386 - Null / Frame 385",
			fr: 60,
			id: "lz9or3ny6yxegwz9",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "Scrum - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "Frame 386 - Null",
					sr: 1,
					parent: 18,
					ks: {
						a: {
							a: 0,
							k: [
								80,
								80
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 15.372,
									s: [
										-19.900000000000006,
										110
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 56.064,
									s: [
										110,
										110
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 176.22,
									s: [
										110,
										110
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 205.458,
									s: [
										246,
										110
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 63.19199999999999,
									s: [
										-1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 170.02800000000002,
									s: [
										-360
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 20,
					ty: 0,
					nm: "Frame 385",
					refId: "lz9or3o0yt7oupgc",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 220,
					h: 220,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		},
		{
			nm: "Scrum",
			fr: 60,
			id: "lz9or3nxfohhtv6i",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 21,
					hd: false,
					nm: "Scrum - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 22,
					ty: 0,
					nm: "Frame 386",
					refId: "lz9or3ny6yxegwz9",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 220,
					h: 220,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					hd: false,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 23,
					hd: false,
					nm: "s stroke - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 0
						},
						p: {
							a: 0,
							k: [
								110,
								159.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 24,
					hd: false,
					nm: "s stroke - Stroke",
					sr: 1,
					parent: 23,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: false,
											v: [
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 11
									},
									lc: 1,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											5.75,
											5.5
										]
									},
									s: {
										a: 0,
										k: [
											23,
											22
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 25,
					hd: false,
					nm: "Ellipse 5177 - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								55.5,
								55.5
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								110.5,
								110.5
							]
						},
						r: {
							a: 0,
							k: 90
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 26,
					hd: false,
					nm: "Ellipse 5177 - Stroke",
					sr: 1,
					parent: 25,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													110,
													55
												],
												[
													55,
													110
												],
												[
													0,
													55
												],
												[
													55,
													0
												],
												[
													110,
													55
												]
											],
											i: [
												[
													0,
													-30.376499999999993
												],
												[
													30.3765,
													0
												],
												[
													0,
													30.3765
												],
												[
													-30.3765,
													0
												],
												[
													0,
													-30.3765
												]
											],
											o: [
												[
													0,
													30.376499999999993
												],
												[
													-30.3765,
													0
												],
												[
													0,
													-30.3765
												],
												[
													30.376499999999993,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 11
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "tm",
							s: {
								a: 1,
								k: [
									{
										t: 65.04,
										s: [
											100
										],
										o: {
											x: [
												0.5
											],
											y: [
												0
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 168.51,
										s: [
											0
										]
									}
								]
							},
							e: {
								a: 1,
								k: [
									{
										t: 110.112,
										s: [
											100
										],
										o: {
											x: [
												0.5
											],
											y: [
												0
											]
										},
										i: {
											x: [
												0.15
											],
											y: [
												1
											]
										}
									},
									{
										t: 183.978,
										s: [
											0
										]
									}
								]
							},
							o: {
								a: 0,
								k: 0
							},
							m: 1
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											60.5,
											60.5
										]
									},
									s: {
										a: 0,
										k: [
											242,
											242
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 27,
					hd: false,
					nm: "f stroke2 - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 182.604,
									s: [
										103.84,
										165
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 213.768,
									s: [
										231,
										165
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 120,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 28,
					hd: false,
					nm: "f stroke2 - Stroke",
					sr: 1,
					parent: 27,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 120,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 174.63,
												s: [
													{
														c: false,
														v: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 182.70600000000002,
												s: [
													{
														c: false,
														v: [
															[
																0,
																0
															],
															[
																44.7344,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "st",
									c: {
										a: 1,
										k: [
											{
												t: 166.62,
												s: [
													1,
													1,
													1,
													1
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 176.832,
												s: [
													1,
													1,
													1,
													1
												]
											}
										]
									},
									o: {
										a: 1,
										k: [
											{
												t: 166.62,
												s: [
													0
												],
												o: {
													x: [
														0
													],
													y: [
														0
													]
												},
												i: {
													x: [
														1
													],
													y: [
														1
													]
												}
											},
											{
												t: 176.832,
												s: [
													100
												]
											}
										]
									},
									w: {
										a: 0,
										k: 11
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											55.5,
											5.5
										]
									},
									s: {
										a: 0,
										k: [
											222,
											22
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 29,
					hd: false,
					nm: "f stroke - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								100,
								0
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 115.00200000000001,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 121.19399999999999,
									s: [
										0
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 18.588,
									s: [
										-8,
										165
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 53.94,
									s: [
										109,
										165
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 177.966,
									s: [
										109,
										165
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 193.008,
									s: [
										109,
										165
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ddd: 0,
					ind: 30,
					hd: false,
					nm: "f stroke - Stroke",
					sr: 1,
					parent: 29,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 115.00200000000001,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 121.19399999999999,
									s: [
										0
									]
								}
							]
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					ty: 4,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 1,
										k: [
											{
												t: 80.34,
												s: [
													{
														c: false,
														v: [
															[
																-4,
																0
															],
															[
																100,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												],
												o: {
													x: [
														0.25
													],
													y: [
														0.1
													]
												},
												i: {
													x: [
														0.25
													],
													y: [
														1
													]
												}
											},
											{
												t: 131.268,
												s: [
													{
														c: false,
														v: [
															[
																100,
																0
															],
															[
																100,
																0
															]
														],
														i: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														],
														o: [
															[
																0,
																0
															],
															[
																0,
																0
															]
														]
													}
												]
											}
										]
									}
								},
								{
									ty: "st",
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									o: {
										a: 0,
										k: 100
									},
									w: {
										a: 0,
										k: 11
									},
									lc: 2,
									lj: 1,
									ml: 4,
									bm: 0,
									nm: "Stroke",
									hd: false
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						},
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "rc",
									nm: "Rectangle",
									hd: false,
									p: {
										a: 0,
										k: [
											55.5,
											5.5
										]
									},
									s: {
										a: 0,
										k: [
											222,
											22
										]
									},
									r: {
										a: 0,
										k: 0
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 0
									},
									c: {
										a: 0,
										k: [
											0,
											1,
											0,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 31,
					hd: false,
					nm: "back - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								80,
								80
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								110,
								110
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 5.964,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 12.99,
									s: [
										111.58999999999999,
										111.58999999999999
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 17.904,
									s: [
										110.00000000000001,
										110.00000000000001
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 28.416,
									s: [
										98.41,
										98.41
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 35.778000000000006,
									s: [
										100.03999999999999,
										100.03999999999999
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 32,
					hd: false,
					nm: "back",
					sr: 1,
					parent: 31,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													160,
													80
												],
												[
													80,
													160
												],
												[
													0,
													80
												],
												[
													80,
													0
												],
												[
													160,
													80
												]
											],
											i: [
												[
													0,
													-44.184
												],
												[
													44.184,
													0
												],
												[
													0,
													44.184
												],
												[
													-44.184,
													0
												],
												[
													0,
													-44.184
												]
											],
											o: [
												[
													0,
													44.184
												],
												[
													-44.184,
													0
												],
												[
													0,
													-44.184
												],
												[
													44.184,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 1,
										k: [
											{
												t: 6.1080000000000005,
												s: [
													70
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.312,
												s: [
													100
												]
											}
										]
									},
									c: {
										a: 1,
										k: [
											{
												t: 6.1080000000000005,
												s: [
													0.07450980392156863,
													0.8862745098039215,
													0.8392156862745098,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 36.312,
												s: [
													0.07450980392156863,
													0.8862745098039215,
													0.8392156862745098,
													1
												]
											}
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 33,
					hd: false,
					nm: "round - Null",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								96,
								96
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								110,
								110
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 1,
							k: [
								{
									t: 6.21,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 13.248,
									s: [
										111.58999999999999,
										111.58999999999999
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 18.174,
									s: [
										110.00000000000001,
										110.00000000000001
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 28.692,
									s: [
										98.41,
										98.41
									],
									o: {
										x: [
											0.33
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.67
										],
										y: [
											1
										]
									}
								},
								{
									t: 36.054,
									s: [
										100.03999999999999,
										100.03999999999999
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 34,
					hd: false,
					nm: "round",
					sr: 1,
					parent: 33,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 229.69199999999998,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													192,
													96
												],
												[
													96,
													192
												],
												[
													0,
													96
												],
												[
													96,
													0
												],
												[
													192,
													96
												]
											],
											i: [
												[
													0,
													-53.01933
												],
												[
													53.0193,
													0
												],
												[
													0,
													53.0193
												],
												[
													-53.0193,
													0
												],
												[
													0,
													-53.0193
												]
											],
											o: [
												[
													0,
													53.01933
												],
												[
													-53.01934,
													0
												],
												[
													0,
													-53.01934
												],
												[
													53.01933,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													96,
													186
												],
												[
													186,
													96
												],
												[
													96,
													6
												],
												[
													6,
													96
												],
												[
													96,
													186
												]
											],
											i: [
												[
													-49.705629999999985,
													0
												],
												[
													0,
													49.7056
												],
												[
													49.7056,
													0
												],
												[
													0,
													-49.7056
												],
												[
													-49.7056,
													0
												]
											],
											o: [
												[
													49.705629999999985,
													0
												],
												[
													0,
													-49.70563
												],
												[
													-49.70563,
													0
												],
												[
													0,
													49.705629999999985
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 1,
										k: [
											{
												t: 6.1080000000000005,
												s: [
													70
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 52.002,
												s: [
													100
												]
											}
										]
									},
									c: {
										a: 1,
										k: [
											{
												t: 6.1080000000000005,
												s: [
													0.07450980392156863,
													0.8862745098039215,
													0.8392156862745098,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 52.002,
												s: [
													0.07450980392156863,
													0.8862745098039215,
													0.8392156862745098,
													1
												]
											}
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers = [
		{
			ty: 3,
			ddd: 0,
			ind: 21,
			hd: false,
			nm: "Scrum - Null",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				o: {
					a: 0,
					k: 100
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				r: {
					a: 0,
					k: 0
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				}
			},
			ao: 0,
			ip: 0,
			op: 229.69199999999998,
			st: 0,
			bm: 0
		},
		{
			ddd: 0,
			ind: 2,
			ty: 0,
			nm: "Scrum",
			refId: "lz9or3nxfohhtv6i",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 220,
			h: 220,
			ip: 0,
			op: 229.69199999999998,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var scrumLottieIconInfo = {
		fr: fr,
		v: v,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	class WorkgroupForm extends main_core_events.EventEmitter {
		static instance = null;
		#scrumLottieAnimation = null;
		#scrumLottieIconContainer;
		static PATH_TO_CSS = '/bitrix/components/bitrix/socialnetwork.group_create.ex/templates/.default/style.css';
		static getInstance() {
			return WorkgroupForm.instance;
		}
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.WorkgroupForm');
			this.componentName = params.componentName;
			this.signedParameters = params.signedParameters;
			this.userSelector = '';
			this.lastAction = 'invite';
			this.animationList = {};
			this.selectedTypeCode = false;
			this.#scrumLottieAnimation = null;
			this.#scrumLottieIconContainer = null;
			this.groupId = parseInt(params.groupId);
			this.isScrumProject = params.isScrumProject;
			this.config = params.config;
			this.avatarUploaderId = params.avatarUploaderId;
			this.themePickerData = params.themePickerData;
			this.projectOptions = params.projectOptions;
			this.isScrumForm = params.isScrumForm;
			this.isScrumTrialEnabled = params.isScrumTrialEnabled;
			this.isProjectsTrialEnabled = params.isProjectsTrialEnabled;
			this.projectTypes = params.projectTypes;
			this.confidentialityTypes = params.confidentialityTypes;
			this.selectedProjectType = params.selectedProjectType;
			this.selectedConfidentialityType = params.selectedConfidentialityType;
			this.initialFocus = main_core.Type.isStringFilled(params.focus) ? params.focus : '';
			this.culture = params.culture ? params.culture : {};
			this.currentUserType = params.currentUserType;
			this.demoInfoAlreadyBeenShown = false;
			this.scrumManager = new Scrum({
				isScrumProject: this.isScrumProject
			});
			this.wizardManager = new Wizard({
				currentStep: Object.entries(this.projectTypes).length > 1 ? 1 : 2,
				stepsCount: params.stepsCount > 1 ? params.stepsCount : 1
			});
			this.alertManager = new AlertManager({
				errorContainerId: 'sonet_group_create_error_block'
			});
			WorkgroupForm.instance = this;
			this.buttonsInstance = new Buttons();
			this.init(params);
		}
		init(params) {
			this.scrumManager.makeAdditionalCustomizationForm();
			if (this.groupId <= 0) {
				this.recalcForm();
			}
			new Avatar({
				componentName: this.componentName,
				signedParameters: this.signedParameters,
				groupId: this.groupId
			});
			if (main_core.Type.isPlainObject(params.themePickerData) && document.getElementById('GROUP_THEME_container')) {
				new ThemePicker({
					container: document.getElementById('GROUP_THEME_container'),
					theme: params.themePickerData
				});
			}
			new DateCorrector({
				culture: this.culture
			});
			if (document.getElementById('group-tags-bind-node')) {
				new Tags({
					groupId: this.groupId,
					containerNodeId: 'group-tags-bind-node',
					hiddenFieldId: 'GROUP_KEYWORDS'
				});
			}
			new TypePresetSelector(this.buttonsInstance);
			new ConfidentialitySelector();
			new FeaturesManager();
			if (main_core.Type.isStringFilled(this.initialFocus)) {
				if (this.initialFocus === 'description') {
					const groupDescriptionNode = document.getElementById('GROUP_DESCRIPTION_input');
					if (groupDescriptionNode) {
						groupDescriptionNode.focus();
					}
				}
			} else {
				const groupNameNode = document.getElementById('GROUP_NAME_input');
				if (groupNameNode) {
					groupNameNode.focus();
				}
			}
			this.bindEvents();
			Util.initExpandSwitches();
			Util.initDropdowns();
			if (main_core.Type.isStringFilled(params.expandableSettingsNodeId)) {
				BX.UI.Hint.init(document.getElementById(params.expandableSettingsNodeId));
			}
			if (this.groupId <= 0 && this.selectedProjectType === 'scrum') {
				this.saveScrumAnalyticData();
			}
		}
		bindEvents() {
			if (BX.SidePanel.Instance.getTopSlider()) {
				main_core_events.EventEmitter.subscribe(BX.SidePanel.Instance.getTopSlider().getWindow(), 'SidePanel.Slider:onClose', event => {
					setTimeout(() => {
						const sliderInstance = event.getTarget();
						if (!sliderInstance) {
							return;
						}
						BX.SidePanel.Instance.destroy(sliderInstance.getUrl());
					}, 500);
				});
			}
			const extranetCheckboxNode = document.getElementById('IS_EXTRANET_GROUP');
			if (extranetCheckboxNode && extranetCheckboxNode.type === 'checkbox') {
				extranetCheckboxNode.addEventListener('click', () => {
					this.switchExtranet(extranetCheckboxNode.checked);
				});
			}
			const visibleCheckboxNode = document.getElementById('GROUP_VISIBLE');
			if (visibleCheckboxNode && visibleCheckboxNode.type === 'checkbox') {
				visibleCheckboxNode.addEventListener('click', () => {
					this.switchNotVisible(visibleCheckboxNode.checked);
				});
			}
			const projectCheckboxNode = document.getElementById('GROUP_PROJECT');
			if (projectCheckboxNode && projectCheckboxNode.type === 'checkbox') {
				projectCheckboxNode.addEventListener('click', () => {
					Util.recalcFormPartProject(projectCheckboxNode.checked);
				});
			}
			main_core_events.EventEmitter.subscribe('BX.Socialnetwork.WorkgroupFormTeamManager::onEventsBinded', this.recalcFormDependencies.bind(this));
		}
		recalcForm(params) {
			if (main_core.Type.isPlainObject(params)) {
				if (!main_core.Type.isUndefined(params.selectedProjectType)) {
					this.selectedProjectType = main_core.Type.isStringFilled(params.selectedProjectType) ? params.selectedProjectType : '';
				}
				if (!main_core.Type.isUndefined(params.selectedConfidentialityType)) {
					this.selectedConfidentialityType = main_core.Type.isStringFilled(params.selectedConfidentialityType) ? params.selectedConfidentialityType : '';
				}
			}
			if (this.groupId <= 0) {
				this.scrumManager.isScrumProject = main_core.Type.isPlainObject(this.projectTypes[this.selectedProjectType]) && main_core.Type.isStringFilled(this.projectTypes[this.selectedProjectType]['SCRUM_PROJECT']) && this.projectTypes[this.selectedProjectType]['SCRUM_PROJECT'] === 'Y';
				Util.recalcFormPartProject(main_core.Type.isPlainObject(this.projectTypes[this.selectedProjectType]) && main_core.Type.isStringFilled(this.projectTypes[this.selectedProjectType].PROJECT) && this.projectTypes[this.selectedProjectType].PROJECT === 'Y');
			}
			this.scrumManager.makeAdditionalCustomizationForm();
			if (this.groupId <= 0) {
				const openedCheckboxNode = document.getElementById('GROUP_OPENED');
				if (openedCheckboxNode) {
					Util.setCheckedValue(openedCheckboxNode, main_core.Type.isPlainObject(this.confidentialityTypes[this.selectedConfidentialityType]) && main_core.Type.isStringFilled(this.confidentialityTypes[this.selectedConfidentialityType].OPENED) && this.confidentialityTypes[this.selectedConfidentialityType].OPENED === 'Y');
				}
				const visibleCheckboxNode = document.getElementById('GROUP_VISIBLE');
				if (visibleCheckboxNode) {
					Util.setCheckedValue(visibleCheckboxNode, main_core.Type.isPlainObject(this.confidentialityTypes[this.selectedConfidentialityType]) && main_core.Type.isStringFilled(this.confidentialityTypes[this.selectedConfidentialityType].VISIBLE) && this.confidentialityTypes[this.selectedConfidentialityType].VISIBLE === 'Y');
				}
			}
			this.recalcFormDependencies();
		}
		recalcFormDependencies() {
			const extranetCheckboxNode = document.getElementById('IS_EXTRANET_GROUP');
			if (extranetCheckboxNode) {
				this.switchExtranet(Util.getCheckedValue(extranetCheckboxNode));
			}
			const visibleCheckboxNode = document.getElementById('GROUP_VISIBLE');
			if (visibleCheckboxNode) {
				this.switchNotVisible(visibleCheckboxNode.checked);
			}
		}
		switchExtranet(isChecked) {
			this.emit('onSwitchExtranet', new main_core_events.BaseEvent({
				data: {
					isChecked
				}
			}));
			const openedBlock = document.getElementById('GROUP_OPENED');
			if (openedBlock) {
				if (!isChecked) {
					if (openedBlock.type === 'checkbox') {
						openedBlock.disabled = false;
					}
				} else {
					if (openedBlock.type === 'checkbox') {
						openedBlock.disabled = true;
						openedBlock.checked = false;
					} else {
						openedBlock.value = 'N';
					}
				}
			}
			const visibleBlock = document.getElementById('GROUP_VISIBLE');
			if (visibleBlock) {
				if (!isChecked) {
					if (visibleBlock.type == 'checkbox') {
						visibleBlock.disabled = false;
					}
				} else {
					if (visibleBlock.type == 'checkbox') {
						visibleBlock.disabled = true;
						visibleBlock.checked = false;
					} else {
						visibleBlock.value = 'N';
					}
				}
				this.switchNotVisible(visibleBlock.checked);
			}
		}
		switchNotVisible(isChecked) {
			const openedNode = document.getElementById('GROUP_OPENED');
			if (openedNode && openedNode.type == 'checkbox') {
				if (isChecked) {
					openedNode.disabled = false;
				} else {
					openedNode.disabled = true;
					openedNode.checked = false;
				}
			}
		}
		submitForm(e) {
			let actionUrl = document.getElementById('sonet_group_create_popup_form').action;
			if (actionUrl) {
				const groupIdNode = document.getElementById('SONET_GROUP_ID');
				let b24statAction = 'addSonetGroup';
				if (groupIdNode) {
					if (parseInt(groupIdNode.value) <= 0) {
						actionUrl = main_core.Uri.addParam(actionUrl, {
							action: 'createGroup',
							groupType: this.selectedTypeCode
						});
					} else {
						b24statAction = 'editSonetGroup';
					}
				}
				actionUrl = main_core.Uri.addParam(actionUrl, {
					b24statAction: b24statAction
				});
				const formElements = document.forms['sonet_group_create_popup_form'].elements;
				if (formElements.GROUP_PROJECT && (formElements.IS_EXTRANET_GROUP || formElements.GROUP_OPENED)) {
					let b24statType = formElements.GROUP_PROJECT.checked ? 'project-' : 'group-';
					if (formElements.IS_EXTRANET_GROUP && formElements.IS_EXTRANET_GROUP.checked) {
						b24statType += 'external';
					} else {
						b24statType += formElements.GROUP_OPENED.checked ? 'open' : 'closed';
					}
					actionUrl = main_core.Uri.addParam(actionUrl, {
						b24statType: b24statType
					});
				}
				if (formElements.SCRUM_PROJECT && b24statAction === 'addSonetGroup') {
					actionUrl = main_core.Uri.addParam(actionUrl, {
						analyticsLabel: {
							scrum: 'Y',
							action: 'scrum_create'
						}
					});
				}
				Buttons.showWaitSubmitButton(true);
				main_core.ajax.submitAjax(document.forms['sonet_group_create_popup_form'], {
					url: actionUrl,
					method: 'POST',
					dataType: 'json',
					data: {
						PROJECT_OPTIONS: this.projectOptions
					},
					onsuccess: response => {
						if (main_core.Type.isStringFilled(response.ERROR)) {
							const warningText = main_core.Type.isStringFilled(response.WARNING) ? `${response.WARNING}<br>` : '';
							this.alertManager.showAlert(`${warningText}${response.ERROR}`);
							if (main_core.Type.isStringFilled(response.WIZARD_STEP_PROCESSED)) {
								this.wizardManager.recalcAfterSubmit({
									processedStep: response.WIZARD_STEP_PROCESSED.toLowerCase(),
									createdGroupId: parseInt(!main_core.Type.isUndefined(response.CREATED_GROUP_ID) ? response.CREATED_GROUP_ID : 0)
								});
							}
							if (main_core.Type.isArray(response.SUCCESSFULL_USERS_ID) && response.SUCCESSFULL_USERS_ID.length > 0) {
								response.SUCCESSFULL_USERS_ID = response.SUCCESSFULL_USERS_ID.map(userId => {
									return Number(userId);
								});
								const usersSelector = TeamManager.getInstance().usersSelector;
								const usersSelectorDialog = usersSelector ? usersSelector.getDialog() : null;
								if (usersSelectorDialog) {
									usersSelectorDialog.getSelectedItems().forEach(item => {
										if (item.entityId === 'user' && response.SUCCESSFULL_USERS_ID.includes(item.id)) {
											item.deselect();
										}
									});
								}
								window.top.BX.SidePanel.Instance.postMessageAll(window, 'sonetGroupEvent', {
									code: 'afterInvite',
									data: {}
								});
							}
							Buttons.showWaitSubmitButton(false);
						} else if (response.MESSAGE === 'SUCCESS') {
							const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
							if (currentSlider) {
								const event = new main_core_events.BaseEvent({
									compatData: [currentSlider.getEvent('onClose')],
									data: currentSlider.getEvent('onClose')
								});
								main_core_events.EventEmitter.emit(window.top, 'SidePanel.Slider:onClose', event);
							}
							if (window === top.window)
								// not frame
								{
									if (main_core.Type.isStringFilled(response.URL)) {
										top.location.href = response.URL;
									}
								} else if (main_core.Type.isStringFilled(response.ACTION)) {
								let eventData = null;
								if (['create', 'edit'].includes(response.ACTION) && !main_core.Type.isUndefined(response.GROUP)) {
									eventData = {
										code: response.ACTION == 'create' ? 'afterCreate' : 'afterEdit',
										data: {
											group: response.GROUP,
											projectOptions: this.projectOptions
										}
									};
								} else if (response.ACTION === 'invite') {
									eventData = {
										code: 'afterInvite',
										data: {}
									};
								}
								if (eventData) {
									const groupWillBeShown = response.ACTION === 'create' && main_core.Type.isStringFilled(response.URL) && (!main_core.Type.isStringFilled(this.config.refresh) || this.config.refresh === 'Y');
									window.top.BX.SidePanel.Instance.postMessageAll(window, 'sonetGroupEvent', eventData);
									if (response.ACTION === 'create') {
										const createdGroupsData = JSON.parse(response.SELECTOR_GROUPS);
										if (main_core.Type.isArray(createdGroupsData)) {
											window.top.BX.SidePanel.Instance.postMessageAll(window, 'BX.Socialnetwork.Workgroup:onAdd', {
												projects: createdGroupsData
											});
											if (!groupWillBeShown) {
												this.showDemoInfo(response);
											}
										}
									}
									if (currentSlider) {
										BX.SidePanel.Instance.close(false, () => {
											BX.SidePanel.Instance.destroy(currentSlider.getUrl());
										});
									}
									if (groupWillBeShown) {
										let bindingFound = false;
										BX.SidePanel.Instance.anchorRules.find(rule => {
											if (bindingFound || !main_core.Type.isArray(rule.condition)) {
												return;
											}
											rule.condition.forEach(condition => {
												if (bindingFound) {
													return;
												}
												if (response.URL.match(condition)) {
													bindingFound = true;
												}
											});
										});
										if (bindingFound) {
											BX.SidePanel.Instance.open(response.URL, {
												events: {
													onLoad: () => {
														this.showDemoInfo(response);
													}
												}
											});
										} else {
											top.window.location.href = response.URL;
										}
									}
								}
							}
						}
					},
					onfailure: errorData => {
						Buttons.showWaitSubmitButton(false);
						this.alertManager.showAlert(main_core.Loc.getMessage('SONET_GCE_T_AJAX_ERROR'));
					}
				});
			}
			e.preventDefault();
		}
		saveScrumAnalyticData() {
			const actionUrl = document.getElementById('sonet_group_create_popup_form').action;
			const source = new main_core.Uri(actionUrl).getQueryParam('source');
			const availableSources = new Set(['guide_adv', 'guide_direct', 'guide_portal']);
			if (availableSources.has(source)) {
				main_core.ajax.runAction('bitrix:tasks.scrum.info.saveScrumStart', {
					data: {},
					analyticsLabel: {
						scrum: 'Y',
						action: 'scrum_start',
						source: source
					}
				});
			}
		}
		showHideBlock(params) {
			if (!main_core.Type.isPlainObject(params)) {
				return false;
			}
			const containerNode = params.container;
			const blockNode = params.block;
			const show = !!params.show;
			if (!main_core.Type.isDomNode(containerNode) || !main_core.Type.isDomNode(blockNode)) {
				return false;
			}
			if (!main_core.Type.isUndefined(this.animationList[blockNode.id]) && !main_core.Type.isNull(this.animationList[blockNode.id])) {
				return false;
			}
			this.animationList[blockNode.id] = null;
			const maxHeight = parseInt(blockNode.offsetHeight);
			const duration = !main_core.Type.isUndefined(params.duration) && parseInt(params.duration) > 0 ? parseInt(params.duration) : 0;
			if (show) {
				containerNode.style.display = 'block';
			}
			if (duration > 0) {
				if (main_core.Type.isStringFilled(blockNode.id)) {
					this.animationList[blockNode.id] = true;
				}
				BX.delegate(new BX.easing({
					duration: duration,
					start: {
						height: show ? 0 : maxHeight,
						opacity: show ? 0 : 100
					},
					finish: {
						height: show ? maxHeight : 0,
						opacity: show ? 100 : 0
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: state => {
						containerNode.style.maxHeight = `${state.height}px`;
						containerNode.style.opacity = state.opacity / 100;
					},
					complete: () => {
						if (main_core.Type.isStringFilled(blockNode.id)) {
							this.animationList[blockNode.id] = null;
						}
						if (!main_core.Type.isUndefined(params.callback) && main_core.Type.isFunction(params.callback.complete)) {
							containerNode.style.maxHeight = '';
							containerNode.style.opacity = '';
							params.callback.complete();
						}
					}
				}).animate(), this);
			} else {
				params.callback.complete();
			}
			return true;
		}
		showDemoInfo(response) {
			if (this.demoInfoAlreadyBeenShown) {
				return;
			}
			if ('trialEnabled' in response && main_core.Type.isPlainObject(response.trialEnabled)) {
				if ('scrum' in response.trialEnabled && response.trialEnabled.scrum === true) {
					this.showScrumDemoInfo();
					this.demoInfoAlreadyBeenShown = true;
				} else if ('project' in response.trialEnabled && response.trialEnabled.project === true) {
					this.showProjectDemoInfo();
					this.demoInfoAlreadyBeenShown = true;
				}
			}
		}
		showScrumDemoInfo() {
			const popup = new top.BX.PopupWindow({
				id: `socialnetwork-scrum-demo-info-${main_core.Text.getRandom()}`,
				className: 'socialnetwork__demo-info --scrum',
				width: 620,
				overlay: true,
				padding: 48,
				closeIcon: true,
				content: this.#renderScrumDemoInfoContent(),
				events: {
					onFirstShow: baseEvent => {
						top.BX.loadCSS(WorkgroupForm.PATH_TO_CSS);
						this.#bindStartWorkBtn(baseEvent.getTarget());
					}
				}
			});
			popup.show();
		}
		showProjectDemoInfo() {
			top.BX.Runtime.loadExtension('socialnetwork.v2.components.popup.projects-trial-banner').then(exports => exports.showProjectsTrialBanner()).catch(() => {}); // the form iframe may be gone already; the banner lives in the top window
		}
		#renderScrumDemoInfoContent() {
			return main_core.Tag.render`
			<div class="socialnetwork__demo-info_wrapper">
				<div class="socialnetwork__demo-info_content">
					<div class="socialnetwork__demo-info_title">
						${main_core.Loc.getMessage('SONET_GCE_T_DEMO_INFO_TITLE_SCRUM_1')}
					</div>
					<div class="socialnetwork__demo-info_text">
						${main_core.Loc.getMessage('SONET_GCE_T_DEMO_INFO_TEXT_SCRUM_1')}
					</div>
					<div class="socialnetwork__demo-info_text-trial">
						${main_core.Loc.getMessage('SONET_GCE_T_DEMO_INFO_TEXT_TRIAL_1')}
					</div>
					<div class="ui-btn ui-btn-sm ui-btn-success ui-btn-round ui-btn-no-caps">
						${main_core.Loc.getMessage('SONET_GCE_T_DEMO_INFO_BTN_1')}
					</div>
				</div>
				${this.#getLottieScrum()}
			</div>
		`;
		}
		#getLottieScrum() {
			if (!this.#scrumLottieIconContainer) {
				this.#scrumLottieIconContainer = main_core.Tag.render`
				<div class="socialnetwork__demo-info_image"></div>
			`;
				this.#scrumLottieAnimation = ui_lottie.Lottie.loadAnimation({
					container: this.#scrumLottieIconContainer,
					renderer: 'svg',
					loop: false,
					animationData: scrumLottieIconInfo
				});
			}
			return this.#scrumLottieIconContainer;
		}
		#bindStartWorkBtn(popup) {
			const popupContainer = popup.getContentContainer();
			if (main_core.Type.isDomNode(popupContainer)) {
				const btnNode = popup.getContentContainer().querySelector('.ui-btn');
				if (main_core.Type.isDomNode(popupContainer)) {
					main_core.Event.bind(btnNode, 'click', () => popup.close());
				}
			}
		}
	}

	exports.WorkgroupForm = WorkgroupForm;
	exports.WorkgroupFormTeamManager = TeamManager;
	exports.WorkgroupFormUFManager = UFManager;

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Event, BX.Main, BX.UI, BX.UI.EntitySelector, BX.Socialnetwork.Limit, BX.Messenger.v2.Lib, BX.UI, BX.UI);
//# sourceMappingURL=script.js.map
