/** `YYYY-MM-DD`: a day of the calendar of the user, the very format the server methods speak. */
declare type DateNavigationDay = string;

/** `YYYY-MM`: a month shown by the calendar. */
declare type DateNavigationMonth = string;

declare type DateNavigationStatusValue = 'success' | 'cancelled' | 'error';

/** Error code as the server sent it; null when the request failed without one. */
declare type DateNavigationErrorCodeValue = string | number | null;

/** Days that carry messages, and the bounds of the history available to the user. */
declare type DateNavigationCalendar = {
	days: DateNavigationDay[],
	firstAvailableDate: DateNavigationDay | null,
	lastAvailableDate: DateNavigationDay | null,
}

/** First message of the day the server resolved the pick to, and that day itself. */
declare type DateNavigationResolvedDate = {
	messageId: number,
	date: DateNavigationDay,
}

/**
 * How a request names the time its days are cut by: the timezone itself when the device reports one,
 * a single UTC offset otherwise. The server prefers the identifier when both reach it.
 */
declare type DateNavigationRequestTimezone = { timezoneId: string } | { timezoneOffset: number }

declare type DateNavigationCalendarParams = DateNavigationRequestTimezone & {
	dialogId: string,
	from: DateNavigationDay,
	to: DateNavigationDay,
}

declare type DateNavigationResolveParams = DateNavigationRequestTimezone & {
	dialogId: string,
	date: DateNavigationDay,
}

declare type DateNavigationRequestWindow = {
	from: DateNavigationDay,
	to: DateNavigationDay,
}

/**
 * A part of the request window asked for by one request: the whole window when it is named by a
 * timezone identifier, a stretch of a constant UTC offset when it is named by an offset.
 */
declare type DateNavigationRequestSegment = DateNavigationRequestTimezone & {
	from: DateNavigationDay,
	to: DateNavigationDay,
}

declare type DateNavigationLoadResult = {
	status: DateNavigationStatusValue,
	errorCode: DateNavigationErrorCodeValue,
}

declare type DateNavigationResolveResult = {
	status: DateNavigationStatusValue,
	errorCode: DateNavigationErrorCodeValue,
	resolvedDate: DateNavigationResolvedDate | null,
}

/**
 * Both ends of the available history, and whether they are known at all: before the first answer
 * of the server nothing outside the future can be forbidden.
 */
declare type DateNavigationBoundaries = {
	firstAvailableDate: DateNavigationDay | null,
	lastAvailableDate: DateNavigationDay | null,
	boundariesKnown: boolean,
}
