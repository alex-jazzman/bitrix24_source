import { Type } from 'main.core';
import { type ControllerError } from '../type';

function getErrorSortCode(error: ControllerError, connectionErrorCode: string): number
{
	const { code } = error;

	if (code === connectionErrorCode)
	{
		return 0;
	}

	if (Type.isString(code) && code !== '')
	{
		return 1;
	}

	return 2;
}

export function getSortedErrors(
	errors: Array<ControllerError>,
	connectionErrorCode: string,
): Array<ControllerError>
{
	return [...errors].sort(
		(firstError, secondError) => getErrorSortCode(firstError, connectionErrorCode)
			- getErrorSortCode(secondError, connectionErrorCode),
	);
}
