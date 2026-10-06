import { Type } from 'main.core';

export function isTemplateId(value: ?(number | string)): boolean
{
	if (!Type.isNumber(value) && !Type.isStringFilled(value))
	{
		return false;
	}

	const templateId = Number(value);

	return Number.isInteger(templateId) && templateId > 0;
}
