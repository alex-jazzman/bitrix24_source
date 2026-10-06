import { DateTimeFormat } from 'main.date';

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
	const date = new Date(ts * 1000);
	const isCurrentYear = date.getFullYear() === new Date().getFullYear();

	const dayDefault = isCurrentYear
		? DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT')
		: DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT');

	const dayFormats = [
		['today', 'today'],
		['yesterday', 'yesterday'],
		['', dayDefault],
	];

	const dayFormatted = DateTimeFormat.format(dayFormats, date);
	// Time is rendered with the portal's SHORT_TIME_FORMAT so the hub honours the 12h/24h setting
	// (regional/culture format) exactly like tasks.v2's viewer control — a 24h portal gives "22:38",
	// a 12h portal gives "10:38 pm". Do NOT hardcode 'H:i' here: that forced 24h and ignored the
	// portal setting.
	const timeFormatted = DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), date);

	return `${dayFormatted} ${timeFormatted}`;
}

// Time-only, in the portal's SHORT_TIME_FORMAT (12h/24h per the portal setting). Used by the
// history tile, whose calendar day is already shown by the sticky group date header — so the tile
// itself only needs the time. Same portal-format rule as above: never hardcode 'H:i'.
export function formatTime(ts: number): string
{
	return DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), new Date(ts * 1000));
}
