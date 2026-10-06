/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_designTokens, main_kanban, main_core, ui_buttons, ui_notification, ui_fonts_opensans, rpa_kanban, rpa_manager, main_popup, ui_dialogs_messagebox, rpa_fieldspopup) {
	'use strict';

	class PullManager {
		constructor(grid) {
			this.eventIds = new Set();
			if (grid instanceof rpa_kanban.Kanban.Grid) {
				this.grid = grid;
				if (main_core.Type.isArray(this.grid.getData().eventIds)) {
					this.grid.getData().eventIds.forEach(eventId => {
						this.eventIds.add(eventId);
					});
				}
				if (main_core.Type.isString(grid.getData().pullTag) && main_core.Type.isString(grid.getData().moduleId) && grid.getData().userId > 0) {
					this.init();
				}
			}
		}
		registerEventId(eventId) {
			this.eventIds.add(eventId);
		}
		registerRandomEventId() {
			const eventId = main_core.Text.getRandom();
			this.registerEventId(eventId);
			return eventId;
		}
		init() {
			main_core.Event.ready(() => {
				const Pull = BX.PULL;
				if (!Pull) {
					console.error('pull is not initialized');
					return;
				}
				if (main_core.Type.isString(this.grid.getData().pullTag)) {
					Pull.subscribe({
						moduleId: this.grid.getData().moduleId,
						command: this.grid.getData().pullTag,
						callback: params => {
							if (main_core.Type.isString(params.eventName)) {
								if (main_core.Type.isString(params.eventId)) {
									if (this.eventIds.has(params.eventId)) {
										return;
									}
								}
								if (params.eventName.indexOf('ITEMUPDATED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.item)) {
									this.onPullItemUpdated(params);
								} else if (params.eventName === 'ITEMADDED' + this.grid.getTypeId() && main_core.Type.isPlainObject(params.item)) {
									this.onPullItemAdded(params);
								} else if (params.eventName.indexOf('ITEMDELETED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.item)) {
									this.onPullItemDeleted(params);
								} else if (params.eventName === 'STAGEADDED' + this.grid.getTypeId() && main_core.Type.isPlainObject(params.stage)) {
									this.onPullStageAdded(params);
								} else if (params.eventName.indexOf('STAGEUPDATED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.stage)) {
									this.onPullStageUpdated(params);
								} else if (params.eventName.indexOf('STAGEDELETED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.stage)) {
									this.onPullStageDeleted(params);
								} else if (params.eventName === 'ROBOTADDED' + this.grid.getTypeId() && main_core.Type.isPlainObject(params.robot)) {
									this.onPullRobotAdded(params);
								} else if (params.eventName.indexOf('ROBOTUPDATED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.robot)) {
									this.onPullRobotUpdated(params);
								} else if (params.eventName.indexOf('ROBOTDELETED' + this.grid.getTypeId()) === 0 && main_core.Type.isPlainObject(params.robot)) {
									this.onPullRobotDeleted(params);
								} else if (params.eventName.indexOf('TYPEUPDATED' + this.grid.getTypeId()) === 0) {
									this.onPullTypeUpdated();
								}
							}
						}
					});
					Pull.extendWatch(this.grid.getData().pullTag);
				}
				if (main_core.Type.isString(this.grid.getData().taskCountersPullTag)) {
					Pull.subscribe({
						moduleId: this.grid.getData().moduleId,
						command: this.grid.getData().taskCountersPullTag,
						callback: params => {
							if (main_core.Type.isString(params.eventId)) {
								if (this.eventIds.has(params.eventId)) {
									return;
								}
							}
							if (this.grid.getTypeId() === main_core.Text.toInteger(params.typeId)) {
								this.onPullCounters(params);
							}
						}
					});
					Pull.extendWatch(this.grid.getData().taskCountersPullTag);
				}
			});
		}
		onPullItemUpdated(params) {
			this.grid.addUsers(params.item.users);
			const item = this.grid.getItem(params.item.id);
			if (item) {
				item.setData(params.item);
				this.grid.insertItem(item);
			} else {
				const column = this.grid.getColumn(params.item.stageId);
				if (column && (column.isCanMoveFrom() || column.canAddItems())) {
					this.onPullItemAdded(params);
				}
			}
		}
		onPullItemAdded(params) {
			const itemData = params.item;
			this.grid.addUsers(itemData.users);
			const oldItem = this.grid.getItem(itemData.id);
			if (oldItem) {
				return;
			}
			const item = new rpa_kanban.Kanban.Item({
				id: itemData.id,
				columnId: itemData.stageId,
				name: itemData.name,
				data: itemData
			});
			item.setGrid(this.grid);
			this.grid.items[item.getId()] = item;
			const column = this.grid.getColumn(item.getStageId());
			if (column
			//&& this.grid.getFirstColumn() !== column
			&& (column.isCanMoveFrom() || column.canAddItems())) {
				column.addItem(item, column.getFirstItem());
			}
		}
		onPullItemDeleted(params) {
			if (!main_core.Type.isPlainObject(params.item)) {
				return;
			}
			this.grid.removeItem(params.item.id);
		}
		onPullStageAdded(params) {
			this.grid.onApplyFilter();
		}
		onPullStageUpdated(params) {
			const column = this.grid.getColumn(params.stage.id);
			if (column) {
				column.update(params);
			}
		}
		onPullStageDeleted(params) {
			this.grid.removeColumn(params.stage.id);
		}
		onPullRobotAdded(params) {
			this.onPullRobotChanged(params.robot.stageId);
		}
		onPullRobotUpdated(params) {
			this.onPullRobotChanged(params.robot.stageId);
		}
		onPullRobotDeleted(params) {
			if (main_core.Type.isPlainObject(params.robot) && main_core.Type.isString(params.robot.robotName)) {
				const column = this.grid.getColumn(params.robot.stageId);
				if (column) {
					column.setTasks(column.getTasks().filter(filteredTask => {
						return filteredTask.robotName !== params.robot.robotName;
					}));
					column.rerenderSubtitle();
				}
			}
		}
		onPullRobotChanged(stageId) {
			const column = this.grid.getColumn(stageId);
			if (column) {
				column.loadTasks().then(() => {
					column.rerenderSubtitle();
				}).catch(() => {});
			}
		}
		onPullCounters(params) {
			let typeId = main_core.Text.toInteger(params.typeId);
			let itemId = main_core.Text.toInteger(params.itemId);
			if (typeId !== this.grid.getTypeId()) {
				return;
			}
			const item = this.grid.getItem(itemId);
			if (item) {
				let currentCounter = item.getTasksCounter();
				if (params.counter === '+1') {
					currentCounter++;
				} else if (params.counter === '-1') {
					currentCounter--;
				}
				item.setTasksCounter(currentCounter);
				if (main_core.Type.isPlainObject(params.tasksFaces)) {
					item.setTasksParticipants(params.tasksFaces);
				}
				item.render();
			}
		}
		onPullTypeUpdated() {
			this.grid.onApplyFilter();
		}
	}

	class Column extends main_kanban.Kanban.Column {
		getId() {
			return parseInt(super.getId());
		}
		setOptions(options) {
			super.setOptions(options);
			this.canMoveFrom = !!options.canMoveFrom;
			this.setPermissionProperties();
		}
		isDroppable() {
			return super.isDroppable() || this.canMoveTo();
		}
		isFirstColumn() {
			return this.data.isFirst === true;
		}
		setIsFirstColumn(isFirst = false) {
			this.data.isFirst = isFirst;
			return this;
		}
		onAfterRender() {
			if (!this.isDroppable()) {
				this.getContainer().style.backgroundColor = 'rgba(204, 204, 204, 0.2)';
			} else {
				this.getContainer().style.backgroundColor = 'transparent';
			}
		}
		rerenderSubtitle() {
			const nodeNames = ['responsible', 'subTitleTasksButton', 'subTitleTasks', 'subTitleAddTaskButton', 'subTitleSettingsButton', 'subTitleAddButton'];
			nodeNames.forEach(nodeName => {
				main_core.Dom.clean(this.layout[nodeName]);
				this.layout[nodeName] = null;
			});
			main_core.Dom.clean(this.layout.subtitleNode);
			if (this.tasksPopup) {
				this.tasksPopup.destroy();
			}
			this.renderSubTitle();
		}
		renderSubTitle() {
			const subTitleNode = this.getSubTitleNode();
			if (this.isEditable()) {
				const tasks = this.getTasks();
				const robotsCnt = this.getData()['robotsCount'];
				if (tasks && tasks.length > 0) {
					subTitleNode.appendChild(this.renderSubTitleTasks(tasks));
				} else {
					if (!this.isFirstColumn() || this.isFirstColumn() && !robotsCnt) {
						subTitleNode.appendChild(this.renderSubTitleAddTaskButton());
					}
				}
			}
			if (this.isFirstColumn() && this.canAddItems()) {
				subTitleNode.appendChild(this.renderSubTitleAddButton());
			} else {
				if (this.layout.subTitleAddButton) {
					main_core.Dom.remove(this.layout.subTitleAddButton);
					this.layout.subTitleAddButton = null;
				}
			}
			return subTitleNode;
		}
		getSubTitleNode() {
			if (!this.layout.subtitleNode) {
				this.layout.subtitleNode = main_core.Tag.render`<div class="main-kanban-column-subtitle-box"></div>`;
			}
			return this.layout.subtitleNode;
		}
		getContainer() {
			const container = super.getContainer();
			if (this.isFirstColumn() && this.canAddItems()) {
				const quickFormContainer = this.renderQuickFormContainer();
				const itemsContainer = this.getItemsContainer();
				if (quickFormContainer && itemsContainer) {
					if (quickFormContainer.parentNode !== itemsContainer) {
						main_core.Dom.prepend(quickFormContainer, itemsContainer);
					}
				}
			}
			return container;
		}

		//region quick form
		renderSubTitleAddButton() {
			if (!this.layout.subTitleAddButton) {
				this.layout.subTitleAddButton = main_core.Tag.render`<div class="main-kanban-column-add-item-button" onclick="${this.handleAddItemButtonClick.bind(this)}"></div>`;
			}
			return this.layout.subTitleAddButton;
		}
		renderQuickFormContainer() {
			if (!this.layout.quickFormContainer) {
				let className = 'rpa-kanban-form';
				if (this.getGrid().canAddColumns()) {
					className += ' rpa-kanban-form-with-settings';
				}
				this.layout.quickFormContainer = main_core.Tag.render`<div class="${className}"></div>`;
			}
			return this.layout.quickFormContainer;
		}
		renderQuickFormButtons() {
			if (!this.layout.quickFormButtons) {
				this.layout.quickFormButtons = main_core.Tag.render`<div class="rpa-kanban-form-buttons">
				<button class="ui-btn ui-btn-sm ui-btn-primary" onclick="${this.handleFormSaveButtonClick.bind(this)}">${main_core.Loc.getMessage('RPA_KANBAN_QUICK_FORM_SAVE_BUTTON')}</button>
				<button class="ui-btn ui-btn-sm ui-btn-link" onclick="${this.handleFormCancelButtonClick.bind(this)}">${main_core.Loc.getMessage('RPA_KANBAN_QUICK_FORM_CANCEL_BUTTON')}</button>
			</div>`;
			}
			return this.layout.quickFormButtons;
		}
		handleAddItemButtonClick() {
			if (this.getGrid().isProgress()) {
				return;
			}
			if (this.getGrid().isCreateItemRestricted()) {
				rpa_manager.Manager.Instance.showFeatureSlider();
				return;
			}
			if (this.isFormVisible()) {
				return;
			}
			this.getGrid().startProgress();
			main_core.ajax.runAction('rpa.Item.getEditor', {
				analyticsLabel: 'rpaItemOpenQuickForm',
				data: {
					typeId: this.getGrid().getTypeId(),
					id: 0,
					stageId: this.getId(),
					eventId: this.getGrid().pullManager.registerRandomEventId()
				}
			}).then(response => {
				this.getGrid().stopProgress();
				main_core.Runtime.html(this.layout.quickFormContainer, response.data.html).then(() => {
					this.addSelectButtonToEditor();
					main_core.Dom.append(this.renderQuickFormButtons(), this.layout.quickFormContainer);
					this.showForm();
					this.bindKeyDownEvents();
				});
			}).catch(response => {
				this.getGrid().stopProgress();
				this.getGrid().showErrorFromResponse(response);
			});
		}
		showForm() {
			this.getBody().scrollTop = 0;
			this.layout.quickFormContainer.style.display = 'block';
			this.layout.quickFormButtons.style.display = 'block';
		}
		hideForm() {
			this.layout.quickFormContainer.style.display = 'none';
			this.layout.quickFormButtons.style.display = 'none';
		}
		isFormVisible() {
			return this.layout.quickFormContainer.style.display === 'block' && this.layout.quickFormButtons.style.display === 'block';
		}
		getEditor() {
			return rpa_manager.Manager.getEditor(this.getGrid().getTypeId(), 0);
		}
		handleFormCancelButtonClick() {
			const editor = this.getEditor();
			if (editor) {
				editor.rollback();
				editor.refreshLayout();
			}
			this.hideForm();
		}
		handleFormSaveButtonClick() {
			const editor = this.getEditor();
			if (editor) {
				editor.save();
				this.bindEditorEvents();
			} else {
				this.hideForm();
			}
		}
		onEditorSubmit(entityData, response) {
			if (this.isFormVisible()) {
				this.hideForm();
				const itemData = response.data.item;
				this.getGrid().addUsers(response.data.item.users);
				const oldItem = this.getGrid().getItem(itemData.id);
				if (oldItem) {
					return;
				}
				const item = new rpa_kanban.Kanban.Item({
					id: itemData.id,
					columnId: itemData.stageId,
					name: itemData.name,
					data: itemData
				});
				item.setGrid(this.getGrid());
				this.getGrid().items[item.getId()] = item;
				const column = this.getGrid().getColumn(item.getStageId());
				if (column) {
					column.addItem(item, column.getFirstItem());
				}
			}
		}
		onEditorErrors(errors) {
			if (this.isFormVisible()) {
				this.hideForm();
				this.getGrid().showErrorFromResponse(errors);
			}
		}
		bindEditorEvents() {
			if (!this.isEditorEventsBinded) {
				this.isEditorEventsBinded = true;
				BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmitFailure', this.onEditorErrors.bind(this));
				BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmit', this.onEditorSubmit.bind(this));
			}
		}
		bindKeyDownEvents() {
			if (!this.isKeyDownEventsBinded) {
				this.isKeyDownEventsBinded = true;
				const onEnterKeyDown = event => {
					if ((event.code === 'Enter' || event.code === 'NumpadEnter') && this.isFormVisible()) {
						this.handleFormSaveButtonClick();
					}
				};
				const isCtrlKey = function (code) {
					return code === 'MetaRight' || code === 'MetaLeft' || code === 'ControlRight' || code === 'ControlLeft';
				};
				main_core.Event.bind(window, 'keydown', event => {
					if (isCtrlKey(event.code)) {
						main_core.Event.bind(window, 'keydown', onEnterKeyDown);
					} else if (event.code === 'Escape') {
						this.handleFormCancelButtonClick();
					}
				});
				main_core.Event.bind(window, 'keyup', event => {
					if (isCtrlKey(event.code)) {
						main_core.Event.unbind(window, 'keydown', onEnterKeyDown);
					}
				});
			}
		}

		//endregion

		//region settings
		renderSubTitleSettingsButton() {
			if (!this.layout.subTitleSettingsButton) {
				this.layout.subTitleSettingsButton = main_core.Tag.render`
			<div class="main-kanban-column-settings-button" onclick="${this.openSettings.bind(this)}">
				<button class="ui-btn ui-btn-xs ui-btn-link ui-btn-icon-setting"></button>
			</div>`;
			}
			return this.layout.subTitleSettingsButton;
		}
		openSettings() {
			const url = this.data.settingsUrl;
			if (url) {
				rpa_manager.Manager.openSlider(url).then(slider => {
					const response = slider.getData().get('response');
					if (response) {
						this.update(response.data);
					}
				});
			}
		}
		//endregion

		//region task
		renderSubTitleAddTaskButton() {
			if (!this.layout.subTitleAddTaskButton) {
				const url = this.buildAddRobotUrl();
				this.layout.subTitleAddTaskButton = main_core.Tag.render`
					<div class="main-kanban-column-settings-button">
						<a class="ui-btn ui-btn-xs ui-btn-light-border ui-btn-no-caps ui-btn-round ui-btn-themes main-kanban-column-settings-button-rpa" href="${url}">
							${main_core.Loc.getMessage('RPA_KANBAN_COLUMN_ADD_TASK_BTN')}
						</a>
					</div>
				`;
			}
			return this.layout.subTitleAddTaskButton;
		}
		renderSubTitleTasks(tasks) {
			if (!this.layout.subTitleTasks) {
				this.layout.subTitleTasks = main_core.Tag.render`
					<div class="rpa-kanban-column-task-block">
						<div class="rpa-kanban-column-task-inner">
							${this.renderSubTitleResponsible(tasks, true)}
							${this.renderSubTitleTasksButton(tasks)}
						</div>
					</div>
				`;
			}
			return this.layout.subTitleTasks;
		}
		renderSubTitleTasksButton(tasks) {
			if (!this.layout.subTitleTasksButton) {
				this.layout.subTitleTasksButton = main_core.Tag.render`
					<div class="rpa-kanban-column-task-btn" onclick="${this.showTasks.bind(this, tasks)}">
						<span class="rpa-kanban-column-task-btn-title">${main_core.Loc.getMessage('RPA_KANBAN_TASKS')}</span>
						<span class="rpa-kanban-column-task-btn-counter">${tasks.length}</span>
					</div>
				`;
			}
			return this.layout.subTitleTasksButton;
		}
		renderSubTitleResponsible(tasks, showTaskListMenu) {
			let responsibleElements = [];
			const plusHandler = this.showTasks.bind(this, tasks);
			tasks.forEach(task => {
				task.users.forEach(user => {
					let style = 'border-color: #' + this.getColor() + ';';
					if (user.photoSrc) {
						style += ' background-image: url(\'' + main_core.Text.encode(encodeURI(user.photoSrc)) + '\');';
					} else {
						style += ' background-size: 60%;';
					}
					responsibleElements.push(main_core.Tag.render`<span class="rpa-kanban-column-task-responsible-item" title="${user.name}">
					<span class="rpa-kanban-column-task-responsible-img" style="${style}">
					</span>
				</span>`);
				});
			});
			responsibleElements = this.sliceResponsibleListElements(responsibleElements);
			let plusNode = main_core.Tag.render`<span class="rpa-kanban-column-task-responsible-add"></span>`;
			if (showTaskListMenu) {
				BX.bind(plusNode, 'click', plusHandler);
			} else {
				let task = tasks[0];
				if (task.canAppendResponsibles) {
					BX.Bizproc.UserSelector.decorateNode(plusNode, {
						isOnlyDialogMode: true,
						callbacks: {
							select: this.addTaskUserHandler.bind(this, task)
						}
					});
				} else {
					plusNode = main_core.Tag.render`<a href="${this.buildEditRobotUrl(task['robotName'])}" class="rpa-kanban-column-task-responsible-add"></a>`;
				}
			}
			return main_core.Tag.render`
				<div class="rpa-kanban-column-task-responsible">
					<div class="rpa-kanban-column-task-responsible-list" style="background-color: ${"#" + this.getColor()}" onclick="${plusHandler}">
						${responsibleElements}
					</div>
					${plusNode}
				</div>
			`;
		}
		sliceResponsibleListElements(elements) {
			if (elements.length > 4) {
				let counter = elements.length - 4;
				elements = elements.slice(0, 4);
				elements.push(main_core.Tag.render`<span class="rpa-kanban-column-task-responsible-item rpa-kanban-column-task-responsible-item-other">
						<span class="rpa-kanban-column-task-responsible-other-text">+${counter}</span>
					</span>`);
			}
			return elements;
		}
		showTasks(tasks) {
			this.getTasksPopup(tasks).show();
		}
		addTaskUserHandler(task, value, selector) {
			main_core.ajax.runAction('rpa.Task.addUser', {
				analyticsLabel: 'rpaTaskAddUser',
				data: {
					typeId: this.getGrid().getData().typeId,
					stageId: this.getId(),
					robotName: task.robotName,
					userValue: value
				},
				getParameters: {
					context: 'kanban'
				}
			}).then(response => {});
		}
		getTasksPopup(tasks) {
			if (!this.tasksPopup) {
				let button = this.layout.subTitleTasksButton;
				if (!button) {
					button = this.renderSubTitleTasksButton(this.getTasks());
				}
				this.tasksPopup = new main_popup.Popup('rpa-tasks-' + this.getId(), button, {
					autoHide: true,
					draggable: false,
					offsetTop: -5,
					offsetLeft: 30,
					noAllPaddings: true,
					bindOptions: {
						forceBindPosition: true
					},
					closeByEsc: true,
					cacheable: false,
					angle: {
						offset: 81,
						position: 'top'
					},
					events: {
						onPopupDestroy: () => {
							this.tasksPopup = null;
						}
					},
					overlay: {
						backgroundColor: 'transparent'
					},
					content: this.renderTasksPopup(tasks)
				});
			}
			return this.tasksPopup;
		}
		renderTasksPopup(tasks) {
			const elements = tasks.map(task => {
				return main_core.Tag.render`<div class="rpa-kanban-tasks-popup-item">
						<a href="${this.buildEditRobotUrl(task['robotName'])}" class="rpa-kanban-tasks-popup-name">${main_core.Text.encode(task['title'])}</a>
						<div class="rpa-kanban-tasks-popup-desc">
							${this.renderSubTitleResponsible([task])}
							<span class="rpa-kanban-tasks-popup-delete" onclick="${this.deleteTaskHandler.bind(this, task)}">${main_core.Loc.getMessage('RPA_KANBAN_COLUMN_DELETE_TASK_BTN')}</span>
						</div>
					</div>`;
			});
			return main_core.Tag.render`
			<div class="rpa-kanban-tasks-popup-inner" data-role="rpa-kanban-column-tasks-item">
				<div class="rpa-kanban-tasks-popup-list">
					${elements}
				</div>
				<a href="${this.buildAddRobotUrl()}" class="rpa-kanban-tasks-popup-add">${main_core.Loc.getMessage('RPA_KANBAN_COLUMN_ADD_TASK_BTN')}</a>
			</div>`;
		}
		deleteTaskHandler(task, event) {
			ui_dialogs_messagebox.MessageBox.show({
				message: main_core.Loc.getMessage('RPA_KANBAN_COLUMN_DELETE_TASK_CONFIRM'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				onOk: () => {
					if (this.getGrid().isProgress()) {
						return;
					}
					this.getGrid().startProgress();
					const promise = new BX.Promise();
					main_core.ajax.runAction('rpa.Task.delete', {
						analyticsLabel: 'rpaKanbanTaskDelete',
						data: {
							typeId: this.getGrid().getData().typeId,
							stageId: this.getId(),
							robotName: task['robotName'],
							eventId: this.getGrid().pullManager.registerRandomEventId()
						},
						getParameters: {
							context: 'kanban'
						}
					}).then(() => {
						if (this.tasksPopup) {
							this.tasksPopup.destroy();
						}
						this.setTasks(this.getTasks().filter(filteredTask => {
							return filteredTask.robotName !== task.robotName;
						}));
						this.rerenderSubtitle();
						this.getGrid().stopProgress();
						promise.fulfill();
					}).catch(response => {
						this.getGrid().stopProgress();
						promise.reject();
					});
					return promise;
				},
				popupOptions: {
					zIndexAbsolute: 1200
				}
			});
		}
		buildAddRobotUrl() {
			const typeId = this.getGrid().getData().typeId;
			const url = new main_core.Uri(`/rpa/automation/${typeId}/addrobot/`); //TODO use URI from urlManager

			url.setQueryParams({
				stage: this.getId()
			});
			return url;
		}
		buildEditRobotUrl(robotName) {
			const typeId = this.getGrid().getData().typeId;
			const url = new main_core.Uri(`/rpa/automation/${typeId}/editrobot/`); //TODO use URI from urlManager

			url.setQueryParams({
				stage: this.getId(),
				robotName
			});
			return url;
		}
		//endregion

		getFields() {
			let fields = this.getData().userFields;
			if (!fields || !main_core.Type.isPlainObject(fields)) {
				fields = this.getGrid().getFields();
			}
			if (!fields || !main_core.Type.isPlainObject(fields)) {
				fields = {};
			}
			return fields;
		}
		getPossibleNextStages() {
			return this.getData().possibleNextStages;
		}
		getSort() {
			return parseInt(this.getData().sort);
		}
		isCanMoveFrom() {
			return !!this.canMoveFrom;
		}
		canMoveTo() {
			let result = false;
			this.getGrid().getColumns().forEach(column => {
				if (column.isCanMoveFrom() && column.getPossibleNextStages().includes(this.getId())) {
					result = true;
				}
			});
			return result;
		}
		update(data) {
			if (main_core.Type.isPlainObject(data) && data.stage && main_core.Type.isPlainObject(data.stage) && parseInt(data.stage.id) === this.getId()) {
				const stageData = data.stage;
				this.setName(stageData.name);
				this.setColor(stageData.color);
				this.setData(stageData);
				this.processPermissions(stageData);
				this.getGrid().moveColumn(this, this.getTargetColumn());
				this.render();
				this.getGrid().getColumns().forEach(column => {
					if (column !== this) {
						column.processPermissions();
						column.onAfterRender();
					}
				});
			}
		}
		getTargetColumn() {
			const columns = this.getGrid().getColumns();
			let targetColumn = null;
			columns.forEach(gridColumn => {
				if (gridColumn.getId() !== this.getId() && gridColumn.getSort() >= this.getSort() && (!targetColumn || targetColumn.getSort() > gridColumn.getSort())) {
					targetColumn = gridColumn;
				}
			});
			return targetColumn;
		}
		processPermissions() {
			this.setPermissionProperties();
			this.processDraggingOptions();
		}
		setPermissionProperties() {
			const data = this.getData();
			let permissions = {};
			if (data.permissions && main_core.Type.isPlainObject(data.permissions)) {
				permissions = data.permissions;
			}
			Object.keys(permissions).forEach(name => {
				this[name] = permissions[name];
			});
		}
		processDraggingOptions() {
			if (this.isDraggable()) {
				this.makeDraggable();
			} else {
				this.disableDragging();
			}
			if (this.isDroppable()) {
				this.makeDroppable();
			} else {
				this.disableDropping();
			}
			this.getItems().forEach(item => {
				item.processPermissions();
			});
		}
		loadTasks() {
			return new Promise((resolve, reject) => {
				this.getGrid().startProgress();
				main_core.ajax.runAction('rpa.Stage.getTasks', {
					data: {
						id: this.getId()
					}
				}).then(response => {
					this.getGrid().stopProgress();
					this.setTasks(response.data.tasks);
					resolve();
				}).catch(response => {
					this.getGrid().stopProgress().showErrorFromResponse(response);
					reject();
				});
			});
		}
		getTasks() {
			if (!this.data) {
				this.data = {};
			}
			if (!this.data.tasks || !main_core.Type.isArray(this.data.tasks)) {
				this.data.tasks = [];
			}
			return Array.from(this.data.tasks);
		}
		setTasks(tasks) {
			if (!main_core.Type.isArray(tasks)) {
				tasks = [];
			}
			this.data.tasks = tasks;
			return this;
		}
		addSelectButtonToEditor() {
			const editor = this.getEditor();
			if (!editor) {
				return;
			}
			let editorMainSection = this.getGrid().getEditorMainSection(editor);
			if (!editorMainSection) {
				return;
			}
			if (editorMainSection._addChildButton) {
				return;
			}
			editorMainSection.ensureButtonPanelCreated();
			editorMainSection._addChildButton = BX.create("span", {
				props: {
					className: "ui-entity-editor-content-add-lnk"
				},
				text: BX.message("UI_ENTITY_EDITOR_SELECT_FIELD"),
				events: {
					click: BX.delegate(editorMainSection.onAddChildBtnClick, editorMainSection)
				}
			});
			editorMainSection.addButtonElement(editorMainSection._addChildButton, {
				position: "left"
			});
		}
	}

	class Item extends main_kanban.Kanban.Item {
		currentState = {};
		setOptions(options) {
			super.setOptions(options);
			this.setPermissionProperties();
		}
		render() {
			this.layout.title = null;
			this.renderDescription();
			this.renderFieldsList();
			this.renderShadow();
			if (!this.layout.content) {
				this.layout.content = main_core.Tag.render`<div ondblclick="${this.onDoubleClick.bind(this)}" class="rpa-kanban-item"></div>`;
			} else {
				main_core.Dom.clean(this.layout.content);
			}
			if (this.layout.title) {
				this.layout.content.appendChild(this.layout.title);
			}
			if (this.layout.fieldList) {
				this.layout.content.appendChild(this.layout.fieldList);
			}
			if (this.layout.description) {
				this.layout.content.appendChild(this.layout.description);
			}
			this.layout.content.appendChild(this.renderShadow());
			//this.layout.content.appendChild(this.renderContact());
			this.layout.description.appendChild(this.renderTasksParticipants());
			this.layout.description.appendChild(this.renderTasksCounter());
			this.layout.content.appendChild(BX.Tag.render`<div class="rpa-kanban-item-line"></div>`);
			this.layout.content.style.setProperty("--rpa-kanban-item-color", "#" + this.getColumn().getColor());
			if (this.isDraggable()) {
				this.layout.content.style.backgroundColor = "#fff";
			} else {
				this.layout.content.style.backgroundColor = "#aaa";
			}
			main_core.Event.bindOnce(this.layout.content, "animationend", () => {
				BX.removeClass(this.layout.container, "main-kanban-item-new");
			});
			return this.layout.content;
		}
		setTasksParticipants(tasksFaces) {
			this.data.tasksFaces = tasksFaces;
			return this;
		}
		getTasksCounter() {
			return main_core.Text.toInteger(this.data.tasksCounter);
		}
		getTasksParticipants() {
			const userId = main_core.Text.toInteger(this.getData()['createdBy']);
			const currentUserId = this.getGrid().getUserId();
			const startedBy = this.getGrid().getUser(userId);
			const faces = this.data.tasksFaces;
			const completedById = faces.completed[0];
			const waitingForId = faces.running.includes(currentUserId) ? currentUserId : faces.running[0];
			const completedCnt = faces.completed.length;
			const waitingForCnt = faces.running.length;
			let completedBy = null;
			let waitingFor = null;
			if (completedById) {
				completedBy = this.getGrid().getUser(main_core.Text.toInteger(completedById));
			}
			if (waitingForId) {
				waitingFor = this.getGrid().getUser(main_core.Text.toInteger(waitingForId));
			}
			return {
				startedBy,
				completedBy,
				waitingFor,
				completedCnt,
				waitingForCnt
			};
		}
		setTasksCounter(counter) {
			this.data.tasksCounter = counter;
			return this;
		}
		bindEditorEvents() {
			if (!this.isEditorEventsBinded) {
				this.isEditorEventsBinded = true;
				BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmitFailure', this.onEditorErrors.bind(this));
				BX.addCustomEvent(window, 'BX.UI.EntityEditorAjax:onSubmit', this.onEditorSubmit.bind(this));
			}
		}
		showEditor(columnId) {
			main_core.Dom.addClass(this.layout.container, 'main-kanban-item-waiting');
			this.bindEditorEvents();
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('rpa.Item.getEditor', {
					analyticsLabel: 'rpaItemMovedMandatoryFieldsPopupOpen',
					data: {
						typeId: this.getTypeId(),
						id: this.getId(),
						stageId: columnId > 0 ? columnId : null,
						eventId: this.getGrid().pullManager.registerRandomEventId()
					}
				}).then(response => {
					const popup = this.getPopup();
					if (popup) {
						main_core.Runtime.html(popup.getContentContainer(), response.data.html).then(() => {
							popup.show();
							this.editorResolve = resolve;
							this.editorReject = reject;
						});
					}
				}).catch(response => {
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
					reject(response.errors);
				});
			});
		}
		onEditorSaveClick() {
			const editor = this.getEditor();
			if (!editor) {
				this.getPopup().close();
				if (main_core.Type.isFunction(this.editorReject)) {
					this.editorReject('Editor not found');
					this.editorResolve = null;
					this.editorReject = null;
				}
			} else {
				editor.save();
			}
		}
		onEditorCancelClick() {
			main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
			this.getPopup().close();
			if (main_core.Type.isFunction(this.editorResolve)) {
				this.editorResolve({
					cancel: true
				});
				this.editorResolve = null;
				this.editorReject = null;
			}
		}
		onEditorSubmit(entityData, response) {
			if (this.getPopup().isShown()) {
				main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
				this.getPopup().close();
				this.setData(response.data.item);
				this.saveCurrentState();
				this.render();
			}
		}
		onEditorErrors(errors) {
			if (this.getPopup().isShown()) {
				main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
				this.getPopup().close();
				if (main_core.Type.isFunction(this.editorReject)) {
					this.editorReject({
						errors
					}, false);
					this.editorResolve = null;
					this.editorReject = null;
				}
			}
		}
		getPopup() {
			const popupId = 'rpa-kanban-item-popup-' + this.getId();
			let popup = main_popup.PopupWindowManager.getPopupById(popupId);
			if (!popup) {
				popup = new main_popup.PopupWindow(popupId, null, {
					zIndex: 200,
					className: "",
					autoHide: false,
					closeByEsc: false,
					closeIcon: false,
					width: 600,
					overlay: true,
					lightShadow: false,
					buttons: this.getItemPopupButtons()
				});
			}
			return popup;
		}
		getEditor() {
			return rpa_manager.Manager.getEditor(this.getTypeId(), parseInt(this.getId()));
		}
		getItemPopupButtons() {
			return [new BX.PopupWindowButton({
				text: main_core.Loc.getMessage('RPA_KANBAN_POPUP_SAVE'),
				className: "ui-btn ui-btn-md ui-btn-primary",
				events: {
					click: this.onEditorSaveClick.bind(this)
				}
			}), new BX.PopupWindowButton({
				text: main_core.Loc.getMessage('RPA_KANBAN_POPUP_CANCEL'),
				className: "ui-btn ui-btn-md",
				events: {
					click: this.onEditorCancelClick.bind(this)
				}
			})];
		}
		showTasks() {
			main_core.Dom.addClass(this.layout.container, 'main-kanban-item-waiting');
			return new Promise(resolve => {
				rpa_manager.Manager.Instance.openTasks(this.getTypeId(), this.getId()).then(result => {
					resolve(result);
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
				});
			});
		}
		getStageId() {
			return main_core.Text.toInteger(this.getData().stageId);
		}
		setStageId(stageId) {
			this.data.stageId = stageId;
			return this;
		}
		getTypeId() {
			return main_core.Text.toInteger(this.getData().typeId);
		}
		saveCurrentState() {
			const column = this.getColumn();
			const nextItem = column.getNextItemSibling(this);
			const previousItem = column.getPreviousItemSibling(this);
			this.data.stageId = this.getColumnId();
			this.currentState.nextItemId = nextItem ? nextItem.getId() : 0;
			this.currentState.previousItemId = previousItem ? previousItem.getId() : 0;
			this.currentState.stageId = this.data.stageId;
			return this;
		}
		savePosition() {
			const data = {
				id: this.getId(),
				typeId: this.getTypeId(),
				fields: {
					stageId: this.getStageId(),
					previousItemId: this.currentState.previousItemId || null
				},
				eventId: this.getGrid().pullManager.registerRandomEventId()
			};
			main_core.Dom.addClass(this.layout.container, 'main-kanban-item-waiting');
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('rpa.Item.update', {
					analyticsLabel: 'rpaItemMoved',
					data: data
				}).then(response => {
					this.data = response.data.item;
					if (!this.moveToActualColumn()) {
						this.render();
					}
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
					resolve(response);
				}).catch(response => {
					reject(response);
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
				});
			});
		}
		moveToActualColumn() {
			if (this.getStageId() !== this.getColumn().getId()) {
				const column = this.getGrid().getColumn(this.getStageId());
				if (column) {
					this.getGrid().moveItem(this, column, column.getFirstItem());
				} else {
					this.getGrid().moveItem(this, this.getStageId());
				}
				return true;
			}
			return false;
		}
		saveSort() {
			const data = {
				id: this.getId(),
				typeId: this.getTypeId(),
				previousItemId: this.currentState.previousItemId
			};
			main_core.Dom.addClass(this.layout.container, 'main-kanban-item-waiting');
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('rpa.Item.sort', {
					analyticsLabel: 'rpaItemSorted',
					data: data
				}).then(response => {
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
					resolve(response);
				}).catch(response => {
					reject(response);
					main_core.Dom.removeClass(this.layout.container, 'main-kanban-item-waiting');
				});
			});
		}
		getCurrentState() {
			return Object.assign({}, this.currentState);
		}
		restoreState(previousState) {
			this.currentState = previousState;
			this.data.stageId = this.currentState.stageId;
			return this;
		}
		onDoubleClick() {
			if (this.data.detailUrl) {
				rpa_manager.Manager.openSlider(this.data.detailUrl);
			}
		}
		getMovedBy() {
			return main_core.Text.toInteger(this.getData().movedBy);
		}
		getUpdatedBy() {
			return main_core.Text.toInteger(this.getData().updatedBy);
		}
		getCreatedBy() {
			return main_core.Text.toInteger(this.getData().createdBy);
		}
		getName() {
			return this.data.name;
		}
		renderTitle(title) {
			if (main_core.Type.isArray(title)) {
				title = title[0];
			}
			title = main_core.Text.encode(title);
			let href = 'javascript:void(0);';
			if (this.data.detailUrl) {
				href = this.data.detailUrl;
			}
			if (!this.layout.title) {
				this.layout.title = main_core.Tag.render`<a class="rpa-kanban-item-title" href="${href}">${title}</a>`;
			} else {
				this.layout.title.innerText = title;
			}
			return this.layout.title;
		}
		renderFieldsList() {
			if (!this.layout.fieldList) {
				this.layout.fieldList = main_core.Tag.render`<div class="rpa-kanban-item-field-list"></div>`;
			}
			this.layout.fieldList.innerHTML = '';
			const fields = this.getGrid().getFields();
			Object.keys(fields).forEach(fieldName => {
				if (fields[fieldName]['isVisibleOnKanban'] && !this.isEmptyValue(this.getData()[fieldName])) {
					if (fields[fieldName]['isTitle']) {
						this.renderTitle(this.getData()[fieldName]);
					} else if (fieldName === 'createdBy' || fieldName === 'updatedBy' || fieldName === 'movedBy') {
						const renderedUser = this.renderUser(fieldName);
						if (renderedUser) {
							this.layout.fieldList.appendChild(main_core.Tag.render`
							<div class="rpa-kanban-item-field-item">
								<span class="rpa-kanban-item-field-item-name">${main_core.Text.encode(fields[fieldName].title)}</span>
								${renderedUser}
							</div>`);
						}
					} else {
						this.layout.fieldList.appendChild(main_core.Tag.render`
						<div class="rpa-kanban-item-field-item">
							<span class="rpa-kanban-item-field-item-name">${main_core.Text.encode(fields[fieldName].title)}</span>
							<span class="rpa-kanban-item-field-item-value">${this.getDisplayableValue(fieldName)}</span>
						</div>`);

						// field with link
						/*this.layout.fieldList.appendChild(Tag.render`
							<div class="rpa-kanban-item-field-item">
								<span class="rpa-kanban-item-field-item-name">Link</span>
								<a class="rpa-kanban-item-field-item-value-link" href="#">Bitrix Inc.</a>
							</div>`
						);*/
					}
				}
			});
			return this.layout.fieldList;
		}
		renderShadow() {
			return main_core.Tag.render`
			<div class="rpa-kanban-item-shadow"></div>
		`;
		}
		renderDescription() {
			this.layout.description = main_core.Tag.render`
			<div class="rpa-kanban-item-description"></div>
		`;
		}
		renderUserPhoto({
			link,
			photo
		}) {
			if (main_core.Type.isString(link) && main_core.Type.isString(photo)) {
				return main_core.Tag.render`<a class="rpa-kanban-item-user-photo" href="${main_core.Text.encode(link)}" style="background-image: url(${main_core.Text.encode(photo)})"></a>`;
			}
			return null;
		}
		renderUser(fieldName) {
			const userId = main_core.Text.toInteger(this.getData()[fieldName]);
			const userInfo = this.getGrid().getUser(userId);
			if (userInfo) {
				const photo = this.renderUserPhoto(userInfo);
				return main_core.Tag.render`<div class="rpa-kanban-item-user">
				${photo ? photo : ''}
				<a class="rpa-kanban-item-user-name rpa-kanban-item-field-item-value" href="${main_core.Text.encode(userInfo.link)}">${main_core.Text.encode(userInfo.fullName)}</a>
			</div>`;
			}
			return null;
		}
		renderContact() {
			return main_core.Tag.render`
				<div class="rpa-kanban-item-contact">
					<span class="rpa-kanban-item-contact-im"></span>
				</div>
		`;
		}
		renderTasksParticipants() {
			const {
				startedBy,
				completedBy,
				waitingFor,
				completedCnt,
				waitingForCnt
			} = this.getTasksParticipants();
			const elements = [];
			if (startedBy) {
				elements.push(this.renderTaskParticipant(startedBy));
			}
			if (completedBy) {
				elements.push(this.renderTaskParticipant(completedBy, completedCnt > 1));
			}
			if (waitingFor) {
				elements.push(this.renderTaskParticipant(waitingFor, waitingForCnt > 1));
			}
			return main_core.Tag.render`
				<div class="rpa-kanban-column-task-responsible-list">
					${elements}
				</div>
		`;
		}
		renderTaskParticipant({
			link,
			photo,
			fullName
		}, isMore) {
			return main_core.Tag.render`
			<a class="rpa-kanban-column-task-responsible-item ${isMore ? 'rpa-kanban-column-task-responsible-item-more' : ''}" 
			 href="${main_core.Text.encode(link)}" title="${main_core.Text.encode(fullName)}">
				<span class="rpa-kanban-column-task-responsible-img" ${photo ? 'style="background-image: url(\'' + main_core.Text.encode(encodeURI(photo)) + '\')"' : ''}>	
				</span>
			</a>
		`;
		}
		renderTasksCounter() {
			return main_core.Tag.render`
				<div class="rpa-kanban-item-counter" onclick="${this.showTasks.bind(this)}" ${this.getTasksCounter() <= 0 ? 'style="display: none;"' : ''}>
					<div class="rpa-kanban-item-counter-text">${main_core.Loc.getMessage('RPA_KANBAN_TASKS')}</div>
					<div class="rpa-kanban-item-counter-value">${this.getTasksCounter()}</div>
				</div>
		`;
		}
		hasEmptyMandatoryFields(column) {
			let result = false;
			if (!column) {
				column = this.getStageId();
			}
			column = this.getGrid().getColumn(column);
			if (!column) {
				throw new Error("Column not found");
			}
			const fields = column.getFields();
			Object.keys(fields).forEach(fieldName => {
				if (fields[fieldName].mandatory && this.isEmptyValue(this.getData()[fieldName])) {
					result = true;
				}
			});
			return result;
		}
		isEmptyValue(value) {
			return main_core.Type.isNil(value) || value === false || (main_core.Type.isString(value) || main_core.Type.isArray(value)) && value.length <= 0 || main_core.Type.isNumber(value) && value === 0;
		}
		update(data) {
			if (main_core.Type.isPlainObject(data) && data.item && main_core.Type.isPlainObject(data.item) && parseInt(data.item.id) === this.getId()) {
				this.data = data.item;
				this.processPermissions();
				this.render();
			}
			return this;
		}
		processPermissions() {
			this.setPermissionProperties();
			this.processDraggingOptions();
			return this;
		}
		setPermissionProperties() {
			const data = this.getData();
			let permissions = {};
			if (data.permissions && main_core.Type.isPlainObject(data.permissions)) {
				permissions = data.permissions;
			}
			Object.keys(permissions).forEach(name => {
				this[name] = permissions[name];
			});
			return this;
		}
		processDraggingOptions() {
			if (this.isDraggable()) {
				this.makeDraggable();
			} else {
				this.disableDragging();
			}
			this.render();
			return this;
		}
		getDisplayableValue(fieldName) {
			let result = null;
			if (this.data.display && this.data.display[fieldName]) {
				result = this.data.display[fieldName];
			} else if (this.data[fieldName]) {
				result = this.data[fieldName];
			}
			if (main_core.Type.isArray(result)) {
				result = result.join(', ');
			}
			return result;
		}
		isDeletable() {
			return this.canDelete !== false;
		}
	}

	class Grid extends main_kanban.Kanban.Grid {
		getTypeId() {
			return main_core.Text.toInteger(this.getData().typeId);
		}
		getUserId() {
			return main_core.Text.toInteger(this.getData().userId);
		}
		isCreateItemRestricted() {
			return this.getData().isCreateItemRestricted === true;
		}
		bindEvents() {
			BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemCaptured", this.onBeforeItemCaptured.bind(this));
			BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemRestored", this.onBeforeItemRestored.bind(this));
			BX.addCustomEvent("Kanban.Column:render", column => {
				if (column.getGrid() === this && column instanceof Column) {
					column.onAfterRender.apply(column);
				}
			});
			BX.addCustomEvent("BX.Main.Filter:apply", this.onApplyFilter.bind(this));
			BX.addCustomEvent(this, "Kanban.Grid:onColumnLoadAsync", promises => {
				promises.push(column => {
					return this.getColumnItems(column);
				});
			});
			BX.addCustomEvent(this, "Kanban.Grid:onBeforeItemMoved", this.saveItemState);
			BX.addCustomEvent(this, "Kanban.Grid:onItemMoved", this.onItemMoved);
			BX.addCustomEvent(this, "Kanban.Grid:onColumnUpdated", this.onColumnUpdated);
			BX.addCustomEvent(this, "Kanban.Grid:onColumnMoved", this.onColumnMoved);
			BX.addCustomEvent(this, "Kanban.Grid:onColumnAddedAsync", promises => {
				promises.push(column => {
					return this.addStage(column);
				});
			});
			BX.addCustomEvent(this, "Kanban.Grid:onColumnRemovedAsync", promises => {
				promises.push(column => {
					return this.removeStage(column);
				});
			});
			BX.addCustomEvent(window, 'BX.UI.EntityEditorSection:onOpenChildMenu', this.onOpenSelectFieldMenu.bind(this));
			BX.addCustomEvent('SidePanel.Slider:onMessage', message => {
				if (message.getEventId() === 'userfield-list-update') {
					this.onApplyFilter();
				}
			});
			this.pullManager = new PullManager(this);
		}
		onBeforeItemCaptured(dropZoneEvent) {
			main_core.Event.EventEmitter.emit('BX.Rpa.Kanban.Grid:onBeforeItemCapturedStart', [this, dropZoneEvent]);
			const item = dropZoneEvent.getItem();
			if (!(item instanceof Item)) {
				return;
			}
			if (!dropZoneEvent.isActionAllowed()) {
				return;
			}
			const dropZone = dropZoneEvent.getDropZone();
			if (dropZone.getId() === 'delete') {
				if (!item.isDeletable()) {
					dropZoneEvent.denyAction();
					return;
				}
				if (this.deleteCommand && !this.deleteCommand.isCompleted()) {
					this.deleteCommand.run();
				}
				this.deleteCommand = new Command(item, commandItem => {
					this.deleteItem(commandItem);
				}, commandItem => {
					this.unhideItem(commandItem);
				});
				this.deleteCommand.start(dropZone.getDropZoneArea().getDropZoneTimeout());
			} else if (dropZone.getData().isColumn === true) {
				dropZoneEvent.denyAction();
				const targetColumn = this.getColumn(dropZone.getId());
				if (!targetColumn) {
					item.saveCurrentState();
					this.hideItem(item);
				} else {
					this.moveItem(item, targetColumn);
				}
				this.moveItemToStage(item, dropZone.getId(), item.getColumn());
			}
		}
		onBeforeItemRestored(dropZoneEvent) {
			const item = dropZoneEvent.getItem();
			if (!(item instanceof Item)) {
				return;
			}
			const dropZone = dropZoneEvent.getDropZone();
			if (dropZone.getId() === 'delete') {
				if (this.deleteCommand) {
					this.deleteCommand.cancel();
					this.deleteCommand = null;
				}
			}
		}
		saveItemState(dropEvent) {
			dropEvent.getItem().saveCurrentState();
		}
		getFirstColumn() {
			const columns = this.getColumns();
			if (columns.length > 0) {
				return columns[0];
			}
			return null;
		}
		onItemMoved(item, targetColumn, beforeItem, skipHandler) {
			const itemPreviousState = item.getCurrentState();
			// moving in the same column
			if (parseInt(item.getStageId()) === parseInt(targetColumn.getId())) {
				if (!beforeItem && item.getCurrentState().nextItemId === 0 || beforeItem && parseInt(beforeItem.getId()) === parseInt(item.getCurrentState().nextItemId)) {
					// skip moving on the same place
					this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
					return;
				}
				// save sorting
				item.saveCurrentState().saveSort().catch(response => {
					this.onItemMoveError(item, response, itemPreviousState);
				});
				return;
			}
			// check permissions and next stage
			const previousColumn = this.getColumn(item.getStageId());
			//const isPossibleNextStagesIncludesTargetColumn = previousColumn.getPossibleNextStages().includes(targetColumn.getId());
			//sorry but for now we do not check possible next stages
			const isPossibleNextStagesIncludesTargetColumn = true;
			/*if(!isPossibleNextStagesIncludesTargetColumn && previousColumn.canMoveTo() && item.getMovedBy() === this.getUserId() && targetColumn.getPossibleNextStages().includes(previousColumn.getId()))
			{
				// item is moving back - no editor just moving
				item.saveCurrentState().savePosition().catch((response) =>
				{
					this.onItemMoveError(item, response, itemPreviousState);
				});
			}
			else */
			if (previousColumn.isCanMoveFrom() && isPossibleNextStagesIncludesTargetColumn) {
				this.moveItemToStage(item, targetColumn.getId(), previousColumn);
			} else if (!previousColumn.isCanMoveFrom() && isPossibleNextStagesIncludesTargetColumn) {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('RPA_KANBAN_MOVE_PERMISSION_NOTIFY').replace('#STAGE#', main_core.Text.encode(previousColumn.getName()))
				});
				this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
			} else if (previousColumn.isCanMoveFrom() && !isPossibleNextStagesIncludesTargetColumn) ; else {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('RPA_KANBAN_MOVE_ITEM_PERMISSION_NOTIFY').replace('#ITEM#', main_core.Text.encode(item.getName())).replace('#STAGE#', main_core.Text.encode(previousColumn.getName()))
				});
				this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
			}
		}
		moveItemToStage(item, targetColumnId, previousColumn) {
			const itemPreviousState = item.getCurrentState();
			if (item.hasEmptyMandatoryFields(previousColumn)) {
				if (!previousColumn.canAddItems()) {
					this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
					main_kanban.Kanban.Utils.showErrorDialog(main_core.Loc.getMessage('RPA_KANBAN_MOVE_EMPTY_MANDATORY_FIELDS_ERROR'), false);
					return;
				}
				item.showEditor(targetColumnId).then(response => {
					this.onEditorSave(item, response);
				}).catch(response => {
					this.onItemMoveError(item, response, itemPreviousState);
				});
			} else {
				const targetColumn = this.getColumn(targetColumnId);
				if (targetColumn) {
					item.saveCurrentState();
				} else {
					item.setStageId(targetColumnId);
				}
				item.savePosition().catch(response => {
					let isShowEditor = false;
					let isShowTasks = false;
					let isTasksError = false;
					response.errors.forEach(error => {
						if (error.code && error.code === 'RPA_MANDATORY_FIELD_EMPTY') {
							// show editor in case we missed some empty mandatory field
							isShowEditor = true;
						} else if (error.code && error.code === 'RPA_ITEM_USER_HAS_TASKS') {
							isShowTasks = true;
						} else if (error.code && error.code === 'RPA_ITEM_TASKS_NOT_COMPLETED') {
							isTasksError = true;
						}
					});
					if (isShowEditor) {
						if (!previousColumn.canAddItems()) {
							BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('RPA_KANBAN_MOVE_ITEM_PERMISSION_NOTIFY').replace('#ITEM#', main_core.Text.encode(item.getName())).replace('#STAGE#', main_core.Text.encode(previousColumn.getName()))
							});
							this.onItemMoveError(item, null, itemPreviousState);
							return;
						}
						item.showEditor(targetColumnId).then(response => {
							if (response.cancel === true) {
								this.onItemMoveError(item, null, itemPreviousState);
							}
						}).catch(response => {
							this.onItemMoveError(item, response, itemPreviousState);
						});
					} else if (isShowTasks) {
						item.showTasks().then(response => {
							// move back
							if (response.isCompleted !== true) {
								this.onItemMoveError(item, null, itemPreviousState);
							} else {
								item.update(response);
								if (!item.moveToActualColumn()) {
									item.render();
								}
							}
						}).catch(response => {
							this.onItemMoveError(item, response, itemPreviousState);
						});
					} else if (isTasksError) {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('RPA_KANBAN_MOVE_ITEM_HAS_TASKS_ERROR')
						});
						this.onItemMoveError(item, null, itemPreviousState);
					} else {
						this.onItemMoveError(item, response, itemPreviousState);
					}
				});
			}
		}
		onItemMoveError(item, response = null, previousState = null) {
			if (previousState) {
				item.restoreState(previousState);
				if (!item.isVisible()) {
					this.unhideItem(item);
				}
				this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
			}
			if (response) {
				this.showErrorFromResponse(response);
			}
		}
		onEditorSave(item, response) {
			if (response.cancel === true) {
				this.moveItem(item, item.getStageId(), item.getCurrentState().nextItemId);
			}
		}
		showErrorFromResponse(response, fatal = false) {
			let errors = null;
			if (main_core.Type.isPlainObject(response) && response.errors && main_core.Type.isArray(response.errors)) {
				errors = response.errors;
			} else if (main_core.Type.isArray(response)) {
				errors = response;
			}
			let message = '';
			if (main_core.Type.isArray(errors)) {
				errors.forEach(error => {
					message += main_core.Text.encode(error.message) + "\n";
				});
			} else {
				message = 'Unknown error';
			}
			main_kanban.Kanban.Utils.showErrorDialog(message, fatal);
		}
		onColumnUpdated(column) {
			this.startProgress();
			main_core.ajax.runAction('rpa.Stage.update', {
				analyticsLabel: 'rpaKanbanStageUpdate',
				data: {
					id: column.getId(),
					fields: {
						name: column.getName(),
						color: column.getColor()
					},
					eventId: this.pullManager.registerRandomEventId()
				},
				getParameters: {
					context: 'kanban'
				}
			}).then(response => {
				this.stopProgress();
				column.update(response.data);
			}).catch(response => {
				this.stopProgress();
				this.showErrorFromResponse(response, true);
			});
		}
		addStage(column) {
			this.startProgress();
			const previousColumn = this.getPreviousColumnSibling(column);
			const previousColumnId = previousColumn ? previousColumn.getId() : 0;
			const promise = new BX.Promise();
			main_core.ajax.runAction('rpa.Stage.add', {
				analyticsLabel: 'rpaKanbanStageAdd',
				data: {
					fields: {
						name: column.getName(),
						color: column.getColor(),
						previousStageId: previousColumnId,
						typeId: this.getTypeId()
					},
					eventId: this.pullManager.registerRandomEventId()
				},
				getParameters: {
					context: 'kanban'
				}
			}).then(response => {
				promise.fulfill(this.transformColumnActionResponseToColumnOptions(response));
				this.stopProgress();
			}).catch(response => {
				const error = response.errors.pop().message;
				promise.reject(error);
				this.stopProgress();
			});
			return promise;
		}
		removeStage(column) {
			const promise = new BX.Promise();
			this.startProgress();
			main_core.ajax.runAction('rpa.Stage.delete', {
				analyticsLabel: 'rpaKanbanStageDelete',
				data: {
					id: column.getId()
				},
				getParameters: {
					context: 'kanban'
				}
			}).then(() => {
				this.stopProgress();
				promise.fulfill();
			}).catch(response => {
				this.stopProgress();
				const error = response.errors.pop().message;
				column.enableDragging();
				column.getContainer().classList.remove("main-kanban-column-edit-mode");
				promise.reject(error);
			});
			return promise;
		}
		onColumnMoved(column) {
			const previousColumn = this.getPreviousColumnSibling(column);
			const previousColumnId = previousColumn ? previousColumn.getId() : 0;
			main_core.ajax.runAction('rpa.Stage.update', {
				analyticsLabel: 'rpaKanbanStageMove',
				data: {
					id: column.getId(),
					fields: {
						previousStageId: previousColumnId
					},
					eventId: this.pullManager.registerRandomEventId()
				},
				getParameters: {
					context: 'kanban'
				}
			}).then(response => {
				const wasFirst = column.isFirstColumn();
				let isFirst = true;
				column.update(response.data);
				if (column.isFirstColumn() && wasFirst) {
					return;
				}
				if (column.isFirstColumn() || wasFirst) {
					this.getColumns().forEach(renderedColumn => {
						if (renderedColumn !== column) {
							renderedColumn.setIsFirstColumn(wasFirst && isFirst);
							isFirst = false;
						}
						renderedColumn.rerenderSubtitle();
					});
				}
				this.getFirstColumn().rerenderSubtitle();
			}).catch(response => {
				this.showErrorFromResponse(response, true);
			});
		}
		transformColumnActionResponseToColumnOptions(response) {
			return {
				id: response.data.stage.id,
				name: response.data.stage.name,
				color: response.data.stage.color,
				total: response.data.stage.total,
				data: response.data.stage
			};
		}
		getColumnItems(column) {
			const page = column.getPagination().page + 1;
			const size = this.getData().pageSize;
			const promise = new BX.Promise();
			main_core.ajax.runComponentAction('bitrix:rpa.kanban', 'getColumn', {
				mode: 'class',
				analyticsLabel: 'rpaKanbanPagination',
				signedParameters: this.getData().signedParameters,
				data: {
					stageId: column.getId()
				},
				navigation: {
					page,
					size
				}
			}).then(response => {
				let items = [];
				response.data.items.forEach(itemData => {
					items.push({
						id: itemData.id,
						columnId: itemData.stageId,
						name: itemData.name,
						data: itemData
					});
				});
				promise.fulfill(items);
			}).catch(response => {
				const error = response.errors.pop().message;
				promise.reject(error);
			});
			return promise;
		}
		insertItem(item) {
			if (!(item instanceof Item)) {
				return;
			}
			let beforeItem = null;
			const newColumn = this.getColumn(item.getStageId());
			if (newColumn) {
				beforeItem = newColumn.getFirstItem();
				this.moveItem(item, item.getStageId(), beforeItem);
				item.processPermissions();
			} else {
				this.removeItem(item);
			}
		}
		onApplyFilter(filterId, values, filterInstance, promise, params) {
			if (main_core.Type.isPlainObject(params)) {
				params.autoResolve = false;
			}
			this.startProgress();
			main_core.ajax.runComponentAction('bitrix:rpa.kanban', 'get', {
				analyticsLabel: 'rpaKanbanApplyFilter',
				signedParameters: this.getData().signedParameters,
				mode: 'class'
			}).then(response => {
				this.stopProgress();
				this.getColumns().forEach(column => {
					const pagination = column.getPagination();
					if (pagination) {
						pagination.page = 1;
					}
				});
				this.getColumns().forEach(column => {
					this.removeColumn(column);
				});
				this.removeItems();
				this.loadData(response.data.kanban);
				if (!main_core.Type.isNil(promise)) {
					promise.fulfill();
				}
			}).catch(response => {
				this.stopProgress();
				this.showErrorFromResponse(response);
				if (!main_core.Type.isNil(promise)) {
					promise.reject();
				}
			});
		}
		loadData(json) {
			if (main_core.Type.isPlainObject(json.data)) {
				this.addUsers(json.data.users);
				this.data.fields = json.data.fields;
			}
			super.loadData(json);
		}
		addUsers(users) {
			if (main_core.Type.isPlainObject(users)) {
				if (!this.users) {
					this.users = new Map();
				}
				Object.keys(users).forEach(userId => {
					userId = main_core.Text.toInteger(userId);
					if (userId > 0) {
						this.users.set(userId, users[userId]);
					}
				});
			}
		}
		getUser(userId) {
			if (!this.users) {
				this.users = new Map();
			}
			return this.users.get(userId);
		}
		getFields() {
			let fields = this.getData().fields;
			if (!fields || !main_core.Type.isPlainObject(fields)) {
				fields = {};
			}
			return fields;
		}
		onOpenSelectFieldMenu(editor, params) {
			params.cancel = true;
			const popupId = 'rpa-kanban-column-select-fields-menu-' + this.getTypeId();
			let popup = main_popup.PopupWindowManager.getPopupById(popupId);
			if (!popup) {
				popup = new main_popup.PopupMenuWindow({
					id: 'rpa-kanban-column-select-fields-menu-' + this.getTypeId(),
					bindElement: params.button,
					items: [{
						text: main_core.Loc.getMessage('RPA_KANBAN_FIELDS_VIEW_SETTINGS'),
						onclick: this.onSelectFieldsViewSettingsClick.bind(this)
					}, {
						text: main_core.Loc.getMessage('RPA_KANBAN_FIELDS_MODIFY_SETTINGS'),
						onclick: this.onSelectFieldsModifySettingsClick.bind(this)
					}],
					autoHide: true,
					closeByEsc: true,
					cacheable: false
				});
			} else {
				popup.setBindElement(params.button);
			}
			popup.show();
		}
		onSelectFieldsViewSettingsClick() {
			if (!this.canAddColumns()) {
				return;
			}
			const fields = this.getFields();
			const data = [];
			Object.keys(fields).forEach(fieldName => {
				data.push({
					title: fields[fieldName].title,
					name: fieldName,
					checked: fields[fieldName].isVisibleOnKanban
				});
			});
			const fieldsPopup = new rpa_fieldspopup.FieldsPopup('rpa-kanban-view-' + this.getTypeId(), data, main_core.Loc.getMessage('RPA_KANBAN_FIELDS_VIEW_SETTINGS'));
			fieldsPopup.show().then(result => {
				if (result !== false) {
					if (this.isProgress()) {
						return;
					}
					this.startProgress();
					main_core.ajax.runAction('rpa.Fields.setVisibilitySettings', {
						analyticsLabel: 'rpaKanbanSaveVisibleFields',
						data: {
							typeId: this.getTypeId(),
							fields: Array.from(result),
							visibility: 'kanban'
						}
					}).then(response => {
						this.stopProgress();
						Object.keys(this.getFields()).forEach(fieldName => {
							this.data.fields[fieldName]['isVisibleOnKanban'] = result.has(fieldName);
						});
						this.getColumns().forEach(column => {
							column.getItems().forEach(item => {
								item.render();
							});
						});
					}).catch(response => {
						this.stopProgress();
						this.showErrorFromResponse(response);
					});
				}
			});
		}
		onSelectFieldsModifySettingsClick() {
			if (!this.canAddColumns()) {
				return;
			}
			const firstColumn = this.getFirstColumn();
			if (!firstColumn) {
				return;
			}
			const editor = firstColumn.getEditor();
			if (!editor) {
				return;
			}
			const fields = this.getFields();
			const data = [];
			Object.keys(fields).forEach(fieldName => {
				if (fields[fieldName].canBeEdited) {
					data.push({
						title: fields[fieldName].title,
						name: fieldName,
						checked: !!editor.getControlById(fieldName)
					});
				}
			});
			const fieldsPopup = new rpa_fieldspopup.FieldsPopup('rpa-kanban-edit-' + this.getTypeId(), data, main_core.Loc.getMessage('RPA_KANBAN_FIELDS_MODIFY_SETTINGS'));
			fieldsPopup.show().then(result => {
				if (!result) {
					return;
				}
				if (this.isProgress()) {
					return;
				}
				this.startProgress();
				main_core.ajax.runAction('rpa.Fields.setVisibilitySettings', {
					data: {
						typeId: this.getTypeId(),
						fields: Array.from(result),
						visibility: 'create'
					},
					analyticsLabel: 'rpaKanbanSaveCreateFields'
				}).then(response => {
					this.stopProgress();
					this.syncEditorFields(editor, result);
				}).catch(response => {
					this.stopProgress();
					this.showErrorFromResponse(response);
				});
			});
		}
		syncEditorFields(editor, availableFields) {
			const fields = this.getFields();
			const editorMainSection = this.getEditorMainSection(editor);
			if (!editorMainSection) {
				return;
			}
			Object.keys(fields).forEach(fieldName => {
				let control = editor.getControlById(fieldName);
				if (control && !availableFields.has(fieldName)) {
					editorMainSection.removeChild(control, {
						enableSaving: false
					});
				} else if (!control && availableFields.has(fieldName)) {
					let element = editor.getAvailableSchemeElementByName(fieldName);
					if (element) {
						let field = editor.createControl(element.getType(), element.getName(), {
							schemeElement: element,
							model: editor._model,
							mode: editor._mode
						});
						if (field) {
							editorMainSection.addChild(field, {
								layout: {
									forceDisplay: true
								},
								enableSaving: false
							});
						}
					}
				}
			});
		}
		getEditorMainSection(editor) {
			let editorMainSection = editor.getControlById('main');
			if (editorMainSection instanceof BX.UI.EntityEditorColumn) {
				editorMainSection = editorMainSection.getChildById('main');
			}
			return editorMainSection;
		}
		isProgress() {
			return this.progress === true;
		}
		startProgress() {
			this.progress = true;
			this.showLoader().fadeOut();
			return this;
		}
		stopProgress() {
			this.progress = false;
			this.hideLoader().fadeIn();
			return this;
		}
		showLoader() {
			this.getLoader().style.display = 'block';
			return this;
		}
		hideLoader() {
			this.getLoader().style.display = 'none';
			return this;
		}
		deleteItem(item) {
			if (this.isProgress()) {
				return;
			}
			this.startProgress();
			main_core.ajax.runAction('rpa.Item.delete', {
				analyticsLabel: 'rpaKanbanItemDelete',
				data: {
					typeId: this.getTypeId(),
					id: item.getId()
				}
			}).then(() => {
				if (this.getItem(item)) {
					item.getColumn().removeItem(item);
				}
				this.stopProgress();
			}).catch(response => {
				this.stopProgress();
				this.showErrorFromResponse(response);
			});
		}
	}
	class Command {
		constructor(item, action, restore) {
			this.item = item;
			this.action = action;
			this.restore = restore;
			this.timeoutId = null;
		}
		start(timeout) {
			this.timeoutId = setTimeout(this.run.bind(this), timeout);
		}
		run() {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
			if (main_core.Type.isFunction(this.action)) {
				this.action(this.item);
			}
		}
		cancel() {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
			if (main_core.Type.isFunction(this.restore)) {
				this.restore(this.item);
			}
		}
		isCompleted() {
			return !(this.timeoutId > 0);
		}
	}

	const Kanban = {
		Grid,
		Item,
		Column
	};

	exports.Kanban = Kanban;

})(this.BX.Rpa = this.BX.Rpa || {}, window, BX, BX, BX.UI, BX.UI.Notification, BX, BX.Rpa, BX.Rpa, BX.Main, BX.UI.Dialogs, BX.Rpa);
//# sourceMappingURL=kanban.bundle.js.map
