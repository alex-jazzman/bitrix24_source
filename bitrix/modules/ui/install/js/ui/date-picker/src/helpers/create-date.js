// Cross-module contract: calendar and disk set and read __utc themselves, so renaming it here breaks both.
/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type } from 'main.core';
import { type DateLike } from '../date-picker-options';
import { convertToDbFormat } from './convert-to-db-format';
import { createUtcDate } from './create-utc-date';
import { parseDate } from './parse-date';

export function createDate(value: DateLike, formatDate: string = null): Date | null
{
	let date = null;
	if (Type.isStringFilled(value) && Type.isStringFilled(formatDate))
	{
		date = parseDate(value, convertToDbFormat(formatDate));
	}
	else if (Type.isNumber(value))
	{
		date = new Date(value);
		date = createUTC(date);
	}
	else if (Type.isDate(value))
	{
		date = value.__utc ? value : createUTC(value);
	}

	if (date === null)
	{
		console.warn(`DatePicker: invalid date or format (${value}).`);
	}
	else
	{
		date.__utc = true;
	}

	return date;
}

function createUTC(date: Date): Date
{
	return createUtcDate(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
	);
}
