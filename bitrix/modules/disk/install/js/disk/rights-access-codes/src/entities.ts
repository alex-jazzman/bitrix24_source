import { EntityId } from './access-code';

export type DialogEntityOptions = {
	selectMode?: string,
	allowSelectRootDepartment?: boolean,
	allowFlatDepartments?: boolean,
	emailUsers?: boolean,
	inviteEmployeeLink?: boolean,
	inviteGuestLink?: boolean,
};

export type DialogEntity = {
	id: string,
	options?: DialogEntityOptions,
	dynamicLoad?: boolean,
	dynamicSearch?: boolean,
};

export function getDialogEntities(isBitrix24: boolean): DialogEntity[]
{
	const entities: DialogEntity[] = [
		{
			id: EntityId.User,
			options: {
				// The recipients stay as wide as the legacy provider offered them: collabers and
				// extranet users are grantees of the folders this component serves.
				emailUsers: false,
				// Both invite links off leave the provider without a footer to build.
				inviteEmployeeLink: false,
				inviteGuestLink: false,
			},
		},
		{
			id: EntityId.Department,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				// Gives the "department itself" item, whose id carries the :F suffix and maps to D{id}.
				allowFlatDepartments: true,
			},
		},
		{
			id: EntityId.ProjectAccessCodes,
		},
		{
			// The provider builds AU and CR in fillDialog(), which the dialog calls for dynamic entities only.
			id: EntityId.SpecialAccess,
			dynamicLoad: true,
		},
	];

	if (!isBitrix24)
	{
		entities.push({
			// The registry keeps no defaults for this entity, so tab and search stay empty without the flags.
			id: EntityId.SiteGroups,
			dynamicLoad: true,
			dynamicSearch: true,
		});
	}

	return entities;
}
