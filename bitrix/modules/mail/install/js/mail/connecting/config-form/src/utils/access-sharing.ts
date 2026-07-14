export type SelectorTag = {
	getEntityId(): string;
	getId(): string | number;
};

export type SelectorPreselectedItem = [string, string | number];

export function getAccessUserOptions(): { [key: string]: boolean }
{
	return {
		intranetUsersOnly: true,
		emailUsers: false,
		inviteEmployeeLink: false,
		inviteGuestLink: false,
	};
}

export function getSelectorItemByAccessCode(code: string): SelectorPreselectedItem | null
{
	const userMatch = code.match(/^U(\d+)$/);
	if (userMatch)
	{
		return ['user', userMatch[1]];
	}

	const recursiveDepartmentMatch = code.match(/^DR(\d+)$/);
	if (recursiveDepartmentMatch)
	{
		return ['department', recursiveDepartmentMatch[1]];
	}

	const flatDepartmentMatch = code.match(/^D(\d+)$/);
	if (flatDepartmentMatch)
	{
		return ['department', `${flatDepartmentMatch[1]}:F`];
	}

	return null;
}

export function getAccessCodeBySelectorTag(tag: SelectorTag): string | null
{
	const entityId = tag.getEntityId();
	const itemId = String(tag.getId());

	if (entityId === 'user')
	{
		return `U${itemId}`;
	}

	if (entityId === 'department')
	{
		const flatDepartmentMatch = itemId.match(/^(\d+):F$/);
		if (flatDepartmentMatch)
		{
			return `D${flatDepartmentMatch[1]}`;
		}

		const recursiveDepartmentMatch = itemId.match(/^\d+$/);
		if (recursiveDepartmentMatch)
		{
			return `DR${itemId}`;
		}
	}

	return null;
}
