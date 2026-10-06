import { Type } from 'main.core';

/**
 * Single value the dedicated controls of the constant form work with. The form edits one default
 * value, while the stored default of a multiple constant may be an array: the wizard never writes
 * one, but a template built outside it (import, REST, template generator) does, and the array is a
 * legitimate part of the `default` contract. The first element is taken, the way
 * Bitrix\Bizproc\BaseType\Date::toSingleValue does it on the server.
 */
export function toSingleDefaultValue(defaultValue: mixed): string
{
	const value = Type.isArray(defaultValue) ? defaultValue[0] : defaultValue;

	if (Type.isString(value))
	{
		return value;
	}

	return Type.isNumber(value) ? String(value) : '';
}
