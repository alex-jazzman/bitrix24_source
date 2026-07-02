import type { BaseAction, BaseActionType } from './base-action';
import { SyncAction } from './sync-action';
import { OpenSettingsAction } from './open-settings-action';
import { RejectMailboxConnectionRequestAction } from './reject-mailbox-connection-request-action';
import { ConnectMailboxConnectionRequestAction } from './connect-mailbox-connection-request-action';

const actionMap = new Map([
	[SyncAction.getActionId(), SyncAction],
	[OpenSettingsAction.getActionId(), OpenSettingsAction],
	[RejectMailboxConnectionRequestAction.getActionId(), RejectMailboxConnectionRequestAction],
	[ConnectMailboxConnectionRequestAction.getActionId(), ConnectMailboxConnectionRequestAction],
]);

export class ActionFactory
{
	static create(actionId: string, options: BaseActionType): ?BaseAction
	{
		const ActionClass = actionMap.get(actionId);
		if (ActionClass)
		{
			return new ActionClass(options);
		}

		return null;
	}
}
