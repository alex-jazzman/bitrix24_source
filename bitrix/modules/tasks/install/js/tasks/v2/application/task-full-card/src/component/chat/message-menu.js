import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.vue';

import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';
import type { TaskModel } from 'tasks.v2.model.tasks';

// eslint-disable-next-line no-unused-vars
import type { MessageMenu } from 'im.v2.lib.menu';

const MenuSectionCode = Object.freeze({
	first: 'first',
	second: 'second',
	third: 'third',
});
/**
 * @param {typeof MessageMenu} baseMenu
 * @returns {typeof MessageMenu}
 */
// eslint-disable-next-line max-lines-per-function
export const TaskFullCardMessageMenu = (baseMenu) => class extends baseMenu
{
	context: Object;
	close: Function;

	getMenuItems(): MenuItemOptions[] | null[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getAddResultItem(),
			this.getRemoveResultItem(),
			...this.getAdditionalItems(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems([this.getDeleteItem()], MenuSectionCode.second),
		];
	}

	getNestedItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getPinItem(),
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.getCreateMeetingItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(this.getMarketItems(), MenuSectionCode.second),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getAddResultItem(): ?MenuItemOptions
	{
		if (
			this.#isDeletedMessage()
			|| !this.#isOwnMessage()
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
			this.#isDeletedMessage()
			|| !this.#isOwnMessage()
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

	getCreateTaskItem(): null
	{
		return null;
	}

	getMarkItem(): null
	{
		return null;
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

	#isDeletedMessage(): boolean
	{
		return this.context.isDeleted;
	}

	#isOwnMessage(): boolean
	{
		return this.context.authorId === Core.getParams().currentUser.id;
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
