import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { CheckListBaseAction } from './check-list-base-action';
import type { ActionPayload } from '../../type/action-payload';

class ShowCheckListItemsAction extends CheckListBaseAction
{
	getName(): string
	{
		return ChatAction.ShowCheckListItems;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		const { entityId, childrenIds, bindElement, coordinates } = payload;

		if (!checkListService.isCheckListExists(entityId))
		{
			this.showCheckListRemovedHint(bindElement, coordinates);

			return;
		}

		const filteredItems = checkListService.filterItemsBelongingToCheckList(entityId, childrenIds);

		if (filteredItems.length === 0)
		{
			this.showCheckListItemsRemovedHint(bindElement, coordinates);

			return;
		}

		EventEmitter.emit(EventName.ShowCheckListItems, { checkListItemIds: filteredItems.slice(0, 10) });
	}
}

export const showCheckListItemsAction = new ShowCheckListItemsAction();
