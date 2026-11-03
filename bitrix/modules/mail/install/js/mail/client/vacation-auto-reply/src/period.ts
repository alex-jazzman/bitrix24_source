import { Dom } from 'main.core';
import { createUtcDate } from 'ui.date-picker';

/**
 * The bounds of the period are wall clock time of the timezone the setting keeps, and they stay that
 * way end to end: the server sends them with the offset of that timezone already applied, and takes
 * them back together with the identifier of the timezone, which it resolves the offset by. So the
 * screen carries the reading of the clock and never converts it through the timezone of the browser
 * - a browser in another timezone would otherwise move the period of the user by its difference.
 *
 * A bound travels through the screen as `YYYY-MM-DDTHH:MM:SS`, and through the calendar as a Date
 * whose UTC members hold that same reading: `ui.date-picker` builds and reads its dates that way.
 * Such a date has to come from `createUtcDate` of the calendar, which marks it as one of its own:
 * a date built by hand the calendar takes for a moment of the browser and reads by its local
 * members, moving the bound by the offset of the browser.
 */

/** Date and time of a bound; the offset of the source string is deliberately dropped. */
const BOUND_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;

export type PeriodBound = string;

function pad(value: number, length: number = 2): string
{
	return String(value).padStart(length, '0');
}

/** Reads a saved bound while deliberately dropping its timezone offset. */
export function readBound(value: string | null | undefined): PeriodBound | null
{
	const parts = BOUND_PATTERN.exec(String(value ?? ''));
	if (parts === null)
	{
		return null;
	}

	return `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6] ?? '00'}`;
}

/** The bound as the calendar carries it: the reading of the clock in the UTC members of a Date. */
export function toCalendarDate(bound: PeriodBound | null): Date | null
{
	const parts = BOUND_PATTERN.exec(String(bound ?? ''));
	if (parts === null)
	{
		return null;
	}

	return createUtcDate(
		Number(parts[1]),
		Number(parts[2]) - 1,
		Number(parts[3]),
		Number(parts[4]),
		Number(parts[5]),
		Number(parts[6] ?? '0'),
	);
}

export function fromCalendarDate(date: Date | null): PeriodBound | null
{
	if (!(date instanceof Date) || Number.isNaN(date.getTime()))
	{
		return null;
	}

	const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
	const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

	return `${day}T${time}`;
}

/**
 * An unset bound is sent as an empty string: switching the auto-reply off keeps the stored period,
 * and with it the senders already answered inside it.
 */
export function toRequestBound(bound: PeriodBound | null): string
{
	return bound ?? '';
}

/** As far as the calendar of the design system goes: it neither shows nor takes seconds. */
function toMinutes(bound: PeriodBound): string
{
	return bound.slice(0, 'YYYY-MM-DDTHH:MM'.length);
}

/**
 * The bound to send for a field that still shows the loaded one. Read back from the text of the
 * field the bound loses its seconds, and the server tells one period from another by its start down
 * to the second: a start rounded to the whole minute makes the same vacation a new one and forgets
 * the senders already answered inside it.
 */
export function keepSeconds(loaded: PeriodBound | null, shown: PeriodBound | null): PeriodBound | null
{
	if (loaded === null || shown === null)
	{
		return shown;
	}

	return toMinutes(loaded) === toMinutes(shown) ? loaded : shown;
}

/** What the screen needs of the calendar of the design system to fill the field of a bound. */
export type BoundPicker = {
	deselectAll(): void,
	selectDate(date: Date): void,
};

/**
 * Puts a bound into its field. An empty bound is cleared by hand as well: the calendar takes back
 * only what it put there itself, and a date typed from the keyboard never reached its selection - it
 * would stay in the field of the mailbox the screen switches to.
 */
export function applyBound(picker: BoundPicker | null, input: HTMLInputElement, bound: PeriodBound | null): void
{
	picker?.deselectAll();

	const date = toCalendarDate(bound);
	if (date === null)
	{
		Dom.adjust(input, { props: { value: '' } });

		return;
	}

	picker?.selectDate(date);
}

/** What the screen needs of the calendar to show what its field takes. */
export type BoundFormatter = {
	formatDate(date: Date): string,
};

/** A whole hour of today reads as a time of a day and not as a value with a meaning of its own. */
const EXAMPLE_HOUR = 9;

/**
 * A bound written the way the field of the period expects it. The example is written by the calendar
 * of that very field, so it cannot name a format the field would not take back: the format is a
 * setting of the portal and is not the same everywhere.
 */
export function describeBoundExample(picker: BoundFormatter | null): string
{
	if (picker === null)
	{
		return '';
	}

	const today = new Date();

	return picker.formatDate(
		createUtcDate(today.getFullYear(), today.getMonth(), today.getDate(), EXAMPLE_HOUR, 0, 0),
	);
}

/** A zone the browser has no place for is named by its offset alone, and the offset is told once. */
const OFFSET_NAME_PATTERN = /^(?:GMT|UTC)/;

/**
 * The timezone the bounds are read in: the saved one, or the screen fallback while no setting has
 * arrived or the stored one names none.
 */
export function resolveTimezoneId(settingTimezoneId: string | null | undefined, fallback: string): string
{
	const timezoneId = String(settingTimezoneId ?? '');

	return timezoneId === '' ? String(fallback ?? '') : timezoneId;
}

/**
 * The timezone the bounds are read in, as the user reads it: `Europe/Moscow` is the value the two
 * sides speak in and not the answer to "which time is this". The identifier stays the fallback - a
 * hint of a place nobody can name is worse than a technical one.
 */
export function describeTimezone(timezoneId: string, languageId: string): string
{
	if (timezoneId === '')
	{
		return '';
	}

	const offset = toUtcOffset(readTimezonePart(timezoneId, languageId, 'longOffset'));
	// The short generic name is the place without the season: the city, not "the city, summer time"
	const name = readTimezonePart(timezoneId, languageId, 'shortGeneric');

	if (name === '' || name === timezoneId || OFFSET_NAME_PATTERN.test(name))
	{
		return offset === '' ? timezoneId : offset;
	}

	return offset === '' ? name : `${name} (${offset})`;
}

/** The offset as the portal shows it; the browser writes it against GMT. */
function toUtcOffset(offset: string): string
{
	return offset.replace('GMT', 'UTC');
}

function readTimezonePart(
	timezoneId: string,
	languageId: string,
	timeZoneName: Intl.DateTimeFormatOptions['timeZoneName'],
): string
{
	try
	{
		const parts = new Intl.DateTimeFormat(languageId === '' ? undefined : languageId, {
			timeZone: timezoneId,
			timeZoneName,
		}).formatToParts(new Date());

		return parts.find((part: Intl.DateTimeFormatPart): boolean => part.type === 'timeZoneName')?.value ?? '';
	}
	catch
	{
		// An identifier the browser does not know, or a naming it cannot do
		return '';
	}
}
