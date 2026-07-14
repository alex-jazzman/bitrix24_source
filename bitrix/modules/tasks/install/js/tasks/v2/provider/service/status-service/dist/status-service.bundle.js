/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, ui_dialogs_messagebox, tasks_v2_core, tasks_v2_const, tasks_v2_lib_analytics, tasks_v2_lib_scrumManager, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_deadlineService, tasks_v2_provider_service_taskService, tasks_v2_provider_service_resultService) {
	'use strict';

	const statusService = new class {
		async start(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusStart, tasks_v2_const.TaskStatus.InProgress);
		}
		async take(id, analyticsParams = {}) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusTake, tasks_v2_const.TaskStatus.InProgress);
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
			if (task.allowsTimeTracking) {
				tasks_v2_lib_analytics.analytics.sendAutoTimeTracking(analyticsParams, {
					taskId: id
				});
			}
		}
		async startTimer(id, analyticsParams = {}) {
			const taskWithActiveTimer = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/taskWithActiveTimer`];
			if (taskWithActiveTimer) {
				return new Promise(resolve => {
					ui_dialogs_messagebox.MessageBox.show({
						useAirDesign: true,
						message: main_core.Loc.getMessage('TASKS_V2_STATUS_TIMER_WARNING', {
							'#TITLE#': taskWithActiveTimer.title
						}),
						buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
						okCaption: main_core.Loc.getMessage('TASKS_V2_STATUS_TIMER_WARNING_OK'),
						onOk: async dialog => {
							dialog.close();
							await this.#doStartTimer(id, analyticsParams);
							resolve();
						},
						popupOptions: {
							closeByEsc: false,
							autoHide: false,
							events: {
								onClose: () => {
									resolve();
								}
							}
						}
					});
				});
			}
			return this.#doStartTimer(id, analyticsParams);
		}
		async #doStartTimer(id, analyticsParams) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskTrackingTimerStart, tasks_v2_const.TaskStatus.InProgress);
			tasks_v2_lib_analytics.analytics.sendAutoTimeTracking(analyticsParams, {
				taskId: id
			});
		}
		async disapprove(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusDisapprove, tasks_v2_const.TaskStatus.Pending);
		}
		async defer(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusDefer, tasks_v2_const.TaskStatus.Deferred);
		}
		async approve(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusApprove, tasks_v2_const.TaskStatus.Completed);
		}
		async pause(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusPause, tasks_v2_const.TaskStatus.Pending);
		}
		async pauseTimer(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskTrackingTimerStop, tasks_v2_const.TaskStatus.Pending);
		}
		async complete(id, analyticsParams = {}, handleRequireResult = true) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
			if (!task) {
				return null;
			}
			const currentUserId = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
			if (handleRequireResult && task.requireResult && !tasks_v2_core.Core.getParams().rights.user.admin && currentUserId !== task.creatorId && !tasks_v2_provider_service_resultService.resultService.hasOpenedResults(id)) {
				main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.RequiredResultsMissing, {
					taskId: id
				});
				return null;
			}
			const group = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Groups}/getById`](task.groupId);
			const scrumManager = new tasks_v2_lib_scrumManager.ScrumManager({
				taskId: task.id,
				parentId: task.parentId,
				groupId: task.groupId
			});
			let canComplete = true;
			if (scrumManager.isScrum(group?.type)) {
				canComplete = await scrumManager.handleDodDisplay();
			}
			if (!canComplete) {
				return null;
			}
			const status = task.needsControl ? tasks_v2_const.TaskStatus.SupposedlyCompleted : tasks_v2_const.TaskStatus.Completed;
			const error = await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusComplete, status, true);
			if (error) {
				return error;
			}
			if (scrumManager.isScrum(group?.type)) {
				void scrumManager?.handleParentState();
			}
			tasks_v2_lib_analytics.analytics.sendTaskComplete(analyticsParams, {
				taskId: task.id
			});
			void tasks_v2_provider_service_resultService.resultService.closeResults(id);
			if (task.maxDeadlineChanges) {
				await tasks_v2_provider_service_deadlineService.deadlineService.updateDeadlineChangeCount(id);
			}
			return null;
		}
		async renew(id) {
			await this.#updateStatus(id, tasks_v2_const.Endpoint.TaskStatusRenew, tasks_v2_const.TaskStatus.Pending);
		}
		async #updateStatus(id, action, status, silent = false) {
			const taskBeforeUpdate = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
					status
				});
				return null;
			}
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(action, {
					task: {
						id
					}
				});
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
					status
				});
				tasks_v2_provider_service_taskService.taskService.extractTask(data);
				return null;
			} catch (error) {
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, taskBeforeUpdate);
				if (!silent) {
					console.error(`StatusService: ${action} error`, error);
				}
				return new Error(error.errors?.[0]?.message);
			}
		}
	}();

	exports.statusService = statusService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.UI.Dialogs, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=status-service.bundle.js.map
