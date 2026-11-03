import { Type } from 'main.core';

export function isRequiredField(field: Object): boolean
{
	return Boolean(field?.property?.Required || field?.property?.RequiredMark);
}

export function hasVisibleFieldLabel(field: Object): boolean
{
	return !field?.property?.Hidden
		&& Type.isStringFilled(field?.property?.Name)
		&& field?.property?.ShowFieldLabel !== false
	;
}
