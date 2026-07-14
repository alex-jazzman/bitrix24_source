export function getSelectorItemByAccessCode(accessCode)
{
	const value = String(accessCode);

	if (value.startsWith('U'))
	{
		return ['user', value.slice(1)];
	}

	if (value.startsWith('SG'))
	{
		return ['project', value.slice(2)];
	}

	if (value.startsWith('DR'))
	{
		return ['department', value.slice(2)];
	}

	return null;
}

export function getAccessCodeByDialogItem(item)
{
	const entityId = item.getEntityId();
	const id = String(item.getId());

	switch (entityId)
	{
		case 'user':
			return `U${id}`;

		case 'project':
			return `SG${id}`;

		case 'department':
			return `DR${id}`;

		default:
			return null;
	}
}