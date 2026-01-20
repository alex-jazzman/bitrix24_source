import { ActionFactory } from './action/action-factory';

export type ActionParamsType = {
	actionId: string,
	gridId: string,
	filter: Array,
	showPopups: ?boolean;
}

export class Panel
{
	static executeAction(params: ActionParamsType)
	{
		try
		{
			const action = ActionFactory.createGroupAction(params.actionId, {
				grid: BX.Main.gridManager.getById(params.gridId)?.instance,
				filter: params.filter,
			});

			action.execute();
		}
		catch (error)
		{
			console.error('Error executing action:', error);
		}
	}
}
