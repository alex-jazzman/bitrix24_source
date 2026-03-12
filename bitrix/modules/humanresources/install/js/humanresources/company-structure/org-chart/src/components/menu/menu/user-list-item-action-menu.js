import { EntityTypes } from 'humanresources.company-structure.utils';
import { AbstractActionMenu } from '../abstract-action-menu';
import { FireUserFromCompanyMenuItem } from '../items/user-item/fire-user-from-company';
import { MoveFromDepartmentMenuItem } from '../items/user-item/move-from-department';
import { RemoveFromDepartmentMenuItem } from '../items/user-item/remove-from-department';
import { ShowMultiRoleUserSettingsMenuItem } from '../items/user-item/show-multirole-user-settings';

export class UserListActionMenu extends AbstractActionMenu
{
	isUserInvited: boolean;
	isUserMultiple: boolean;

	constructor(entityId: number, entityType: string, isUserInvited: boolean, isUserMultiple: boolean)
	{
		super(entityId);
		this.isUserInvited = isUserInvited;
		this.isUserMultiple = isUserMultiple;
		this.entityType = entityType;
		this.items = this.getFilteredItems();
	}

	getItems(): Array
	{
		let items = [];

		if (this.entityType === EntityTypes.team)
		{
			items = [
				new MoveFromDepartmentMenuItem(this.entityType),
				new RemoveFromDepartmentMenuItem(this.entityType),
			];
		}
		else
		{
			items = [new MoveFromDepartmentMenuItem(this.entityType)];

			if (this.isUserMultiple)
			{
				items.push(new ShowMultiRoleUserSettingsMenuItem());
			}

			items.push(
				new RemoveFromDepartmentMenuItem(this.entityType),
				new FireUserFromCompanyMenuItem(this.isUserInvited),
			);
		}

		return items;
	}
}
