import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.vue';

import { EventName } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';

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
			|| !this.isOwnMessage()
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
					authorId: this.context.authorId,
				});

				this.close();
			},
		};
	}

	getRemoveResultItem(): ?MenuItemOptions
	{
		if (
			this.isDeletedMessage()
			|| !this.isOwnMessage()
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
					resultId: this.#getMessageResultId(),
				});

				this.close();
			},
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

		return !this.#getMessageResultId();
	}

	#shouldShowRemoveResult(): boolean
	{
		const task = this.#getTask();
		if (!task)
		{
			return false;
		}

		return this.#getMessageResultId() > 0;
	}

	#getMessageResultId(): number
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
				return Number(resultId);
			}
		}

		return 0;
	}

	#getTask(): ?TaskModel
	{
		return taskService.getStoreTask(this.getTaskId());
	}
};
