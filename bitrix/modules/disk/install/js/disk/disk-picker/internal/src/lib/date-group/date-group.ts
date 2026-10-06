import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const GroupRank = Object.freeze({
	Today: 0,
	Yesterday: 1,
	Previous7Days: 2,
	Previous30Days: 3,
	Month: 4,
	Year: 5,
	NoDate: 6,
});

export const DateGroupKey = Object.freeze({
	Today: 'DISK_PICKER_GROUP_TODAY',
	Yesterday: 'DISK_PICKER_GROUP_YESTERDAY',
	Previous7Days: 'DISK_PICKER_GROUP_PREVIOUS_7_DAYS',
	Previous30Days: 'DISK_PICKER_GROUP_PREVIOUS_30_DAYS',
	NoDate: 'DISK_PICKER_GROUP_NO_DATE',
});

export type DateGroup = {
	key: string,
	labelCode: string | null,
	label: string | null,
	rank: number,
	sortValue: number,
};

type CalendarDate = {
	year: number,
	month: number,
	ordinal: number,
};

function calendarDate(timestampInSeconds: number): CalendarDate
{
	const [year, month, day] = DateTimeFormat.format('Y-m-d', timestampInSeconds)
		.split('-')
		.map((part) => Number(part));

	return {
		year,
		month,
		ordinal: Date.UTC(year, month - 1, day) / DAY_MILLISECONDS,
	};
}

function relativeGroup(key: string, rank: number): DateGroup
{
	return { key, labelCode: key, label: null, rank, sortValue: 0 };
}

export function resolveDateGroup(timestampInSeconds: number | null, nowInSeconds: number): DateGroup
{
	if (!Type.isNumber(timestampInSeconds))
	{
		return relativeGroup(DateGroupKey.NoDate, GroupRank.NoDate);
	}

	const itemDate = calendarDate(timestampInSeconds);
	const currentDate = calendarDate(nowInSeconds);
	const dayDifference = currentDate.ordinal - itemDate.ordinal;

	if (dayDifference <= 0)
	{
		return relativeGroup(DateGroupKey.Today, GroupRank.Today);
	}

	if (dayDifference === 1)
	{
		return relativeGroup(DateGroupKey.Yesterday, GroupRank.Yesterday);
	}

	if (dayDifference >= 2 && dayDifference <= 7)
	{
		return relativeGroup(DateGroupKey.Previous7Days, GroupRank.Previous7Days);
	}

	if (dayDifference >= 8 && dayDifference <= 30)
	{
		return relativeGroup(DateGroupKey.Previous30Days, GroupRank.Previous30Days);
	}

	if (itemDate.year === currentDate.year)
	{
		return {
			key: `month:${itemDate.year}-${String(itemDate.month).padStart(2, '0')}`,
			labelCode: null,
			label: DateTimeFormat.format('f', timestampInSeconds),
			rank: GroupRank.Month,
			sortValue: itemDate.month,
		};
	}

	return {
		key: `year:${itemDate.year}`,
		labelCode: null,
		label: String(itemDate.year),
		rank: GroupRank.Year,
		sortValue: itemDate.year,
	};
}

export function compareDateGroups(left: DateGroup, right: DateGroup): number
{
	return left.rank - right.rank || right.sortValue - left.sortValue;
}
