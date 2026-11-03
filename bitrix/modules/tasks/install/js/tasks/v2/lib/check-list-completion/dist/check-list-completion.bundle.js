/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_notificationManager, tasks_v2_core, tasks_v2_const, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_taskService, tasks_v2_lib_checkListCompletionPrompt) {
	'use strict';

	class CheckListSnapshotBuilder {
		#getTask;
		#getItems;
		constructor(dependencies = {}) {
			this.#getTask = dependencies.getTask ?? (taskId => tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId));
			this.#getItems = dependencies.getItems ?? (ids => tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.CheckList}/getByIds`](ids));
		}
		build(taskId) {
			const task = this.#getTask(taskId);
			return tasks_v2_lib_checkListCompletionPrompt.buildCompletionSnapshot(this.#getItems(task?.checklist ?? []) ?? []);
		}
	}

	class CheckListCompletionService {
		#snapshotBuilder = new CheckListSnapshotBuilder();
		async run(options) {
			const {
				taskId,
				complete,
				completeWithChecklist,
				beforeComplete
			} = options;
			let snapshot = null;
			try {
				await tasks_v2_provider_service_checkListService.checkListService.forceSavePending(taskId, {
					rejectOnError: true
				});
				await tasks_v2_provider_service_checkListService.checkListService.ensureLoaded(taskId);
				snapshot = this.#snapshotBuilder.build(taskId);
			} catch (error) {
				console.error('CheckListCompletionService: run error', error);
				return Object.freeze({
					state: tasks_v2_lib_checkListCompletionPrompt.CompletionStates.Failed,
					error,
					snapshot: null
				});
			}
			return tasks_v2_lib_checkListCompletionPrompt.checkListCompletionPromptRunner.run(snapshot, {
				complete: () => this.#runAction(complete),
				completeWithChecklist: async () => {
					const error = await this.#runAction(completeWithChecklist);
					if (!error) {
						await this.#markSnapshotComplete(snapshot);
						this.#showSuccessNotification(taskId);
					}
					return error;
				}
			}, {
				beforeComplete
			});
		}
		async #runAction(action) {
			try {
				return await action();
			} catch (error) {
				console.error('CheckListCompletionService: action error', error);
				return error;
			}
		}
		async #markSnapshotComplete(snapshot) {
			const completedItems = snapshot.incompleteIds.map(id => tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.CheckList}/getById`](id)).filter(Boolean).map(item => ({
				...item,
				isComplete: true
			}));
			if (completedItems.length > 0) {
				await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, completedItems);
			}
		}
		#showSuccessNotification(taskId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const message = task?.needsControl === true || task?.status === tasks_v2_const.TaskStatus.SupposedlyCompleted ? 'TASKS_V2_CHECKLIST_TASK_SENT_TO_REVIEW' : 'TASKS_V2_CHECKLIST_TASK_COMPLETED';
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id: `tasks-checklist-on-complete-success-${taskId}`,
				text: main_core.Loc.getMessage(message) ?? ''
			});
		}
	}
	function isCompletionSuccessful(result) {
		return result.state === tasks_v2_lib_checkListCompletionPrompt.CompletionStates.Success;
	}
	const checkListCompletionService = new CheckListCompletionService();

	exports.checkListCompletionService = checkListCompletionService;
	exports.isCompletionSuccessful = isCompletionSuccessful;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.UI.NotificationManager, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib);
//# sourceMappingURL=check-list-completion.bundle.js.map
