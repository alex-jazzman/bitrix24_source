import { Type } from 'main.core';
import { DateTimeFormat, Timezone } from 'main.date';
import { timezone } from 'tasks.v2.lib.timezone';
import { calendar } from 'tasks.v2.lib.calendar';

export class TimeStringConverter
{
	static format(timestamp: number): string
	{
		return DateTimeFormat.format(
			DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
			(timestamp + timezone.getOffset(timestamp)) / 1000,
		);
	}

	static parseServerTime(serverTimeString: string): string
	{
		return Type.isStringFilled(serverTimeString)
			? serverTimeString
			: calendar.dayStartTime
		;
	}

	static applyTimeToDate(date: Date, timeString: string): Date
	{
		const [hours, minutes] = timeString.split(':');
		date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

		return date;
	}

	static convertTsToServerTimeString(browserTs: number): string
	{
		const serverTs = Timezone.BrowserTime.toServer(browserTs / 1000);

		return DateTimeFormat.format('H:i', serverTs);
	}
}
