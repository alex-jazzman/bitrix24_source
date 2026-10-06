import { Type } from 'main.core';

// Modification-mode catalog.
// Mirrors (does not import) bizproc.automation's modifiersMap + applicability-by-type logic,
// adding a display `name` per modifier and the `name` modifier for `file`.

/**
 * The two type strings a source carries. `type` is the concrete field type, `baseType` the bizproc
 * base type behind it, and they part ways for user field types: a `S:Money` field is `string` at the
 * base, a custom date one is `datetime`. automation picks a specific one per modifier
 * (`enrichFieldsWithModifiers()`), so applicability needs both and not just one of them.
 *
 * `presentable` is the source schema telling that the provider prints the field itself — a funnel id
 * has a funnel name behind it. Such a field takes printable whatever its type is; a host that knows
 * nothing about it leaves the flag out and the type alone decides, as it always did.
 */
export type SourceTypes = {
	type: ?string,
	baseType: ?string,
	presentable?: boolean,
};

// A field of a user type: string at the base, but not the plain string type — automation offers the
// printable form for exactly these (`isCustomField`).
function isCustomType({ type, baseType }: SourceTypes): boolean
{
	return baseType === 'string' && type !== 'string';
}

export const MODIFIERS = Object.freeze([
	{
		id: 'friendly',
		nameInCode: 'friendly',
		wire: '> friendly',
		appliesTo: ({ type }: SourceTypes): boolean => type === 'user',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_FRIENDLY',
	},
	{
		id: 'printable',
		nameInCode: 'printable',
		wire: '> printable',
		appliesTo: (types: SourceTypes): boolean => (
			types.presentable === true
			|| ['bool', 'file'].includes(types.type)
			|| isCustomType(types)
		),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_PRINTABLE',
	},
	{
		id: 'server',
		nameInCode: 'server',
		wire: '> server',
		appliesTo: ({ baseType }: SourceTypes): boolean => ['date', 'datetime', 'time'].includes(baseType),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SERVER',
	},
	{
		id: 'responsible',
		nameInCode: 'responsible',
		wire: '> responsible',
		appliesTo: ({ baseType }: SourceTypes): boolean => ['date', 'datetime', 'time'].includes(baseType),
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_RESPONSIBLE',
	},
	{
		id: 'shortlink',
		nameInCode: 'shortLink',
		wire: '> shortlink',
		appliesTo: ({ type }: SourceTypes): boolean => type === 'file',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_SHORTLINK',
	},
	{
		id: 'name',
		nameInCode: 'name',
		wire: '> name',
		appliesTo: ({ type }: SourceTypes): boolean => type === 'file',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_MOD_NAME',
	},
]);

/**
 * A source type is "known" when node-settings provided at least one concrete type string.
 * Functions and manual input have no type at all, so their type is unknown.
 */
export function isSourceTypeKnown(types: ?SourceTypes): boolean
{
	return Type.isStringFilled(types?.type) || Type.isStringFilled(types?.baseType);
}

/**
 * Known type: only the modifiers applicable to it. Unknown type (nil/empty): all modifiers,
 * and the caller shows the warning.
 */
export function getApplicableModifiers(types: ?SourceTypes): Array<Object>
{
	if (!isSourceTypeKnown(types))
	{
		return [...MODIFIERS];
	}

	return MODIFIERS.filter((modifier) => modifier.appliesTo(types));
}

export function findModifierById(modifierId: string): ?Object
{
	return MODIFIERS.find((modifier) => modifier.id === modifierId) ?? null;
}

/**
 * Append a modifier to a source expression, mirroring automation's createNewField:
 * `{=Obj:Field}` -> `{=Obj:Field > modifier}`; `{{=expr}}` -> `{{=expr modifier}}`
 * (comment after `#` is dropped, as in automation).
 */
export function applyModifier(source: string, modifierWire: string): string
{
	if (!Type.isStringFilled(source) || !Type.isStringFilled(modifierWire))
	{
		return Type.isStringFilled(source) ? source : '';
	}

	const modifier = modifierWire.trim();

	if (source.startsWith('{{') && source.endsWith('}}'))
	{
		let inner = source.slice(2, -2);
		const commentIndex = inner.indexOf('#');
		if (commentIndex >= 0)
		{
			inner = inner.slice(0, commentIndex);
		}

		return `{{${inner.trim()} ${modifier}}}`;
	}

	if (source.startsWith('{=') && source.endsWith('}'))
	{
		const inner = source.slice(2, -1).trim();

		return `{=${inner} ${modifier}}`;
	}

	return `{=${source.trim()} ${modifier}}`;
}
