import { Type } from 'main.core';

export const USER_ENTITY_TYPES = Object.freeze({
	USER: 'user',
	DEPARTMENT: 'structure-node',
});

// The editor writes user-constant defaults in bizproc's internal format (`user_5`, `group_hr5` for a
// flat department, `group_hrr5` for a department subtree). This internal format is accepted by the
// launch form's value parser and by the backend (CBPHelper::UsersStringToArray). Note that the launch
// form field itself emits the printable form (`Name[5]`, `Name[HR5]`, `Name[HRR5]`) on user input;
// the parsers below accept both that printable form and a bare numeric id for backward compatibility.
const VALUE_PARSERS = [
	{
		template: /\[hrr(\d+)]$/i,
		format: (match) => [USER_ENTITY_TYPES.DEPARTMENT, match[1]],
	},
	{
		template: /\[hr(\d+)]$/i,
		format: (match) => [USER_ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`],
	},
	{
		template: /\[(\d+)]$/,
		format: (match) => [USER_ENTITY_TYPES.USER, match[1]],
	},
	{
		template: /^group_hrr(\d+)$/i,
		format: (match) => [USER_ENTITY_TYPES.DEPARTMENT, match[1]],
	},
	{
		template: /^group_hr(\d+)$/i,
		format: (match) => [USER_ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`],
	},
	{
		template: /^user_(\d+)$/i,
		format: (match) => [USER_ENTITY_TYPES.USER, match[1]],
	},
	{
		template: /^(\d+)$/,
		format: (match) => [USER_ENTITY_TYPES.USER, match[1]],
	},
];

export function parseUserValue(rawValue: string): Array | null
{
	const value = String(rawValue).trim();
	if (!value)
	{
		return null;
	}

	for (const parser of VALUE_PARSERS)
	{
		const match = value.match(parser.template);
		if (match)
		{
			return parser.format(match);
		}
	}

	// Keep an unrecognized legacy value as a user reference instead of dropping it silently.
	return [USER_ENTITY_TYPES.USER, value];
}

export function normalizeUserValue(modelValue: string | Array<string>, multiple: boolean): Array<string>
{
	if (multiple && Type.isStringFilled(modelValue))
	{
		return modelValue.split(';');
	}

	if (Type.isArray(modelValue))
	{
		return modelValue;
	}

	return modelValue ? [String(modelValue)] : [];
}

export function buildUserPreselectedItems(modelValue: string | Array<string>, multiple: boolean): Array
{
	return normalizeUserValue(modelValue, multiple)
		.map((element) => parseUserValue(element))
		.filter(Boolean)
	;
}

export function getUserSelectorEntities(): Array
{
	return [
		{
			id: USER_ENTITY_TYPES.USER,
			options: { inviteEmployeeLink: false },
		},
		{
			id: USER_ENTITY_TYPES.DEPARTMENT,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true,
			},
		},
	];
}
