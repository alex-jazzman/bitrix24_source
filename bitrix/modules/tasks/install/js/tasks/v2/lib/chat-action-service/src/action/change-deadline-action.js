import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import type { ActionPayload } from '../type/action-payload.js';
import { BaseAction } from './base-action.js';
import { chatHint } from '../chat-hint';

class ChangeDeadlineAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.ChangeDeadline;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (!this.hasPermission(payload))
		{
			this.#showAccessDeniedHint(payload);

			return;
		}

		this.#emitOpenDeadlinePickerEvent(payload);
	}

	hasPermission(payload: ActionPayload): boolean
	{
		const task = taskService.getStoreTask(payload.taskId);
		if (!task)
		{
			return false;
		}

		return this.#canChangeDeadline(task);
	}

	#canChangeDeadline(task: TaskModel): boolean
	{
		const isFlowFilledOnAdd = task.flowId > 0;

		return (
			task.rights.deadline
			&& !this.#exceededChangeCount(task)
			&& !isFlowFilledOnAdd
		);
	}

	#exceededChangeCount(task: TaskModel): boolean
	{
		const currentUserId = Core.getStore().getters[`${Model.Interface}/currentUserId`];
		const isCreator = currentUserId === task.creatorId;
		if (isCreator || !task.maxDeadlineChanges)
		{
			return false;
		}

		const deadlineChangeCount = Core.getStore().getters[`${Model.Interface}/deadlineChangeCount`];

		return deadlineChangeCount >= task.maxDeadlineChanges;
	}

	#showAccessDeniedHint(payload: ActionPayload): void
	{
		const task = taskService.getStoreTask(payload.taskId);

		const exceededChangeCount = this.#exceededChangeCount(task);

		const text = (
			exceededChangeCount
				? Loc.getMessage('TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_EXCEEDED')
				: Loc.getMessage('TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_NO_PERMISSION')
		);

		const width = (exceededChangeCount ? 330 : 280);

		void chatHint.show(
			text,
			payload,
			{ maxWidth: width },
		);
	}

	#emitOpenDeadlinePickerEvent(payload: ActionPayload): void
	{
		EventEmitter.emit(
			EventName.OpenDeadlinePicker,
			{
				taskId: payload.taskId,
				bindElement: payload.bindElement,
				coordinates: payload.coordinates,
			},
		);
	}
}

export const changeDeadlineAction = new ChangeDeadlineAction();
