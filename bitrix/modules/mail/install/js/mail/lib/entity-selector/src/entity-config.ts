import { type SelectorEntityConfig, type UserSelectorOptions } from './types';

export function getIntranetUserSelectorOptions(): UserSelectorOptions
{
	return {
		intranetUsersOnly: true,
		emailUsers: false,
		inviteEmployeeLink: false,
		inviteGuestLink: false,
	};
}

export function getUserDepartmentEntities(
	userOptions: UserSelectorOptions = getIntranetUserSelectorOptions(),
): SelectorEntityConfig[]
{
	return [
		{
			id: 'user',
			dynamicLoad: true,
			dynamicSearch: true,
			options: { ...userOptions },
		},
		{
			id: 'department',
			dynamicLoad: true,
			dynamicSearch: true,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true,
				userOptions: { ...userOptions },
			},
		},
	];
}
