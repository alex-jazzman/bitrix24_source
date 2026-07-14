/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, tasks_v2_application_taskCard, tasks_v2_core, tasks_v2_const, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_relationError, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_provider_service_relationService) {
	'use strict';

	class RelationTasksDialog {
		#dialogs = {};
		#meta;
		#taskId;
		#ids;
		#onClose;
		#onUpdate;
		#analytics;
		constructor(meta) {
			this.#meta = meta;
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TaskAdded, event => {
				const task = event.getData().task;
				this.#addTaskItems([task.id]);
			});
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TaskDeleted, event => {
				const task = event.getData();
				this.#deleteTaskItems([task.id]);
			});
		}
		show(params) {
			this.#ids = params.ids;
			this.#taskId = params.taskId;
			this.#onClose = params.onClose;
			this.#onUpdate = params.onUpdate;
			this.#analytics = params.analytics;
			if (!this.#ids && !this.#meta.service.areIdsLoaded(this.#taskId)) {
				return;
			}
			if (!this.#ids && this.dialog.isLoaded()) {
				this.#addTaskItems(this.#task[this.#meta.idsField]);
				this.dialog.setSelectableByIds(this.#selectableItems);
			}
			this.dialog.selectItemsByIds(this.#items);
			this.dialog.getPopup().setTargetContainer(params.targetContainer);
			this.dialog.showTo(params.targetNode);
		}
		get dialog() {
			this.#dialogs[this.#taskId] ??= this.#createDialog();
			return this.#dialogs[this.#taskId];
		}
		#createDialog() {
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				multiple: !this.#ids,
				enableSearch: true,
				width: 500,
				entities: [{
					id: this.#entityId,
					options: {
						withFooter: false
					}
				}],
				preselectedItems: this.#items,
				events: {
					onLoad: () => {
						const titles = this.dialog.getItems().map(item => ({
							id: this.#isTemplate ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : item.getId(),
							title: item.getTitle().replace(new RegExp(`\\[${item.getId()}\\]$`), '')
						}));
						void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Tasks}/setTitles`, titles);
					}
				},
				popupOptions: {
					events: {
						onClose: () => {
							this.#onClose?.(this.dialog.getSelectedItems());
							if (this.dialog.isLoaded() && !this.#ids) {
								void this.#updateTask();
							}
						}
					}
				},
				footer: this.#isTemplate ? null : this.#createFooter()
			});
		}
		#createFooter() {
			const footer = main_core.Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">${this.#meta.footerText}</span>
		`;
			main_core.Event.bind(footer, 'click', this.#clickCreate.bind(this));
			return footer;
		}
		#clickCreate() {
			tasks_v2_application_taskCard.TaskCard.showCompactCard({
				title: this.dialog.getTagSelector()?.getTextBoxValue(),
				groupId: this.#task.groupId,
				[this.#meta.relationToField]: this.#taskId,
				analytics: {
					context: this.#analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks,
					additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard,
					element: tasks_v2_const.Analytics.Element.CreateButton
				}
			});
			this.dialog.clearSearch();
			this.dialog.freeze();
			const unfreeze = () => {
				this.dialog.unfreeze();
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.CardClosed, unfreeze);
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.FullCardClosed, unfreeze);
				if (this.#ids) {
					this.dialog.hide();
				}
			};
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.CardClosed, unfreeze);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardClosed, unfreeze);
		}
		#addTaskItems(ids) {
			if (!this.dialog || this.#isTemplate) {
				return;
			}
			const itemIds = new Set(this.dialog.getItems().map(it => it.getId()));
			ids.filter(id => !itemIds.has(id)).forEach(id => {
				const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
				this.dialog.addItem({
					id,
					entityId: tasks_v2_const.EntitySelectorEntity.Task,
					title: task.title,
					selected: true,
					sort: 0,
					tabs: ['recents']
				});
			});
		}
		#deleteTaskItems(ids) {
			if (!this.dialog || this.#isTemplate) {
				return;
			}
			ids.forEach(id => this.dialog.removeItem([tasks_v2_const.EntitySelectorEntity.Task, id]));
		}
		async #updateTask() {
			const currentTaskIds = this.#task[this.#meta.idsField];
			const newTaskIds = this.dialog.getSelectedItems().map(item => {
				return this.#isTemplate ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : item.getId();
			});
			const idsToDelete = currentTaskIds.filter(id => !newTaskIds.includes(id));
			const idsToAdd = newTaskIds.filter(id => !currentTaskIds.includes(id));
			if (idsToDelete.length > 0 || idsToAdd.length > 0) {
				await Promise.all([this.#meta.service.delete(this.#taskId, idsToDelete), this.#add(idsToAdd)]);
				this.#onUpdate?.();
			}
		}
		async #add(ids) {
			const error = await this.#meta.service.add(this.#taskId, ids);
			if (error) {
				void tasks_v2_lib_relationError.relationError.setTaskId(this.#taskId).showError(error, this.#meta.id);
			}
		}
		get #selectableItems() {
			const selectableIds = [];
			const unselectableIds = [];
			this.#task[this.#meta.idsField].forEach(id => {
				const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
				if (!task || task.rights.detachParent || task.rights.detachRelated) {
					selectableIds.push(id);
				} else {
					unselectableIds.push(id);
				}
			});
			return {
				selectable: this.#mapIdsToItemIds(selectableIds),
				unselectable: this.#mapIdsToItemIds(unselectableIds)
			};
		}
		get #items() {
			return this.#mapIdsToItemIds(this.#ids ?? this.#task?.[this.#meta.idsField] ?? []);
		}
		#mapIdsToItemIds(ids) {
			return ids.map(id => [this.#entityId, tasks_v2_lib_idUtils.idUtils.unbox(id)]);
		}
		get #entityId() {
			return this.#isTemplate ? tasks_v2_const.EntitySelectorEntity.Template : tasks_v2_const.EntitySelectorEntity.Task;
		}
		get #isTemplate() {
			return this.#meta.isTemplate && tasks_v2_lib_idUtils.idUtils.isTemplate(this.#taskId);
		}
		get #task() {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId);
		}
	}

	const subTasksMeta = Object.freeze({
		id: tasks_v2_const.TaskField.SubTasks,
		idsField: 'subTaskIds',
		relationToField: 'parentId',
		footerText: main_core.Loc.getMessage('TASKS_V2_SUB_TASKS_CREATE'),
		service: tasks_v2_provider_service_relationService.subTasksService,
		isTemplate: true
	});
	const relatedTasksMeta = Object.freeze({
		id: tasks_v2_const.TaskField.RelatedTasks,
		idsField: 'relatedTaskIds',
		relationToField: 'relatedToTaskId',
		footerText: main_core.Loc.getMessage('TASKS_V2_RELATED_TASKS_CREATE'),
		service: tasks_v2_provider_service_relationService.relatedTasksService
	});
	const ganttMeta = Object.freeze({
		footerText: main_core.Loc.getMessage('TASKS_V2_GANTT_CREATE')
	});

	const subTasksDialog = new RelationTasksDialog(subTasksMeta);
	const relatedTasksDialog = new RelationTasksDialog(relatedTasksMeta);
	const ganttDialog = new RelationTasksDialog(ganttMeta);

	exports.ganttDialog = ganttDialog;
	exports.relatedTasksDialog = relatedTasksDialog;
	exports.subTasksDialog = subTasksDialog;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Event, BX.Tasks.V2.Application, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=relation-tasks-dialog.bundle.js.map
