import { Loc } from 'main.core';

import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { BaseAction } from '../base-action';
import { chatHint } from '../../chat-hint';
import type { ActionPayload } from '../../type/action-payload';
import type { Coordinates } from '../../type/coordinates';

export class CheckListBaseAction extends BaseAction
{
	get needsTaskData(): boolean
	{
		return true;
	}

	get redirectsToTaskWhenNotReady(): boolean
	{
		return true;
	}

	isReady(payload: ActionPayload): boolean
	{
		return this.#hasLoadedTask(payload) && !this.#isStoreBehind(payload);
	}

	// the refreshed tree is merged into the store task, so there is nothing to refresh without one
	needsRefresh(payload: ActionPayload): boolean
	{
		return this.#hasLoadedTask(payload) && this.#isStoreBehind(payload);
	}

	async refreshData(payload: ActionPayload): Promise<boolean>
	{
		try
		{
			await checkListService.refresh(payload.taskId, this.getCheckedEntityIds(payload));

			return true;
		}
		catch
		{
			this.#showLoadFailedHint(payload.bindElement, payload.coordinates);

			return false;
		}
	}

	showCheckListRemovedHint(bindElement: HTMLElement, coordinates: Object): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_REMOVED_HINT_MSGVER_1'),
			{ bindElement, coordinates },
		);
	}

	showCheckListItemsRemovedHint(bindElement: HTMLElement, coordinates: Object): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_ITEMS_REMOVED_HINT_MSGVER_1'),
			{ bindElement, coordinates },
		);
	}

	getCheckedEntityIds(payload: ActionPayload): number[]
	{
		return [payload.entityId];
	}

	#hasLoadedTask(payload: ActionPayload): boolean
	{
		return taskService.hasStoreTask(payload.taskId, false);
	}

	// an entity missing from the store is a removal only once the server was asked about this very
	// entity: a tree loaded before the entity appeared misses it exactly like a tree where it was
	// deleted, and the local revision moves only with pull, so it cannot vouch for the whole tree
	#isStoreBehind(payload: ActionPayload): boolean
	{
		return this.#lacksEntity(payload)
			&& !checkListService.hasCheckedEntities(payload.taskId, this.getCheckedEntityIds(payload));
	}

	// the check is made against the tree of payload.taskId, while the check list store keeps the trees
	// of every loaded task, so an entity outside this task's tree confirms nothing about this task
	#lacksEntity(payload: ActionPayload): boolean
	{
		if (this.isTooltipOnly(payload))
		{
			return true;
		}

		const checkListIds = taskService.getStoreTask(payload.taskId)?.checklist ?? [];

		return !checkListIds.includes(payload.entityId);
	}

	#showLoadFailedHint(bindElement: HTMLElement, coordinates: ?Coordinates): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_LOAD_FAILED'),
			{ bindElement, coordinates },
		);
	}
}
