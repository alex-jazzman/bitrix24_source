export const DateNavigationStatus = Object.freeze({
	Success: 'success',
	Cancelled: 'cancelled',
	Error: 'error',
} as const);

// Mirrors Bitrix\Im\V2\Message\DateNavigation\DateNavigationError constants.
export const DateNavigationErrorCode = Object.freeze({
	NotAvailable: 'DATE_NAVIGATION_NOT_AVAILABLE',
	WrongDateFormat: 'DATE_NAVIGATION_WRONG_DATE_FORMAT',
	WrongRange: 'DATE_NAVIGATION_WRONG_RANGE',
	WrongTimezone: 'DATE_NAVIGATION_WRONG_TIMEZONE',
	MessageNotFound: 'DATE_NAVIGATION_MESSAGE_NOT_FOUND',
} as const);
