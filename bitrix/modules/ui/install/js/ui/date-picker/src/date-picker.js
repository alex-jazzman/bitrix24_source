import { Dom, Extension, Tag, Type, Loc, Event, Text } from 'main.core';
import { type BaseCache, MemoryCache } from 'main.core.cache';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { DateTimeFormat } from 'main.date';
import { Popup, type PopupOptions } from 'main.popup';
import { FocusZone, type InputModality } from 'ui.a11y';

import { type BasePicker } from './base-picker';

import {
	type DatePickerSelectionMode,
	type DayColorOptions,
	type DateLike,
	type DatePickerOptions,
	type DatePickerPreset,
	type DatePickerType,
	type DayColor,
	type DayMark,
	type DayMarkOptions,
	type DateLikeMatcher,
	type DateMatcher,
} from './date-picker-options';

import { DayPicker } from './day-picker';
import { DatePickerEvent } from './date-picker-event';
import { addDate } from './helpers/add-date';
import { addToRange } from './helpers/add-to-range';
import { ceilDate } from './helpers/ceil-date';
import { cloneDate } from './helpers/clone-date';

import { createDate } from './helpers/create-date';
import { createUtcDate } from './helpers/create-utc-date';
import { floorDate } from './helpers/floor-date';
import { getDate, type DateComponents } from './helpers/get-date';
import { getFocusableBoundaryElements } from './helpers/get-focusable-boundary-elements';
import { getPresetSubtitle } from './helpers/get-preset-subtitle';
import { isDateLike } from './helpers/is-date-like';
import { isDatesEqual } from './helpers/is-dates-equal';
import { resolvePresetValue } from './helpers/resolve-preset-value';
import { setTime } from './helpers/set-time';
import { isDateMatch } from './helpers/is-date-match';
import { KeyboardNavigation } from './keyboard-navigation';
import { MonthPicker } from './month-picker';
import { TimePickerWheel } from './time-picker-wheel';
import { TimePickerGrid } from './time-picker-grid';
import { YearPicker } from './year-picker';

import './css/date-picker.css';

let singleOpenDatePicker: DatePicker = null;

/**
 * @namespace BX.UI.DatePicker
 */
export class DatePicker extends EventEmitter
{
	#id: string = null;
	#viewDate: Date = null;
	#startDate: Date = null;
	#selectedDates: Date[] = [];
	#focusDate: Date = null;
	#focusInputModality: InputModality | null = null;

	#type: DatePickerType = 'date';
	#currentView: 'day' | 'year' | 'month' | 'time' = null;
	#selectionMode: DatePickerSelectionMode = 'single';
	#views: Map = new Map();

	#firstWeekDay: number = 1;
	#showWeekDays: boolean = true;
	#showWeekNumbers: boolean = false;
	#showOutsideDays: boolean = true;
	#numberOfMonths: number = 1;

	#maxDays: number = Infinity;
	#minDays: number = 0;
	#minDate: Date | null = null;
	#maxDate: Date | null = null;
	#restrictNavigation: boolean = true;
	#fullYear: boolean = false;

	#weekends: number[] = [0, 6];
	#holidays: Array<[number, number]> = [];
	#workdays: Array<[number, number]> = [];
	#enableTime: boolean = false;
	#allowSeconds: boolean = false;
	#amPmMode: boolean = false;
	#minuteStep: number = 5;
	#defaultTime: string = '00:00:00';
	#defaultTimeSpan: number = 60;
	#timePickerStyle: 'wheel' | 'grid' = 'grid';
	#cutZeroTime: boolean = true;

	#targetNode: HTMLElement = null;
	#inputField: HTMLInputElement | HTMLTextAreaElement = null;
	#rangeStartInput: HTMLInputElement | HTMLTextAreaElement = null;
	#rangeEndInput: HTMLInputElement | HTMLTextAreaElement = null;
	#useInputEvents: boolean = true;
	#dateSeparator: string = ', ';

	#popup: Popup = null;
	#popupOptions: PopupOptions = {};
	#hideByEsc: boolean = true;
	#autoHide: boolean = true;
	#cacheable: boolean = true;
	#singleOpening: boolean = true;

	#refs: BaseCache<HTMLElement | Function> = new MemoryCache();
	#rendered: boolean = false;
	#inline: boolean = false;
	#autoFocus: boolean = true;

	#dateFormat: string = null;
	#timeFormat: string = null;

	#toggleSelected: boolean = null;
	#hideOnSelect: boolean = true;
	#locale: boolean = null;
	#hideHeader: boolean = false;

	#dayColors: DayColor[] = [];
	#dayMarks: DayMark[] = [];
	#disabledDateMatchers: DateMatcher[] = [];

	#presets: DatePickerPreset[] = [];
	#presetsContainer: HTMLElement | null = null;
	#presetsFocusZone: FocusZone | null = null;

	#keyboardNavigation: KeyboardNavigation = null;
	#destroying: boolean = false;

	constructor(pickerOptions: DatePickerOptions)
	{
		super();
		this.setEventNamespace('BX.UI.DatePicker');

		const settings = Extension.getSettings('ui.date-picker');
		const options: DatePickerOptions = Type.isPlainObject(pickerOptions) ? pickerOptions : {};

		this.#id = Text.getRandom();
		this.#setType(options.type);
		this.#setSelectionMode(options.selectionMode);

		this.#locale = Type.isStringFilled(options.locale) ? options.locale : settings.get('locale', 'en');

		this.#enableTime = Type.isBoolean(options.enableTime) ? options.enableTime : this.#enableTime;
		if (this.isMultipleMode())
		{
			this.#enableTime = false;
		}

		this.#allowSeconds = Type.isBoolean(options.allowSeconds) ? options.allowSeconds : this.#allowSeconds;
		this.#amPmMode = Type.isBoolean(options.amPmMode) ? options.amPmMode : DateTimeFormat.isAmPmMode();
		this.#cutZeroTime = Type.isBoolean(options.cutZeroTime) ? options.cutZeroTime : this.#cutZeroTime;
		this.#dateFormat = Type.isStringFilled(options.dateFormat) ? options.dateFormat : this.#getDefaultDateFormat();

		this.setDefaultTime(options.defaultTime);
		this.setDefaultTimeSpan(options.defaultTimeSpan);

		this.#timeFormat = (
			Type.isStringFilled(options.timeFormat)
				? options.timeFormat
				: DateTimeFormat.getFormat(this.#allowSeconds ? 'LONG_TIME_FORMAT' : 'SHORT_TIME_FORMAT')
		);

		this.#minuteStep = (
			Type.isNumber(options.minuteStep) && [1, 5, 10, 15, 30].includes(options.minuteStep)
				? options.minuteStep
				: this.#minuteStep
		);

		this.#timePickerStyle = options.timePickerStyle === 'wheel' ? 'wheel' : this.#timePickerStyle;

		this.#viewDate = this.getToday();

		this.#useInputEvents = Type.isBoolean(options.useInputEvents) ? options.useInputEvents : this.#useInputEvents;
		this.setAutoFocus(options.autoFocus);
		this.setInputField(options.inputField);
		this.setRangeStartInput(options.rangeStartInput);
		this.setRangeEndInput(options.rangeEndInput);
		this.setDateSeparator(options.dateSeparator);

		this.selectDates(options.selectedDates, { emitEvents: false });

		this.#startDate = isDateLike(options.startDate) ? this.createDate(options.startDate) : null;
		const viewDate = this.getDefaultViewDate();
		this.setViewDate(viewDate);

		this.#inline = options.inline === true;

		let firstWeekDay = settings.get('firstWeekDay', this.#firstWeekDay);
		firstWeekDay = Type.isNumber(options.firstWeekDay) ? options.firstWeekDay : firstWeekDay;
		this.#firstWeekDay = Math.min(Math.max(0, firstWeekDay), 6);

		this.#numberOfMonths = Type.isNumber(options.numberOfMonths) ? options.numberOfMonths : this.#numberOfMonths;
		this.#fullYear = options.fullYear === true;
		if (this.#fullYear)
		{
			this.#enableTime = false;
			this.#numberOfMonths = 12;
			this.setViewDate(createUtcDate(viewDate.getUTCFullYear(), 0, 1));
		}

		this.#showWeekDays = Type.isBoolean(options.showWeekDays) ? options.showWeekDays : this.#showWeekDays;
		this.#showWeekNumbers = Type.isBoolean(options.showWeekNumbers) ? options.showWeekNumbers : this.#showWeekNumbers;

		const defaultWeekends = settings.get('weekends', []);
		this.#weekends = (
			Type.isArray(options.weekends)
				? options.weekends
				: (Type.isArrayFilled(defaultWeekends) ? defaultWeekends : this.#weekends)
		);

		const defaultHolidays = settings.get('holidays', []);
		this.#holidays = Type.isArray(options.holidays) ? options.holidays : defaultHolidays;

		const defaultWorkdays = settings.get('workdays', []);
		this.#workdays = Type.isArray(options.workdays) ? options.workdays : defaultWorkdays;

		this.#showOutsideDays = this.#numberOfMonths > 1 ? false : this.#showOutsideDays;
		this.#showOutsideDays = Type.isBoolean(options.showOutsideDays) ? options.showOutsideDays : this.#showOutsideDays;

		this.#popupOptions = Type.isPlainObject(options.popupOptions) ? options.popupOptions : this.#popupOptions;

		this.setMinDays(options.minDays);
		this.setMaxDays(options.maxDays);
		this.setMinDate(options.minDate);
		this.setMaxDate(options.maxDate);
		this.setRestrictNavigation(options.restrictNavigation);
		this.setHideOnSelect(options.hideOnSelect);
		this.setTargetNode(options.targetNode);
		this.setToggleSelected(options.toggleSelected);
		this.setAutoHide(options.autoHide);
		this.setHideByEsc(options.hideByEsc);
		this.setCacheable(options.cacheable);
		this.setSingleOpening(options.singleOpening);
		this.setDayColors(options.dayColors);
		this.setDayMarks(options.dayMarks);
		this.setDisabledDates(options.disabledDates);
		this.setHideHeader(options.hideHeader);
		this.setPresets(options.presets);

		this.subscribeFromOptions(options.events);
		this.#keyboardNavigation = new KeyboardNavigation(this);
	}

	getId(): string
	{
		return this.#id;
	}

	setViewDate(date: DateLike)
	{
		let newDate = this.createDate(date);
		if (newDate === null)
		{
			return;
		}

		newDate = setTime(newDate, 0, 0, 0);

		this.#viewDate = newDate;

		if (this.isDateOutOfView(this.getFocusDate()))
		{
			this.setFocusDate(null, { adjustViewDate: false, render: false });
		}

		if (this.isRendered())
		{
			this.getPicker().render();
		}
	}

	getViewDate(): Date
	{
		return this.#viewDate;
	}

	getDefaultViewDate(): Date
	{
		return this.getSelectedDate() || this.#startDate || this.getToday();
	}

	adjustViewDate(date: Date): void
	{
		if (this.isSingleMode())
		{
			if (this.getNumberOfMonths() === 1)
			{
				if (!isDatesEqual(date, this.getViewDate(), 'month'))
				{
					this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
				}
			}
			else
			{
				const { year, month } = this.getViewDateParts();
				const firstMonth = createUtcDate(year, month);
				const lastMonth = ceilDate(createUtcDate(year, month + this.getNumberOfMonths() - 1), 'month');
				if (date < firstMonth || date >= lastMonth)
				{
					this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
				}
			}
		}
		else
		{
			const dayPicker: DayPicker = this.getPicker('day');
			const months = dayPicker.getMonths();
			const firstDay = months[0].weeks[0][0].date;
			const lastDay = months.at(-1).weeks.at(-1).at(-1).date;
			if (date < firstDay || date > lastDay)
			{
				this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
			}
		}
	}

	getViewDateParts(): DateComponents
	{
		return getDate(this.#viewDate);
	}

	selectDate(date: DateLike, options = {}): boolean
	{
		if (this.isRangeMode())
		{
			throw new Error('DatePicker: to select a range use selectRange method.');
		}

		if (!isDateLike(date))
		{
			return false;
		}

		const selectedDate = this.createDate(date);
		if (this.isDateSelected(selectedDate, 'datetime'))
		{
			return false;
		}

		if (!this.isDateAllowed(selectedDate))
		{
			return false;
		}

		const updateTime = this.isDateSelected(selectedDate, 'day');
		if (!updateTime && this.isMultipleMode() && this.#selectedDates.length >= this.getMaxDays())
		{
			return false;
		}

		const { emitEvents, render, updateInputs } = {
			emitEvents: true,
			render: true,
			updateInputs: true,
			...options,
		};

		if (emitEvents && !this.#canSelectDate(selectedDate))
		{
			return false;
		}

		if (this.isMultipleMode())
		{
			if (updateTime)
			{
				const index = this.#selectedDates.findIndex((currentDate: Date) => {
					return isDatesEqual(currentDate, selectedDate, 'day');
				});

				// replace existing date
				if (index !== -1)
				{
					this.#selectedDates.splice(index, 1, selectedDate);
				}
			}
			else
			{
				const index = this.#selectedDates.findIndex((currentDate: Date) => {
					return currentDate > selectedDate;
				});

				if (index === -1)
				{
					this.#selectedDates.push(selectedDate);
				}
				else if (index === 0)
				{
					this.#selectedDates.unshift(selectedDate);
				}
				else
				{
					this.#selectedDates.splice(index, 0, selectedDate);
				}
			}
		}
		else
		{
			const currentDate = this.#selectedDates[0] || null;
			if (emitEvents && currentDate !== null)
			{
				if (!this.#canDeselectDate(currentDate))
				{
					return false;
				}

				this.deselectDate(currentDate, { emitEvents: false, render: false });
				this.emit(DatePickerEvent.DESELECT, { date: currentDate });
			}

			this.#selectedDates = [selectedDate];
		}

		this.adjustViewDate(selectedDate);
		if (this.isRendered() && render)
		{
			this.getPicker().render();
		}

		this.#refreshPresetsActive();

		if (updateInputs)
		{
			this.updateInputFields();
		}

		if (emitEvents)
		{
			this.emit(DatePickerEvent.SELECT, { date: selectedDate });
			this.emit(DatePickerEvent.SELECT_CHANGE);
		}

		return true;
	}

	selectDates(dates: DateLike[], options = {}): void
	{
		if (!Type.isArrayFilled(dates))
		{
			return;
		}

		if (this.isRangeMode())
		{
			const [start, end] = dates;
			this.selectRange(start, end, options);
		}
		else
		{
			dates.forEach((date: DateLike): void => {
				this.selectDate(date, options);
			});
		}
	}

	selectRange(start: DateLike, end: DateLike = null, options = {}): boolean
	{
		if (!this.isRangeMode())
		{
			throw new Error('DatePicker: to select a date use selectDate method.');
		}

		if (!isDateLike(start) || (end !== null && !isDateLike(end)))
		{
			return false;
		}

		let newStart = this.createDate(start);
		let newEnd = end === null ? null : this.createDate(end);
		if (newStart === null && newEnd === null)
		{
			return false;
		}

		if (newStart !== null && newEnd !== null && newStart > newEnd)
		{
			[newStart, newEnd] = [newEnd, newStart];
		}

		if (newStart !== null && !this.isDateAllowed(newStart))
		{
			return false;
		}

		if (newEnd !== null && !this.isDateAllowed(newEnd))
		{
			return false;
		}

		const currentStart = this.#selectedDates[0] || null;
		const currentEnd = this.#selectedDates[1] || null;

		if (
			isDatesEqual(newStart, currentStart, 'datetime')
			&& (
				(newEnd === null && currentEnd === null) || isDatesEqual(newEnd, currentEnd, 'datetime')
			)
		)
		{
			return false;
		}

		const { emitEvents, updateInputs } = { emitEvents: true, updateInputs: true, ...options };
		const deselectStart = (
			currentStart !== null
			&& emitEvents
			&& !isDatesEqual(newStart, currentStart, 'datetime')
			&& !isDatesEqual(newEnd, currentStart, 'datetime')
		);

		const deselectEnd = (
			currentEnd !== null
			&& emitEvents
			&& !isDatesEqual(newStart, currentEnd, 'datetime')
			&& !isDatesEqual(newEnd, currentEnd, 'datetime')
		);

		const selectStart = !this.isDateSelected(newStart, 'datetime');
		const selectEnd = (
			newEnd !== null
			&& (
				!this.isDateSelected(newEnd, 'datetime')
				|| (currentEnd === null && isDatesEqual(newEnd, newStart, 'datetime'))
			)
		);

		if (deselectStart && !this.#canDeselectDate(currentStart))
		{
			return false;
		}

		if (deselectEnd && !this.#canDeselectDate(currentEnd))
		{
			return false;
		}

		if (selectStart && !this.#canSelectDate(newStart))
		{
			return false;
		}

		if (selectEnd && !this.#canSelectDate(newEnd))
		{
			return false;
		}

		if (deselectStart)
		{
			this.deselectDate(currentStart, { emitEvents: false, render: false });
			this.emit(DatePickerEvent.DESELECT, { date: currentStart });
		}

		if (deselectEnd)
		{
			this.deselectDate(currentEnd, { emitEvents: false, render: false });
			this.emit(DatePickerEvent.DESELECT, { date: currentEnd });
		}

		this.#selectedDates = newEnd === null ? [newStart] : [newStart, newEnd];

		this.adjustViewDate(newStart);
		if (this.isRendered())
		{
			this.getPicker().render();
		}

		this.#refreshPresetsActive();

		if (updateInputs)
		{
			this.updateInputFields();
		}

		if (emitEvents)
		{
			if (selectStart)
			{
				this.emit(DatePickerEvent.SELECT, { date: newStart });
			}

			if (selectEnd)
			{
				this.emit(DatePickerEvent.SELECT, { date: newEnd });
			}

			this.emit(DatePickerEvent.SELECT_CHANGE);
		}

		return true;
	}

	deselectDate(date: DateLike, options = {}): boolean
	{
		if (!isDateLike(date))
		{
			return false;
		}

		const dateToDeselect = this.createDate(date);
		const { emitEvents, render, updateInputs } = {
			emitEvents: true,
			render: true,
			updateInputs: true,
			...options,
		};

		if (emitEvents && !this.#canDeselectDate(dateToDeselect))
		{
			return false;
		}

		if (this.isMultipleMode() && this.#selectedDates.length <= this.getMinDays())
		{
			return false;
		}

		const index = this.#selectedDates.findIndex((selectedDate) => {
			return isDatesEqual(dateToDeselect, selectedDate);
		});

		if (index === -1)
		{
			return false;
		}

		this.#selectedDates.splice(index, 1);

		if (emitEvents)
		{
			this.emit(DatePickerEvent.DESELECT, { date: dateToDeselect });
			this.emit(DatePickerEvent.SELECT_CHANGE);
		}

		if (this.isRendered() && render)
		{
			this.getPicker().render();
		}

		this.#refreshPresetsActive();

		if (updateInputs)
		{
			this.updateInputFields();
		}

		return true;
	}

	deselectAll(options = {}): boolean
	{
		const dates = [...this.#selectedDates];
		dates.forEach((date: Date) => {
			this.deselectDate(date, options);
		});

		return this.#selectedDates.length === 0;
	}

	#canSelectDate(date: Date): boolean
	{
		const event = new BaseEvent({ data: { date } });
		this.emit(DatePickerEvent.BEFORE_SELECT, event);

		return !event.isDefaultPrevented();
	}

	#canDeselectDate(date: Date): boolean
	{
		const event = new BaseEvent({ data: { date } });
		this.emit(DatePickerEvent.BEFORE_DESELECT, event);

		return !event.isDefaultPrevented();
	}

	getSelectedDates(): Date[]
	{
		return this.#selectedDates;
	}

	getSelectedDate(): Date | null
	{
		return this.#selectedDates[0] || null;
	}

	getRangeStart(): Date | null
	{
		return this.#selectedDates[0] || null;
	}

	getRangeEnd(): Date | null
	{
		return this.#selectedDates[1] || null;
	}

	isDateSelected(date: Date, precision: 'day' | 'datetime' | 'month' | 'year' = 'day'): boolean
	{
		return this.#selectedDates.some((selectedDate: Date): boolean => {
			return isDatesEqual(date, selectedDate, precision);
		});
	}

	setFocusDate(date: DateLike, options = {}): void
	{
		if (!isDateLike(date) && date !== null)
		{
			return;
		}

		this.#focusDate = date === null ? null : this.createDate(date);

		const { render, adjustViewDate, inputModality } = {
			render: true,
			adjustViewDate: true,
			inputModality: 'pointer',
			...options,
		};

		this.setFocusInputModality(this.#focusDate === null ? null : inputModality);

		if (adjustViewDate && this.isDateOutOfView(this.#focusDate))
		{
			this.setViewDate(createUtcDate(this.#focusDate.getUTCFullYear(), this.#focusDate.getUTCMonth()));
		}

		if (this.isRendered() && render)
		{
			this.getPicker().render();
		}
	}

	getFocusDate(): Date | null
	{
		return this.#focusDate;
	}

	getInitialFocusDate(mode: 'datetime' | 'range-start' | 'range-end' = 'datetime'): Date
	{
		const focusDate = this.getFocusDate();
		if (focusDate !== null)
		{
			return focusDate;
		}

		if (mode === 'range-start')
		{
			const { year, month, day } = this.getViewDateParts();

			return this.getRangeStart() || createUtcDate(year, month, day);
		}

		if (mode === 'range-end')
		{
			const { year, month, day } = this.getViewDateParts();

			return this.getRangeEnd() || createUtcDate(year, month, day);
		}

		const selectedDates = this.getSelectedDates();
		if (Type.isArrayFilled(selectedDates))
		{
			const date = selectedDates.find((selectedDate: Date) => {
				return !this.isDateOutOfView(selectedDate);
			});

			if (Type.isDate(date))
			{
				return date;
			}
		}

		return this.getViewDate();
	}

	getFocusInputModality(): InputModality | null
	{
		return this.#focusInputModality;
	}

	setFocusInputModality(modality: InputModality | null): void
	{
		this.#focusInputModality = modality;
	}

	isDateOutOfView(date: Date | null): boolean
	{
		if (date === null)
		{
			return false;
		}

		let isOutOfView = false;
		const { year: currentViewYear } = this.getViewDateParts();
		const { year: focusYear } = getDate(date);
		if (this.getCurrentView() === 'day')
		{
			const dayPicker: DayPicker = this.getPicker('day');
			const firstDay = dayPicker.getFirstDay();
			const lastDay = dayPicker.getLastDay();

			const focusDate = createUtcDate(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
			);

			isOutOfView = focusDate < firstDay || focusDate >= lastDay;
		}
		else if (this.getCurrentView() === 'month')
		{
			isOutOfView = currentViewYear !== focusYear;
		}
		else if (this.getCurrentView() === 'year')
		{
			const yearPicker: YearPicker = this.getPicker('year');
			const firstYear = yearPicker.getFirstYear();
			const lastYear = yearPicker.getLastYear();

			isOutOfView = focusYear < firstYear || focusYear > lastYear;
		}

		return isOutOfView;
	}

	setCurrentView(view: string): void
	{
		if (this.#currentView === view)
		{
			return;
		}

		const picker = this.getPicker(view);
		if (picker === null)
		{
			return;
		}

		Dom.style(this.getPicker()?.getContainer(), 'display', 'none');
		Dom.attr(this.getPicker()?.getContainer(), 'inert', true);
		this.getPicker()?.onHide();

		this.#currentView = view;
		this.setFocusDate(null, { render: false });

		if (!picker.isRendered())
		{
			picker.renderTo(this.getViewsContainer());
		}

		Dom.style(picker.getContainer(), 'display', null);
		Dom.attr(picker.getContainer(), 'inert', null);

		picker.onShow();
		picker.render();

		this.focus();
	}

	getCurrentView(): 'day' | 'year' | 'month' | 'time'
	{
		return this.#currentView;
	}

	getPicker(pickerId?: string): BasePicker | null
	{
		const currentPickerId = Type.isStringFilled(pickerId) ? pickerId : this.#currentView;
		let view = this.#views.get(currentPickerId) || null;
		if (view === null)
		{
			view = this.#createPicker(currentPickerId);
			if (view !== null)
			{
				this.#views.set(currentPickerId, view);
			}
		}

		return view;
	}

	#setType(type: DatePickerType)
	{
		if (['date', 'year', 'month', 'time'].includes(type))
		{
			this.#type = type;
		}
	}

	getType(): DatePickerType
	{
		return this.#type;
	}

	getFirstWeekDay(): number
	{
		return this.#firstWeekDay;
	}

	getNumberOfMonths(): number
	{
		return this.#numberOfMonths;
	}

	shouldShowWeekDays(): boolean
	{
		return this.#showWeekDays;
	}

	shouldShowWeekNumbers(): boolean
	{
		return this.#showWeekNumbers;
	}

	shouldShowOutsideDays(): boolean
	{
		return this.#showOutsideDays;
	}

	getWeekends(): number[]
	{
		return this.#weekends;
	}

	isWeekend(date: Date): boolean
	{
		return this.#weekends.includes(date.getUTCDay());
	}

	isHoliday(date: Date): boolean
	{
		return this.#holidays.some(([day, month]) => {
			return date.getUTCDate() === day && date.getUTCMonth() === month;
		});
	}

	isWorkday(date: Date): boolean
	{
		return this.#workdays.some(([day, month]) => {
			return date.getUTCDate() === day && date.getUTCMonth() === month;
		});
	}

	isDayOff(date: Date): boolean
	{
		return !this.isWorkday(date) && (this.isWeekend(date) || this.isHoliday(date));
	}

	isTimeEnabled(): boolean
	{
		return this.#enableTime;
	}

	setDefaultTime(time: string): void
	{
		if (Type.isStringFilled(time) && /([01]{1,2}\d|2[0-3]):[0-5]\d(:[0-5]\d)?/.test(time))
		{
			this.#defaultTime = time;
		}
	}

	getDefaultTime(): string
	{
		return this.#defaultTime;
	}

	setDefaultTimeSpan(minutes: number): void
	{
		if (Type.isNumber(minutes) && minutes >= 0)
		{
			this.#defaultTimeSpan = minutes;
		}
	}

	getDefaultTimeSpan(): string
	{
		return this.#defaultTimeSpan;
	}

	getDefaultTimeParts(): { hours: number, minutes: number, seconds: number }
	{
		const parts = this.getDefaultTime().split(':');

		return {
			hours: Number(parts[0] || 0),
			minutes: Number(parts[1] || 0),
			seconds: Number(parts[2] || 0),
		};
	}

	getTimePickerStyle(): 'wheel' | 'grid'
	{
		return this.#timePickerStyle;
	}

	shouldCutZeroTime(): boolean
	{
		return this.#cutZeroTime;
	}

	shouldAllowSeconds(): boolean
	{
		return this.#allowSeconds;
	}

	setToggleSelected(flag: boolean | null): void
	{
		if (Type.isBoolean(flag) || Type.isNull(flag))
		{
			this.#toggleSelected = flag;
		}
	}

	shouldToggleSelected(): boolean
	{
		if (this.#toggleSelected !== null)
		{
			return this.#toggleSelected;
		}

		return this.isMultipleMode();
	}

	setMaxDays(days: number): void
	{
		if (Type.isNumber(days) && days > 0)
		{
			this.#maxDays = days;
		}
	}

	getMaxDays(): number
	{
		return this.#maxDays;
	}

	setMinDays(days: number)
	{
		if (Type.isNumber(days) && days > 0)
		{
			this.#minDays = days;
		}
	}

	getMinDays(): number
	{
		return this.#minDays;
	}

	setMinDate(date: DateLike | null): void
	{
		if (date === null || Type.isUndefined(date))
		{
			this.#minDate = null;
		}
		else if (isDateLike(date))
		{
			this.#minDate = this.createDate(date);
		}

		if (this.isRendered())
		{
			this.getPicker()?.render();
		}
	}

	getMinDate(): Date | null
	{
		return this.#minDate;
	}

	setMaxDate(date: DateLike | null): void
	{
		if (date === null || Type.isUndefined(date))
		{
			this.#maxDate = null;
		}
		else if (isDateLike(date))
		{
			this.#maxDate = this.createDate(date);
		}

		if (this.isRendered())
		{
			this.getPicker()?.render();
		}
	}

	getMaxDate(): Date | null
	{
		return this.#maxDate;
	}

	setRestrictNavigation(flag: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.#restrictNavigation = flag;
			if (this.isRendered())
			{
				this.getPicker()?.render();
			}
		}
	}

	isNavigationRestricted(): boolean
	{
		return this.#restrictNavigation;
	}

	isDateAllowed(date: Date, precision: 'datetime' | 'day' | 'month' | 'year' = 'datetime'): boolean
	{
		if (
			this.#minDate === null
			&& this.#maxDate === null
			&& this.#disabledDateMatchers.length === 0
		)
		{
			return true;
		}

		const toComparable = (d: Date): number => {
			switch (precision)
			{
				case 'year':
					return d.getUTCFullYear();
				case 'month':
					return (d.getUTCFullYear() * 12) + d.getUTCMonth();
				case 'day':
					return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
				default:
					return d.getTime();
			}
		};

		const ref = toComparable(date);
		if (this.#minDate !== null && ref < toComparable(this.#minDate))
		{
			return false;
		}

		if (this.#maxDate !== null && ref > toComparable(this.#maxDate))
		{
			return false;
		}

		if (
			(precision === 'day' || precision === 'datetime')
			&& this.isDateDisabled(date)
		)
		{
			return false;
		}

		return true;
	}

	canNavigate(view: 'day' | 'month' | 'year', direction: 'prev' | 'next'): boolean
	{
		if (!this.#restrictNavigation)
		{
			return true;
		}

		const bound = direction === 'prev' ? this.#minDate : this.#maxDate;
		if (bound === null)
		{
			return true;
		}

		if (view === 'day')
		{
			const { year, month } = this.getViewDateParts();
			const numberOfMonths = this.getNumberOfMonths();
			const firstDay = createUtcDate(year, month, 1);
			const lastDay = addDate(createUtcDate(year, month + numberOfMonths, 1), 'day', -1);
			const checkDate = direction === 'prev'
				? addDate(firstDay, 'day', -1)
				: addDate(lastDay, 'day', 1)
			;

			return this.isDateAllowed(checkDate, 'day');
		}

		if (view === 'month')
		{
			const viewYear = this.getViewDate().getUTCFullYear();

			return direction === 'prev' ? bound.getUTCFullYear() < viewYear : bound.getUTCFullYear() > viewYear;
		}

		if (view === 'year')
		{
			const yearPicker = this.getPicker('year');
			if (yearPicker === null)
			{
				return true;
			}

			return direction === 'prev'
				? bound.getUTCFullYear() < yearPicker.getFirstYear()
				: bound.getUTCFullYear() > yearPicker.getLastYear()
			;
		}

		return true;
	}

	isFullYear(): boolean
	{
		return this.#fullYear;
	}

	isAmPmMode(): boolean
	{
		return this.#amPmMode;
	}

	getMinuteStep(): number
	{
		return this.#minuteStep;
	}

	getMinuteStepByDate(date: Date): number
	{
		let step = this.getMinuteStep();
		if (!Type.isDate(date))
		{
			return step;
		}

		const selectedMinute = date.getUTCMinutes();
		if (selectedMinute > 0 && (selectedMinute % step) !== 0)
		{
			// Reduce a step to show a selected minute
			const availableSteps = [30, 15, 10, 5, 1];
			const index = availableSteps.indexOf(selectedMinute);
			const steps = index === -1 ? [1] : availableSteps.slice(index);
			for (const newStep of steps)
			{
				if (selectedMinute % newStep === 0)
				{
					step = newStep;
					break;
				}
			}
		}

		return step;
	}

	getToday(): Date
	{
		return this.createDate(new Date());
	}

	show(): void
	{
		this.updateFromInputFields();

		if (this.isInline())
		{
			if (!this.isRendered())
			{
				this.#render();
			}

			// Dom.removeClass(this.getContainer(), '--hidden');
		}
		else
		{
			this.getPopup().show();
		}
	}

	hide(): void
	{
		if (!this.isRendered() || this.isInline())
		{
			return;
		}

		// if (this.isInline())
		// {
		// Dom.addClass(this.getContainer(), '--hidden');
		// }

		this.getPopup().close();
	}

	isOpen(): boolean
	{
		return this.#popup !== null && this.#popup.isShown();
	}

	adjustPosition(): void
	{
		if (this.isRendered() && this.isOpen())
		{
			this.getPopup().adjustPosition();
		}
	}

	toggle(): void
	{
		if (this.isOpen())
		{
			this.hide();
		}
		else
		{
			this.show();
		}
	}

	focus(): void
	{
		if (this.isRendered())
		{
			const rootContainer = this.getRootContainer();
			const [, next = null] = getFocusableBoundaryElements(
				rootContainer,
				(element: HTMLElement) => element.dataset.tabPriority === 'true',
			);

			if (next === null)
			{
				this.getRootContainer().focus({ preventScroll: true });
			}
			else
			{
				next.focus({ preventScroll: true, focusVisible: true });
				this.#keyboardNavigation.setLastFocusElement(next);
			}
		}
	}

	setSingleOpening(flag: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.#singleOpening = flag;
		}
	}

	isSingleOpening(): boolean
	{
		return this.#singleOpening;
	}

	setDayColors(options: DayColorOptions[]): void
	{
		if (!Type.isArray(options))
		{
			return;
		}

		const dayColors = [];
		for (const option of options)
		{
			if (!Type.isStringFilled(option.bgColor) && !Type.isStringFilled(option.textColor))
			{
				continue;
			}

			const matchers = this.#createDateMatchers(option.matcher);
			if (Type.isArrayFilled(matchers))
			{
				dayColors.push({
					bgColor: Type.isStringFilled(option.bgColor) ? option.bgColor : null,
					textColor: Type.isStringFilled(option.textColor) ? option.textColor : null,
					matchers,
				});
			}
		}

		this.#dayColors = dayColors;

		if (this.isRendered())
		{
			this.getPicker().render();
		}
	}

	getDayColor(day: Date): DayColor | null
	{
		return this.#dayColors.find((dayColor: DayColor): boolean => isDateMatch(day, dayColor.matchers)) || null;
	}

	setDayMarks(options: DayMarkOptions[]): void
	{
		if (!Type.isArray(options))
		{
			return;
		}

		const dayMarks = [];
		for (const option of options)
		{
			if (!Type.isStringFilled(option.bgColor))
			{
				continue;
			}

			const matchers = this.#createDateMatchers(option.matcher);
			if (Type.isArrayFilled(matchers))
			{
				dayMarks.push({
					bgColor: option.bgColor,
					matchers,
				});
			}
		}

		this.#dayMarks = dayMarks;

		if (this.isRendered())
		{
			this.getPicker().render();
		}
	}

	getDayMarks(day: Date): DayMark[]
	{
		return this.#dayMarks.filter((dayMark: DayMark): boolean => isDateMatch(day, dayMark.matchers));
	}

	setDisabledDates(matcher: DateLikeMatcher | DateLikeMatcher[]): void
	{
		if (Type.isUndefined(matcher) || matcher === null)
		{
			this.#disabledDateMatchers = [];
		}
		else
		{
			this.#disabledDateMatchers = this.#createDateMatchers(matcher);
		}

		if (this.isRendered())
		{
			this.getPicker()?.render();
			this.#refreshPresetsActive();
		}
	}

	getDisabledDates(): DateMatcher[]
	{
		return this.#disabledDateMatchers;
	}

	isDateDisabled(date: Date): boolean
	{
		if (this.#disabledDateMatchers.length === 0)
		{
			return false;
		}

		return isDateMatch(date, this.#disabledDateMatchers);
	}

	setPresets(presets: DatePickerPreset[]): void
	{
		if (!Type.isArray(presets))
		{
			return;
		}

		this.#presets = presets.filter((preset) => {
			return (
				Type.isPlainObject(preset)
				&& Type.isStringFilled(preset.label)
				&& !Type.isUndefined(preset.value)
			);
		});

		if (!this.isRendered())
		{
			return;
		}

		const body = this.#refs.get('body');

		if (this.#shouldRenderPresets())
		{
			const fresh = this.#createPresetsContainer();
			if (this.#presetsContainer !== null)
			{
				Dom.replace(this.#presetsContainer, fresh);
			}
			else if (body)
			{
				Dom.append(fresh, body);
			}
			this.#presetsContainer = fresh;
			this.#presetsFocusZone?.activate();
		}
		else if (this.#presetsContainer !== null)
		{
			this.#destroyPresetsFocusZone();
			Dom.remove(this.#presetsContainer);
			this.#presetsContainer = null;
		}
	}

	getPresets(): DatePickerPreset[]
	{
		return this.#presets;
	}

	#shouldRenderPresets(): boolean
	{
		return (
			this.#presets.length > 0
			&& this.#selectionMode !== 'none'
			&& this.getType() === 'date'
		);
	}

	#createPresetsContainer(): HTMLElement
	{
		const container = Tag.render`
			<div
				class="ui-date-picker-presets"
				role="listbox"
				aria-label="${Loc.getMessage('UI_DATE_PICKER_PRESETS_LABEL')}"
			></div>
		`;
		this.#presets.forEach((preset: DatePickerPreset, index: number): void => {
			const button = this.#renderPreset(preset, index);
			if (button !== null)
			{
				Dom.append(button, container);
			}
		});

		this.#destroyPresetsFocusZone();
		this.#presetsFocusZone = new FocusZone(container, {
			focusOutBehavior: 'wrap',
		});

		return container;
	}

	#destroyPresetsFocusZone(): void
	{
		if (this.#presetsFocusZone !== null)
		{
			this.#presetsFocusZone.deactivate();
			this.#presetsFocusZone = null;
		}
	}

	#renderPreset(preset: DatePickerPreset, index: number): HTMLElement | null
	{
		const dates = this.#resolvePresetValue(preset);
		const disabled = !this.#isPresetAllowed(preset, dates);
		const isActive = !disabled && this.#isPresetActive(preset, dates);
		const subtitle = this.#getPresetSubtitle(preset, dates);

		const classes = ['ui-date-picker-preset'];
		if (isActive)
		{
			classes.push('--active');
		}

		if (disabled)
		{
			classes.push('--disabled');
		}

		const subtitleNode = (
			subtitle === null
				? ''
				: Tag.render`<span class="ui-date-picker-preset-subtitle">${subtitle}</span>`
		);

		const button = Tag.render`
			<button
				type="button"
				class="${classes.join(' ')}"
				data-index="${index}"
				aria-pressed="${isActive ? 'true' : 'false'}"
				onclick="${this.#handlePresetClick.bind(this, preset)}"
				onmouseenter="${this.#handlePresetMouseEnter.bind(this, preset)}"
				onmouseleave="${this.#handlePresetMouseLeave.bind(this)}"
			>
				<span class="ui-date-picker-preset-label">${preset.label}</span>
				${subtitleNode}
			</button>
		`;
		button.disabled = disabled;

		return button;
	}

	#isPresetAllowed(preset: DatePickerPreset, resolvedDates: Date[] | null = null): boolean
	{
		if (this.#minDate === null && this.#maxDate === null)
		{
			return true;
		}

		const dates = resolvedDates === null ? this.#resolvePresetValue(preset) : resolvedDates;
		if (dates === null)
		{
			return true;
		}

		return dates.every((date: Date): boolean => this.isDateAllowed(date));
	}

	#resolvePresetValue(preset: DatePickerPreset): Date[] | null
	{
		return resolvePresetValue(preset, this.#selectionMode, this.getDateFormat());
	}

	#isPresetActive(preset: DatePickerPreset, resolvedDates: Date[] | null = null): boolean
	{
		const dates = resolvedDates === null ? this.#resolvePresetValue(preset) : resolvedDates;
		if (dates === null)
		{
			return false;
		}

		const precision = this.isTimeEnabled() || this.getType() === 'time' ? 'datetime' : 'day';

		if (this.isSingleMode())
		{
			const selected = this.getSelectedDate();

			return selected !== null && isDatesEqual(dates[0], selected, precision);
		}

		if (this.isRangeMode())
		{
			const rangeStart = this.getRangeStart();
			const rangeEnd = this.getRangeEnd();

			return rangeStart !== null
				&& rangeEnd !== null
				&& isDatesEqual(dates[0], rangeStart, precision)
				&& isDatesEqual(dates[1], rangeEnd, precision)
			;
		}

		if (this.isMultipleMode())
		{
			const selected = this.getSelectedDates();
			if (selected.length !== dates.length)
			{
				return false;
			}

			return dates.every((presetDate: Date): boolean => {
				return selected.some((selectedDate: Date): boolean => {
					return isDatesEqual(presetDate, selectedDate, precision);
				});
			});
		}

		return false;
	}

	#getPresetSubtitle(preset: DatePickerPreset, dates: Date[] | null): string | null
	{
		return getPresetSubtitle(preset, dates, (resolved) => this.#buildAutoSubtitle(resolved));
	}

	#buildAutoSubtitle(dates: Date[]): string | null
	{
		const withTime = this.isTimeEnabled();
		const timeFormat = this.getTimeFormat();

		const formatBy = (date: Date, format: string): string => {
			return DateTimeFormat.format(format, date, null, true);
		};
		const formatTime = (date: Date): string => formatBy(date, timeFormat);
		const formatDate = (date: Date, formatName: string): string => {
			const datePart = formatBy(date, DateTimeFormat.getFormat(formatName));

			return withTime ? `${datePart} ${formatTime(date)}` : datePart;
		};

		if (this.isRangeMode())
		{
			const [start, end] = dates;
			const sameYear = start.getUTCFullYear() === end.getUTCFullYear();

			if (withTime && isDatesEqual(start, end, 'day'))
			{
				return `${formatDate(start, 'SHORT_DAY_OF_WEEK_SHORT_MONTH_FORMAT')} – ${formatTime(end)}`;
			}

			let formatName = null;
			if (withTime)
			{
				formatName = sameYear ? 'SHORT_DAY_OF_WEEK_SHORT_MONTH_FORMAT' : 'MEDIUM_DATE_FORMAT';
			}
			else
			{
				formatName = sameYear ? 'DAY_MONTH_FORMAT' : 'MEDIUM_DATE_FORMAT';
			}

			return `${formatDate(start, formatName)} – ${formatDate(end, formatName)}`;
		}

		if (this.isMultipleMode())
		{
			if (dates.length === 1)
			{
				return formatDate(dates[0], 'DAY_OF_WEEK_MONTH_FORMAT');
			}

			if (dates.length === 2)
			{
				return `${formatDate(dates[0], 'DAY_MONTH_FORMAT')}, ${formatDate(dates[1], 'DAY_MONTH_FORMAT')}`;
			}

			return null;
		}

		return formatDate(dates[0], 'DAY_OF_WEEK_MONTH_FORMAT');
	}

	#handlePresetClick(preset: DatePickerPreset): void
	{
		const dates = this.#resolvePresetValue(preset);
		if (dates === null || !this.#isPresetAllowed(preset, dates))
		{
			return;
		}

		if (this.isSingleMode())
		{
			this.selectDate(dates[0]);
		}
		else if (this.isRangeMode())
		{
			this.selectRange(dates[0], dates[1]);
		}
		else if (this.isMultipleMode())
		{
			this.deselectAll({ emitEvents: false });
			this.selectDates(dates);
		}

		this.emit(DatePickerEvent.PRESET_SELECT, { preset, dates });

		if (this.shouldHideOnSelect())
		{
			this.hide();
		}
	}

	#handlePresetMouseEnter(preset: DatePickerPreset): void
	{
		if (!this.isSingleMode())
		{
			return;
		}

		const dates = this.#resolvePresetValue(preset);
		if (dates === null || !this.#isPresetAllowed(preset, dates))
		{
			return;
		}

		const dayPicker: DayPicker = this.getPicker('day');
		dayPicker?.clearMouseOutTimeout();

		this.setFocusDate(dates[0]);
	}

	#handlePresetMouseLeave(): void
	{
		this.setFocusDate(null);
	}

	#refreshPresetsActive(): void
	{
		if (this.#presetsContainer === null)
		{
			return;
		}

		const buttons = this.#presetsContainer.querySelectorAll('.ui-date-picker-preset');
		this.#presets.forEach((preset: DatePickerPreset, index: number): void => {
			const button = buttons[index];
			if (!button)
			{
				return;
			}

			const dates = this.#resolvePresetValue(preset);
			const disabled = !this.#isPresetAllowed(preset, dates);
			const isActive = !disabled && this.#isPresetActive(preset, dates);

			button.disabled = disabled;
			if (disabled)
			{
				Dom.addClass(button, '--disabled');
			}
			else
			{
				Dom.removeClass(button, '--disabled');
			}

			if (isActive)
			{
				Dom.addClass(button, '--active');
			}
			else
			{
				Dom.removeClass(button, '--active');
			}

			button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});
	}

	#createDateMatchers(matcher: DateLikeMatcher | DateLikeMatcher[]): DateMatcher[]
	{
		if (Type.isUndefined(matcher))
		{
			return [];
		}

		const result = [];
		const matchers = Type.isArray(matcher) ? [...matcher] : [matcher];
		matchers.forEach((matcherValue: DateLikeMatcher): void => {
			if (Type.isArray(matcherValue))
			{
				const dates = [];
				matcherValue.forEach((dateLike: DateLike): void => {
					if (!isDateLike(dateLike))
					{
						return;
					}

					const date = this.createDate(dateLike);
					if (date !== null)
					{
						dates.push(date);
					}
				});

				result.push(dates);
			}
			else if (isDateLike(matcherValue))
			{
				const date = this.createDate(matcherValue);
				if (date !== null)
				{
					result.push(date);
				}
			}
			else if (Type.isBoolean(matcherValue) || Type.isFunction(matcherValue))
			{
				result.push(matcherValue);
			}
			else if (Type.isPlainObject(matcherValue))
			{
				const converted = this.#convertExtraMatcher(matcherValue);
				if (converted !== null)
				{
					result.push(converted);
				}
			}
		});

		return result;
	}

	#convertExtraMatcher(matcher: Object): Object | null
	{
		if (Type.isArray(matcher.dayOfWeek))
		{
			return { dayOfWeek: matcher.dayOfWeek };
		}

		if (Type.isArray(matcher.dayOfMonth))
		{
			return { dayOfMonth: matcher.dayOfMonth };
		}

		const converted = {};
		for (const key of ['from', 'to', 'before', 'after'])
		{
			if (!(key in matcher) || Type.isUndefined(matcher[key]) || Type.isNull(matcher[key]))
			{
				continue;
			}

			const date = this.createDate(matcher[key]);
			if (date === null)
			{
				return null;
			}

			converted[key] = date;
		}

		return Object.keys(converted).length > 0 ? converted : null;
	}

	getPopup(): Popup
	{
		if (this.#popup !== null)
		{
			return this.#popup;
		}

		const popupOptions = { ...this.#popupOptions };
		const userEvents = popupOptions.events;
		delete popupOptions.events;

		const defaultAriaLabel = this.getTitle();
		const ariaLabel = (
			Type.isStringFilled(popupOptions.ariaLabel) || Type.isStringFilled(popupOptions.title)
				? popupOptions.ariaLabel
				: defaultAriaLabel
		);

		delete popupOptions.ariaLabel;

		this.#popup = new Popup({
			contentPadding: 0,
			padding: 0,
			offsetTop: 5,
			bindElement: this.getTargetNode(),
			bindOptions: {
				forceBindPosition: true,
			},
			autoHide: this.isAutoHide(),
			closeByEsc: this.shouldHideByEsc(),
			cacheable: this.isCacheable(),
			content: this.getContainer(),
			ariaLabel,
			focusTrap: {
				initialFocus: false,
			},
			autoHideHandler: this.#handleAutoHide.bind(this),
			events: {
				onFirstShow: this.#handlePopupFirstShow.bind(this),
				onShow: this.#handlePopupShow.bind(this),
				onClose: this.#handlePopupClose.bind(this),
				onDestroy: this.#handlePopupDestroy.bind(this),
			},
			...popupOptions,
		});

		this.#popup.subscribeFromOptions(userEvents);

		return this.#popup;
	}

	#setSelectionMode(mode: DatePickerSelectionMode): void
	{
		if (this.getType() !== 'date')
		{
			this.#selectionMode = 'single';
		}
		else if (['single', 'multiple', 'range', 'none'].includes(mode))
		{
			this.#selectionMode = mode;
		}
	}

	setHideOnSelect(flag: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.#hideOnSelect = flag;
		}
	}

	shouldHideOnSelect(): boolean
	{
		if (this.isInline())
		{
			return false;
		}

		return this.#hideOnSelect;
	}

	setDateSeparator(separator: string): void
	{
		if (Type.isStringFilled(separator))
		{
			this.#dateSeparator = separator;
		}
	}

	getDateSeparator(): string
	{
		return this.#dateSeparator;
	}

	setInputField(field: string | HTMLElement): void
	{
		const input = this.#getInputField(field);
		if (input !== null)
		{
			this.#inputField = input;
			this.#bindInputEvents(input);
			this.#applyInputAriaAttributes(input);
		}
	}

	setRangeStartInput(field: string | HTMLElement): void
	{
		const input = this.#getInputField(field);
		if (input !== null)
		{
			this.#rangeStartInput = input;
			this.#bindInputEvents(input);
			this.#applyInputAriaAttributes(input);
		}
	}

	setRangeEndInput(field: string | HTMLElement): void
	{
		const input = this.#getInputField(field);
		if (input !== null)
		{
			this.#rangeEndInput = input;
			this.#bindInputEvents(input);
			this.#applyInputAriaAttributes(input);
		}
	}

	#applyInputAriaAttributes(input: HTMLElement): void
	{
		if (this.isInline())
		{
			return;
		}

		input.setAttribute('aria-haspopup', 'dialog');
		input.setAttribute('aria-expanded', this.isOpen() ? 'true' : 'false');
	}

	#syncInputsAriaExpanded(open: boolean): void
	{
		const expanded = open ? 'true' : 'false';
		[this.#inputField, this.#rangeStartInput, this.#rangeEndInput].forEach((input) => {
			if (input !== null && input.hasAttribute('aria-haspopup'))
			{
				input.setAttribute('aria-expanded', expanded);
			}
		});
	}

	#getInputField(field: string | HTMLElement): HTMLElement | null
	{
		if (Type.isStringFilled(field))
		{
			const element = document.querySelector(field);
			if (Type.isElementNode(element) || (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA'))
			{
				return element;
			}

			console.error(`Date Picker: a form element was not found (${field}).`);
		}
		else if (Type.isElementNode(field) && (field.nodeName === 'INPUT' || field.nodeName === 'TEXTAREA'))
		{
			return field;
		}

		return null;
	}

	#bindInputEvents(input: HTMLElement): void
	{
		if (!this.shouldUseInputEvents())
		{
			return;
		}

		Event.bind(input, 'click', this.#refs.remember('click-handler', () => {
			return this.#handleInputClick.bind(this);
		}));

		Event.bind(input, 'focusout', this.#refs.remember('focusout-handler', () => {
			return this.#handleInputFocusOut.bind(this);
		}));

		Event.bind(input, 'keydown', this.#refs.remember('keydown-handler', () => {
			return this.#handleInputKeyDown.bind(this);
		}));

		Event.bind(input, 'input', this.#refs.remember('change-handler', () => {
			return this.#handleInputChange.bind(this);
		}));
	}

	#unbindInputEvents(input: HTMLElement): void
	{
		Event.unbind(input, 'click', this.#refs.get('click-handler'));
		Event.unbind(input, 'focusout', this.#refs.get('focusout-handler'));
		Event.unbind(input, 'keydown', this.#refs.get('keydown-handler'));
		Event.unbind(input, 'input', this.#refs.get('change-handler'));
	}

	#handleInputClick(event: MouseEvent): void
	{
		if (this.isRangeMode())
		{
			this.setTargetNode(event.target);
			if (!this.isOpen())
			{
				this.show();
			}
		}
		else
		{
			this.show();
		}
	}

	#handleInputFocusOut(event: MouseEvent): void
	{
		if (!this.getRootContainer().contains(event.relatedTarget))
		{
			this.hide();
		}
	}

	#handleInputKeyDown(event: KeyboardEvent): void
	{
		if (event.key === 'Tab' && !event.shiftKey && this.isOpen())
		{
			event.preventDefault();
			this.focus();
		}
	}

	#handleInputChange(event: KeyboardEvent): void
	{
		if (this.isOpen())
		{
			this.updateFromInputFields();
		}
	}

	#handleAutoHide(event: MouseEvent): boolean
	{
		const target = event.target;
		const el = this.getPopup().getPopupContainer();
		if (target === el || el.contains(target))
		{
			return false;
		}

		if (this.isRangeMode())
		{
			const anotherInput = (
				(this.getRangeStartInput() === target || this.getRangeEndInput() === target)
				&& this.getTargetNode() !== target
			);

			return !anotherInput;
		}

		return true;
	}

	shouldUseInputEvents(): boolean
	{
		return this.#useInputEvents;
	}

	getInputField(): HTMLInputElement | HTMLTextAreaElement | null
	{
		return this.#inputField;
	}

	getRangeStartInput(): HTMLInputElement | HTMLTextAreaElement | null
	{
		return this.#rangeStartInput;
	}

	getRangeEndInput(): HTMLInputElement | HTMLTextAreaElement | null
	{
		return this.#rangeEndInput;
	}

	updateInputFields(): void
	{
		if (this.isSingleMode())
		{
			if (this.getType() === 'time')
			{
				this.#setInputDate(this.getInputField(), this.getSelectedDate(), this.getTimeFormat());
			}
			else
			{
				this.#setInputDate(this.getInputField(), this.getSelectedDate());
			}
		}
		else if (this.isMultipleMode())
		{
			this.#setInputDate(
				this.getInputField(),
				this.getSelectedDates()
					.map((date: Date) => this.formatDate(date))
					.join(this.getDateSeparator())
				,
			);
		}
		else if (this.isRangeMode())
		{
			this.#setInputDate(this.getRangeStartInput(), this.getRangeStart());
			this.#setInputDate(this.getRangeEndInput(), this.getRangeEnd());
		}
	}

	#focusInputField(): void
	{
		if (this.getInputField() !== null)
		{
			this.getInputField().focus({ preventScroll: true });
		}
		else if (this.getRangeStartInput() !== null)
		{
			this.getRangeStartInput().focus({ preventScroll: true });
		}
	}

	updateFromInputFields(): void
	{
		if (this.isSingleMode() && this.getInputField() !== null)
		{
			const inputDate = this.#getDateFromInput(this.getInputField());
			if (inputDate === null)
			{
				this.deselectAll({ updateInputs: false, emitEvents: false });
			}
			else
			{
				this.selectDate(inputDate, { updateInputs: false, emitEvents: false });
			}
		}
		else if (this.isMultipleMode() && this.getInputField() !== null)
		{
			const value = this.getInputField().value.trim();
			const inputDates: Date[] = value
				.split(this.getDateSeparator().trim())
				.map((part: string) => this.createDate(part.trim()))
				.filter((date: Date | null) => date !== null)
			;

			this.deselectAll({ updateInputs: false, emitEvents: false });
			this.selectDates(inputDates, { updateInputs: false, emitEvents: false });
		}
		else if (this.isRangeMode() && this.getRangeStartInput() !== null)
		{
			const rangeStart = this.#getDateFromInput(this.getRangeStartInput());
			const rangeEnd = this.#getDateFromInput(this.getRangeEndInput());

			if (rangeStart === null)
			{
				this.deselectAll({ updateInputs: false, emitEvents: false });
			}
			else
			{
				this.selectRange(rangeStart, rangeEnd, { updateInputs: false, emitEvents: false });
			}
		}
	}

	#getDateFromInput(input: HTMLInputElement | HTMLTextAreaElement | null): Date | null
	{
		if (input === null)
		{
			return null;
		}

		const value = input.value.trim();
		if (!Type.isStringFilled(value))
		{
			return null;
		}

		if (this.getType() === 'time')
		{
			return createDate(value, this.getTimeFormat());
		}

		return this.createDate(value);
	}

	#setInputDate(input: HTMLInputElement | HTMLTextAreaElement | null, date: Date | null, format: string = null): void
	{
		if (input !== null)
		{
			let value = '';
			if (date === null)
			{
				value = '';
			}
			else if (Type.isString(date))
			{
				value = date;
			}
			else
			{
				value = this.formatDate(date, format);
			}

			// eslint-disable-next-line no-param-reassign
			input.value = value;
		}
	}

	getLocale(): string
	{
		return this.#locale;
	}

	isRendered(): boolean
	{
		return this.#rendered;
	}

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			const classes = ['ui-date-picker'];
			if (this.isInline())
			{
				classes.push('--inline');
			}

			if (this.shouldHideHeader())
			{
				classes.push('--hide-header');
			}

			classes.push(`--${this.getType()}-picker`);

			const container = Tag.render`
				<div
					id="${this.getContainerId()}"
					tabindex="-1"
					onkeyup="${this.#handleContainerKeyUp.bind(this)}"
					class="${classes.join(' ')}"
				>
					${this.getBodyContainer()}
				</div>
			`;

			if (this.isInline())
			{
				container.setAttribute('role', 'group');
				container.setAttribute('aria-label', this.getTitle());
			}

			return container;
		});
	}

	getRootContainer(): HTMLElement
	{
		return this.isInline() ? this.getContainer() : this.getPopup().getPopupContainer();
	}

	getTitle(): string
	{
		if (this.getType() === 'time')
		{
			return Loc.getMessage('UI_DATE_PICKER_TIME_VIEW_LABEL');
		}

		if (this.getType() === 'month')
		{
			return Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL');
		}

		if (this.getType() === 'year')
		{
			return Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL');
		}

		return Loc.getMessage('UI_DATE_PICKER_DIALOG_LABEL');
	}

	getContainerId(): string
	{
		return `ui-date-picker-${this.#id}`;
	}

	getBodyContainer(): HTMLElement
	{
		return this.#refs.remember('body', () => {
			const body = Tag.render`<div class="ui-date-picker-body" role="none">${this.getViewsContainer()}</div>`;

			if (this.#shouldRenderPresets())
			{
				this.#presetsContainer = this.#createPresetsContainer();
				Dom.append(this.#presetsContainer, body);
			}

			return body;
		});
	}

	getViewsContainer(): HTMLElement
	{
		return this.#refs.remember('views', () => {
			return Tag.render`<div role="none" class="ui-date-picker-views" id="${this.getContainerId()}-views"></div>`;
		});
	}

	getViewsContainerId(): string
	{
		return this.getViewsContainer().id;
	}

	isMultipleMode(): boolean
	{
		return this.#selectionMode === 'multiple';
	}

	isSingleMode(): boolean
	{
		return this.#selectionMode === 'single';
	}

	isRangeMode(): boolean
	{
		return this.#selectionMode === 'range';
	}

	isInline(): boolean
	{
		return this.#inline;
	}

	isFocused(): boolean
	{
		const rootContainer = this.getRootContainer();
		const activeElement = rootContainer.ownerDocument.activeElement;

		return rootContainer.contains(activeElement) || rootContainer === activeElement;
	}

	setAutoFocus(flag: boolean): boolean
	{
		if (Type.isBoolean(flag))
		{
			this.#autoFocus = flag;
		}
	}

	isAutoFocus(): boolean
	{
		return this.#autoFocus;
	}

	setTargetNode(node: HTMLElement | { left: number, top: number } | null | MouseEvent): void
	{
		if (!Type.isDomNode(node) && !Type.isNull(node) && !Type.isObject(node))
		{
			return;
		}

		this.#targetNode = node;

		if (this.isRendered())
		{
			this.getPopup().setBindElement(this.#targetNode);
			this.getPopup().adjustPosition();
		}
	}

	getTargetNode(): HTMLElement | null
	{
		return this.#targetNode;
	}

	setAutoHide(enable: boolean): void
	{
		if (Type.isBoolean(enable))
		{
			this.#autoHide = enable;
			if (this.isRendered())
			{
				this.getPopup().setAutoHide(enable);
			}
		}
	}

	isAutoHide(): boolean
	{
		return this.#autoHide;
	}

	setHideByEsc(enable: boolean): void
	{
		if (Type.isBoolean(enable))
		{
			this.#hideByEsc = enable;
			if (this.isRendered())
			{
				this.getPopup().setClosingByEsc(enable);
			}
		}
	}

	shouldHideByEsc(): boolean
	{
		return this.#hideByEsc;
	}

	isCacheable(): boolean
	{
		return this.#cacheable;
	}

	setCacheable(cacheable: boolean): void
	{
		if (Type.isBoolean(cacheable))
		{
			this.#cacheable = cacheable;
			if (this.isRendered())
			{
				this.getPopup().setCacheable(cacheable);
			}
		}
	}

	setHideHeader(enable: boolean): void
	{
		if (Type.isBoolean(enable))
		{
			this.#hideHeader = enable;
			if (this.isRendered())
			{
				if (enable)
				{
					Dom.addClass(this.getContainer(), '--hide-header');
				}
				else
				{
					Dom.removeClass(this.getContainer(), '--hide-header');
				}
			}
		}
	}

	shouldHideHeader(): boolean
	{
		return this.#hideHeader;
	}

	createDate(date: DateLike): Date | null
	{
		return createDate(date, this.getDateFormat());
	}

	formatDate(date: Date, format: string = null): string
	{
		const midnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
		const dateFormat = format === null ? this.getDateFormat() : format;
		let result = DateTimeFormat.format(dateFormat, date, null, true);

		if (this.isTimeEnabled() && midnight && this.shouldCutZeroTime())
		{
			result = result
				.replaceAll(/\s*12:00:00 am\s*/gi, '')
				.replaceAll(/\s*12:00 am\s*/gi, '')
				.replaceAll(/\s*00:00:00\s*/g, '')
				.replaceAll(/\s*00:00\s*/g, '')
			;
		}

		return result;
	}

	formatTime(date: Date, format: string = null): string
	{
		return DateTimeFormat.format(
			format === null ? this.getTimeFormat() : format,
			date,
			null,
			true,
		);
	}

	getDateFormat(): string
	{
		return this.#dateFormat;
	}

	#getDefaultDateFormat(): string
	{
		if (this.getType() === 'year')
		{
			return 'Y';
		}

		if (this.getType() === 'month')
		{
			return 'f - Y';
		}

		if (this.isTimeEnabled())
		{
			if (this.shouldAllowSeconds())
			{
				return DateTimeFormat.getFormat('FORMAT_DATETIME');
			}

			return DateTimeFormat.getFormat('FORMAT_DATETIME').replace(/:s/i, '');
		}

		return DateTimeFormat.getFormat('FORMAT_DATE');
	}

	getTimeFormat(): string
	{
		return this.#timeFormat;
	}

	#render(): void
	{
		if (this.isRendered())
		{
			return;
		}

		if (this.isInline() && this.getTargetNode() !== null)
		{
			Dom.append(this.getContainer(), this.getTargetNode());
		}

		const views = ['day', 'month', 'year', 'time'];
		const index = views.indexOf(this.getType());
		const view = index === -1 ? 'day' : views[index];

		this.setCurrentView(view);
		this.#rendered = true;

		if (this.#keyboardNavigation !== null)
		{
			this.#keyboardNavigation.init();
		}

		this.#presetsFocusZone?.activate();
	}

	#createPicker(pickerId: string): BasePicker
	{
		if (pickerId === 'day')
		{
			const dayPicker = new DayPicker(this);
			dayPicker.subscribe('onSelect', this.#handleDaySelect.bind(this));
			dayPicker.subscribe('onFocus', this.#handleDayFocus.bind(this));
			dayPicker.subscribe('onBlur', this.#handleDayBlur.bind(this));

			dayPicker.subscribe('onPrevBtnClick', () => {
				const unit = this.isFullYear() ? 'year' : 'month';
				const viewDate = addDate(floorDate(this.getViewDate(), unit), unit, -1);
				this.setViewDate(viewDate);
			});

			dayPicker.subscribe('onNextBtnClick', () => {
				const unit = this.isFullYear() ? 'year' : 'month';
				const viewDate = ceilDate(this.getViewDate(), unit);
				this.setViewDate(viewDate);
			});

			dayPicker.subscribe('onMonthClick', () => this.setCurrentView('month'));
			dayPicker.subscribe('onYearClick', () => this.setCurrentView('year'));
			dayPicker.subscribe('onTimeClick', this.#handleTimeClick.bind(this, 'datetime'));
			dayPicker.subscribe('onRangeStartClick', this.#handleTimeClick.bind(this, 'range-start'));
			dayPicker.subscribe('onRangeEndClick', this.#handleTimeClick.bind(this, 'range-end'));

			return dayPicker;
		}

		if (pickerId === 'month')
		{
			const monthPicker = new MonthPicker(this);
			monthPicker.subscribe('onSelect', this.#handleMonthSelect.bind(this));
			monthPicker.subscribe('onFocus', this.#handleMonthFocus.bind(this));
			monthPicker.subscribe('onBlur', this.#handleMonthBlur.bind(this));

			monthPicker.subscribe('onPrevBtnClick', () => {
				const { year, month } = getDate(this.getViewDate());
				const viewDate = createUtcDate(year - 1, month, 1);
				this.setViewDate(viewDate);
			});
			monthPicker.subscribe('onNextBtnClick', () => {
				const { year, month } = getDate(this.getViewDate());
				const viewDate = createUtcDate(year + 1, month, 1);
				this.setViewDate(viewDate);
			});

			monthPicker.subscribe('onTitleClick', () => this.setCurrentView('year'));

			return monthPicker;
		}

		if (pickerId === 'year')
		{
			const yearPicker = new YearPicker(this);
			yearPicker.subscribe('onSelect', this.#handleYearSelect.bind(this));
			yearPicker.subscribe('onFocus', this.#handleYearFocus.bind(this));
			yearPicker.subscribe('onBlur', this.#handleYearBlur.bind(this));
			yearPicker.subscribe('onPrevBtnClick', () => {
				const { year } = getDate(this.getViewDate());
				const viewDate = createUtcDate(year - 12, 0, 1);
				this.setViewDate(viewDate);
			});
			yearPicker.subscribe('onNextBtnClick', () => {
				const { year } = getDate(this.getViewDate());
				const viewDate = createUtcDate(year + 12, 0, 1);
				this.setViewDate(viewDate);
			});

			return yearPicker;
		}

		if (pickerId === 'time')
		{
			const timePicker = this.getTimePickerStyle() === 'wheel' ? new TimePickerWheel(this) : new TimePickerGrid(this);
			if (this.isRangeMode())
			{
				timePicker.subscribe('onSelect', this.#handleTimeRangeSelect.bind(this));
			}
			else
			{
				timePicker.subscribe('onSelect', this.#handleTimeSelect.bind(this));
			}

			timePicker.subscribe('onFocus', this.#handleTimeFocus.bind(this));
			timePicker.subscribe('onBlur', this.#handleTimeBlur.bind(this));
			timePicker.subscribe('onPrevBtnClick', () => this.setCurrentView('day'));
			timePicker.subscribe('onTitleClick', () => this.setCurrentView('day'));

			return timePicker;
		}

		return null;
	}

	#handleContainerKeyUp(event: KeyboardEvent): void
	{
		if (this.isInline())
		{
			return;
		}

		if (event.key === 'Escape' && this.shouldHideByEsc())
		{
			this.hide();
		}
	}

	#handleTimeClick(mode)
	{
		const timePicker: TimePickerWheel = this.getPicker('time');
		const selectTime = (
			(mode === 'range-start' && this.getRangeStart() !== null)
			|| (mode === 'range-end' && this.getRangeEnd() !== null)
			|| (this.getSelectedDate() !== null)
		);

		if (selectTime)
		{
			timePicker.setMode(mode);
			this.setCurrentView('time');
		}
	}

	#handleDaySelect(event: BaseEvent): void
	{
		const { year, month, day } = event.getData();
		let selectedDate = createUtcDate(year, month, day);

		const dayEvent = new BaseEvent({ data: { date: selectedDate } });
		this.emit(DatePickerEvent.BEFORE_DAY_SELECT, dayEvent);
		if (dayEvent.isDefaultPrevented())
		{
			return;
		}

		if (this.isRangeMode())
		{
			const currentRange = this.#selectedDates;
			if (currentRange.length === 0)
			{
				const { hours, minutes, seconds } = this.getDefaultTimeParts();
				selectedDate = setTime(selectedDate, hours, minutes, seconds);
			}
			else if (currentRange.length === 1)
			{
				let { hours, minutes, seconds } = this.getDefaultTimeParts();
				if (this.isDateSelected(selectedDate, 'day'))
				{
					({ hours, minutes, seconds } = getDate(this.getRangeStart()));
					minutes += this.getDefaultTimeSpan();
				}

				selectedDate = setTime(selectedDate, hours, minutes, seconds);
			}

			const range = addToRange(selectedDate, currentRange);
			const [start, end] = range;
			if (range.length === 0)
			{
				this.deselectAll();
			}
			else
			{
				this.selectRange(start, end);
			}
		}
		else if (this.isDateSelected(selectedDate))
		{
			if (this.shouldToggleSelected())
			{
				this.deselectDate(selectedDate);
			}
			else if (this.shouldHideOnSelect() && this.isSingleMode())
			{
				this.hide();
			}
		}
		else
		{
			let { hours, minutes, seconds } = this.getDefaultTimeParts();
			if (this.isSingleMode() && this.getSelectedDate() !== null)
			{
				// save previous time
				({ hours, minutes, seconds } = getDate(this.getSelectedDate()));
			}

			this.selectDate(createUtcDate(year, month, day, hours, minutes, seconds));

			if (this.shouldHideOnSelect() && this.isSingleMode() && !this.isTimeEnabled())
			{
				this.hide();
			}
		}
	}

	#handleDayFocus(event: BaseEvent): void
	{
		const { year, month, day } = event.getData();

		const focusDate = createUtcDate(year, month, day);
		if (!isDatesEqual(focusDate, this.getFocusDate()))
		{
			this.setFocusDate(focusDate);
		}
	}

	#handleDayBlur(event: BaseEvent): void
	{
		this.setFocusDate(null);
	}

	#handleMonthFocus(event: BaseEvent): void
	{
		const { year, month } = event.getData();

		const focusDate = createUtcDate(year, month);
		if (!isDatesEqual(focusDate, this.getFocusDate(), 'month'))
		{
			this.setFocusDate(focusDate);
		}
	}

	#handleMonthBlur(event: BaseEvent): void
	{
		this.setFocusDate(null);
	}

	#handleYearFocus(event: BaseEvent): void
	{
		const { year } = event.getData();

		const focusDate = createUtcDate(year);
		if (!isDatesEqual(focusDate, this.getFocusDate(), 'year'))
		{
			this.setFocusDate(focusDate);
		}
	}

	#handleYearBlur(event: BaseEvent): void
	{
		this.setFocusDate(null);
	}

	#handleTimeFocus(event: BaseEvent): void
	{
		const { hour, minute } = event.getData();
		let focusDate = cloneDate(this.getInitialFocusDate());
		if (Type.isNumber(hour))
		{
			focusDate = setTime(focusDate, hour, null, null);
			this.setFocusDate(focusDate);
		}
		else if (Type.isNumber(minute))
		{
			focusDate = setTime(focusDate, null, minute, null);
			this.setFocusDate(focusDate);
		}
	}

	#handleTimeBlur(event: BaseEvent): void
	{
		this.setFocusDate(null);
	}

	#handleMonthSelect(event: BaseEvent): void
	{
		const { year } = getDate(this.getViewDate());
		const month: number = event.getData().month;
		const date = createUtcDate(year, month);

		if (this.getType() === 'month')
		{
			this.selectDate(date);
			if (this.shouldHideOnSelect())
			{
				this.hide();
			}
		}
		else
		{
			this.setViewDate(date);
			this.setCurrentView('day');
		}
	}

	#handleYearSelect(event: BaseEvent): void
	{
		const { month } = getDate(this.getViewDate());
		const year: number = event.getData().year;
		const date = createUtcDate(year, month);

		if (this.getType() === 'year')
		{
			this.selectDate(createUtcDate(year));
			if (this.shouldHideOnSelect())
			{
				this.hide();
			}
		}
		else
		{
			this.setViewDate(date);
			this.setCurrentView('day');
		}
	}

	#handleTimeSelect(event: BaseEvent<{ hour: number, minute: number }>): void
	{
		let selectedDate = null;
		if (this.getType() === 'time')
		{
			selectedDate = (
				this.getSelectedDate() === null
					? ceilDate(this.getToday(), 'day')
					: cloneDate(this.getSelectedDate())
			);
		}
		else if (this.getSelectedDate() === null)
		{
			return;
		}
		else
		{
			selectedDate = cloneDate(this.getSelectedDate());
		}

		const hideOrSwitchToDayView = () => {
			if (this.shouldHideOnSelect())
			{
				this.hide();
			}
			else if (this.getType() === 'date')
			{
				this.setCurrentView('day');
			}
		};

		const { hour, minute } = event.getData();
		if (Type.isNumber(hour))
		{
			const currentHour = this.getSelectedDate() === null ? -1 : selectedDate.getUTCHours();
			if (currentHour === hour)
			{
				hideOrSwitchToDayView();
			}
			else
			{
				selectedDate.setUTCHours(hour);
				this.selectDate(selectedDate);
			}
		}
		else if (Type.isNumber(minute))
		{
			const currentMinute = this.getSelectedDate() === null ? -1 : selectedDate.getUTCMinutes();
			if (currentMinute !== minute)
			{
				selectedDate.setUTCMinutes(minute);
				this.selectDate(selectedDate);
			}

			if (this.getTimePickerStyle() === 'grid')
			{
				hideOrSwitchToDayView();
			}
		}
	}

	#handleTimeRangeSelect(event: BaseEvent<{ hour: number, minute: number }>): void
	{
		const timePicker: TimePickerWheel = event.getTarget();
		const rangeEndChange = timePicker.getMode() === 'range-end';

		let rangeStart = this.getRangeStart() === null ? null : cloneDate(this.getRangeStart());
		let rangeEnd = this.getRangeEnd() === null ? null : cloneDate(this.getRangeEnd());

		if (rangeStart === null || (rangeEnd === null && rangeEndChange))
		{
			return;
		}

		const switchToDayView = (): boolean => {
			if (this.getType() === 'date' && this.getTimePickerStyle() === 'grid')
			{
				this.setCurrentView('day');
			}
		};

		const { hour, minute } = event.getData();
		if (Type.isNumber(hour))
		{
			if (rangeEndChange)
			{
				const currentHour = rangeEnd.getUTCHours();
				if (currentHour === hour)
				{
					switchToDayView();

					return;
				}

				rangeEnd.setUTCHours(hour);
			}
			else
			{
				const currentHour = rangeStart.getUTCHours();
				if (currentHour === hour)
				{
					switchToDayView();

					return;
				}

				rangeStart.setUTCHours(hour);
			}
		}
		else if (Type.isNumber(minute))
		{
			if (rangeEndChange)
			{
				const currentMinute = rangeEnd.getUTCMinutes();
				if (currentMinute === minute)
				{
					switchToDayView();

					return;
				}

				rangeEnd.setUTCMinutes(minute);
			}
			else
			{
				const currentMinute = rangeStart.getUTCMinutes();
				if (currentMinute === minute)
				{
					switchToDayView();

					return;
				}

				rangeStart.setUTCMinutes(minute);
			}
		}

		if (rangeEnd !== null && rangeStart > rangeEnd)
		{
			if (rangeEndChange)
			{
				rangeStart = addDate(rangeEnd, 'minute', -this.getDefaultTimeSpan());
			}
			else
			{
				rangeEnd = addDate(rangeStart, 'minute', this.getDefaultTimeSpan());
			}
		}

		this.selectRange(rangeStart, rangeEnd);

		if (Type.isNumber(minute))
		{
			switchToDayView();
		}
	}

	#handlePopupShow(): void
	{
		if (!this.isFocused() && this.isAutoFocus())
		{
			this.focus();
		}

		if (this.isSingleOpening())
		{
			if (singleOpenDatePicker !== null)
			{
				singleOpenDatePicker.hide();
			}

			// eslint-disable-next-line unicorn/no-this-assignment
			singleOpenDatePicker = this;
		}

		this.#syncInputsAriaExpanded(true);
		this.emit('onShow');
	}

	#handlePopupFirstShow(): void
	{
		this.#render();

		this.emit('onFirstShow');
	}

	#handlePopupClose(): void
	{
		if (this.getType() === 'date')
		{
			this.setCurrentView('day');
		}

		this.setFocusDate(null);
		this.setViewDate(this.getDefaultViewDate());

		if (this.isSingleOpening())
		{
			singleOpenDatePicker = null;
		}

		if (this.isFocused())
		{
			this.#focusInputField();
		}

		this.#syncInputsAriaExpanded(false);
		this.emit('onHide');
	}

	#handlePopupDestroy(): void
	{
		this.destroy();
	}

	destroy(): void
	{
		if (this.#destroying)
		{
			return;
		}

		this.#destroying = true;
		this.emit(DatePickerEvent.DESTROY);

		this.#destroyPresetsFocusZone();

		if (this.isRendered())
		{
			Dom.remove(this.getContainer());
		}

		this.#unbindInputEvents(this.getInputField());
		this.#unbindInputEvents(this.getRangeStartInput());
		this.#unbindInputEvents(this.getRangeEndInput());

		if (this.#popup !== null)
		{
			this.#popup.destroy();
		}

		this.#refs = null;
		this.#views = null;
		this.#selectedDates = null;

		if (this.isSingleOpening())
		{
			singleOpenDatePicker = null;
		}

		Object.setPrototypeOf(this, null);
	}
}
