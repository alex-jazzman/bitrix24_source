import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

// The loc module, not the composables barrel: the barrel pulls in composables that import
// back into shared/utils, which closes an import cycle.
import type { GetMessage } from '../composables/loc';

const JUST_NOW = 'BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_TIME_JUST_NOW';

// Digits only: DateTimeFormat.format() substitutes single letters as format characters,
// so a marker with letters would be mangled.
const JUST_NOW_MARK = '#01#';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Length of the interval characters used by DateTimeFormat.format().
const RULE_UNIT_LENGTH = {
	s: SECOND,
	i: MINUTE,
	H: HOUR,
	d: DAY,
};

type RelativeTimeBand = {
	unit: string,
	count: number,
	token: string,
	step?: number,
};

/**
 * The only place the wording boundaries are written down: the interval rules of
 * DateTimeFormat.format() and the moment the label changes its text are both derived from this
 * table, so they cannot drift apart.
 *
 * `unit` and `count` make the rule "less than count units", and the first matching band wins.
 * `token` is what the band prints; the iago/Hago/dago tokens return main phrases with correct
 * plural forms. `step` is how often the printed value changes inside the band; a band without it
 * prints a phrase without a number, so its text changes only when the band ends.
 *
 * The first minute has its own phrase, and a save older than the whole scale falls through to a
 * date: "40 days ago" tells the user nothing.
 */
const RELATIVE_TIME_SCALE: Array<RelativeTimeBand> = [
	{ unit: 's', count: 60, token: JUST_NOW_MARK },
	{ unit: 'i', count: 60, token: 'iago', step: MINUTE },
	{ unit: 'H', count: 24, token: 'Hago', step: HOUR },
	{ unit: 'd', count: 2, token: 'dago', step: DAY },
];

function getAbsoluteFormat(): string
{
	// Seconds are noise for a save time.
	return DateTimeFormat.getFormat('FORMAT_DATETIME')?.replace(/:s/g, '') ?? '';
}

function getBandEnd(band: RelativeTimeBand): number
{
	return band.count * RULE_UNIT_LENGTH[band.unit];
}

function getRelativeTimeRules(): Array<[string, string]>
{
	return [
		...RELATIVE_TIME_SCALE.map(({ unit, count, token }) => [`${unit}${count}`, token]),
		// The last rule of DateTimeFormat.format() is the fallback for everything past the scale.
		['', getAbsoluteFormat()],
	];
}

function isTimePoint(savedAt: ?number): boolean
{
	return Type.isNumber(savedAt) && savedAt > 0;
}

/**
 * Turns a point in time into a localized relative label: "just now", "2 minutes ago",
 * "3 hours ago", "1 day ago"; an older point in time is shown as a date and time.
 *
 * A point in time in the future (clock skew) reads as "just now" instead of a negative interval.
 *
 * @param {?number} savedAt - point in time in milliseconds, the same base as Date.now().
 * @param {GetMessage} getMessage - localization phrase resolver.
 * @returns {string} localized relative label, empty string when there is no time.
 */
export function formatRelativeTime(savedAt: ?number, getMessage: GetMessage): string
{
	if (!isTimePoint(savedAt))
	{
		return '';
	}

	const formatted = DateTimeFormat.format(getRelativeTimeRules(), new Date(savedAt));

	return formatted === JUST_NOW_MARK ? getMessage(JUST_NOW) : formatted;
}

/**
 * Tells how long the label of formatRelativeTime() keeps its current text. A caller that shows
 * the label outside of a hover (a copy kept in the markup for a screen reader, for example) can
 * refresh it exactly when the wording changes instead of guessing an interval.
 *
 * @param {?number} savedAt - point in time in milliseconds, the same base as Date.now().
 * @returns {?number} milliseconds until the label changes, or null when it never will again:
 *   there is no time, or the point in time has left the relative scale and is shown as a date.
 */
export function getNextRelativeTimeChange(savedAt: ?number): ?number
{
	if (!isTimePoint(savedAt))
	{
		return null;
	}

	// A point in time in the future reads as "just now", the same as a save made right now.
	const elapsed = Math.max(0, Date.now() - savedAt);
	const band = RELATIVE_TIME_SCALE.find((item) => elapsed < getBandEnd(item));

	if (Type.isNil(band))
	{
		return null;
	}

	const untilBandEnd = getBandEnd(band) - elapsed;

	if (Type.isNil(band.step))
	{
		return untilBandEnd;
	}

	return Math.min(untilBandEnd, band.step - (elapsed % band.step));
}
