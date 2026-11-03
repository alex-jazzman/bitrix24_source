import {Type, Loc, Runtime, Text} from 'main.core';

import {MessageBox, MessageBoxButtons} from 'ui.dialogs.messagebox';
import {UI} from 'ui.notification';

import {Dod} from 'tasks.scrum.dod';

import {RequestSender} from './request.sender';

type State = {
	taskId: number,
	action: 'complete' | 'renew',
	groupId?: number,
	parentTaskId?: number,
	performActionOnParentTask?: boolean,
	completeWithChecklist?: boolean,
}

type Task = {
	name: string,
	checkListCompletionSnapshot?: Object | null,
}

export class TaskStatus
{
	static actions = {
		complete: 'complete',
		renew: 'renew',
		proceed: 'proceed',
		skip: 'skip',
		alreadyCompleted: 'alreadyCompleted',
	};

	constructor(state: State)
	{
		this.setState(state);

		this.requestSender = new RequestSender();
	}

	setState(state: State)
	{
		this.taskId = parseInt(state.taskId, 10);
		this.action = (
			state.action === TaskStatus.actions.complete
				? TaskStatus.actions.complete
				: TaskStatus.actions.renew
		);
		this.groupId = Type.isUndefined(state.groupId) ? 0 : parseInt(state.groupId, 10);
		this.parentTaskId = Type.isUndefined(state.parentTaskId) ? 0 : parseInt(state.parentTaskId, 10);
		this.performActionOnParentTask = (
			Type.isUndefined(state.performActionOnParentTask)
				? false
				: state.performActionOnParentTask
		);
		this.completeWithChecklist = state.completeWithChecklist === true;
	}

	updateState(): Promise
	{
		return this.requestSender.getData({
			taskId: this.taskId
		})
			.then((response) => {
				this.setState(
					{
						...{
							action: this.action,
							groupId: this.groupId,
							parentTaskId: this.parentTaskId,
							performActionOnParentTask: this.performActionOnParentTask,
						},
						...response.data,
						completeWithChecklist: this.completeWithChecklist,
					}
				);
			})
		;
	}

	update(): Promise
	{
		return this.requestSender.needUpdateTask({
			taskId: this.parentTaskId,
			action: this.action
		})
			.then((response) => response.data === true)
			.then((needUpdate: boolean) => {
				if (needUpdate)
				{
					const request: Object = {
						groupId: this.groupId,
						taskIds: [this.parentTaskId, this.taskId],
					};
					if (this.action === TaskStatus.actions.complete)
					{
						request.checkListTaskId = this.parentTaskId;
					}

					return this.requestSender.getTasks(request)
						.then((response) => {
							const tasks = response.data;

							return this.showMessage(
								tasks[this.parentTaskId],
								tasks[this.taskId]
							);
						})
					;
				}
				else
				{
					return TaskStatus.actions.skip;
				}
			})
			.then((response) => {
				if (response === TaskStatus.actions.alreadyCompleted)
				{
					if (this.performActionOnParentTask)
					{
						UI.Notification.Center.notify({
							content: Loc.getMessage('TST_PARENT_COMPLETE_NOTIFY')
						});
					}

					return TaskStatus.actions.complete;
				}

				if (response === TaskStatus.actions.complete)
				{
					return this.completeParentTask(this.parentTaskId)
						.then((isCompleted) => {
							if (!isCompleted)
							{
								return TaskStatus.actions.skip;
							}

							if (this.performActionOnParentTask)
							{
								UI.Notification.Center.notify({
									content: Loc.getMessage('TST_PARENT_COMPLETE_NOTIFY')
								});
							}

							return response;
						})
					;
				}

				if (this.performActionOnParentTask)
				{
					switch (response)
					{
						case TaskStatus.actions.renew:
							return this.renewTask(this.parentTaskId)
								.then(() => {
									UI.Notification.Center.notify({
										content: Loc.getMessage('TST_PARENT_RENEW_NOTIFY')
									});

									return response;
								})
							;
						case TaskStatus.actions.proceed:
							UI.Notification.Center.notify({
								content: Loc.getMessage('TST_PARENT_PROCEED_NOTIFY')
							});

							return response;
						case TaskStatus.actions.skip:
							return response;
					}
				}
				else
				{
					return response;
				}
			})
			.catch((response) => this.requestSender.showErrorAlert(response))
		;
	}

	isParentScrumTask(taskId?: number): Promise
	{
		taskId = Type.isUndefined(taskId) ? this.parentTaskId : taskId;
		if (!taskId)
		{
			return new Promise((resolve) => resolve(false));
		}

		return this.requestSender.isParentScrumTask({
			groupId: this.groupId,
			taskId: taskId
		})
			.then((response) => response.data === true)
		;
	}

	showMessage(parentTask: Task, task: Task): Promise
	{
		const isCompleteAction = (this.action === TaskStatus.actions.complete);
		const hasCheckListCompletionSnapshot = (
			!Type.isUndefined(parentTask.checkListCompletionSnapshot)
			&& parentTask.checkListCompletionSnapshot !== null
		);
		if (isCompleteAction && hasCheckListCompletionSnapshot)
		{
			return this.showCheckListCompletionPrompt(parentTask);
		}

		return this.showConfirmMessage(parentTask, task);
	}

	showConfirmMessage(parentTask: Task, task: Task): Promise
	{
		return new Promise((resolve, reject) => {
			const isCompleteAction = (this.action === TaskStatus.actions.complete);

			(new MessageBox({
				minWidth: 300,
				message: isCompleteAction
					? Loc.getMessage('TST_PARENT_COMPLETE_MESSAGE')
						.replace(/#name#/g, Text.encode(parentTask.name))
					: Loc.getMessage('TST_PARENT_RENEW_MESSAGE')
						.replace("#name#", Text.encode(parentTask.name))
						.replace("#sub-name#", Text.encode(task.name))
				,
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: isCompleteAction
					? Loc.getMessage('TST_PARENT_COMPLETE_OK_CAPTION')
					: Loc.getMessage('TST_PARENT_RENEW_OK_CAPTION')
				,
				cancelCaption: isCompleteAction
					? Loc.getMessage('TST_PARENT_PROCEED_CAPTION')
					: Loc.getMessage('TST_PARENT_RENEW_CANCEL_CAPTION')
				,
				onOk: (messageBox) => {
					if (isCompleteAction)
					{
						this.showDodConfirmation(this.parentTaskId)
							.then((confirmed) => {
								if (!confirmed)
								{
									messageBox.getOkButton().setDisabled(false);

									return;
								}

								messageBox.close();

								resolve(TaskStatus.actions.complete);
							})
							.catch((error) => {
								messageBox.close();

								reject(error);
							})
						;
					}
					else
					{
						messageBox.close();

						resolve(TaskStatus.actions.renew);
					}
				},
				onCancel: (messageBox) => {
					messageBox.close();
					if (isCompleteAction)
					{
						this.proceedParentTask(this.parentTaskId)
							.then(() => {
								resolve(TaskStatus.actions.proceed);
							})
						;
					}
					else
					{
						resolve(TaskStatus.actions.skip);
					}
				},
			})).show();
		});
	}

	async showCheckListCompletionPrompt(parentTask: Task): Promise<string>
	{
		const { checkListCompletionPromptRunner, CompletionStates } = await Runtime.loadExtension(
			'tasks.v2.lib.check-list-completion-prompt',
		);
		const complete = () => this.completeTask(this.parentTaskId, true)
			.then((response) => response.data === true ? null : response)
		;
		const result = await checkListCompletionPromptRunner.run(
			parentTask.checkListCompletionSnapshot,
			{
				complete,
				completeWithChecklist: complete,
			},
			{
				presentation: {
					title: Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_TITLE'),
					titleLink: {
						text: parentTask.name,
						onClick: () => {
							void this.openTaskCard(this.parentTaskId);
						},
					},
					subtitle: Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_SUBTITLE'),
					completeButtonText: Loc.getMessage('TST_PARENT_CHECKLIST_COMPLETE_BUTTON'),
					returnButtonText: Loc.getMessage('TST_PARENT_CHECKLIST_CONTINUE_BUTTON'),
				},
				beforeComplete: () => this.showDodConfirmation(this.parentTaskId),
			},
		);

		if (result.state === CompletionStates.Failed)
		{
			throw result.error;
		}

		if (
			result.state === CompletionStates.Cancelled
			|| result.state === CompletionStates.Returned
		)
		{
			return TaskStatus.actions.skip;
		}

		return TaskStatus.actions.alreadyCompleted;
	}

	async openTaskCard(taskId: number): Promise<void>
	{
		const { TaskCard } = await Runtime.loadExtension('tasks.v2.application.task-card');

		TaskCard.showFullCard({ taskId });
	}

	showDod(taskId: number): Promise
	{
		return this.showDodDialog(taskId);
	}

	showDodConfirmation(taskId: number): Promise<boolean>
	{
		return this.showDodDialog(taskId, true).then(
			() => true,
			(error) => {
				if (Type.isUndefined(error))
				{
					return false;
				}

				throw error;
			},
		);
	}

	showDodDialog(taskId: number, skipErrorAlert: boolean = false): Promise
	{
		return new Promise((resolve, reject) => {
			const dod = new Dod({
				taskId,
				groupId: this.groupId,
				skipErrorAlert,
			});

			dod.subscribe('resolve', () => resolve());
			dod.subscribe('reject', () => reject());

			dod.isNecessary()
				.then((isNecessary) => {
					if (isNecessary)
					{
						dod.showList();
					}
					else
					{
						resolve();
					}
				})
				.catch(reject)
			;
		});
	}

	async completeParentTask(taskId: number): Promise<boolean>
	{
		const response = await this.completeTask(taskId, true);

		return response.data === true;
	}

	completeTask(taskId: number, completeWithChecklist: boolean = false): Promise
	{
		return this.requestSender.completeTask({
			groupId: this.groupId,
			taskId,
			completeWithChecklist,
		});
	}

	renewTask(taskId: number): Promise
	{
		return this.requestSender.renewTask({
			groupId: this.groupId,
			taskId: taskId
		});
	}

	proceedParentTask(taskId: number): Promise
	{
		return this.requestSender.proceedParentTask({
			groupId: this.groupId,
			taskId: taskId
		});
	}
}
