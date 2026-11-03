import { Extension, Type } from 'main.core';

// Fallback for the dictionary served by SharingMemberType::forExtension(): the settings node
// still wins, the copy only keeps appearance working on a page cached without that node.
const fallbackMemberType = Object.freeze({
	employee: 'employee',
	extranet: 'extranet',
	collaber: 'collaber',
	group: 'group',
	department: 'department',
});

/**
 * Builds the member type dictionary from the extension settings value,
 * filling missing entries from the fallback so every type keeps a usable value.
 */
export function resolveMemberTypeDictionary(settingsMemberTypes: mixed): { [string]: string }
{
	const settingsValues = Type.isPlainObject(settingsMemberTypes) ? settingsMemberTypes : {};

	const dictionary = {};
	for (const [key, fallbackValue] of Object.entries(fallbackMemberType))
	{
		dictionary[key] = Type.isStringFilled(settingsValues[key]) ? settingsValues[key] : fallbackValue;
	}

	return Object.freeze(dictionary);
}

// Dictionary of member type values, served by SharingMemberType::forExtension().
export const MemberType = resolveMemberTypeDictionary(
	Extension.getSettings('disk.sharing-access-popup').get('memberTypes', null),
);

export const MemberImageKey = Object.freeze({
	Employee: 'employee',
	Extranet: 'extranet',
	Collaber: 'collaber',
	Group: 'group',
	Department: 'department',
	Unknown: 'unknown',
});

export type MemberAppearance = {
	labelKey: string | null,
	labelColor: string | null,
	nameColor: string,
	imageKey: string,
};

const appearanceByKey = Object.freeze({
	employee: {
		labelKey: null,
		labelColor: null,
		nameColor: '--ui-color-base-1',
		imageKey: MemberImageKey.Employee,
	},
	extranet: {
		labelKey: 'DISK_SHARING_ACCESS_POPUP_MEMBER_TYPE_EXTRANET',
		labelColor: '--ui-color-accent-extra-orange',
		nameColor: '--ui-color-accent-extra-orange',
		imageKey: MemberImageKey.Extranet,
	},
	collaber: {
		labelKey: 'DISK_SHARING_ACCESS_POPUP_MEMBER_TYPE_COLLABER',
		labelColor: '--ui-color-collab-element-1',
		nameColor: '--ui-color-collab-element-1',
		imageKey: MemberImageKey.Collaber,
	},
	group: {
		labelKey: 'DISK_SHARING_ACCESS_POPUP_MEMBER_TYPE_GROUP',
		labelColor: '--ui-color-base-4',
		nameColor: '--ui-color-base-1',
		imageKey: MemberImageKey.Group,
	},
	department: {
		labelKey: 'DISK_SHARING_ACCESS_POPUP_MEMBER_TYPE_DEPARTMENT',
		labelColor: '--ui-color-base-4',
		nameColor: '--ui-color-base-1',
		imageKey: MemberImageKey.Department,
	},
});

const unknownAppearance = Object.freeze({
	labelKey: null,
	labelColor: null,
	nameColor: '--ui-color-base-1',
	imageKey: MemberImageKey.Unknown,
});

// Keyed by the member type value: a Map avoids computed object keys, which would collapse
// the whole map into one entry if the dictionary ever lost a value.
const appearanceByType = new Map(
	Object.keys(appearanceByKey).map((key) => [MemberType[key], appearanceByKey[key]]),
);

/**
 * Resolves the row appearance (label phrase key, colors, default image key) for a member type.
 * `null` (chat branch or unrecognized selector type) resolves to the undefined appearance.
 * The image key names the `access-private-user__avatar--*` class that carries the default image.
 */
export function resolveMemberAppearance(memberType: ?string): MemberAppearance
{
	return appearanceByType.get(memberType) ?? unknownAppearance;
}

/**
 * Normalizes a selector entity into a domain member type.
 * Inputs come from UserProvider::getUserType(); the provider set is wider than the domain,
 * so values cannot be accepted as-is. Returns `null` for the undefined appearance.
 */
export function normalizeSelectorType(entityId: string, entityType: ?string): ?string
{
	if (entityId === 'project')
	{
		return MemberType.group;
	}

	if (entityId === 'department')
	{
		return MemberType.department;
	}

	switch (entityType)
	{
		case 'collaber':
			return MemberType.collaber;

		case 'extranet':
		case 'email':
			return MemberType.extranet;

		case 'employee':
		case 'integrator':
		case 'user':
			return MemberType.employee;

		default:
			return null;
	}
}
