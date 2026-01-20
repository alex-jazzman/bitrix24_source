import { DateTimeFormat } from 'main.date';
import { timezone } from 'tasks.v2.lib.timezone';

export const offsetDateTimeFormat = (value: string): string => {
	const timestamp = Number(JSON.parse(value)) * 1000;

	if (timestamp <= 0)
	{
		return '';
	}

	const offset = timezone.getOffset(timestamp);
	const timestampOffset = (timestamp + offset) / 1000;

	const date = DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), timestampOffset);
	const time = DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), timestampOffset);

	return `${date} ${time}`;
};
