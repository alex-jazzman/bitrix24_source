import { Type } from 'main.core';
import { type ControllerError } from '../type';

function isFilledMessage(message: ?string): boolean
{
	return Type.isString(message) && message.trim() !== '';
}

export function getErrorMessage(
	sortedErrors: Array<ControllerError>,
	...fallbacks: Array<?string>
): string
{
	const messages = [...sortedErrors.map((error: ControllerError) => error.message), ...fallbacks];

	return messages.find((message: ?string) => isFilledMessage(message)) ?? '';
}
