import { DateTimeFormat } from 'main.date';

export class TimeStringConverter
{
	static toTimestamp(timeString: string = null): number
	{
		if (!timeString)
		{
			return 0;
		}

		const [hour = '0', minutes = '0'] = timeString.split(':');
		const date = new Date();
		date.setHours(parseInt(hour, 10));
		date.setMinutes(parseInt(minutes, 10));
		date.setSeconds(0);
		date.setMilliseconds(0);

		return date.getTime();
	}

	static toTimeString(timestamp: number, offset = 0): string
	{
		return DateTimeFormat.format(
			DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
			new Date(timestamp + offset),
		);
	}
}
