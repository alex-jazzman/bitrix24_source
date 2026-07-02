import { Core } from 'booking.core';
import { Grid, Model } from 'booking.const';
import { type DatePeriodTs } from './types';

const DayDurationTs = 24 * 60 * 60;

export class DatePeriod
{
	static createByCurrentGridMode(): DatePeriodTs
	{
		const store = Core.getStore();
		const selectedDateTs = store.getters[`${Model.Interface}/selectedDateTs`];
		const selectedFirstDayPeriodTs = store.getters[`${Model.Interface}/selectedFirstDayPeriodTs`];
		const isWeekMode = store.getters[`${Model.Interface}/isWeekMode`];

		const periodStartTs = isWeekMode
			? selectedFirstDayPeriodTs
			: selectedDateTs
		;

		const durationDays = isWeekMode ? Grid.Duration.Week : Grid.Duration.Day;

		return DatePeriod.create(periodStartTs / 1000, durationDays);
	}

	static create(fromTs: number, durationDays: number = Grid.Duration.Day): DatePeriodTs
	{
		const periodStartTs = Math.floor(fromTs);

		return {
			fromTs: periodStartTs,
			toTs: periodStartTs + (durationDays * DayDurationTs),
		};
	}

	static intersect(firstPeriod: DatePeriodTs, secondPeriod: DatePeriodTs): DatePeriodTs
	{
		return {
			fromTs: Math.max(firstPeriod.fromTs, secondPeriod.fromTs),
			toTs: Math.min(firstPeriod.toTs, secondPeriod.toTs),
		};
	}

	static isIntersect(firstPeriod: DatePeriodTs, secondPeriod: DatePeriodTs): boolean
	{
		return firstPeriod.fromTs < secondPeriod.toTs && secondPeriod.fromTs < firstPeriod.toTs;
	}

	static getDuration(datePeriod: DatePeriodTs): number
	{
		return Math.max(0, datePeriod.toTs - datePeriod.fromTs);
	}

	static merge(datePeriods: DatePeriodTs[]): DatePeriodTs[]
	{
		return datePeriods
			.map(({ fromTs, toTs }) => ({ fromTs, toTs }))
			.sort((firstPeriod, secondPeriod) => firstPeriod.fromTs - secondPeriod.fromTs)
			.reduce((acc, { fromTs, toTs }) => {
				const lastPeriod = acc[acc.length - 1];

				if (lastPeriod && lastPeriod.toTs >= fromTs)
				{
					if (lastPeriod.toTs < toTs)
					{
						lastPeriod.toTs = toTs;
					}

					return acc;
				}

				acc.push({ fromTs, toTs });

				return acc;
			}, [])
			.filter(({ fromTs, toTs }) => toTs > fromTs)
		;
	}

	static getDates(datePeriod: DatePeriodTs): number[]
	{
		const dates = [];
		for (let dateTs = datePeriod.fromTs; dateTs < datePeriod.toTs; dateTs += DayDurationTs)
		{
			dates.push(dateTs);
		}

		return dates;
	}
}
