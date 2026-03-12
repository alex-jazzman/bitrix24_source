import { ActionFactory } from './group-actions/group-action-factory';
import { ajax } from 'main.core';

export type ActionParamsType = {
	actionId: string,
	gridId: string,
	filter: Array,
	isCloud: boolean,
	isFirstAdminConfirmationEnabled: ?boolean,
	currentUserId: ?number,
	currentUserName: ?string,
}

export class Panel
{
	static executeAction(params: ActionParamsType) {
		try
		{
			const grid = BX.Main.gridManager.getById(params.gridId)?.instance;

			if (params.isCloud && params.isFirstAdminConfirmationEnabled)
			{
				Panel.checkFirstAdminInSelection(grid).then((firstAdminId) => {
					const action = ActionFactory.createAction(params.actionId, {
						grid,
						filter: params.filter,
						isCloud: params.isCloud,
						isFirstAdminConfirmationEnabled: params.isFirstAdminConfirmationEnabled,
						currentUserId: params.currentUserId,
						currentUserName: params.currentUserName,
						firstAdminId,
					});
					action.execute();
				})
					.catch((error) => {
						console.error('Error checking first admin in selection:', error);
					});
			}
			else
			{
				const action = ActionFactory.createAction(params.actionId, {
					grid,
					filter: params.filter,
					isCloud: params.isCloud,
					isFirstAdminConfirmationEnabled: params.isFirstAdminConfirmationEnabled,
					currentUserId: params.currentUserId,
					currentUserName: params.currentUserName,
					firstAdminId: null,
				});
				action.execute();
			}
		}
		catch (error)
		{
			console.error('Error executing action:', error);
		}
	}

	static checkFirstAdminInSelection(grid: BX.Main.grid): Promise
	{
		const selectedRows = grid.getRows().getSelectedIds();

		return ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.getPortalCreator')
			.then((response) => {
				const portalCreatorId = Number(response.data.id);
				const found = selectedRows.find((userId) => Number(userId) === portalCreatorId);

				return found ? portalCreatorId : null;
			})
			.catch(() => {
				return null;
			});
	}
}
