import type { BaseAction, BaseActionType } from './base-action';
import { SyncAction } from './sync-action';
import { OpenSettingsAction } from './open-settings-action';
import { RejectMailboxConnectionRequestAction } from './reject-mailbox-connection-request-action';
import { ConnectMailboxConnectionRequestAction } from './connect-mailbox-connection-request-action';
import { MassDisconnectAction } from './mass-disconnect-action';
import { MassCrmEnableAction, MassCrmDisableAction } from './mass-crm-action';
import { MassCalendarEnableAction, MassCalendarDisableAction } from './mass-calendar-action';
import { MassCrmConfigureAction } from './mass-crm-configure-action';

const actionMap = new Map([
	[SyncAction.getActionId(), SyncAction],
	[OpenSettingsAction.getActionId(), OpenSettingsAction],
	[RejectMailboxConnectionRequestAction.getActionId(), RejectMailboxConnectionRequestAction],
	[ConnectMailboxConnectionRequestAction.getActionId(), ConnectMailboxConnectionRequestAction],
	[MassDisconnectAction.getActionId(), MassDisconnectAction],
	[MassCrmEnableAction.getActionId(), MassCrmEnableAction],
	[MassCrmDisableAction.getActionId(), MassCrmDisableAction],
	[MassCalendarEnableAction.getActionId(), MassCalendarEnableAction],
	[MassCalendarDisableAction.getActionId(), MassCalendarDisableAction],
	[MassCrmConfigureAction.getActionId(), MassCrmConfigureAction],
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
