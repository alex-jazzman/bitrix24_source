import type { BaseAction } from './base-action';
import { actionMap, groupActionMap } from './action-map';

export class ActionFactory
{
	static createFromMap(
		actionMapping: Map<string, BaseAction>,
		actionId: string,
	): BaseAction | null
	{
		const ActionClass = actionMapping.get(actionId);

		return ActionClass ? new ActionClass() : null;
	}

	static create(actionId: string): BaseAction | null
	{
		return this.createFromMap(actionMap, actionId);
	}

	static createGroupAction(actionId: string): BaseAction | null
	{
		return this.createFromMap(groupActionMap, actionId);
	}
}
