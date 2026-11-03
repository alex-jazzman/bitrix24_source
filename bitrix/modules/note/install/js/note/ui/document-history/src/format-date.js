import { DateTimeFormat } from 'main.date';

// Which of the three calendar branches a timestamp falls into. The activity chip needs the branch
// itself and not only its printed form: the phrase for a near day carries the day inside its own
// text (NOTE_UI_DOCUMENT_HISTORY_ACTIVITY_CHANGED_TODAY) while the phrase for an older event takes the day as #DATE#,
// so the caller has to know which of the two it is holding before it can substitute anything.
export const ActivityDayKind = Object.freeze({
	Today: 'today',
	Yesterday: 'yesterday',
	Date: 'date',
});

type ActivityTimestampParts = {
	kind: string,
	date: string,
	time: string,
};

// [Date format fix] Shared day+time convention across the whole hub (views popover, activity
// chip, history tiles) — same helper as tasks.v2's own "who viewed" control:
// tasks/install/js/tasks/v2/component/tasks-user-actions-demonstrator/src/tasks-user-actions-demonstrator.js:123-144.
//
// The previous convention here, DateTimeFormat.format('x', ts), resolves through the 'sago'/
// 'iago' branches for anything under an hour old and prints a "N seconds ago" label for a just-now
// timestamp — a real bug for a hub whose whole point is showing fresh activity. This format
// buckets by calendar day instead (localized "today, HH:MM" / "yesterday, HH:MM" / "Jul 7, HH:MM"), so a
// fresh event never renders as "0 ...".
export function formatActivityTimestamp(ts: number): string
{
	const { date, time } = describeActivityTimestamp(ts);

	return `${date} ${time}`;
}

// The same day+time convention, but the day and the time come back separately, together with the
// calendar branch they were taken from. That is what lets a caller fill a localized phrase with its
// own #DATE# / #TIME# placeholders instead of gluing the two parts with a separator picked by JS:
// which separator — and which word order — belongs between a day and a time is a property of the
// language, not of this hub ("сегодня в 22:38", "today at 10:38 pm", "heute um 22:38"). Gluing is how
// en ended up reading "Modified on today 10:38 pm".
export function describeActivityTimestamp(ts: number): ActivityTimestampParts
{
	const date = new Date(ts * 1000);
	const kind = detectDayKind(date);

	return {
		kind,
		date: formatDay(date, kind),
		time: formatTime(ts),
	};
}

// Time-only, in the portal's SHORT_TIME_FORMAT (12h/24h per the portal setting). Used by the
// history tile, whose calendar day is already shown by the sticky group date header — so the tile
// itself only needs the time. Do NOT hardcode 'H:i' here: that forced 24h and ignored the portal
// setting.
export function formatTime(ts: number): string
{
	return DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), new Date(ts * 1000));
}

// Calendar-day boundaries exactly as main.date computes them for its own 'today' / 'yesterday'
// format intervals (date-time-format.js, non-UTC path): local midnight of the current day and of
// the day before it. Reproduced rather than re-derived, so this hub's notion of "today" can never
// drift from the one DateTimeFormat prints.
function detectDayKind(date: Date): string
{
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const day = now.getDate();

	const todayStart = new Date(year, month, day, 0, 0, 0, 0);
	const tomorrowStart = new Date(year, month, day + 1, 0, 0, 0, 0);
	if (date >= todayStart && date < tomorrowStart)
	{
		return ActivityDayKind.Today;
	}

	const yesterdayStart = new Date(year, month, day - 1, 0, 0, 0, 0);
	if (date >= yesterdayStart && date < todayStart)
	{
		return ActivityDayKind.Yesterday;
	}

	return ActivityDayKind.Date;
}

function formatDay(date: Date, kind: string): string
{
	// 'today' / 'yesterday' are main.date's own relative-day tokens (FD_TODAY / FD_YESTERDAY), so the
	// word itself still comes from the locale. They are not culture date patterns, which is why they
	// are spelled out here while every real pattern below goes through getFormat().
	if (kind === ActivityDayKind.Today)
	{
		return DateTimeFormat.format('today', date);
	}

	if (kind === ActivityDayKind.Yesterday)
	{
		return DateTimeFormat.format('yesterday', date);
	}

	// Full month name instead of the abbreviated one: the day is now read as part of a sentence
	// ("Изменён 7 июля в 22:38"), and a clipped "7 июл" inside a phrase reads like a table cell.
	// That clipped form is exactly what the previous pair, DAY_SHORT_MONTH_FORMAT /
	// MEDIUM_DATE_FORMAT, printed.
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();
	const dayFormat = isCurrentYear
		? DateTimeFormat.getFormat('DAY_MONTH_FORMAT')
		: DateTimeFormat.getFormat('LONG_DATE_FORMAT');

	return DateTimeFormat.format(dayFormat, date);
}
