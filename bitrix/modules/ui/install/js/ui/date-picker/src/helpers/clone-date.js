// Cross-module contract: calendar and disk set and read __utc themselves, so renaming it here breaks both.
/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

export function cloneDate(date: Date): Date
{
	const newDate = new Date(date.getTime());
	if (date.__utc)
	{
		newDate.__utc = true;
	}

	return newDate;
}
