import { Loc, Type } from 'main.core';

import { ChatAction, GroupType, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { Store } from 'ui.vue3.vuex';

import { chatHint } from '../chat-hint';
import { BaseAction } from './base-action';
import type { ActionPayload } from '../type/action-payload';

class OpenGroupAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.OpenGroup;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (!this.#isLinkedToCurrentTask(payload))
		{
			this.#showGroupUnlinkedHint(payload);

			return;
		}

		await this.#openGroup(payload);
	}

	#isLinkedToCurrentTask(payload: ActionPayload): boolean
	{
		const { entityId, taskId } = payload;

		const task = taskService.getStoreTask(taskId);

		return Type.isNumber(task?.groupId) && task.groupId > 0 && task.groupId === entityId;
	}

	#showGroupUnlinkedHint(payload: ActionPayload): void
	{
		void chatHint.show(Loc.getMessage('TASKS_V2_CHAT_ACTION_OPEN_GROUP_UNLINKED'), payload);
	}

	async #openGroup(payload: ActionPayload): void
	{
		const { entityId: groupId } = payload;

		const group = this.$store.getters[`${Model.Groups}/getById`](groupId);

		const href = await groupService.getUrl(groupId, group.type);

		BX.SidePanel.Instance.emulateAnchorClick(href);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const openGroupAction = new OpenGroupAction();
