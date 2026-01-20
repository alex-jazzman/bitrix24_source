import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { chatHint } from '../chat-hint';
import { BaseAction } from './base-action';
import type { ActionPayload } from '../type/action-payload';

class OpenResultAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.OpenResult;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (!this.#hasResult(payload))
		{
			this.#showNoResultHint(payload);

			return;
		}

		this.#emitOpenResultEvent(payload);
	}

	#hasResult(payload: ActionPayload): boolean
	{
		const { entityId, taskId } = payload;

		if (!entityId || !taskId)
		{
			return false;
		}

		const task = taskService.getStoreTask(taskId);

		return !(!task?.results || !task.results.includes(entityId));
	}

	#showNoResultHint(payload: ActionPayload): void
	{
		void chatHint.show(Loc.getMessage('TASKS_V2_CHAT_ACTION_RESULT_NOT_FOUND'), payload);
	}

	#emitOpenResultEvent(payload: ActionPayload): void
	{
		EventEmitter.emit(
			EventName.OpenResultFromChat,
			{
				taskId: payload.taskId,
				resultId: payload.entityId,
			},
		);
	}
}

export const openResultAction = new OpenResultAction();
