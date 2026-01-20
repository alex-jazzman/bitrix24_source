import type { BaseAction, BaseActionType } from './base-action';
import { SyncAction } from './sync-action';
import { OpenSettingsAction } from './open-settings-action';

const actionMap = new Map([
	[SyncAction.getActionId(), SyncAction],
	[OpenSettingsAction.getActionId(), OpenSettingsAction],
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
