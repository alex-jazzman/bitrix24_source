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
	getWeekStartTs(dateTs: number, firstWeekDay: number): number
	{
		const firstWeekDate = new Date(dateTs);
		const diff = (firstWeekDate.getDay() - firstWeekDay + 7) % 7;

		firstWeekDate.setHours(0, 0, 0, 0);
		firstWeekDate.setDate(firstWeekDate.getDate() - diff);

		return firstWeekDate.getTime();
	},
	getMonthStartTs(dateTs: number): number
	{
		const date = new Date(dateTs);

		return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
	},
	isSameDay(fromTs: number, toTs: number, offset: number = 0): boolean
	{
		const from = new Date(fromTs + offset);
		const to = new Date(toTs + offset);

		from.setHours(0, 0, 0, 0);
		to.setHours(0, 0, 0, 0);

		return from.getTime() === to.getTime();
	},
};

export const timeUtil = Object.seal(TimeUtil);
