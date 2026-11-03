import { Loc, Type } from 'main.core';

import { ChatAction, Model, TaskStatus } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { statusService } from 'tasks.v2.provider.service.status-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { Store } from 'ui.vue3.vuex';

import type { ActionPayload } from '../type/action-payload.js';
import { BaseAction } from './base-action.js';
import { announce } from '../announcer';
import { chatHint } from '../chat-hint';
import { resultServiceLoader } from '../extension-loader';

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

		if (!payload.isCardMounted && payload.isTaskDataReady === false)
		{
			await this.#showTaskUnavailableHint(payload);

			return;
		}

		if (this.#isCompleted(payload))
		{
			await this.#showCompletedHint(payload);

			return;
		}

		if (!this.hasPermission(payload))
		{
			await this.#showAccessDeniedHint(payload);

			return;
		}

		if (!payload.isCardMounted && this.requiresCard(payload))
		{
			await this.#showCardRequiredHint(payload);

			return;
		}

		const error = await statusService.complete(payload.taskId);

		if (error)
		{
			await this.#showErrorHint(error, payload);

			return;
		}

		if (this.#isCompleted(payload))
		{
			await announce(Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), 'polite');
		}
	}

	hasPermission(payload: ActionPayload): boolean
	{
		const task = taskService.getStoreTask(payload.taskId);

		return task?.rights?.complete === true;
	}

	get needsTaskData(): boolean
	{
		return true;
	}

	get needsResultData(): boolean
	{
		return true;
	}

	requiresCard(payload: ActionPayload): boolean
	{
		if (this.#isRefused(payload))
		{
			return false;
		}

		const task = taskService.getStoreTask(payload.taskId);
		if (!task?.requireResult)
		{
			return false;
		}

		const currentUserId = this.$store.getters[`${Model.Interface}/currentUserId`];

		return (
			!Core.getParams().rights.user.admin
			&& currentUserId !== task.creatorId
			&& !this.#hasOpenedResults(payload.taskId)
		);
	}

	#isRefused(payload: ActionPayload): boolean
	{
		return this.#isCompleted(payload) || !this.hasPermission(payload);
	}

	isTooltipOnly(payload: ActionPayload): boolean
	{
		return this.#isCompleted(payload) || !this.hasPermission(payload);
	}

	isReady(payload: ActionPayload): boolean
	{
		return taskService.hasStoreTask(payload.taskId, false);
	}

	#isCompleted(payload: ActionPayload): boolean
	{
		const task = taskService.getStoreTask(payload.taskId);

		return [TaskStatus.Completed, TaskStatus.SupposedlyCompleted].includes(task?.status);
	}

	#hasOpenedResults(taskId: number): boolean
	{
		const resultService = resultServiceLoader.getExports()?.resultService;

		return resultService ? resultService.hasOpenedResults(taskId) : false;
	}

	#showAccessDeniedHint(payload: ActionPayload): Promise<void>
	{
		return this.#showHint(Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_NO_PERMISSION'), payload);
	}

	#showCompletedHint(payload: ActionPayload): Promise<void>
	{
		return this.#showHint(Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), payload);
	}

	#showCardRequiredHint(payload: ActionPayload): Promise<void>
	{
		return this.#showHint(Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_RESULT_REQUIRED'), payload);
	}

	#showTaskUnavailableHint(payload: ActionPayload): Promise<void>
	{
		return this.#showHint(Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_LOAD_FAILED'), payload);
	}

	#showErrorHint(error: Error, payload: ActionPayload): Promise<void>
	{
		const text = Type.isStringFilled(error.message)
			? error.message
			: Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_ERROR')
		;

		return this.#showHint(text, payload);
	}

	#showHint(text: string, payload: ActionPayload): Promise<void>
	{
		void chatHint.show(text, payload);

		return announce(text, 'assertive');
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const completeTaskAction = new CompleteTaskAction();
