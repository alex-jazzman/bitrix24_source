import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

export const ScheduledTimePreset = Object.freeze({
	InOneHour: 'inOneHour',
	Tomorrow: 'tomorrow',
	WeekEnd: 'weekEnd',
	NextWeek: 'nextWeek',
	MonthEnd: 'monthEnd',
	Custom: 'custom',
} as const);

export const ScheduledTimeErrorCode = Object.freeze({
	InvalidLocalTime: 'invalid_local_time',
	PastTime: 'past_time',
} as const);

export type ScheduledTimePresetValue = typeof ScheduledTimePreset[keyof typeof ScheduledTimePreset];

export type ScheduledTimeErrorCodeValue = typeof ScheduledTimeErrorCode[keyof typeof ScheduledTimeErrorCode];

export type ScheduledTimeError = RangeError & {
	code: ScheduledTimeErrorCodeValue,
};

export type LocalDateTime = {
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second?: number,
};

export type AbsoluteScheduledTime = {
	iso: string,
	timezoneLabel: string,
};

export type ScheduledTimePresetOptions = {
	now?: Date,
	selectedLocalDateTime?: LocalDateTime,
};

type RequiredLocalDateTime = Required<LocalDateTime>;

const MinuteMilliseconds = 60 * 1000;
const HourMilliseconds = 60 * MinuteMilliseconds;
const DayMilliseconds = 24 * HourMilliseconds;
const TodayHour = 18;
const TomorrowHour = 9;
const NextWeekHour = 9;

export function toAbsoluteScheduledTime(
	localDateTime: LocalDateTime,
	timezoneId: string,
): AbsoluteScheduledTime
{
	const normalized = normalizeLocalDateTime(localDateTime);
	const candidates = resolveInstantCandidates(normalized, timezoneId);
	if (candidates.length === 0)
	{
		throw createTimeError(
			ScheduledTimeErrorCode.InvalidLocalTime,
			'The local time does not exist in the selected timezone.',
		);
	}

	return createAbsoluteScheduledTime(candidates[0], timezoneId);
}

export function resolveScheduledTimePreset(
	preset: ScheduledTimePresetValue,
	timezoneId: string,
	options: ScheduledTimePresetOptions = {},
): AbsoluteScheduledTime
{
	const now = options.now ?? new Date();
	if (!Type.isDate(now) || !Type.isNumber(now.getTime()))
	{
		throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The current time is invalid.');
	}

	if (preset === ScheduledTimePreset.InOneHour)
	{
		return createAbsoluteScheduledTime(now.getTime() + HourMilliseconds, timezoneId);
	}

	if (preset === ScheduledTimePreset.Custom)
	{
		if (!options.selectedLocalDateTime)
		{
			throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'A custom local time is required.');
		}

		return ensureFuture(toAbsoluteScheduledTime(options.selectedLocalDateTime, timezoneId), now);
	}

	const localNow = getLocalDateTime(now.getTime(), timezoneId);
	if (preset === ScheduledTimePreset.Tomorrow)
	{
		return ensureFuture(
			toAbsoluteScheduledTime(addLocalDays(localNow, 1, TomorrowHour), timezoneId),
			now,
		);
	}

	if (preset === ScheduledTimePreset.WeekEnd)
	{
		const localDay = createUtcDate(localNow).getUTCDay();
		const daysUntilFriday = (5 - localDay + 7) % 7;
		const weekEnd = toAbsoluteScheduledTime(addLocalDays(localNow, daysUntilFriday, TodayHour), timezoneId);

		return new Date(weekEnd.iso).getTime() > now.getTime()
			? weekEnd
			: ensureFuture(toAbsoluteScheduledTime(addLocalDays(localNow, 7, TodayHour), timezoneId), now);
	}

	if (preset === ScheduledTimePreset.NextWeek)
	{
		const localDay = createUtcDate(localNow).getUTCDay();
		const daysUntilNextMonday = localDay === 0 ? 1 : 8 - localDay;

		return ensureFuture(
			toAbsoluteScheduledTime(addLocalDays(localNow, daysUntilNextMonday, NextWeekHour), timezoneId),
			now,
		);
	}

	if (preset === ScheduledTimePreset.MonthEnd)
	{
		const lastDay = new Date(Date.UTC(localNow.year, localNow.month, 0)).getUTCDate();
		const monthEnd = toAbsoluteScheduledTime({
			...localNow,
			day: lastDay,
			hour: TodayHour,
			minute: 0,
			second: 0,
		}, timezoneId);

		return new Date(monthEnd.iso).getTime() > now.getTime()
			? monthEnd
			: ensureFuture(toAbsoluteScheduledTime({
				...addLocalDays(localNow, 1, TodayHour),
				day: new Date(Date.UTC(localNow.year, localNow.month + 1, 0)).getUTCDate(),
			}, timezoneId), now);
	}

	throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'Unknown scheduled time preset.');
}

export function formatScheduledDateTime(
	absoluteTime: string,
	format: string = DateTimeFormat.getFormat('FORMAT_DATETIME') ?? 'Y-m-d H:i:s',
): string
{
	const timestamp = Date.parse(absoluteTime);
	if (!Type.isNumber(timestamp))
	{
		throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The absolute time is invalid.');
	}

	return DateTimeFormat.format(format, timestamp / 1000);
}

/**
 * Renders the moment the way the author scheduled it: "today, 18:00" / "tomorrow, 09:00", any other day
 * in full. Both the moment and the reference are moved to the author wall clock beforehand, so the day is
 * counted in the author timezone and a letter set for tonight does not read as tomorrow abroad.
 */
export function formatRelativeScheduledDateTime(
	absoluteTime: string,
	timezoneId: string,
	now: Date = new Date(),
): string
{
	const timestamp = Date.parse(absoluteTime);
	if (!Type.isNumber(timestamp))
	{
		throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The absolute time is invalid.');
	}

	const timeFormat = resolveRelativeTimeFormat();
	// the banner names the minute; the platform drops the second the same way in its own relative tokens
	const fullFormat = (DateTimeFormat.getFormat('FORMAT_DATETIME') ?? 'Y-m-d H:i:s').replaceAll(':s', '');

	return DateTimeFormat.format(
		[
			['tomorrow', `tomorrow, ${timeFormat}`],
			['today', `today, ${timeFormat}`],
			['', fullFormat],
		],
		toAuthorWallClock(timestamp, timezoneId) / 1000,
		toAuthorWallClock(now.getTime(), timezoneId) / 1000,
	);
}

function resolveRelativeTimeFormat(): string
{
	const ampmMode = DateTimeFormat.isAmPmMode(true);
	if (ampmMode === DateTimeFormat.AM_PM_MODE.LOWER)
	{
		return 'g:i a';
	}

	if (ampmMode === DateTimeFormat.AM_PM_MODE.UPPER)
	{
		return 'g:i A';
	}

	return 'H:i';
}

/** The browser timestamp showing the same wall clock the author sees, so DateTimeFormat compares author days. */
function toAuthorWallClock(timestamp: number, timezoneId: string): number
{
	const localDateTime = getLocalDateTime(timestamp, timezoneId);

	return new Date(
		localDateTime.year,
		localDateTime.month - 1,
		localDateTime.day,
		localDateTime.hour,
		localDateTime.minute,
		localDateTime.second,
	).getTime();
}

function ensureFuture(absoluteTime: AbsoluteScheduledTime, now: Date): AbsoluteScheduledTime
{
	if (new Date(absoluteTime.iso).getTime() <= now.getTime())
	{
		throw createTimeError(ScheduledTimeErrorCode.PastTime, 'The scheduled time must be in the future.');
	}

	return absoluteTime;
}

function normalizeLocalDateTime(localDateTime: LocalDateTime): RequiredLocalDateTime
{
	const normalized = {
		...localDateTime,
		second: localDateTime.second ?? 0,
	};
	const values = [
		normalized.year,
		normalized.month,
		normalized.day,
		normalized.hour,
		normalized.minute,
		normalized.second,
	];
	if (!values.every((value: number): boolean => Type.isInteger(value)))
	{
		throw createTimeError(
			ScheduledTimeErrorCode.InvalidLocalTime,
			'The local time contains a non-integer component.',
		);
	}

	const validationDate = createUtcDate(normalized);
	if (
		normalized.year < 1970
		|| normalized.year > 9999
		|| validationDate.getUTCFullYear() !== normalized.year
		|| validationDate.getUTCMonth() + 1 !== normalized.month
		|| validationDate.getUTCDate() !== normalized.day
		|| validationDate.getUTCHours() !== normalized.hour
		|| validationDate.getUTCMinutes() !== normalized.minute
		|| validationDate.getUTCSeconds() !== normalized.second
	)
	{
		throw createTimeError(
			ScheduledTimeErrorCode.InvalidLocalTime,
			'The local time contains an invalid calendar value.',
		);
	}

	return normalized;
}

function resolveInstantCandidates(localDateTime: RequiredLocalDateTime, timezoneId: string): number[]
{
	const wallTimestamp = createUtcDate(localDateTime).getTime();
	const offsets = new Set([
		getTimezoneOffset(wallTimestamp - DayMilliseconds, timezoneId),
		getTimezoneOffset(wallTimestamp, timezoneId),
		getTimezoneOffset(wallTimestamp + DayMilliseconds, timezoneId),
	]);

	return [...offsets]
		.map((offset: number): number => wallTimestamp - offset)
		.filter((timestamp: number): boolean => (
			isSameLocalDateTime(getLocalDateTime(timestamp, timezoneId), localDateTime)
		))
		.sort((first: number, second: number): number => first - second);
}

function getTimezoneOffset(timestamp: number, timezoneId: string): number
{
	const localDateTime = getLocalDateTime(timestamp, timezoneId);

	return createUtcDate(localDateTime).getTime() - timestamp;
}

const localDateTimeFormatters: Map<string, Intl.DateTimeFormat> = new Map();

/**
 * Building the formatter is the costly part of the Intl API, and one click on a preset asks the same zone
 * for its offset up to fifteen times. The identifier of the zone is the whole of the configuration.
 */
function getLocalDateTimeFormatter(timezoneId: string): Intl.DateTimeFormat
{
	const cached = localDateTimeFormatters.get(timezoneId);
	if (cached)
	{
		return cached;
	}

	// formatToParts resolves the IANA offset only; user-visible dates are formatted by DateTimeFormat.
	const formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
		timeZone: timezoneId,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	});
	localDateTimeFormatters.set(timezoneId, formatter);

	return formatter;
}

function getLocalDateTime(timestamp: number, timezoneId: string): RequiredLocalDateTime
{
	let year = 0;
	let month = 0;
	let day = 0;
	let hour = 0;
	let minute = 0;
	let second = 0;

	try
	{
		const formatter = getLocalDateTimeFormatter(timezoneId);
		formatter.formatToParts(new Date(timestamp)).forEach((part: Intl.DateTimeFormatPart): void => {
			switch (part.type)
			{
				case 'year':
					year = Number(part.value);
					break;
				case 'month':
					month = Number(part.value);
					break;
				case 'day':
					day = Number(part.value);
					break;
				case 'hour':
					hour = Number(part.value);
					break;
				case 'minute':
					minute = Number(part.value);
					break;
				case 'second':
					second = Number(part.value);
					break;
				default:
					break;
			}
		});
	}
	catch
	{
		throw createTimeError(ScheduledTimeErrorCode.InvalidLocalTime, 'The timezone identifier is invalid.');
	}

	return { year, month, day, hour, minute, second };
}

function createAbsoluteScheduledTime(timestamp: number, timezoneId: string): AbsoluteScheduledTime
{
	const offset = getTimezoneOffset(timestamp, timezoneId);

	return {
		iso: new Date(timestamp).toISOString(),
		timezoneLabel: `${timezoneId} (UTC${formatTimezoneOffset(offset)})`,
	};
}

function formatTimezoneOffset(offset: number): string
{
	const sign = offset < 0 ? '-' : '+';
	const absoluteMinutes = Math.abs(Math.round(offset / 60000));
	const hours = Math.floor(absoluteMinutes / 60).toString().padStart(2, '0');
	const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');

	return `${sign}${hours}:${minutes}`;
}

function addLocalDays(
	localDateTime: RequiredLocalDateTime,
	days: number,
	hour: number,
): RequiredLocalDateTime
{
	const date = createUtcDate({ ...localDateTime, hour, minute: 0, second: 0 });
	date.setUTCDate(date.getUTCDate() + days);

	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
		hour: date.getUTCHours(),
		minute: date.getUTCMinutes(),
		second: date.getUTCSeconds(),
	};
}

function createUtcDate(localDateTime: RequiredLocalDateTime): Date
{
	return new Date(Date.UTC(
		localDateTime.year,
		localDateTime.month - 1,
		localDateTime.day,
		localDateTime.hour,
		localDateTime.minute,
		localDateTime.second,
	));
}

function isSameLocalDateTime(
	first: RequiredLocalDateTime,
	second: RequiredLocalDateTime,
): boolean
{
	return first.year === second.year
		&& first.month === second.month
		&& first.day === second.day
		&& first.hour === second.hour
		&& first.minute === second.minute
		&& first.second === second.second;
}

function createTimeError(code: ScheduledTimeErrorCodeValue, message: string): ScheduledTimeError
{
	return Object.assign(new RangeError(message), { code });
}
