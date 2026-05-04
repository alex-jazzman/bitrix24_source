import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.vue';

import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { resultService } from 'tasks.v2.provider.service.result-service';

import type { MenuItemOptions } from 'ui.system.menu';
import type { TaskModel } from 'tasks.v2.model.tasks';

// eslint-disable-next-line no-unused-vars
import type { TaskCommentsMessageMenu } from 'im.v2.lib.menu';

/**
 * @param {typeof TaskCommentsMessageMenu} baseMenu
 * @returns {typeof TaskCommentsMessageMenu}
 */
// eslint-disable-next-line max-lines-per-function
export const TaskFullCardMessageMenu = (baseMenu) => class extends baseMenu
{
	getAddResultItem(): ?MenuItemOptions
	{
		if (
			this.isDeletedMessage()
			|| this.#isSystemMessage()
			|| !this.#shouldShowAddResult()
		)
		{
			return null;
		}

		return {
			title: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_ADD_RESULT'),
			icon: Outline.FLAG,
			onClick: (): void => {
				EventEmitter.emit(EventName.AddResultFromChat, {
					taskId: this.getTaskId(),
					messageId: this.context.id,
					text: this.context.text,
					authorId: this.#getUserId()
				});

				this.close();
			}
		};
	}

	getRemoveResultItem(): ?MenuItemOptions
	{
		if (
			this.isDeletedMessage()
			|| this.#isSystemMessage()
			|| !this.#shouldShowRemoveResult()
		)
		{
			return null;
		}

		return {
			title: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_DELETE_RESULT'),
			icon: Outline.FLAG_WITH_CROSS,
			onClick: (): void => {
				EventEmitter.emit(EventName.DeleteResultFromChat, {
					taskId: this.getTaskId(),
					resultId: this.#getMessageResultIdForCurrentUser(),
				});

				this.close();
			}
		};
	}

	getTaskId(): number
	{
		return 0; // reinitialize in the calling class
	}

	#shouldShowAddResult(): boolean
	{
		const task = this.#getTask();
		if (!task)
		{
			return false;
		}

		return this.#getMessageResultIdForCurrentUser() === 0;
	}

	#isSystemMessage(): boolean
	{
		return this.context.authorId === 0;
	}

	#shouldShowRemoveResult(): boolean
	{
		const task = this.#getTask();
		if (!task)
		{
			return false;
		}

		return this.#getMessageResultIdForCurrentUser() > 0;
	}

	#getMessageResultIdForCurrentUser(): int
	{
		const task = this.#getTask();
		if (!task)
		{
			return 0;
		}

		const map = task?.resultsMessageMap || {};
		const messageId = this.context.id;

		for (const [resultId, boundMessageId] of Object.entries(map))
		{
			if (boundMessageId !== null && Number(boundMessageId) === Number(messageId))
			{
				const messageResult = resultService.getStoreResult(Number(resultId));

				if (messageResult !== null && messageResult.author.id === this.#getUserId())
				{
					return messageResult.id;
				}
			}
		}

		return 0;
	}

	#getTask(): ?TaskModel
	{
		return taskService.getStoreTask(this.getTaskId());
	}

	#getUserId(): number
	{
		return Core.getParams().currentUser.id;
	}
};
