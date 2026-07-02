import { BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';

export type DateLike = Date | string | number;
export type DatePickerType = 'date' | 'year' | 'month' | 'time';
export type DatePickerSelectionMode = 'single' | 'multiple' | 'range' | 'none';

export type DateAfter = { after: Date };
export type DateLikeAfter = { after: DateLike };

export type DateBefore = { before: Date };
export type DateLikeBefore = { before: DateLike };

export type DateInterval = { before: Date, after: Date };
export type DateLikeInterval = { before: DateLike, after: DateLike };

export type DateRange = { from: Date | void, to?: Date | void };
export type DateLikeRange = { from: DateLike | void, to?: DateLike | void };

export type DayOfWeek = { dayOfWeek: number[] };
export type DayOfMonth = { dayOfMonth: number[] };

export type DateMatcher =
	boolean
	| ((date: Date) => boolean)
	| Date
	| Date[]
	| DateRange
	| DateBefore
	| DateAfter
	| DateInterval
	| DayOfWeek
	| DayOfMonth
;

export type DateLikeMatcher =
	boolean
	| ((date: Date) => boolean)
	| DateLike
	| DateLike[]
	| DateLikeRange
	| DateLikeBefore
	| DateLikeAfter
	| DateLikeInterval
	| DayOfWeek
	| DayOfMonth
;

export type DayColor = {
	matchers: DateMatcher[],
	bgColor: string,
	textColor: string,
}

export type DayColorOptions = {
	matcher: DateLikeMatcher | DateLikeMatcher[],
	bgColor: string,
	textColor: string,
};

export type DayMark = {
	matchers: DateMatcher[],
	bgColor: string,
}

export type DayMarkOptions = {
	matcher: DateLikeMatcher | DateLikeMatcher[],
	bgColor: string,
};

export type DatePickerPresetValue =
	DateLike
	| DateLike[]
	| [DateLike, DateLike]
	| (() => DateLike | DateLike[] | [DateLike, DateLike])
;

export type DatePickerPreset = {
	label: string,
	value: DatePickerPresetValue,
	subtitle?: string | ((dates: Date[]) => string),
};

export type DatePickerOptions = {
	targetNode: HTMLElement,
	startDate?: DateLike,
	selectedDates?: DateLike | DateLike[],
	selectionMode: DatePickerSelectionMode,
	type?: DatePickerType,

	inputField?: string | HTMLInputElement | HTMLTextAreaElement,
	rangeStartInput?: string | HTMLInputElement | HTMLTextAreaElement,
	rangeEndInput?: string | HTMLInputElement | HTMLTextAreaElement,
	useInputEvents?: boolean,
	dateSeparator?: string,

	dateFormat?: string,
	timeFormat?: string,
	enableTime?: boolean,
	allowSeconds?: boolean,
	amPmMode?: boolean,
	minuteStep?: boolean,
	defaultTime?: string,
	defaultTimeSpan?: number,
	timePickerStyle?: 'wheel' | 'grid',
	cutZeroTime?: boolean,

	firstWeekDay?: number,
	numberOfMonths?: number,
	showWeekNumbers?: boolean,
	showWeekDays?: boolean,
	showOutsideDays?: boolean,
	weekends?: number[],
	holidays?: number[],
	workdays?: number[],

	inline?: boolean,
	popupOptions?: PopupOptions,
	hideByEsc?: boolean,
	autoHide?: boolean,
	cacheable?: boolean,
	autoFocus?: boolean,
	singleOpening?: boolean,

	hideOnSelect?: boolean,
	toggleSelected?: boolean,
	hideHeader?: boolean,

	locale?: string,

	minDays?: number,
	maxDays?: number,
	minDate?: DateLike,
	maxDate?: DateLike,
	restrictNavigation?: boolean,
	fullYear?: boolean,

	dayColors?: DayColorOptions[],
	dayMarks?: DayMarkOptions[],

	presets?: DatePickerPreset[],
	disabledDates?: DateLikeMatcher | DateLikeMatcher[],

	events?: { [eventName: string]: (event: BaseEvent) => void },
};
