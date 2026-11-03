/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_sidepanel_layout, main_core_events, ui_notification) {
	'use strict';

	class TagActions {
		static balloonLifeTime = 3000;
		constructor(pathToTask, pathToUser, tagId = null, tasksCount = null, groupId = null) {
			this.tagId = tagId;
			this.tasksCount = tasksCount;
			this.groupId = parseInt(groupId, 10) ?? 0;
			this.tagStorage = [];
			this.timeoutId = 0;
			this.gridId = 'tasks_by_tag_list';
			this.pathToTask = pathToTask;
			this.pathToUser = pathToUser;
			this.sidePanel = null;
			this.listData = null;
			this.pullTaskCommands = ['task_update', 'task_add', 'task_remove'];
			this.pullTagCommands = ['tag_added', 'tag_changed'];
			this.sidePanelManager = BX.SidePanel.Instance;
			this.balloon = null;
			this.timeoutDelete = null;
			this.bindEvents();
		}
		bindEvents() {
			this.pullTagCommands.forEach(command => {
				BX.PULL.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId: 'tasks',
					command: command,
					callback: this.onPullTag.bind(this)
				});
			});
			this.pullTaskCommands.forEach(command => {
				BX.PULL.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId: 'tasks',
					command: command,
					callback: this.onPullTask.bind(this)
				});
			});
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeTagsGridRequest.bind(this));
		}
		onPullTag(params, extra, command) {
			if (!this.getTagsGrid()) {
				return;
			}
			const userId = parseInt(main_core.Loc.getMessage('USER_ID'), 10);
			if (this.groupId === 0 && command === 'tag_added') {
				this.getTagsGrid().reload();
			}
			if (this.groupId !== 0 && params.groupId === this.groupId) {
				if (userId !== params.userId) {
					this.getTagsGrid().reload();
				}
			}
		}
		onPullTask(params, extra, command) {
			if (!this.getTagsGrid()) {
				return;
			}
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(() => {
				this.getTagsGrid().reload();
			}, 500);
		}
		getTagsGrid() {
			return BX.Main.gridManager.getInstanceById('tags_list');
		}
		deleteTag(tagId) {
			if (!this.getTagsGrid()) {
				return;
			}
			clearTimeout(this.timeoutDelete);
			if (this.balloon) {
				this.balloon.close();
			}
			this.tagStorage.push(tagId);
			let groupDelete = false;
			if (this.tagStorage.length > 1) {
				groupDelete = true;
			}
			let cancelRequest = false;
			this.getTagsGrid().getRows().getById(tagId).hide();
			this.getTagsGrid().showEmptyStub();
			this.balloon = ui_notification.UI.Notification.Center.notify({
				content: this.tagStorage.length > 1 ? main_core.Loc.getMessage('ALL_TAGS_SUCCESSFULLY_DELETED') : main_core.Loc.getMessage('TAG_IS_SUCCESSFULLY_DELETED'),
				autoHideDelay: TagActions.balloonLifeTime,
				events: {
					onMouseEnter: () => {
						cancelRequest = true;
						clearTimeout(this.timeoutDelete);
					},
					onMouseLeave: () => {
						cancelRequest = false;
						this.timeoutDelete = setTimeout(sendRequest, TagActions.balloonLifeTime);
					}
				},
				actions: [{
					title: main_core.Loc.getMessage('TAG_CANCEL'),
					events: {
						click: (event, balloon, action) => {
							cancelRequest = true;
							this.tagStorage.forEach(id => {
								this.getTagsGrid().getRows().getById(id).show();
							});
							balloon.close();
						}
					}
				}]
			});
			let sendRequest = () => {
				if (cancelRequest) {
					return;
				}
				if (groupDelete) {
					groupDelete = false;
					main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'deleteTagGroup', {
						mode: 'class',
						data: {
							tags: this.tagStorage,
							groupId: this.groupId
						}
					}).then(response => {
						if (response.status === 'success') {
							this.balloon.close();
							this.tagStorage = [];
							this.getTagsGrid().reload();
						}
					});
				} else {
					main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'deleteTag', {
						mode: 'class',
						data: {
							tagId: tagId,
							groupId: this.groupId
						}
					}).then(response => {
						if (response.status === 'success') {
							this.balloon.close();
							this.tagStorage = [];
							this.getTagsGrid().removeRow(tagId);
						}
					});
				}
			};
			this.timeoutDelete = setTimeout(sendRequest, TagActions.balloonLifeTime);
		}
		updateTag(tagId) {
			if (!this.getTagsGrid()) {
				return;
			}
			if (this.balloon) {
				this.balloon.close();
			}
			let editingRowsCount = this.getTagsGrid().container.querySelectorAll('div.main-grid-editor-container').length;
			if (editingRowsCount === 1) {
				let id = this.getTagsGrid().container.querySelector('.main-grid-row.main-grid-row-body.main-grid-row-edit').dataset.id;
				this.getTagsGrid().getRows().getById(id).editCancel();
			}
			this.getTagsGrid().getRows().getById(tagId).edit();
			let newName = '';
			let cell = '';
			let result = '';
			this.getTagsGrid().container.querySelector('div.main-grid-editor-container input').addEventListener('keydown', event => {
				if (event.key === 'Enter') {
					if (this.balloon) {
						this.balloon.close();
					}
					cell = this.getTagsGrid().getRows().getById(tagId).getCellById('NAME');
					newName = this.getTagsGrid().getRows().getById(tagId).getEditorContainer(cell).firstChild.value.trim();
					if (newName === '') {
						this.balloon = ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('TAG_EMPTY_NEW_NAME'),
							autoHideDelay: TagActions.balloonLifeTime
						});
						return;
					}
					main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'updateTag', {
						mode: 'class',
						data: {
							tagId: tagId,
							newName: newName,
							groupId: this.groupId
						}
					}).then(response => {
						result = response.data;
						return result;
					}).then(result => {
						if (!result.success) {
							if (!result.error) {
								this.getTagsGrid().getRows().getById(tagId).editCancel();
								return;
							}
							this.balloon = ui_notification.UI.Notification.Center.notify({
								content: result.error,
								autoHideDelay: TagActions.balloonLifeTime
							});
							return;
						}
						this.getTagsGrid().updateRow(tagId);
						this.balloon = ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('TAG_IS_SUCCESSFULLY_UPDATED'),
							autoHideDelay: TagActions.balloonLifeTime
						});
					});
				}
			});
		}
		groupDelete() {
			if (!this.getTagsGrid()) {
				return;
			}
			if (this.balloon) {
				this.balloon.close();
			}
			let cancelRequest = false;
			let tags = [];
			let selected = this.getTagsGrid().getRows().getSelected();
			selected.forEach(row => {
				tags.push(row.getId());
				this.getTagsGrid().getRows().getById(row.getId()).hide();
			});
			document.querySelector('div.main-grid-action-panel').className = 'main-grid-action-panel main-grid-disable';
			this.balloon = ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('ALL_TAGS_SUCCESSFULLY_DELETED'),
				autoHideDelay: TagActions.balloonLifeTime,
				events: {
					onMouseEnter: () => {
						cancelRequest = true;
						clearTimeout(this.timeoutDelete);
					},
					onMouseLeave: () => {
						cancelRequest = false;
						this.timeoutDelete = setTimeout(sendRequest, TagActions.balloonLifeTime);
					}
				},
				actions: [{
					title: main_core.Loc.getMessage('TAG_CANCEL'),
					events: {
						click: (event, balloon, action) => {
							cancelRequest = true;
							tags.forEach(id => {
								let row = this.getTagsGrid().getRows().getById(id);
								row && row.show();
							});
							balloon.close();
						}
					}
				}]
			});
			let sendRequest = () => {
				if (cancelRequest) {
					return;
				}
				main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'deleteTagGroup', {
					mode: 'class',
					data: {
						tags: tags,
						groupId: this.groupId
					}
				}).then(response => {
					if (response.status === 'success') {
						this.balloon.close();
						tags.forEach(tagId => {
							this.getTagsGrid().removeRow(tagId);
						});
					}
				});
			};
			this.timeoutDelete = setTimeout(sendRequest, TagActions.balloonLifeTime);
		}
		showTasksList() {
			this.sidePanelManager.open('tasks-tag-tasks-list-side-panel', {
				width: 700,
				cacheable: false,
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['tasks.tag'],
						title: main_core.Loc.getMessage('TASKS_BY_TAG_LIST'),
						content: this.createTasksListContent.bind(this),
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
		onLoadTasksList(event) {
			const slider = event.getSlider();
			const listContainer = slider.getContainer().querySelector('.tasks-tags-tag-tasks-list');
			this.pullTaskCommands.forEach(command => {
				BX.PULL.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId: 'tasks',
					command: command,
					callback: () => {
						slider.destroy();
					}
				});
			});
			main_core.Runtime.html(listContainer, this.listData.html).then(() => {
				main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeTaskGridRequest.bind(this));
			});
		}
		onBeforeTaskGridRequest(event) {
			const [gridObject, eventArgs] = event.getCompatData();
			eventArgs.sessid = BX.bitrix_sessid();
			eventArgs.method = 'POST';
			eventArgs.data = {
				...eventArgs.data,
				gridId: this.gridId,
				pathToTask: this.pathToTask,
				pathToUser: this.pathToUser,
				tagId: this.tagId,
				tasksCount: this.tasksCount
			};
		}
		createTasksListContent() {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:tasks.tag.list', 'getTasksByTag', {
					mode: 'class',
					data: {
						gridId: this.gridId,
						tagId: this.tagId,
						pathToTask: this.pathToTask,
						pathToUser: this.pathToUser,
						tasksCount: this.tasksCount
					}
				}).then(response => {
					this.listData = response.data;
					resolve(this.renderTasksList());
				});
			});
		}
		renderTasksList() {
			return main_core.Tag.render`<div class="tasks-tags-tag-tasks-list"></div>`;
		}
		show(tagId, tasksCount) {
			return top.BX.Runtime.loadExtension('tasks.tag').then(exports => {
				const ext = new exports['TagActions'](this.pathToTask, this.pathToUser, tagId, tasksCount);
				ext.showTasksList();
			});
		}
		onLoadTagList() {
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeTagsGridRequest.bind(this));
		}
		onBeforeTagsGridRequest(event) {
			const [gridObject, eventArgs] = event.getCompatData();
			eventArgs.sessid = BX.bitrix_sessid();
			eventArgs.method = 'POST';
			eventArgs.data = {
				...eventArgs.data,
				groupId: this.groupId
			};
		}
	}

	exports.TagActions = TagActions;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.UI.SidePanel, BX.Event, BX.UI.Notification);
//# sourceMappingURL=tag.bundle.js.map
