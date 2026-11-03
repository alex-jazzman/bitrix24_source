import { type CalendarDate, type ProjectDates } from '../../model/project-view-info/types';

type FormatDate = (date: CalendarDate) => string;
type FormatUtcTimestamp = (timestamp: number, utc: boolean) => string;
type Localize = (phrase: string, replacements?: { [key: string]: string }) => string | null;

export function formatCalendarDate(date: CalendarDate, formatTimestamp: FormatUtcTimestamp): string
{
	const timestamp = Date.UTC(date.year, date.month - 1, date.day) / 1000;

	return formatTimestamp(timestamp, true);
}

export function formatProjectDates(dates: ProjectDates | null, formatDate: FormatDate, loc: Localize): string
{
	if (!dates)
	{
		return '';
	}

	const start = dates.start ? formatDate(dates.start) : '';
	const finish = dates.finish ? formatDate(dates.finish) : '';

	if (start && finish)
	{
		return loc('SONET_PROJECT_INFO_EMBED_DATE_RANGE', { '#START#': start, '#FINISH#': finish }) ?? '';
	}

	if (start)
	{
		return loc('SONET_PROJECT_INFO_EMBED_DATE_FROM', { '#DATE#': start }) ?? '';
	}

	if (finish)
	{
		return loc('SONET_PROJECT_INFO_EMBED_DATE_TO', { '#DATE#': finish }) ?? '';
	}

	return '';
}
