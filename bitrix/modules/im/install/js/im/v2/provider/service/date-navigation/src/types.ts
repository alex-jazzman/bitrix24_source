import type { DateNavigationStatus } from './const';

export type CalendarMonth = string; // 'YYYY-MM'
export type CalendarDay = string; // 'YYYY-MM-DD'

export type DateNavigationStatusValue = typeof DateNavigationStatus[keyof typeof DateNavigationStatus];

// Server error code as it came from the transport, null when the request failed without one.
export type RequestErrorCode = string | number | null;

export type CalendarDto = {
	days: CalendarDay[],
	firstAvailableDate: CalendarDay | null,
	lastAvailableDate: CalendarDay | null,
};

export type ResolvedDate = {
	messageId: number,
	date: CalendarDay,
};

export type CalendarLoadResult = {
	status: DateNavigationStatusValue,
	errorCode: RequestErrorCode,
};

export type ResolveDateResult = {
	status: DateNavigationStatusValue,
	errorCode: RequestErrorCode,
	resolvedDate: ResolvedDate | null,
};

// The upper boundary of the calendar is the end of the history, and never later than today: a day
// after the last message has no messages either, and a day without messages is not a day to pick.
export type HistoryBoundaries = {
	firstAvailableDate: CalendarDay | null,
	lastAvailableDate: CalendarDay | null,
	boundariesKnown: boolean,
};

export type CalendarRequestWindow = {
	from: CalendarDay,
	to: CalendarDay,
};

// How a request names the time its days are cut by: the timezone itself when the browser reports one,
// a single UTC offset otherwise. The server prefers the identifier when both reach it.
export type CalendarRequestTimezone = { timezoneId: string } | { timezoneOffset: number };
