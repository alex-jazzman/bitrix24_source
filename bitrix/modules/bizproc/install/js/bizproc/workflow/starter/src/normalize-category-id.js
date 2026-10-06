import { Text, Type } from 'main.core';

export function normalizeCategoryId(categoryId: mixed): ?number
{
	if (Type.isNil(categoryId) || categoryId === '')
	{
		return null;
	}

	if (Type.isNumber(categoryId))
	{
		return Text.toInteger(categoryId);
	}

	if (!Type.isStringFilled(categoryId) || Number.isNaN(Number(categoryId)))
	{
		return null;
	}

	return Text.toInteger(categoryId);
}
