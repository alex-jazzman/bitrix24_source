import { Text, Type } from 'main.core';
import { DateTimeFormat, Timezone } from 'main.date';
import { TimeStringConverter } from 'tasks.v2.component.fields.replication';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

export class DateStringConverter
{
	static format(timestamp: number): string
	{
		const offset = timezone.getOffset(timestamp);

		const today = new Date(Date.now() + offset);
		const day = new Date(timestamp + offset);

		const isToday = today.getFullYear() === day.getFullYear()
			&& today.getMonth() === day.getMonth()
			&& today.getDate() === day.getDate()
		;

		if (isToday)
		{
			return Text.capitalize(DateTimeFormat.format('today'));
		}

		return calendar.formatDate(timestamp);
	}

	static parseServerDate(serverDateString: string): Date
	{
		if (Type.isStringFilled(serverDateString))
		{
			return DateTimeFormat.parse(serverDateString);
		}

		const date = new Date();
		date.setHours(0, 0, 0, 0);

		return date;
	}

	static convertServerDateToTs(serverDate: Date, serverTime: ?string = null): number
	{
		if (Type.isStringFilled(serverTime))
		{
			TimeStringConverter.applyTimeToDate(serverDate, serverTime);
		}

		return Timezone.ServerTime.toBrowser(serverDate) * 1000;
	}

	static convertTsToServerDateString(browserTs: number): string
	{
		const browserDate = new Date(browserTs);
		const serverDate = Timezone.BrowserTime.toServerDate(browserDate);
		const serverTsAsMidnight = serverDate.setHours(0, 0, 0, 0) / 1000;

		return DateTimeFormat.format(
			DateTimeFormat.getFormat('FORMAT_DATETIME'),
			serverTsAsMidnight,
		);
	}
}
