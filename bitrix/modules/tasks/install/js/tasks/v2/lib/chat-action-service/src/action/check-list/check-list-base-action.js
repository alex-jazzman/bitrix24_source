import { Loc } from 'main.core';
import { BaseAction } from '../base-action';
import { chatHint } from '../../chat-hint';

export class CheckListBaseAction extends BaseAction
{
	showCheckListRemovedHint(bindElement: HTMLElement, coordinates: Object): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_REMOVED_HINT'),
			{ bindElement, coordinates },
		);
	}

	showCheckListItemsRemovedHint(bindElement: HTMLElement, coordinates: Object): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_ITEMS_REMOVED_HINT'),
			{ bindElement, coordinates },
		);
	}
}
