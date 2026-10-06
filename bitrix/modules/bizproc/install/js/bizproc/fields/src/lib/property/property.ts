import { Type } from 'main.core';
import { type Property } from '../../const/type';

export function isMultiple(property: Property): boolean
{
	return property.Multiple === true;
}

/**
 * A legacy feeder sends AllowSelection as `'Y'`/`'N'` rather than a strict boolean, so the
 * value goes through toBool - the way the backend CBPHelper::getBool reads it. An unsaid
 * flag keeps allowing insertion; a reader with a stricter default normalizes the same way.
 */
export function isSelectable(property: Property): boolean
{
	if (Type.isUndefined(property.AllowSelection))
	{
		return true;
	}

	return toBool(property.AllowSelection);
}

export function isRequired(property: Property): boolean
{
	return property.Required === true;
}

export function getControlName(fieldName: string, property: Property): string
{
	return isMultiple(property) ? `${fieldName}[]` : fieldName;
}

export function isReadOnly(property: Property): boolean
{
	return property.ReadOnly === true;
}

/**
 * Mirrors CBPHelper::getBool blacklist semantics: false for the PHP-empty shapes
 * (null/false/0/''/'0'/empty array), the string 'false' and the case-insensitive flag
 * 'N'; anything else is Boolean(value) - so legacy truthy shapes like `2`, `'yes'` or
 * `'y'` count as true.
 */
export function toBool(value: unknown): boolean
{
	if (
		Type.isNil(value)
		|| value === false
		|| value === 0
		|| value === ''
		|| value === '0'
		|| value === 'false'
		|| (Type.isString(value) && value.toUpperCase() === 'N')
		|| (Type.isArray(value) && value.length === 0)
	)
	{
		return false;
	}

	return Boolean(value);
}
