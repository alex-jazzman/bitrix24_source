/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, ui_sidepanel_layout, ui_label, ui_notification, ui_dialogs_messagebox) {
	'use strict';

	class Filter {
		#props;
		#filter;
		#popupManager;
		#fields;
		#applyFilter;
		#getStopBlur;
		constructor(props) {
			this.#props = props;
			this.#applyFilter = this.#applyFilterHandler.bind(this);
			this.#getStopBlur = this.#onGetStopBlur.bind(this);
			this.#init();
		}
		#init() {
			this.#filter = BX.Main.filterManager.getById(this.#props.filterId);
			this.#popupManager = BX.Main.PopupManager;
			this.#updateFields();
			this.#subscribeToEvents();
		}
		#updateFields() {
			this.#fields = this.#filter.getFilterFieldsValues();
		}
		#unSubscribeToEvents() {
			main_core_events.EventEmitter.unsubscribe('BX.Main.Filter:apply', this.#applyFilter);
			main_core_events.EventEmitter.unsubscribe('BX.Main.Filter:onGetStopBlur', this.#getStopBlur);
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.#applyFilter);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:onGetStopBlur', this.#getStopBlur);
		}
		#applyFilterHandler() {
			this.#updateFields();
		}
		#onGetStopBlur(event) {
			const {
				target,
				path
			} = event.getCompatData()[0];
			const popupWindow = path.find(el => {
				return el.classList?.contains('popup-window') || el.classList?.contains('main-ui-square');
			});
			const popups = [this.#filter.popup.popupContainer, this.#filter.getFieldsPopup().popupContainer];
			if (this.#filter.popup.isShown() && !popups.some(el => el.contains(target)) && !popupWindow) {
				this.#filter.closePopup();
			}
		}
		#resetFilter() {
			const preset = this.#filter.getPreset();
			this.#filter.getSearch().clearInput();
			preset.deactivateAllPresets();
			preset.resetPreset(true);
			return this.#filter.saveOptions({
				preset_id: 'default_filter',
				fields: this.#filter.getFilterFieldsValues(),
				rows: preset.getFields().map(field => main_core.Dom.attr(field, 'data-name')).join(','),
				additional: {},
				clear_filter: 'Y',
				save: 'Y'
			}, {
				FILTER_ID: this.#props.filterId,
				GRID_ID: this.#filter.getParam('GRID_ID'),
				action: 'SET_FILTER'
			});
		}
		destroyPopups() {
			this.#filter.popup.destroy();
			this.#popupManager.getPopupById(this.#props.filterId + '_fields_popup')?.destroy();
			this.#popupManager.getPopupById(this.#props.filterId + '-grid-settings-window')?.destroy();
		}
		release() {
			this.#unSubscribeToEvents();
			const reset = this.#resetFilter();
			this.destroyPopups();
			return reset;
		}
	}

	class RequestSender {
		sendRequest(controller, action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.' + controller + '.' + action, {
					data: data
				}).then(resolve, reject);
			});
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
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TSE_ERROR_POPUP_TITLE');
					ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
		}
	}

	class Epic extends main_core_events.EventEmitter {
		constructor(params = {}) {
			super(params);
			this.setEventNamespace('BX.Tasks.Scrum.Epic');
			this.view = main_core.Type.isString(params.view) ? params.view : '';
			this.groupId = parseInt(params.groupId, 10);
			this.epicId = main_core.Type.isUndefined(params.epicId) ? 0 : parseInt(params.epicId, 10);
			this.gridId = main_core.Type.isUndefined(params.gridId) ? '' : params.gridId;
			this.pathToTask = main_core.Type.isString(params.pathToTask) ? params.pathToTask : '';
			this.requestSender = new RequestSender();

			/* eslint-disable */
			this.sidePanelManager = BX.SidePanel.Instance;
			/* eslint-enable */
			this.sidePanel = null;
			this.id = null;
			this.form = null;
			this.formData = null;
			this.listData = null;
			this.filterData = null;
			this.filter = null;
			this.filterSlider = null;
			this.filterInitialization = null;
			this.editorHandler = null;
			this.colorPickers = new Map();
			this.defaultColor = '#69dafc';
			this.selectedColor = '';
		}
		show() {
			switch (this.view) {
				case 'add':
					this.showAddForm();
					break;
				case 'list':
					this.showList();
					break;
				case 'view':
					this.showViewForm();
					break;
				case 'edit':
					this.showEditForm();
					break;
				case 'tasks':
					this.showTasksList();
					break;
				case 'completedTasks':
					this.showTasksList(true);
					break;
			}
		}
		static showView(groupId, epicId) {
			const epic = new Epic({
				view: 'view',
				groupId: groupId,
				epicId: epicId
			});
			epic.show();
		}
		static showEdit(groupId, epicId) {
			const epic = new Epic({
				view: 'edit',
				groupId: groupId,
				epicId: epicId
			});
			epic.show();
		}
		static removeEpic(groupId, epicId, gridId) {
			const epic = new Epic({
				view: 'edit',
				groupId: groupId,
				gridId: gridId,
				epicId: epicId
			});
			epic.removeEpic().then(() => {
				epic.reloadGrid();
			});
		}
		static showTasks(groupId, epicId) {
			const epic = new Epic({
				view: 'tasks',
				groupId: groupId,
				epicId: epicId
			});
			epic.show();
		}
		static showCompletedTasks(groupId, epicId) {
			const epic = new Epic({
				view: 'completedTasks',
				groupId: groupId,
				epicId: epicId
			});
			epic.show();
		}
		static showTask(taskId) {
			const sidePanelManager = BX.SidePanel.Instance;
			sidePanelManager.getOpenSliders().forEach(openSlider => {
				const frameWindow = openSlider.getWindow();
				if (!main_core.Type.isNil(frameWindow) && !main_core.Type.isNil(frameWindow.BX.Tasks.Scrum.EpicInstance)) {
					frameWindow.BX.Tasks.Scrum.EpicInstance.showTask(taskId);
				}
			});
		}
		showAddForm() {
			this.id = main_core.Text.getRandom();
			this.sidePanelManager.open('tasks-scrum-epic-add-form-side-panel', {
				cacheable: false,
				width: 800,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.epic'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_ADD_EPIC_FORM_TITLE'),
						content: this.createAddContent.bind(this),
						design: {
							section: false
						},
						buttons: ({
							cancelButton,
							SaveButton
						}) => {
							return [new SaveButton({
								onclick: this.onSaveAddForm.bind(this)
							}), cancelButton];
						}
					});
				},
				events: {
					onLoad: this.onLoadAddForm.bind(this)
				}
			});
		}
		showList() {
			this.id = main_core.Text.getRandom();
			this.gridId = 'EntityEpicsGrid_' + this.groupId;
			this.filterId = this.gridId;
			const sidePanelId = 'tasks-scrum-epic-list-side-panel';
			this.subscribeListToEvents(sidePanelId);
			this.sidePanelManager.open(sidePanelId, {
				cacheable: false,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.epic'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_LIST_TITLE'),
						content: this.createContainerContent.bind(this),
						design: {
							section: false
						},
						buttons: []
					});
				},
				events: {
					onOpen: event => {
						this.filterSlider = event.getSlider();
						this.filterInitialization = null;
					},
					onLoad: this.onLoadFilter.bind(this),
					onClose: event => {
						if (this.filterSlider === event.getSlider()) {
							this.filterSlider = null;
							this.filterInitialization = null;
							const filter = this.filter;
							this.filter = null;
							return filter?.release().catch(response => {
								this.requestSender.showErrorAlert(response);
							});
						}
						return null;
					}
				}
			});
		}
		showTasksList(completed = false) {
			this.id = main_core.Text.getRandom();
			this.gridId = 'EpicTasksGrid_' + this.groupId;
			this.sidePanelManager.open('tasks-scrum-epic-tasks-list-side-panel', {
				cacheable: false,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.epic'],
						title: completed ? main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_COMPLETED_TASKS_LIST_TITLE') : main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_TASKS_LIST_TITLE'),
						content: this.createTasksListContent.bind(this, completed),
						design: {
							section: false
						},
						buttons: []
					});
				},
				events: {
					onLoad: this.onLoadTasksList.bind(this)
				}
			});
		}
		showViewForm() {
			this.id = main_core.Text.getRandom();
			this.subscribeViewToEvents();
			this.sidePanelManager.open('tasks-scrum-epic-view-form-side-panel', {
				cacheable: false,
				width: 800,
				contentCallback: () => {
					return new Promise((resolve, reject) => {
						this.getEpic().then(response => {
							const epic = response.data;
							resolve(ui_sidepanel_layout.Layout.createContent({
								extensions: ['tasks.scrum.epic'],
								title: main_core.Loc.getMessage('TASKS_SCRUM_VIEW_EPIC_FORM_TITLE'),
								content: this.createViewContent.bind(this, epic),
								design: {
									section: false
								},
								buttons: ({
									cancelButton,
									SaveButton
								}) => {
									return [new SaveButton({
										text: main_core.Loc.getMessage('TASKS_SCRUM_EPIC_EDIT_BUTTON'),
										onclick: () => {
											this.sidePanel.close(false, () => {
												main_core_events.EventEmitter.emit(this.getEventNamespace() + ':' + 'openEdit', epic.id);
											});
										}
									}), cancelButton];
								}
							}));
						});
					});
				},
				events: {
					onLoad: this.onLoadViewForm.bind(this)
				}
			});
		}
		showEditForm() {
			this.id = main_core.Text.getRandom();
			this.sidePanelManager.open('tasks-scrum-epic-edit-form-side-panel', {
				cacheable: false,
				width: 800,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.scrum.epic'],
						title: main_core.Loc.getMessage('TASKS_SCRUM_EDIT_EPIC_FORM_TITLE'),
						content: this.createEditContent.bind(this),
						design: {
							section: false
						},
						buttons: ({
							cancelButton,
							SaveButton
						}) => {
							return [new SaveButton({
								onclick: this.onSaveEditForm.bind(this)
							}), cancelButton];
						}
					});
				},
				events: {
					onLoad: this.onLoadEditForm.bind(this)
				}
			});
		}
		removeEpic() {
			return main_core.ajax.runAction('bitrix:tasks.scrum.epic.removeEpic', {
				data: {
					groupId: this.groupId,
					epicId: this.epicId
				}
			}).then(response => {
				main_core_events.EventEmitter.emit(this.getEventNamespace() + ':' + 'afterRemove', response.data);
				return true;
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		showTask(taskId) {
			if (this.pathToTask) {
				this.sidePanelManager.open(this.pathToTask.replace('#action#', 'view').replace('#task_id#', parseInt(taskId, 10)));
			}
		}
		subscribeListToEvents(sidePanelId) {
			main_core_events.EventEmitter.subscribe(this.getEventNamespace() + ':' + 'afterAdd', () => this.reloadGrid());
			main_core_events.EventEmitter.subscribe(this.getEventNamespace() + ':' + 'afterEdit', () => this.reloadGrid());
		}
		subscribeViewToEvents() {
			main_core_events.EventEmitter.subscribe(this.getEventNamespace() + ':' + 'openEdit', baseEvent => {
				Epic.showEdit(this.groupId, baseEvent.getData());
			});
		}
		reloadSidePanel(sidePanelId) {
			if (main_core.Type.isUndefined(sidePanelId)) {
				this.sidePanelManager.reload();
			} else {
				const openSliders = this.sidePanelManager.getOpenSliders();
				if (openSliders.length > 0) {
					openSliders.forEach(slider => {
						if (slider.getUrl() === sidePanelId) {
							slider.reload();
						}
					});
				}
			}
		}
		createAddContent() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.getDescriptionEditor', {
					data: {
						groupId: this.groupId,
						editorId: this.id
					}
				}).then(response => {
					this.formData = response.data;
					resolve(this.renderAddForm());
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
		}
		createListContent() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.list', {
					data: {
						groupId: this.groupId,
						gridId: this.gridId
					}
				}).then(response => {
					this.listData = response.data;
					resolve(this.renderList());
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
		}
		createFilterContent() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.filter.get', {
					data: {
						groupId: this.groupId,
						gridId: this.gridId
					}
				}).then(response => {
					this.filterData = response.data;
					resolve(this.renderFilter());
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
		}
		createTasksListContent(completed) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.getTasksList', {
					data: {
						groupId: this.groupId,
						epicId: this.epicId,
						gridId: this.gridId,
						completed: completed ? 'Y' : 'N'
					}
				}).then(response => {
					this.listData = response.data;
					resolve(this.renderTasksList());
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
		}
		createViewContent(epic) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.getEpicFiles', {
					data: {
						groupId: this.groupId,
						epicId: epic.id
					}
				}).then(response => {
					this.epicFiles = main_core.Type.isUndefined(response.data.html) ? '' : response.data.html;
					resolve(this.renderViewForm(epic));
				}).catch(response => {
					this.requestSender.showErrorAlert(response);
				});
			});
		}
		createEditContent() {
			return new Promise((resolve, reject) => {
				this.getEpic().then(response => {
					const epic = response.data;
					main_core.ajax.runAction('bitrix:tasks.scrum.epic.getDescriptionEditor', {
						data: {
							groupId: this.groupId,
							editorId: this.id,
							epicId: epic.id,
							text: epic.description
						}
					}).then(response => {
						this.currentEpic = epic;
						this.formData = response.data;
						resolve(this.renderEditForm(epic));
					}).catch(response => {
						this.requestSender.showErrorAlert(response);
					});
				});
			});
		}
		createContainerContent() {
			return Promise.all([this.createFilterContent(), this.createListContent()]).then(([filterContent, listContent]) => {
				return this.renderContainer(filterContent, listContent);
			});
		}
		getEpic() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.epic.getEpic', {
					data: {
						groupId: this.groupId,
						epicId: this.epicId
					}
				}).then(resolve, reject);
			});
		}
		onLoadAddForm(event) {
			this.sidePanel = event.getSlider();
			this.form = this.sidePanel.getContainer().querySelector('.tasks-scrum-epic-form');
			const descriptionContainer = this.form.querySelector('.tasks-scrum-epic-form-description');
			if (main_core.Type.isUndefined(this.formData.html)) {
				return;
			}
			this.renderEditor(descriptionContainer);
		}
		onSaveAddForm() {
			main_core.ajax.runAction('bitrix:tasks.scrum.epic.createEpic', {
				data: this.getRequestData()
			}).then(response => {
				this.sidePanel.close(false, () => {
					main_core_events.EventEmitter.emit(this.getEventNamespace() + ':' + 'afterAdd', response.data);
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('TASKS_SCRUM_ADD_EPIC_NOTIFY')
					});
				});
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onLoadFilter(event) {
			const slider = event.getSlider();
			if (this.filterSlider !== slider || !slider.isOpen() || !this.filterData?.html) {
				return Promise.resolve();
			}
			if (this.filterInitialization) {
				return this.filterInitialization;
			}
			const {
				html,
				assets = {}
			} = this.filterData;
			const filterContainer = slider.getContainer().querySelector('.tasks-scrum-epic-filter');
			const isCurrentSlider = () => this.filterSlider === slider && slider.isOpen() && this.filterInitialization === initialization;
			const initialization = new Promise((resolve, reject) => {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.load([...(assets.js || []), ...(assets.css || [])], resolve, document, reject);
			}).then(() => {
				if (isCurrentSlider()) {
					return main_core.Runtime.html(filterContainer, html);
				}
				return null;
			}).then(() => {
				if (isCurrentSlider()) {
					this.filter = new Filter({
						filterId: this.filterId
					});
					return this.onLoadList(event);
				}
				return null;
			}).catch(response => {
				if (isCurrentSlider()) {
					this.requestSender.showErrorAlert(response ?? {
						errors: [{
							message: main_core.Loc.getMessage('TSE_ERROR_POPUP_TITLE')
						}]
					});
				}
			});
			this.filterInitialization = initialization;
			return initialization;
		}
		onLoadList(event) {
			const slider = event.getSlider();
			const initialization = this.filterInitialization;
			this.sidePanel = slider;
			const listContainer = this.sidePanel.getContainer().querySelector('.tasks-scrum-epic-list');
			if (main_core.Type.isUndefined(this.listData.html)) {
				main_core.Dom.append(this.renderListBlank(), listContainer);
				main_core.Event.bind(listContainer.querySelector('.tasks-scrum-epics-empty-button'), 'click', this.showAddForm.bind(this));
			} else {
				return main_core.Runtime.html(listContainer, this.listData.html).then(() => {
					if (this.filterSlider !== slider || this.filterInitialization !== initialization || !slider.isOpen()) {
						return;
					}
					main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequest.bind(this));
					this.prepareTagsList(listContainer);
				});
			}
			return Promise.resolve();
		}
		onLoadTasksList(event) {
			this.sidePanel = event.getSlider();
			const listContainer = this.sidePanel.getContainer().querySelector('.tasks-scrum-epic-tasks-list');
			if (this.listData) {
				main_core.Runtime.html(listContainer, this.listData.html).then(() => {
					main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequest.bind(this));
				});
			}
		}
		onLoadViewForm(event) {
			this.sidePanel = event.getSlider();
			if (this.epicFiles) {
				const filesContainer = this.sidePanel.getContainer().querySelector('.tasks-scrum-epic-form-files');
				main_core.Runtime.html(filesContainer, this.epicFiles);
			}
		}
		onLoadEditForm(event) {
			this.sidePanel = event.getSlider();
			this.form = this.sidePanel.getContainer().querySelector('.tasks-scrum-epic-form');
			const descriptionContainer = this.form.querySelector('.tasks-scrum-epic-form-description');
			if (main_core.Type.isUndefined(this.formData.html)) {
				return;
			}
			this.renderEditor(descriptionContainer);
		}
		onSaveEditForm() {
			main_core.ajax.runAction('bitrix:tasks.scrum.epic.editEpic', {
				data: this.getRequestData()
			}).then(response => {
				this.sidePanel.close(false, () => {
					main_core_events.EventEmitter.emit(this.getEventNamespace() + ':' + 'afterEdit', response.data);
				});
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		onBeforeGridRequest(event) {
			const [gridObject, eventArgs] = event.getCompatData();

			/* eslint-disable */
			eventArgs.sessid = BX.bitrix_sessid();
			/* eslint-enable */

			eventArgs.method = 'POST';
			if (!eventArgs.url) {
				eventArgs.url = this.getListUrl();
			}
			eventArgs.data = {
				...eventArgs.data,
				groupId: this.groupId,
				gridId: this.gridId,
				epicId: this.epicId
			};
		}
		getListUrl() {
			return '/bitrix/services/main/ajax.php?action=bitrix:tasks.scrum.epic.list';
		}
		renderAddForm() {
			return main_core.Tag.render`
			<div class="tasks-scrum-epic-form">
				<div class="tasks-scrum-epic-form-container">
					${this.renderNameField(0, '', this.defaultColor)}
					${this.renderDescriptionField()}
				</div>
			</div>
		`;
		}
		renderContainer(filterContent, listContent) {
			return main_core.Tag.render`
			<div class="tasks-scrum-epic-container">
				<div class="tasks-scrum-epic-toolbar">
					<button class="ui-btn ui-btn-success" onclick="${this.showAddForm.bind(this)}">
						<span class="ui-btn-text">${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_LIST_TOOLBAR_BUTTON')}</span>
					</button>
					${filterContent}
				</div>
				${listContent}
			</div>
		`;
		}
		renderFilter() {
			return main_core.Tag.render`<div class="tasks-scrum-epic-filter"></div>`;
		}
		renderList() {
			return main_core.Tag.render`<div class="tasks-scrum-epic-list"></div>`;
		}
		renderTasksList() {
			return main_core.Tag.render`<div class="tasks-scrum-epic-tasks-list"></div>`;
		}
		renderViewForm(epic) {
			return main_core.Tag.render`
			<div class="tasks-scrum-epic-form">
				<div class="tasks-scrum-epic-form-container">
					<div class="tasks-scrum-epic-form-header">
						<div class="tasks-scrum-epic-form-header-title">
							${main_core.Text.encode(epic.name)}
						</div>
						<div class="tasks-scrum-epic-form-header-separate"></div>
						<div class="tasks-scrum-epic-header-color">
							<div
								class="tasks-scrum-epic-header-color-current"
								style="background-color: ${main_core.Text.encode(epic.color)};"
							>
							</div>
						</div>
					</div>
					<div class="tasks-scrum-epic-form-body">
						<div class="tasks-scrum-epic-form-description">
							${epic.description}
						</div>
						<div class="tasks-scrum-epic-form-files"></div>
					</div>
				</div>
			</div>
		`;
		}
		renderEditForm(epic) {
			this.selectedColor = epic.color;
			return main_core.Tag.render`
			<div class="tasks-scrum-epic-form">
				<div class="tasks-scrum-epic-form-container">
					${this.renderNameField(epic.id, epic.name, this.selectedColor)}
					${this.renderDescriptionField()}
				</div>
			</div>
		`;
		}
		renderNameField(epicId, name, color) {
			const nameField = main_core.Tag.render`
			<div class="tasks-scrum-epic-form-header">
				<div class="tasks-scrum-epic-form-header-title">
					<input
						type="text"
						name="name"
						value="${main_core.Text.encode(name)}"
						class="tasks-scrum-epic-form-header-title-control"
						placeholder="${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_NAME_PLACEHOLDER')}"
					>
				</div>
				<div class="tasks-scrum-epic-form-header-separate"></div>
				<div class="tasks-scrum-epic-header-color">
					<div
						data-epic-id="${parseInt(epicId, 10)}"
						class="tasks-scrum-epic-header-color-current"
						style="background-color: ${main_core.Text.encode(color)};"
					>
					</div>
					<div class="tasks-scrum-epic-header-color-btn-angle"></div>
				</div>
			</div>
		`;
			const pickerContainer = nameField.querySelector('.tasks-scrum-epic-header-color');
			main_core.Event.bind(pickerContainer, 'click', () => {
				const colorNode = pickerContainer.querySelector('.tasks-scrum-epic-header-color-current');
				const picker = this.getColorPicker(colorNode);
				picker.open();
			});
			return nameField;
		}
		renderDescriptionField() {
			return main_core.Tag.render`
			<div class="tasks-scrum-epic-form-body">
				<div class="tasks-scrum-epic-form-description --editing"></div>
			</div>
		`;
		}
		renderEditor(container) {
			setTimeout(() => {
				main_core.Runtime.html(container, this.formData.html).then(() => {
					if (window.LHEPostForm) {
						this.editorHandler = window.LHEPostForm.getHandler(this.id);
						main_core_events.EventEmitter.emit(this.editorHandler.eventNode, 'OnShowLHE', [true]);
					}
					this.focusToName();
				});
			}, 300);
		}
		renderListBlank() {
			return main_core.Tag.render`
			<div class="tasks-scrum-epics-empty">
				<div class="tasks-scrum-epics-empty-first-title">
					${main_core.Loc.getMessage('TASKS_SCRUM_EPICS_EMPTY_FIRST_TITLE')}
				</div>
				<div class="tasks-scrum-epics-empty-image">
					<svg width="124px" height="123px" viewBox="0 0 124 123" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.28">
							<path d="M83,105 L83,81.4375 L105,81.4375 L105,18 L17,18 L17,81.4375 L39,81.4375 L39,105 L83,105 Z M10.9411765,0 L113.058824,0 C119.101468,0 124,4.85902727 124,10.8529412 L124,112.147059 C124,118.140973 119.101468,123 113.058824,123 L10.9411765,123 C4.89853156,123 0,118.140973 0,112.147059 L0,10.8529412 C0,4.85902727 4.89853156,0 10.9411765,0 Z M44.0142862,47.0500004 L54.2142857,57.4416671 L79.7142857,32 L87,42.75 L54.2142857,75 L36,57.0833333 L44.0142862,47.0500004 Z" fill="#A8ADB4" />
						</g>
					</svg>
				</div>
				<div class="tasks-scrum-epics-empty-second-title">
					${main_core.Loc.getMessage('TASKS_SCRUM_EPICS_EMPTY_SECOND_TITLE')}
				</div>
				<div class="tasks-scrum-epics-empty-button">
					<button class="ui-btn ui-btn-primary ui-btn-lg">
						${main_core.Loc.getMessage('TASKS_SCRUM_SPRINT_ADD_EPIC_LIST_TOOLBAR_BUTTON')}
					</button>
				</div>
			</div>
		`;
		}
		getGrid() {
			/* eslint-disable */
			if (BX && BX.Main && BX.Main.gridManager) {
				return BX.Main.gridManager.getById(this.gridId);
			}
			/* eslint-enable */

			return null;
		}
		reloadGrid() {
			if (BX && BX.Main && BX.Main.gridManager) {
				BX.Main.gridManager.reload(this.gridId);
			}
		}
		prepareTagsList(container) {
			const tagsContainers = container.querySelectorAll('.tasks-scrum-epic-grid-tags');
			tagsContainers.forEach(tagsContainer => {
				const tags = this.getTagsFromNode(tagsContainer);
				main_core.Dom.clean(tagsContainer);
				tags.forEach(tag => {
					main_core.Dom.append(this.getTagNode(tag), tagsContainer);
				});
			});
		}
		getTagsFromNode(node) {
			const tags = [];
			node.childNodes.forEach(childNode => {
				tags.push(childNode.textContent.trim());
			});
			return tags;
		}
		getTagNode(tag) {
			const tagLabel = new ui_label.Label({
				text: tag,
				color: ui_label.Label.Color.TAG_LIGHT,
				fill: true,
				size: ui_label.Label.Size.SM,
				customClass: ''
			});
			return tagLabel.getContainer();
		}
		getColorPicker(colorNode) {
			const epicId = main_core.Dom.attr(colorNode, 'data-epic-id');
			if (!this.colorPickers.has(epicId)) {
				/* eslint-disable */
				const picker = new BX.ColorPicker({
					bindElement: colorNode,
					defaultColor: this.defaultColor,
					selectedColor: this.selectedColor ? this.selectedColor : this.defaultColor,
					onColorSelected: (color, picker) => {
						this.selectedColor = color;
						colorNode.style.backgroundColor = color;
					},
					popupOptions: {
						angle: {
							position: 'top',
							offset: 33
						},
						className: 'tasks-scrum-epic-color-popup'
					},
					allowCustomColor: false,
					colors: [['#aae9fc', '#bbecf1', '#98e1dc', '#e3f299', '#ffee95', '#ffdd93', '#dfd3b6', '#e3c6bb'], ['#ffad97', '#ffbdbb', '#ffcbd8', '#ffc4e4', '#c4baed', '#dbdde0', '#bfc5cd', '#a2a8b0']]
				});
				this.colorPickers.set(epicId, picker);
				/* eslint-enable */
			}
			return this.colorPickers.get(epicId);
		}
		focusToName() {
			setTimeout(() => {
				this.form.querySelector('.tasks-scrum-epic-form-header-title-control').focus();
			}, 50);
		}
		getRequestData() {
			const requestData = {};
			if (this.currentEpic) {
				requestData.epicId = this.currentEpic.id;
			}
			requestData.groupId = this.groupId;
			requestData.name = this.form.querySelector('[name=name]').value.trim();
			requestData.description = this.editorHandler.getEditor().GetContent();
			requestData.color = this.selectedColor ? this.selectedColor : this.defaultColor;
			requestData.files = this.getAttachmentsFiles();
			return requestData;
		}
		getAttachmentsFiles() {
			const files = [];
			if (!this.editorHandler || !main_core.Type.isPlainObject(this.editorHandler.arFiles) || !main_core.Type.isPlainObject(this.editorHandler.controllers)) {
				return files;
			}
			const fileControllers = [];
			Object.values(this.editorHandler.arFiles).forEach(controller => {
				if (!fileControllers.includes(controller)) {
					fileControllers.push(controller);
				}
			});
			fileControllers.forEach(fileController => {
				if (this.editorHandler.controllers[fileController] && main_core.Type.isPlainObject(this.editorHandler.controllers[fileController].values)) {
					Object.keys(this.editorHandler.controllers[fileController].values).forEach(fileId => {
						if (!files.includes(fileId)) {
							files.push(fileId);
						}
					});
				}
			});
			return files;
		}
	}

	exports.Epic = Epic;
	exports.Filter = Filter;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX, BX.Event, BX.UI.SidePanel, BX.UI, BX.UI.Notification, BX.UI.Dialogs);
//# sourceMappingURL=epic.bundle.js.map
