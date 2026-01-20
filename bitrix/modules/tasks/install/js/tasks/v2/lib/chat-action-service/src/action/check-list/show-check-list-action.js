import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { CheckListBaseAction } from './check-list-base-action';
import type { ActionPayload } from '../../type/action-payload';

class ShowCheckListAction extends CheckListBaseAction
{
	getName(): string
	{
		return ChatAction.ShowCheckList;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		const { entityId, bindElement, coordinates } = payload;

		if (!checkListService.isCheckListExists(entityId))
		{
			this.showCheckListRemovedHint(bindElement, coordinates);

			return;
		}

		EventEmitter.emit(EventName.ShowCheckList, { checkListId: entityId });
	}
}

export const showCheckListAction = new ShowCheckListAction();
