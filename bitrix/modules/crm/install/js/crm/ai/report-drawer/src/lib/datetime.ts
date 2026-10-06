import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { DatetimeConverter } from 'crm.timeline.tools';

export function formatCreatedAt(createdAt: unknown): string
{
	if (!Type.isInteger(createdAt) || createdAt <= 0)
	{
		return '';
	}

	return DatetimeConverter.createFromServerTimestamp(createdAt)
		.toUserTime()
		.toDatetimeString({
			withFullMonth: false,
			delimiter: ', ',
		})
	;
}

export function formatAssessmentDate(createdAt: unknown): string
{
	if (!Type.isInteger(createdAt) || createdAt <= 0)
	{
		return '';
	}

	const date = DatetimeConverter.createFromServerTimestamp(createdAt)
		.toUserTime()
		.getValue()
	;

	return DateTimeFormat.format(DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), date).replaceAll('\\', '');
}
