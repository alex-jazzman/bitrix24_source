import { Type } from 'main.core';
import { type Property, type RenderModeValue } from '../../const/type';
import { RenderMode } from '../../const/const';

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

/**
 * Whether value insertion is open to this field at all, mode included - the rule the core
 * actually lives by, as opposed to the raw flag isSelectable() reads. Public mode is the live
 * document rather than the designer, so an unsaid AllowSelection reads as "no" there and keeps
 * reading as "yes" everywhere else. Designer and NewDesigner are the same side of that line.
 *
 * Mirrors the backend, where Base::renderControlSingle draws the expression companion strictly
 * under $allowSelection.
 */
export function isSelectionAllowed(property: Property, renderMode: RenderModeValue): boolean
{
	if (renderMode === RenderMode.Public)
	{
		return toBool(property.AllowSelection);
	}

	return isSelectable(property);
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
