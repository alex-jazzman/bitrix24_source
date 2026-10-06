import { type EntityOptions } from 'ui.entity-selector';

import { EntityId } from './access-code-map';

/**
 * Tabs of the selection dialog and the options each of them is opened with.
 *
 * The user tab is limited to intranet employees on purpose. A person is saved as `IU{id}`, and the
 * intranet provider hands that code out only to a user who belongs to a department, so an extranet
 * user or a collaborator would produce a row that saves and reads fine yet grants nothing.
 * `intranetUsersOnly` filters the tab by the very same condition.
 */
export function buildDialogEntities(useStructureRoles: boolean): EntityOptions[]
{
	const entities: EntityOptions[] = [
		{
			id: EntityId.User,
			options: {
				intranetUsersOnly: true,
				emailUsers: false,
				inviteEmployeeLink: false,
				inviteGuestLink: false,
			},
		},
		{
			id: EntityId.Department,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true,
			},
		},
		{
			id: EntityId.SiteGroups,
			dynamicLoad: true,
			dynamicSearch: true,
		},
		{
			id: EntityId.ProjectAccessCodes,
		},
	];

	if (useStructureRoles)
	{
		entities.push(
			{
				id: EntityId.StructureRole,
				// Team roles are out of scope, so the tab is limited to departments at the source.
				options: { includedNodeEntityTypes: ['department'] },
				dynamicLoad: true,
				dynamicSearch: true,
			},
			{
				id: EntityId.UserGroups,
				dynamicLoad: true,
			},
		);
	}

	return entities;
}
