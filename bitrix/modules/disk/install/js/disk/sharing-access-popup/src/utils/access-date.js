import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';

const ACCESS_DAY_MONTH_FORMAT = DateTimeFormat.getFormat('DAY_MONTH_FORMAT') || 'j F';
const ACCESS_SHORT_DATE_FORMAT = DateTimeFormat.getFormat('SHORT_DATE_FORMAT') || 'd.m.Y';
const ACCESS_SHORT_TIME_FORMAT = DateTimeFormat.getFormat('SHORT_TIME_FORMAT') || 'H:i';

function createAccessDate(value)
{
	if (!Number.isFinite(value) || value <= 0)
	{
		return null;
	}

	const date = new Date(value * 1000);
	if (Number.isNaN(date.getTime()))
	{
		return null;
	}

	return date;
}

export function formatAccessUntil(value)
{
	const date = createAccessDate(value);
	if (!date)
	{
		return '';
	}

	const formattedDate = DateTimeFormat.format(ACCESS_DAY_MONTH_FORMAT, date);

	return (Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_UNTIL') ?? '')
		.replace('#DATE#', formattedDate);
}

export function formatAccessUntilForInput(value)
{
	const date = createAccessDate(value);
	if (!date)
	{
		return '';
	}

	const isCurrentYear = date.getFullYear() === new Date().getFullYear();
	const dateFormat = isCurrentYear ? ACCESS_DAY_MONTH_FORMAT : ACCESS_SHORT_DATE_FORMAT;
	const formattedDate = DateTimeFormat.format(`${dateFormat} ${ACCESS_SHORT_TIME_FORMAT}`, date);

	return (Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_UNTIL') ?? '')
		.replace('#DATE#', formattedDate);
}
