import type { BaseActionType } from '../types';

import type { BaseAction } from './base-action';
import { actionMap, groupActionMap } from './action-map';

export class ActionFactory
{
	static createFromMap(
		actionMapping: Map<string, BaseAction>,
		actionId: string,
		options: BaseActionType,
	): BaseAction | null
	{
		const ActionClass = actionMapping.get(actionId);

		return ActionClass ? new ActionClass(options) : null;
	}

	static create(actionId: string, options: BaseActionType): BaseAction | null
	{
		return this.createFromMap(actionMap, actionId, options);
	}

	static createGroupAction(actionId: string, options: BaseActionType): BaseAction | null
	{
		return this.createFromMap(groupActionMap, actionId, options);
	}
}
