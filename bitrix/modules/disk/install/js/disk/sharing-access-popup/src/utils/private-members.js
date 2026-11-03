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

// The project provider keeps the workgroup avatar preset in the same `avatar` field as an
// uploaded image (Socialnetwork\Helper\Workgroup::getAvatarEntitySelectorUrl), while the server
// fills ownAvatar from IMAGE_ID only. Presets are static files shipped with the product, so the
// directory they live in is the only thing that tells them apart from an uploaded image.
const workgroupPresetAvatarPath = '/bitrix/images/socialnetwork/workgroup/';

/**
 * Returns the member own picture taken from a selector item, or null when the item carries
 * nothing but a provider preset.
 */
export function getOwnAvatarByDialogItem(item): ?string
{
	const avatar = item.avatar ?? null;
	if (avatar === null)
	{
		return null;
	}

	if (item.getEntityId() === 'project' && avatar.startsWith(workgroupPresetAvatarPath))
	{
		return null;
	}

	return avatar;
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
