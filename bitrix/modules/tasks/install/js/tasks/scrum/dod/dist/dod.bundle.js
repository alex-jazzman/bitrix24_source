/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core_events, main_core, ui_dialogs_messagebox, main_loader, ui_entitySelector, ui_sidepanel_layout, ui_sidepanel_menu, ui_notification, ui_buttons) {
	'use strict';

	class RequestSender {
		sendRequest(controller, action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.' + controller + '.' + action, {
					data: data
				}).then(resolve, reject);
			});
		}
		isNecessary(data) {
			return this.sendRequest('doD', 'isNecessary', data);
		}
		getSettings(data) {
			return this.sendRequest('doD', 'getSettings', data);
		}
		getChecklist(data) {
			return this.sendRequest('doD', 'getChecklist', data);
		}
		saveSettings(data) {
			return this.sendRequest('doD', 'saveSettings', data);
		}
		getList(data) {
			return this.sendRequest('doD', 'getList', data);
		}
		saveList(data) {
			return this.sendRequest('doD', 'saveList', data);
		}
		createType(data) {
			return this.sendRequest('type', 'createType', data);
		}
		changeTypeName(data) {
			return this.sendRequest('type', 'changeTypeName', data);
		}
		removeType(data) {
			return this.sendRequest('type', 'removeType', data);
		}
		showErrorAlert(response, alertTitle) {
			if (main_core.Type.isUndefined(response.errors)) {
				console.error(response);
				return;
			}
			if (response.errors.length) {
				const firstError = response.errors.shift();
				if (firstError) {
					const errorCode = firstError.code ? firstError.code : '';
					const message = firstError.message + ' ' + errorCode;
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TSD_ERROR_POPUP_TITLE');
					ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
		}
	}

	class ItemType {
		constructor(params = {}) {
			this.setId(params.id);
			this.setName(params.name);
			this.setSort(params.sort);
			this.setDodRequired(params.dodRequired);
			this.setParticipants(params.participants);
			this.setActive(params.active === 'Y');
		}
		setId(id) {
			this.id = main_core.Type.isInteger(id) ? parseInt(id, 10) : main_core.Type.isString(id) && id ? id : main_core.Text.getRandom();
		}
		getId() {
			return this.id;
		}
		setName(name) {
			this.name = main_core.Type.isString(name) ? name : '';
		}
		getName() {
			return this.name;
		}
		setSort(sort) {
			this.sort = main_core.Type.isInteger(sort) ? parseInt(sort, 10) : 0;
		}
		getSort() {
			return this.sort;
		}
		setDodRequired(value) {
			this.dodRequired = value === 'Y';
		}
		isDodRequired() {
			return this.dodRequired;
		}
		setActive(value) {
			this.active = main_core.Type.isBoolean(value) ? value : false;
		}
		isActive() {
			return this.active;
		}
		setParticipants(participants) {
			this.participants = [];
			if (!main_core.Type.isArray(participants)) {
				return;
			}
			participants.forEach(participant => {
				this.participants.push([participant.entityId, participant.id]);
			});
		}
		getParticipants() {
			return this.participants;
		}
	}

	class TypeStorage {
		constructor() {
			this.types = new Map();
		}
		setTypes(types) {
			this.types = types;
		}
		getTypes() {
			return this.types;
		}
		addType(type) {
			this.types.set(type.getId(), type);
		}
		getType(typeId) {
			return this.types.get(typeId);
		}
		removeType(type) {
			this.types.delete(type.getId());
		}
		setActiveType(inputType) {
			inputType = main_core.Type.isNil(inputType) ? this.types.values().next().value : inputType;
			this.types.forEach(type => type.setActive(inputType.getId() === type.getId()));
		}
		getActiveType() {
			const foundItem = [...this.types.values()].find(type => type.isActive());
			if (main_core.Type.isNil(foundItem)) {
				return this.types.values().next().value;
			}
			return foundItem;
		}
		isEmpty() {
			return this.types.size === 0;
		}
	}

	class Settings {
		constructor(params) {
			this.requestSender = params.requestSender;
			this.groupId = parseInt(params.groupId, 10);
			this.taskId = parseInt(params.taskId, 10);
			this.sidePanelManager = BX.SidePanel.Instance;
			this.typeStorage = new TypeStorage();
			this.layoutMenu = null;
			this.nameInput = null;
			this.changed = false;
			main_core_events.EventEmitter.subscribe('BX.Tasks.CheckListItem:CheckListChanged', () => {
				this.setChanged();
			});
		}
		show() {
			this.sidePanelManager.open('tasks-scrum-dod-settings-side-panel', {
				cacheable: false,
				width: 1000,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createLayout({
						extensions: ['tasks.scrum.dod', 'ui.entity-selector', 'tasks'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_DOD_TITLE'),
						content: this.renderContent.bind(this),
						design: {
							section: false
						},
						menu: {},
						toolbar: ({
							Button
						}) => {
							return [new Button({
								color: Button.Color.LIGHT_BORDER,
								text: main_core.Loc.getMessage('TASKS_SCRUM_DOD_BTN_CREATE_TYPE'),
								onclick: () => {
									this.showTypeForm();
								}
							})];
						},
						buttons: []
					}).then(layout => {
						this.layoutMenu = layout.getMenu();
						this.layoutMenu.subscribe('click', this.onMenuItemClick.bind(this));
						return layout.render();
					});
				},
				events: {
					onLoad: this.onLoadSettings.bind(this),
					onClose: this.onCloseSettings.bind(this),
					onCloseComplete: this.onCloseSettingsComplete.bind(this)
				}
			});
		}
		onLoadSettings() {
			this.layoutMenu.setItems(this.getMenuItems());
			if (!this.isEmpty()) {
				this.buildEditingForm(this.typeStorage.getActiveType());
			}
		}
		onCloseSettings() {
			if (this.isChanged()) {
				this.saveSettings().then(() => {
					ui_notification.UI.Notification.Center.notify({
						autoHideDelay: 1000,
						content: main_core.Loc.getMessage('TASKS_SCRUM_DOD_SAVE_SETTINGS_NOTIFY')
					});
				}).catch(() => {});
			}
		}
		onCloseSettingsComplete() {
			const currentSlider = this.sidePanelManager.getTopSlider();
			if (currentSlider) {
				if (currentSlider.getUrl() === 'tasks-scrum-dod-list-side-panel' && this.isChanged()) {
					currentSlider.reload();
				}
			}
		}
		isEmpty() {
			return this.typeStorage.isEmpty();
		}
		isChanged() {
			return this.changed;
		}
		setChanged() {
			this.changed = true;
		}
		renderContent() {
			return this.requestSender.getSettings({
				groupId: this.groupId
			}).then(response => {
				const types = main_core.Type.isArray(response.data.types) ? response.data.types : [];
				const itemTypes = new Map();
				types.forEach(typeData => {
					const itemType = new ItemType(typeData);
					itemTypes.set(itemType.getId(), itemType);
				});
				this.typeStorage.setTypes(itemTypes);
				this.typeStorage.setActiveType();
				return this.render(this.typeStorage.getActiveType());
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		render(type) {
			this.node = main_core.Tag.render`
			<div class="tasks-scrum-dod-settings">
				<div class="tasks-scrum-dod-settings-container">
					<div class="tasks-scrum-dod-settings-container-wrap">
						<div class="tasks-scrum-dod-settings-container-sidebar-wrapper">
							${this.renderContainer(type)}
						</div>
					</div>
				</div>
			</div>
		`;
			return this.node;
		}
		renderContainer(type) {
			if (this.typeStorage.isEmpty()) {
				return this.renderEmptyForm();
			} else {
				return this.renderEditingForm(type);
			}
		}
		renderEditingForm(type) {
			return main_core.Tag.render`
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-content">
						${this.renderRequiredOption(type)}
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content">
						${this.renderParticipantsSelector()}
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content ui-form-content-dod-list"></div>
				</div>
			</div>
		`;
		}
		renderEmptyForm() {
			return main_core.Tag.render`
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-content">
						<div class="ui-form-row">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('TASKS_SCRUM_CREATE_TYPE_PROMPT')}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
		}
		renderRequiredOption(type) {
			const node = main_core.Tag.render`
			<div class="ui-form-row">
				<label class="ui-ctl ui-ctl-checkbox">
					<input type="checkbox" class="ui-ctl-element ui-form-content-required-option">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('TASKS_SCRUM_DOD_OPTIONS_REQUIRED_LABEL')}
					</div>
				</label>
			</div>
		`;
			const checkbox = node.querySelector('.ui-form-content-required-option');
			checkbox.checked = type.isDodRequired();
			main_core.Event.bind(checkbox, 'click', () => {
				this.setChanged();
				this.updateActiveType();
			});
			return node;
		}
		renderParticipantsSelector() {
			return ''; //todo tmp
		}
		renderTypeForm(type) {
			const name = type ? type.getName() : '';
			this.typeFormNode = main_core.Tag.render`
			<div class="tasks-scrum-dod-settings-type-form">
				<div class="ui-alert ui-alert-danger --hidden">
					<span class="ui-alert-message"></span>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input
						type="text"
						class="ui-ctl-element"
						placeholder="${main_core.Loc.getMessage('TASKS_SCRUM_DOD_POPUP_INPUT_PLACEHOLDER')}"
						value="${main_core.Text.encode(name)}"
					>
				</div>
			</div>
		`;
			this.nameInput = this.typeFormNode.querySelector('input');
			main_core.Event.bind(this.nameInput, 'keydown', event => {
				if (event.key === 'Enter') {
					this.onOkTypeForm(type);
				}
				this.hideTypeFormError();
			});
			return this.typeFormNode;
		}
		initParticipantsSelector(type) {
			const participantsSelectorContainer = this.node.querySelector('.tasks-scrum-dod-settings-user-selector');
			if (main_core.Type.isNil(participantsSelectorContainer)) {
				return;
			}
			const selectorId = 'tasks-scrum-dod-settings-participants-selector-' + type.getId();

			// todo change to scrum-user provider
			this.participantsSelector = new ui_entitySelector.TagSelector({
				id: selectorId,
				dialogOptions: {
					id: selectorId,
					context: 'TASKS',
					preselectedItems: this.typeStorage.getActiveType().getParticipants(),
					entities: [{
						id: 'user',
						options: {
							inviteEmployeeLink: false,
							analyticsSource: 'tasks'
						}
					}, {
						id: 'project-roles',
						options: {
							projectId: this.groupId
						},
						dynamicLoad: true
					}]
				}
			});
			this.participantsSelector.renderTo(participantsSelectorContainer);
		}
		buildEditingForm(type) {
			const container = this.cleanTypeForm();
			main_core.Dom.append(this.renderEditingForm(type), container);
			this.initParticipantsSelector(type);
			const listContainer = this.node.querySelector('.ui-form-content-dod-list');
			const loader = this.showLoader(listContainer);
			this.requestSender.getChecklist({
				groupId: this.groupId,
				typeId: type.getId()
			}).then(response => {
				loader.hide();
				main_core.Runtime.html(listContainer, response.data.html);
			}).catch(response => {
				loader.hide();
				this.requestSender.showErrorAlert(response);
			});
		}
		buildEmptyForm() {
			const container = this.cleanTypeForm();
			main_core.Dom.append(this.renderEmptyForm(), container);
		}
		showTypeForm(type) {
			this.typeForm = new ui_dialogs_messagebox.MessageBox({
				popupOptions: this.getDefaultPopupOptions(),
				title: main_core.Type.isUndefined(type) ? main_core.Loc.getMessage('TASKS_SCRUM_DOD_POPUP_TITLE_CREATE') : main_core.Loc.getMessage('TASKS_SCRUM_DOD_POPUP_TITLE_EDIT'),
				message: this.renderTypeForm(type),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Type.isUndefined(type) ? main_core.Loc.getMessage('TASKS_SCRUM_DOD_BTN_CREATE_TYPE') : main_core.Loc.getMessage('TASKS_SCRUM_DOD_BTN_SAVE'),
				onOk: () => this.onOkTypeForm(type)
			});
			const popup = this.typeForm.getPopupWindow();
			popup.subscribe('onAfterShow', () => {
				const length = this.nameInput.value.length;
				this.nameInput.focus();
				this.nameInput.setSelectionRange(length, length);
			});
			this.typeForm.show();
		}
		onOkTypeForm(type) {
			if (!this.nameInput.value.trim()) {
				this.showTypeFormError(main_core.Loc.getMessage('TASKS_SCRUM_DOD_POPUP_EMPTY_NAME'));
				this.typeForm.getOkButton().setDisabled(false);
				return;
			}
			this.typeForm.close();
			if (main_core.Type.isUndefined(type)) {
				const skipPrevious = this.typeStorage.isEmpty();
				this.createType(this.nameInput.value).then(createdType => {
					if (createdType) {
						this.addMenuItem(createdType);
						this.switchType(createdType, skipPrevious);
					}
				});
			} else {
				type.setName(this.nameInput.value);
				this.changeType(type).then(changedType => {
					if (changedType) {
						this.changeMenuItem(changedType);
						this.switchType(changedType);
					}
				});
			}
		}
		showTypeFormError(message) {
			const alertNode = this.typeFormNode.querySelector('.ui-alert');
			alertNode.querySelector('.ui-alert-message').textContent = message;
			main_core.Dom.removeClass(alertNode, '--hidden');
		}
		hideTypeFormError() {
			const alertNode = this.typeFormNode.querySelector('.ui-alert');
			if (!main_core.Dom.hasClass(alertNode, '--hidden')) {
				main_core.Dom.addClass(this.typeFormNode.querySelector('.ui-alert'), '--hidden');
			}
		}
		createType(name) {
			const container = this.node.querySelector('.tasks-scrum-dod-settings-container-sidebar-wrapper');
			const loader = this.showLoader(container);
			return this.requestSender.createType({
				groupId: this.groupId,
				name: name,
				sort: this.typeStorage.getTypes().size + 1
			}).then(response => {
				this.setChanged();
				loader.hide();
				const createdType = new ItemType(response.data);
				this.typeStorage.addType(createdType);
				return createdType;
			}).catch(response => {
				loader.hide();
				this.requestSender.showErrorAlert(response);
			});
		}
		switchType(type, skipPrevious = false) {
			const menuItem = this.getMenuItem(type);
			let previousType = null;
			if (!skipPrevious) {
				previousType = this.typeStorage.getActiveType();
				if (menuItem.getId() === previousType.getId()) {
					return;
				}
			}
			this.typeStorage.setActiveType(type);
			this.setActiveMenuItem(type);
			if (previousType) {
				this.saveSettings(previousType).then(response => {
					const updatedType = response.data.type;
					previousType.setDodRequired(updatedType.dodRequired);
					previousType.setParticipants(updatedType.participants);
					this.buildEditingForm(type);
				});
			} else {
				this.buildEditingForm(type);
			}
		}
		changeType(type) {
			return this.requestSender.changeTypeName({
				groupId: this.groupId,
				id: type.getId(),
				name: type.getName()
			}).then(() => {
				this.setChanged();
				return type;
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		removeType(type) {
			return this.requestSender.removeType({
				groupId: this.groupId,
				id: type.getId()
			}).then(() => {
				this.setChanged();
				this.typeStorage.removeType(type);
				if (this.typeStorage.isEmpty()) {
					this.buildEmptyForm();
					return null;
				} else {
					return this.typeStorage.getActiveType();
				}
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		saveSettings(inputType) {
			if (this.typeStorage.isEmpty()) {
				return Promise.resolve();
			}
			const type = inputType ? inputType : this.typeStorage.getActiveType();
			if (!(type instanceof ItemType)) {
				return Promise.resolve();
			}
			return this.requestSender.saveSettings({
				groupId: this.groupId,
				typeId: type.getId(),
				requiredOption: this.getRequiredOptionValue(),
				items: this.getChecklistItems(),
				participants: this.getSelectedParticipants()
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		getChecklistItems() {
			/* eslint-disable */
			if (typeof BX.Tasks.CheckListInstance === 'undefined') {
				return [];
			}
			const treeStructure = BX.Tasks.CheckListInstance.getTreeStructure();
			return treeStructure.getRequestData();
			/* eslint-enable */
		}
		getSelectedParticipants() {
			if (main_core.Type.isNil(this.participantsSelector)) {
				return [];
			}
			const selectedParticipants = [];
			this.participantsSelector.getTags().forEach(tag => {
				selectedParticipants.push({
					id: tag.getId(),
					entityId: tag.getEntityId()
				});
			});
			return selectedParticipants;
		}
		getRequiredOptionValue() {
			const requiredOption = this.node.querySelector('.ui-form-content-required-option');
			return requiredOption.checked === true ? 'Y' : 'N';
		}
		showLoader(container) {
			const listPosition = main_core.Dom.getPosition(container);
			const loader = new main_loader.Loader({
				target: container,
				size: 60,
				mode: 'inline',
				color: 'rgba(82, 92, 105, 0.9)',
				offset: {
					left: `${listPosition.width / 2 - 30}px`
				}
			});
			loader.show();
			return loader;
		}
		updateActiveType() {
			const type = this.typeStorage.getActiveType();
			type.setDodRequired(this.getRequiredOptionValue());
		}
		cleanTypeForm() {
			const container = this.node.querySelector('.tasks-scrum-dod-settings-container-sidebar-wrapper');
			main_core.Dom.clean(container);
			return container;
		}
		getMenuItems() {
			if (this.typeStorage.isEmpty()) {
				return [];
			}
			const items = [];
			this.typeStorage.getTypes().forEach(type => {
				items.push(this.getMenuItemOptions(type, items.length === 0));
			});
			return items;
		}
		addMenuItem(type) {
			return this.layoutMenu.add(this.getMenuItemOptions(type));
		}
		changeMenuItem(type) {
			return this.layoutMenu.change(type.getId(), {
				label: type.getName()
			});
		}
		removeMenuItem(type) {
			this.layoutMenu.remove(type.getId());
		}
		getMenuItem(type) {
			return this.layoutMenu.get(type.getId());
		}
		setActiveMenuItem(type) {
			this.getMenuItem(type).setActive();
		}
		getMenuItemOptions(type, active = false) {
			return {
				id: type.getId(),
				label: type.getName(),
				active: active,
				actions: [{
					label: main_core.Loc.getMessage('TASKS_SCRUM_DOD_BTN_EDIT_TYPE'),
					onclick: () => {
						this.showTypeForm(type);
					}
				}, {
					label: main_core.Loc.getMessage('TASKS_SCRUM_DOD_BTN_REMOVE_TYPE'),
					onclick: item => {
						new ui_dialogs_messagebox.MessageBox({
							title: main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_REMOVE_TYPE_TITLE'),
							message: main_core.Loc.getMessage('TASKS_SCRUM_CONFIRM_TEXT_REMOVE_TYPE_NEW').replace('#name#', main_core.Text.encode(type.getName())),
							popupOptions: this.getDefaultPopupOptions(),
							okCaption: main_core.Loc.getMessage('TASKS_SCRUM_BUTTON_TEXT_REMOVE'),
							buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
							minHeight: 100,
							onOk: messageBox => {
								this.removeType(type).then(nextType => {
									this.removeMenuItem(type);
									if (!main_core.Type.isNull(nextType)) {
										this.switchType(nextType, true);
									}
									messageBox.close();
								});
							}
						}).show();
					}
				}]
			};
		}
		onMenuItemClick(baseEvent) {
			const {
				item: menuItem
			} = baseEvent.getData();
			this.switchType(this.typeStorage.getType(menuItem.getId()));
		}
		getDefaultPopupOptions() {
			const popupOptions = {};
			const currentSlider = this.sidePanelManager.getTopSlider();
			if (currentSlider) {
				popupOptions.targetContainer = currentSlider.getContainer();
			}
			return popupOptions;
		}
	}

	class List extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Dod.List');
			this.sidePanelManager = BX.SidePanel.Instance;
			this.requestSender = params.requestSender;
			this.groupId = parseInt(params.groupId, 10);
			this.taskId = parseInt(params.taskId, 10);
			this.skipNotifications = main_core.Type.isBoolean(params.skipNotifications) ? params.skipNotifications : false;
			this.typeStorage = new TypeStorage();
			this.empty = true;
			this.node = null;
			this.sliderClosedExplicitly = false;
		}
		show() {
			this.sidePanelManager.open('tasks-scrum-dod-list-side-panel', {
				cacheable: false,
				width: 800,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.dod', 'tasks'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_DOD_TITLE'),
						content: this.renderContent.bind(this),
						design: {
							section: false
						},
						toolbar: ({
							Button
						}) => {
							return [new Button({
								color: Button.Color.LIGHT_BORDER,
								text: main_core.Loc.getMessage('TASKS_SCRUM_DOD_TOOLBAR_SETTINGS'),
								onclick: () => this.emit('showSettings', false)
							})];
						},
						buttons: ({
							cancelButton,
							SaveButton
						}) => {
							return [new SaveButton({
								text: this.getListButtonText(),
								onclick: this.onSaveList.bind(this)
							}), new ui_buttons.CancelButton({
								onclick: () => {
									this.emit('reject');
									this.closeSidePanel();
								}
							})];
						}
					});
				},
				events: {
					onLoad: this.onLoadList.bind(this),
					onClose: () => {
						const wasClosedExplicitly = this.sliderClosedExplicitly;
						this.sliderClosedExplicitly = false;
						if (wasClosedExplicitly) {
							return;
						}
						this.emit('reject');
					}
				}
			});
		}
		onLoadList() {
			if (this.isEmpty()) {
				return;
			}
			this.renderList();
		}
		onSaveList() {
			if (this.isEmpty()) {
				return;
			}
			this.save().then(decision => {
				if (decision === 'resolve') {
					this.emit('resolve');
					this.closeSidePanel();
				} else if (decision === 'reject') {
					this.emit('reject');
					this.closeSidePanel();
				}
			});
		}
		closeSidePanel() {
			this.sliderClosedExplicitly = true;
			this.sidePanelManager.close(false);
		}
		getListButtonText() {
			if (this.isSkipNotifications()) {
				return main_core.Loc.getMessage('TASKS_SCRUM_DOD_CONFIRM_SAVE_BUTTON_TEXT');
			} else {
				return main_core.Loc.getMessage('TASKS_SCRUM_DOD_CONFIRM_COMPLETE_BUTTON_TEXT');
			}
		}
		renderContent() {
			return this.requestSender.getSettings({
				groupId: this.groupId,
				taskId: this.taskId,
				saveRequest: this.isSkipNotifications() ? 'Y' : 'N'
			}).then(response => {
				const types = main_core.Type.isArray(response.data.types) ? response.data.types : [];
				const activeTypeId = main_core.Type.isInteger(response.data.activeTypeId) ? parseInt(response.data.activeTypeId, 10) : 0;
				this.empty = types.length === 0;
				const itemTypes = new Map();
				types.forEach(typeData => {
					const itemType = new ItemType(typeData);
					itemTypes.set(itemType.getId(), itemType);
				});
				this.typeStorage.setTypes(itemTypes);
				this.typeStorage.setActiveType(itemTypes.get(activeTypeId));
				if (this.isEmpty()) {
					if (!this.isSkipNotifications()) {
						this.emit('resolve');
					}
					return this.renderEmpty();
				}
				return this.render();
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		renderList() {
			const listNode = this.node.querySelector('.tasks-scrum-dod-checklist');
			main_core.Dom.clean(listNode);
			const loader = this.showLoader(listNode);
			this.requestSender.getList({
				groupId: this.groupId,
				taskId: this.taskId,
				typeId: this.getActiveType().getId()
			}).then(response => {
				loader.hide();
				main_core.Runtime.html(listNode, response.data.html);
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		renderEmpty() {
			const node = main_core.Tag.render`
				<div class="ui-form ui-form-line tasks-scrum-dod-form">
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('TASKS_SCRUM_DOD_LABEL_EMPTY')}
							</div>
						</div>
					</div>
				</div>
			`;
			main_core.Event.bind(node.querySelector('span'), 'click', () => this.emit('showSettings', true));
			return node;
		}
		render() {
			const activeType = this.getActiveType();
			const renderOption = typeData => {
				const selected = activeType.getId() === typeData.id ? 'selected' : '';
				return `<option value="${parseInt(typeData.id, 10)}" ${selected}>${main_core.Text.encode(typeData.name)}</option>`;
			};
			this.node = main_core.Tag.render`
			<div class="ui-form ui-form-line tasks-scrum-dod-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							${main_core.Loc.getMessage('TASKS_SCRUM_DOD_LABEL_TYPES')}
						</div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
							<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							<select class="ui-ctl-element tasks-scrum-dod-types">
								${[...this.typeStorage.getTypes().values()].map(typeData => renderOption(typeData)).join('')}
							</select>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content tasks-scrum-dod-checklist"></div>
				</div>
			</div>
		`;
			const typeSelector = this.node.querySelector('.tasks-scrum-dod-types');
			main_core.Event.bind(typeSelector, 'change', event => {
				const typeId = parseInt(event.target.value, 10);
				this.typeStorage.setActiveType(this.typeStorage.getType(typeId));
				this.renderList();
			});
			return this.node;
		}
		save() {
			const activeType = this.getActiveType();
			return this.requestSender.saveList({
				typeId: activeType.getId(),
				taskId: this.taskId,
				groupId: this.groupId,
				items: this.getListItems()
			}).then(() => {
				if (this.isSkipNotifications()) {
					return this.solve();
				} else {
					if (this.isListRequired(this.getActiveType())) {
						if (this.isAllToggled()) {
							return 'resolve';
						} else {
							this.showInfoPopup();
							return 'wait';
						}
					} else {
						if (this.isAllToggled()) {
							return 'resolve';
						} else {
							this.showConfirmPopup();
							return 'wait';
						}
					}
				}
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		isSkipNotifications() {
			return this.skipNotifications;
		}
		isEmpty() {
			return this.empty;
		}
		getActiveType() {
			return this.typeStorage.getActiveType();
		}
		isListRequired(type) {
			return type.isDodRequired();
		}
		solve() {
			if (this.isListRequired(this.getActiveType())) {
				if (this.isAllToggled()) {
					return 'resolve';
				} else {
					return 'reject';
				}
			} else {
				return 'resolve';
			}
		}
		getListItems() {
			/* eslint-disable */
			if (typeof BX.Tasks.CheckListInstance === 'undefined') {
				return [];
			}
			const treeStructure = BX.Tasks.CheckListInstance.getTreeStructure();
			return treeStructure.getRequestData();
			/* eslint-enable */
		}
		isAllToggled() {
			/* eslint-disable */
			if (typeof BX.Tasks.CheckListInstance === 'undefined') {
				return false;
			}
			let isAllToggled = true;
			const treeStructure = BX.Tasks.CheckListInstance.getTreeStructure();
			treeStructure.getDescendants().forEach(checkList => {
				if (checkList.countTotalCount() > 0 && !checkList.checkIsComplete()) {
					isAllToggled = false;
				}
			});
			return isAllToggled;
			/* eslint-enable */
		}
		showInfoPopup() {
			const popupOptions = {};
			const currentSlider = this.sidePanelManager.getTopSlider();
			if (currentSlider) {
				popupOptions.targetContainer = currentSlider.getContainer();
			}
			new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('TASKS_SCRUM_DOD_INFO_TEXT'),
				popupOptions: popupOptions,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
			}).show();
		}
		showConfirmPopup() {
			const popupOptions = {};
			const currentSlider = this.sidePanelManager.getTopSlider();
			if (currentSlider) {
				popupOptions.targetContainer = currentSlider.getContainer();
			}
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				popupOptions: popupOptions,
				message: main_core.Loc.getMessage('TASKS_SCRUM_DOD_CONFIRM_TEXT_COMPLETE'),
				modal: true,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('TASKS_SCRUM_DOD_CONFIRM_COMPLETE_BUTTON_TEXT'),
					color: ui_buttons.Button.Color.SUCCESS,
					events: {
						click: () => {
							this.emit('resolve');
							messageBox.close();
						}
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('TASKS_SCRUM_DOD_CONFIRM_SAVE_BUTTON_TEXT'),
					color: ui_buttons.Button.Color.LINK,
					events: {
						click: () => {
							this.emit('reject');
							messageBox.close();
						}
					}
				})]
			});
			messageBox.show();
		}
		showLoader(container) {
			const listPosition = main_core.Dom.getPosition(container);
			const loader = new main_loader.Loader({
				target: container,
				size: 60,
				mode: 'inline',
				color: 'rgba(82, 92, 105, 0.9)',
				offset: {
					left: `${listPosition.width / 2 - 30}px`
				}
			});
			loader.show();
			return loader;
		}
	}

	class Dod extends main_core_events.EventEmitter {
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Dod');
			this.view = params.view;
			this.groupId = parseInt(params.groupId, 10);
			this.taskId = parseInt(params.taskId, 10);
			this.skipErrorAlert = params.skipErrorAlert === true;

			// eslint-disable-next-line unicorn/no-abusive-eslint-disable
			this.sidePanelManager = BX.SidePanel.Instance;
			/* eslint-enable */

			this.requestSender = new RequestSender();
			this.settings = new Settings({
				requestSender: this.requestSender,
				groupId: this.groupId,
				taskId: this.taskId
			});
			this.list = new List({
				requestSender: this.requestSender,
				groupId: this.groupId,
				taskId: this.taskId,
				skipNotifications: params.skipNotifications
			});
			this.list.subscribe('resolve', () => {
				this.emit('resolve');
			});
			this.list.subscribe('reject', () => {
				this.emit('reject');
			});
			this.list.subscribe('showSettings', baseEvent => {
				const close = baseEvent.getData();
				if (close) {
					this.sidePanelManager.close(false, () => this.showSettings());
				} else {
					this.showSettings();
				}
			});
		}
		isNecessary() {
			return this.requestSender.isNecessary({
				groupId: this.groupId,
				taskId: this.taskId
			}).then(response => {
				return response.data;
			}).catch(response => {
				if (!this.skipErrorAlert) {
					this.requestSender.showErrorAlert(response);
				}
				throw response;
			});
		}
		show() {
			// eslint-disable-next-line default-case
			switch (this.view) {
				case 'settings':
					this.showSettings();
					break;
				case 'list':
					this.showList();
					break;
			}
		}
		showSettings() {
			this.settings.show();
		}
		showList() {
			this.list.show();
		}
	}

	exports.Dod = Dod;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX.Event, BX, BX.UI.Dialogs, BX, BX.UI.EntitySelector, BX.UI.SidePanel, BX.UI.SidePanel, BX.UI.Notification, BX.UI);
//# sourceMappingURL=dod.bundle.js.map
