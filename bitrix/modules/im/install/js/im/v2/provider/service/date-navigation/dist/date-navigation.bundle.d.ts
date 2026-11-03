/* eslint-disable */
type CalendarMonth = string;

type CalendarLoadResult = {
	status: DateNavigationStatusValue;
	errorCode: RequestErrorCode;
};

type DateNavigationStatusValue = typeof BX.Messenger.v2.Service.DateNavigationStatus[keyof typeof BX.Messenger.v2.Service.DateNavigationStatus];

type RequestErrorCode = string | number | null;

type CalendarDay = string;

type ResolveDateResult = {
	status: DateNavigationStatusValue;
	errorCode: RequestErrorCode;
	resolvedDate: ResolvedDate | null;
};

type ResolvedDate = {
	messageId: number;
	date: CalendarDay;
};

type HistoryBoundaries = {
	firstAvailableDate: CalendarDay | null;
	lastAvailableDate: CalendarDay | null;
	boundariesKnown: boolean;
};

declare namespace BX.Messenger.v2.Service {
	/**
	 * Owns the markup of an opened calendar: the months already fetched, the days having messages
	 * and the history boundaries. The server answer is the only source of truth for the markup,
	 * and no markup outlives the opened calendar - reset() drops it whole. Resolving a picked day
	 * into a message is the second half of the same contract: only the latest resolution is applied,
	 * the ones it superseded report themselves as cancelled.
	 */
	class DateNavigationService {
		constructor(dialogId: string);
		loadMonth(month: CalendarMonth): Promise<CalendarLoadResult>;
		resolveDate(date: CalendarDay): Promise<ResolveDateResult>;
		isDayActive(day: CalendarDay): boolean;
		isMonthLoaded(month: CalendarMonth): boolean;
		getHistoryBoundaries(): HistoryBoundaries;
		reset(): void;
	}

	const DateNavigationStatus: Readonly<{
		readonly Success: "success";
		readonly Cancelled: "cancelled";
		readonly Error: "error";
	}>;

	const DateNavigationErrorCode: Readonly<{
		readonly NotAvailable: "DATE_NAVIGATION_NOT_AVAILABLE";
		readonly WrongDateFormat: "DATE_NAVIGATION_WRONG_DATE_FORMAT";
		readonly WrongRange: "DATE_NAVIGATION_WRONG_RANGE";
		readonly WrongTimezone: "DATE_NAVIGATION_WRONG_TIMEZONE";
		readonly MessageNotFound: "DATE_NAVIGATION_MESSAGE_NOT_FOUND";
	}>;

	/**
	 * A 'YYYY-MM-DD' key names a day of the user's own calendar, so it is read into the local midnight
	 * of that day: new Date(key) would read the same string as UTC midnight and name the previous day
	 * west of Greenwich.
	 */
	const parseCalendarDay: (day: CalendarDay) => Date;
}
