import { Extension } from 'main.core';

type TimezoneSettings = {
	timeZone: string | null;
}

const settings = Extension.getSettings('socialnetwork.v2.lib.timezone') as TimezoneSettings;

export class Timezone
{
	static getOffset(dateTs: number, timeZone: string = Timezone.getTimezone()): number
	{
		return Timezone.getTimezoneOffset(dateTs, timeZone) + new Date(dateTs).getTimezoneOffset() * 60 * 1000;
	}

	static getTimezoneOffset(dateTs: number, timeZone: string = Timezone.getTimezone()): number
	{
		const date = new Date(dateTs);
		const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone }));
		const dateInUTC = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));

		return dateInTimezone.getTime() - dateInUTC.getTime();
	}

	static getTimezone(): string
	{
		return settings.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
}
