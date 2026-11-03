import { Loc, Type } from 'main.core';

export type EntityTextContext = {
	entityTypeId?: number,
	entityTypeName?: string,
	entityTypeCaption?: string,
};

const FIXED_ENTITY_TYPE_NAMES = new Set(['DEAL', 'LEAD', 'QUOTE', 'SMART_INVOICE']);

export function getEntityMessageCodeCandidates(baseCode: string, context: EntityTextContext = {}): string[]
{
	const entityTypeName = Type.isStringFilled(context.entityTypeName)
		? context.entityTypeName.toUpperCase()
		: ''
	;

	if (FIXED_ENTITY_TYPE_NAMES.has(entityTypeName))
	{
		return [`${baseCode}_${entityTypeName}`, baseCode];
	}

	if (entityTypeName.startsWith('DYNAMIC_'))
	{
		return [`${baseCode}_DYNAMIC`, baseCode];
	}

	return [baseCode];
}

export function getEntityMessage(
	baseCode: string,
	context: EntityTextContext = {},
	replacements: Record<string, string> = {},
): string
{
	for (const code of getEntityMessageCodeCandidates(baseCode, context))
	{
		const message = Loc.getMessage(code, replacements);
		if (Type.isStringFilled(message))
		{
			return message;
		}
	}

	return '';
}
