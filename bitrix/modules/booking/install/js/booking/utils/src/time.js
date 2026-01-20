const TimeUtil = {
	getDefaultUTCTimezone(timezoneId: string = null): string
	{
		const offsetM = (new Date()).getTimezoneOffset();
		const offsetH = -offsetM / 60;

		const sign = offsetH >= 0 ? '+' : '-';
		const hours = Math.abs(offsetH).toString().padStart(2, '0');
		const minutes = (Math.abs(offsetM) % 60).toString().padStart(2, '0');
		const offset = `${sign}${hours}:${minutes}`;

		return `(UTC ${offset}) ${timezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone}`;
	},
};

export const timeUtil = Object.seal(TimeUtil);
