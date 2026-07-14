import { Loc } from 'main.core';

export const ACCESS_PUBLIC_RIGHT_LABELS = {
	read: () => Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_READ'),
	edit: () => Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE'),
};

export function buildPublicAccessItems(rightsList)
{
	const uniqueRights = Array.isArray(rightsList) ? [...new Set(rightsList)] : [];
	const unknownRights = [];

	const items = uniqueRights
		.filter((id) => {
			const hasLabel = Boolean(ACCESS_PUBLIC_RIGHT_LABELS[id]);

			if (!hasLabel)
			{
				unknownRights.push(id);
			}

			return hasLabel;
		})
		.map((id) => ({
			id,
			title: ACCESS_PUBLIC_RIGHT_LABELS[id](),
		}));

	return { items, unknownRights };
}

export const ACCESS_PRIVATE_SELECT_ITEMS = [
	{ id: 'R', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_READ') },
	{ id: 'W', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE') },
	{ id: 'D', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_DENIED') },
];

export const ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS = [
	{ id: 'disk_access_read', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_VIEW') },
	{ id: 'disk_access_add', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_ADD') },
	{ id: 'disk_access_edit', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE') },
	{ id: 'disk_access_full', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_FULL') },
];

export const ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT = [
	{ id: 'disk_access_read', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_VIEW') },
	{ id: 'disk_access_add', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_ADD') },
	{ id: 'disk_access_edit', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE_SHORT') },
	{ id: 'disk_access_full', title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_FULL_SHORT') },
];

export const TASK_WEIGHT = {
	disk_access_read: 2,
	disk_access_add: 3,
	disk_access_edit: 4,
	disk_access_full: 5,
};

export const DEFAULT_MAX_TASK_NAME = 'disk_access_full';
export const PREFERRED_DEFAULT_TASK_NAME = 'disk_access_edit';

export const TYPE_FILE_DOCUMENT = 4;
export const TYPE_FILE_BOARD = 12;
export const HELP_DESK_SLIDER_CODE_DESCRIPTION = '25483894';

export const ACCESS_PRIVATE_SELECT_FULL_TEXT = {
	'R': 'VIEW',
	'W': 'EDIT',
	'D': 'DENIED',
}
