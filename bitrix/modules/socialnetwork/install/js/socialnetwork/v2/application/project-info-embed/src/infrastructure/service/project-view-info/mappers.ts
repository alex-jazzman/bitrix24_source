import { Type } from 'main.core';

import { type CalendarDate, type ProjectDates, type ProjectViewInfo } from '../../../model/project-view-info/types';
import { type ProjectViewInfoDto } from './types';

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function mapCalendarDate(value: string | null): CalendarDate | null
{
	if (!Type.isStringFilled(value))
	{
		return null;
	}

	const match = value.match(CALENDAR_DATE_PATTERN);
	if (!match)
	{
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
	{
		return null;
	}

	return { year, month, day };
}

export function mapDtoToProjectViewInfo(dto: ProjectViewInfoDto): ProjectViewInfo
{
	const start = mapCalendarDate(dto.dateStart);
	const finish = mapCalendarDate(dto.dateFinish);
	const dates: ProjectDates | null = start || finish ? { start, finish } : null;

	return {
		description: Type.isString(dto.description) ? dto.description : '',
		goal: Type.isString(dto.goal) ? dto.goal : '',
		dates,
		tags: Type.isArray(dto.tags) ? dto.tags.filter((tag) => Type.isString(tag)) : [],
	};
}
