import { Loc } from 'main.core';

import { ChatAction, TaskStatus } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { statusService } from 'tasks.v2.provider.service.status-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { Store } from 'ui.vue3.vuex';

import type { ActionPayload } from '../type/action-payload.js';
import { BaseAction } from './base-action.js';
import { chatHint } from '../chat-hint';

class CompleteTaskAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.CompleteTask;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (this.#isCompleted(payload))
		{
			this.#showCompletedHint(payload);

			return;
		}

		if (!this.hasPermission(payload))
		{
			this.#showAccessDeniedHint(payload);

			return;
		}

		await statusService.complete(payload.taskId);
	}

	hasPermission(payload: ActionPayload): boolean
	{
		const task = taskService.getStoreTask(payload.taskId);

		return task && task.rights?.complete === true;
	}

	#isCompleted(payload: ActionPayload): boolean
	{
		const task = taskService.getStoreTask(payload.taskId);

		return [TaskStatus.Completed, TaskStatus.SupposedlyCompleted].includes(task?.status);
	}

	#showAccessDeniedHint(payload: ActionPayload): void
	{
		void chatHint.show(Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_NO_PERMISSION'), payload);
	}

	#showCompletedHint(payload: ActionPayload): void
	{
		void chatHint.show(Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), payload);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const completeTaskAction = new CompleteTaskAction();
