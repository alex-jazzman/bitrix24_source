/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, ui_dialogs_messagebox, ui_notification, tasks_scrum_dod) {
	'use strict';

	class RequestSender {
		sendRequest(controller, action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.' + controller + '.' + action, {
					data: data
				}).then(resolve, reject);
			});
		}
		needUpdateTask(data) {
			return this.sendRequest('task', 'needUpdateTaskStatus', data);
		}
		getTasks(data) {
			return this.sendRequest('task', 'getTasks', data);
		}
		completeTask(data) {
			return this.sendRequest('task', 'completeTask', data);
		}
		renewTask(data) {
			return this.sendRequest('task', 'renewTask', data);
		}
		proceedParentTask(data) {
			return this.sendRequest('task', 'proceedParentTask', data);
		}
		isParentScrumTask(data) {
			return this.sendRequest('task', 'isParentScrumTask', data);
		}
		getData(data) {
			return this.sendRequest('task', 'getData', data);
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
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TST_ERROR_POPUP_TITLE');
					ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
		}
	}

	class TaskStatus {
		static actions = {
			complete: 'complete',
			renew: 'renew',
			proceed: 'proceed',
			skip: 'skip',
			alreadyCompleted: 'alreadyCompleted'
		};
		constructor(state) {
			this.setState(state);
			this.requestSender = new RequestSender();
		}
		setState(state) {
			this.taskId = parseInt(state.taskId, 10);
			this.action = state.action === TaskStatus.actions.complete ? TaskStatus.actions.complete : TaskStatus.actions.renew;
			this.groupId = main_core.Type.isUndefined(state.groupId) ? 0 : parseInt(state.groupId, 10);
			this.parentTaskId = main_core.Type.isUndefined(state.parentTaskId) ? 0 : parseInt(state.parentTaskId, 10);
			this.performActionOnParentTask = main_core.Type.isUndefined(state.performActionOnParentTask) ? false : state.performActionOnParentTask;
			this.completeWithChecklist = state.completeWithChecklist === true;
		}
		updateState() {
			return this.requestSender.getData({
				taskId: this.taskId
			}).then(response => {
				this.setState({
					...{
						action: this.action,
						groupId: this.groupId,
						parentTaskId: this.parentTaskId,
						performActionOnParentTask: this.performActionOnParentTask
					},
					...response.data,
					completeWithChecklist: this.completeWithChecklist
				});
			});
		}
		update() {
			return this.requestSender.needUpdateTask({
				taskId: this.parentTaskId,
				action: this.action
			}).then(response => response.data === true).then(needUpdate => {
				if (needUpdate) {
					const request = {
						groupId: this.groupId,
						taskIds: [this.parentTaskId, this.taskId]
					};
					if (this.action === TaskStatus.actions.complete) {
						request.checkListTaskId = this.parentTaskId;
					}
					return this.requestSender.getTasks(request).then(response => {
						const tasks = response.data;
						return this.showMessage(tasks[this.parentTaskId], tasks[this.taskId]);
					});
				} else {
					return TaskStatus.actions.skip;
				}
			}).then(response => {
				if (response === TaskStatus.actions.alreadyCompleted) {
					if (this.performActionOnParentTask) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('TST_PARENT_COMPLETE_NOTIFY')
						});
					}
					return TaskStatus.actions.complete;
				}
				if (response === TaskStatus.actions.complete) {
					return this.completeParentTask(this.parentTaskId).then(isCompleted => {
						if (!isCompleted) {
							return TaskStatus.actions.skip;
						}
						if (this.performActionOnParentTask) {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('TST_PARENT_COMPLETE_NOTIFY')
							});
						}
						return response;
					});
				}
				if (this.performActionOnParentTask) {
					switch (response) {
						case TaskStatus.actions.renew:
							return this.renewTask(this.parentTaskId).then(() => {
								ui_notification.UI.Notification.Center.notify({
									content: main_core.Loc.getMessage('TST_PARENT_RENEW_NOTIFY')
								});
								return response;
							});
						case TaskStatus.actions.proceed:
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('TST_PARENT_PROCEED_NOTIFY')
							});
							return response;
						case TaskStatus.actions.skip:
							return response;
					}
				} else {
					return response;
				}
			}).catch(response => this.requestSender.showErrorAlert(response));
		}
		isParentScrumTask(taskId) {
			taskId = main_core.Type.isUndefined(taskId) ? this.parentTaskId : taskId;
			if (!taskId) {
				return new Promise(resolve => resolve(false));
			}
			return this.requestSender.isParentScrumTask({
				groupId: this.groupId,
				taskId: taskId
			}).then(response => response.data === true);
		}
		showMessage(parentTask, task) {
			const isCompleteAction = this.action === TaskStatus.actions.complete;
			const hasCheckListCompletionSnapshot = !main_core.Type.isUndefined(parentTask.checkListCompletionSnapshot) && parentTask.checkListCompletionSnapshot !== null;
			if (isCompleteAction && hasCheckListCompletionSnapshot) {
				return this.showCheckListCompletionPrompt(parentTask);
			}
			return this.showConfirmMessage(parentTask, task);
		}
		showConfirmMessage(parentTask, task) {
			return new Promise((resolve, reject) => {
				const isCompleteAction = this.action === TaskStatus.actions.complete;
				new ui_dialogs_messagebox.MessageBox({
					minWidth: 300,
					message: isCompleteAction ? main_core.Loc.getMessage('TST_PARENT_COMPLETE_MESSAGE').replace(/#name#/g, main_core.Text.encode(parentTask.name)) : main_core.Loc.getMessage('TST_PARENT_RENEW_MESSAGE').replace("#name#", main_core.Text.encode(parentTask.name)).replace("#sub-name#", main_core.Text.encode(task.name)),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: isCompleteAction ? main_core.Loc.getMessage('TST_PARENT_COMPLETE_OK_CAPTION') : main_core.Loc.getMessage('TST_PARENT_RENEW_OK_CAPTION'),
					cancelCaption: isCompleteAction ? main_core.Loc.getMessage('TST_PARENT_PROCEED_CAPTION') : main_core.Loc.getMessage('TST_PARENT_RENEW_CANCEL_CAPTION'),
					onOk: messageBox => {
						if (isCompleteAction) {
							this.showDodConfirmation(this.parentTaskId).then(confirmed => {
								if (!confirmed) {
									messageBox.getOkButton().setDisabled(false);
									return;
								}
								messageBox.close();
								resolve(TaskStatus.actions.complete);
							}).catch(error => {
								messageBox.close();
								reject(error);
							});
						} else {
							messageBox.close();
							resolve(TaskStatus.actions.renew);
						}
					},
					onCancel: messageBox => {
						messageBox.close();
						if (isCompleteAction) {
							this.proceedParentTask(this.parentTaskId).then(() => {
								resolve(TaskStatus.actions.proceed);
							});
						} else {
							resolve(TaskStatus.actions.skip);
						}
					}
				}).show();
			});
		}
		async showCheckListCompletionPrompt(parentTask) {
			const {
				checkListCompletionPromptRunner,
				CompletionStates
			} = await main_core.Runtime.loadExtension('tasks.v2.lib.check-list-completion-prompt');
			const complete = () => this.completeTask(this.parentTaskId, true).then(response => response.data === true ? null : response);
			const result = await checkListCompletionPromptRunner.run(parentTask.checkListCompletionSnapshot, {
				complete,
				completeWithChecklist: complete
			}, {
				presentation: {
					title: main_core.Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_TITLE'),
					titleLink: {
						text: parentTask.name,
						onClick: () => {
							void this.openTaskCard(this.parentTaskId);
						}
					},
					subtitle: main_core.Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_SUBTITLE'),
					completeButtonText: main_core.Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_BUTTON'),
					returnButtonText: main_core.Loc.getMessage('TST_PARENT_CHECKLIST_CONTINUE_BUTTON')
				},
				beforeComplete: () => this.showDodConfirmation(this.parentTaskId)
			});
			if (result.state === CompletionStates.Failed) {
				throw result.error;
			}
			if (result.state === CompletionStates.Cancelled || result.state === CompletionStates.Returned) {
				return TaskStatus.actions.skip;
			}
			return TaskStatus.actions.alreadyCompleted;
		}
		async openTaskCard(taskId) {
			const {
				TaskCard
			} = await main_core.Runtime.loadExtension('tasks.v2.application.task-card');
			TaskCard.showFullCard({
				taskId
			});
		}
		showDod(taskId) {
			return this.showDodDialog(taskId);
		}
		showDodConfirmation(taskId) {
			return this.showDodDialog(taskId, true).then(() => true, error => {
				if (main_core.Type.isUndefined(error)) {
					return false;
				}
				throw error;
			});
		}
		showDodDialog(taskId, skipErrorAlert = false) {
			return new Promise((resolve, reject) => {
				const dod = new tasks_scrum_dod.Dod({
					taskId,
					groupId: this.groupId,
					skipErrorAlert
				});
				dod.subscribe('resolve', () => resolve());
				dod.subscribe('reject', () => reject());
				dod.isNecessary().then(isNecessary => {
					if (isNecessary) {
						dod.showList();
					} else {
						resolve();
					}
				}).catch(reject);
			});
		}
		async completeParentTask(taskId) {
			const response = await this.completeTask(taskId, true);
			return response.data === true;
		}
		completeTask(taskId, completeWithChecklist = false) {
			return this.requestSender.completeTask({
				groupId: this.groupId,
				taskId,
				completeWithChecklist
			});
		}
		renewTask(taskId) {
			return this.requestSender.renewTask({
				groupId: this.groupId,
				taskId: taskId
			});
		}
		proceedParentTask(taskId) {
			return this.requestSender.proceedParentTask({
				groupId: this.groupId,
				taskId: taskId
			});
		}
	}

	exports.TaskStatus = TaskStatus;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX, BX.UI.Dialogs, BX.UI.Notification, BX.Tasks.Scrum);
//# sourceMappingURL=task.status.bundle.js.map
