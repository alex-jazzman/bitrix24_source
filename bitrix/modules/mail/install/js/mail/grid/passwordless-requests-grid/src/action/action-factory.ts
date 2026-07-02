import { type BaseAction, type BaseActionType } from './base-action';
import { EditAction } from './edit-action';
import { RevokeAction } from './revoke-action';
import { ResendAction } from './resend-action';
import { DeleteAction } from './delete-action';

const actionMap = new Map([
	[EditAction.getActionId(), EditAction],
	[RevokeAction.getActionId(), RevokeAction],
	[ResendAction.getActionId(), ResendAction],
	[DeleteAction.getActionId(), DeleteAction],
]);

export class ActionFactory
{
	static create(actionId: string, options: BaseActionType): BaseAction | null | undefined
	{
		const ActionClass = actionMap.get(actionId);
		if (ActionClass)
		{
			return new ActionClass(options);
		}

		return null;
	}
}
