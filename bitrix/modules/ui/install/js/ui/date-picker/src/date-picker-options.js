import { BaseEvent } from 'main.core.events';
import type { PopupOptions } from 'main.popup';

export type DateLike = Date | string | number;
export type DatePickerType = 'date' | 'year' | 'month' | 'time';
export type DatePickerSelectionMode = 'single' | 'multiple' | 'range' | 'none';

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

	locale?: string,

	minDays?: number,
	maxDays?: number,
	fullYear?: boolean,

	events?: { [eventName: string]: (event: BaseEvent) => void },
};
