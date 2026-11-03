import { Dom, Tag, Loc, Text } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { DateTimeFormat } from 'main.date';
import { InteractivityChecker } from 'ui.a11y';

import { BasePicker } from './base-picker';
import { type DayMark } from './date-picker-options';
import { addDate } from './helpers/add-date';
import { ceilDate } from './helpers/ceil-date';
import { cloneDate } from './helpers/clone-date';
import { createUtcDate } from './helpers/create-utc-date';
import { floorDate } from './helpers/floor-date';
import { getGridStartDate } from './helpers/get-grid-start-date';
import { isDatesEqual } from './helpers/is-dates-equal';
import { setTabAnchor } from './helpers/set-tab-anchor';

import './css/day-picker.css';

export type DayPickerMonth = {
	weeks: Array<DayPickerWeek>,
	date: Date,
};

export type DayPickerWeek = Array<DayPickerDay>;
export type DayPickerDay = {
	day: number,
	month: number,
	year: number,
	date: Date,
	outside: boolean,
	hidden: boolean,
	current: boolean,
	selected: boolean,
	disabled: boolean,
	dayOff: boolean,
	rangeFrom: boolean,
	rangeTo: boolean,
	rangeIn: boolean,
	rangeInStart: boolean,
	rangeInEnd: boolean,
	rangeInSelected: boolean,
	rangeSelected: boolean,
	focused: boolean,
	tabIndex: number,
	bgColor: string | null,
	textColor: string | null,
	marks: string[],
};

export class DayPicker extends BasePicker
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#weekdays: string[] = null;
	#mouseOutTimeout: number = null;

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div
					class="ui-day-picker${this.getDatePicker().isFullYear() ? ' --full-year' : ''}"
					data-testid="ui-date-picker-day-view"
					role="none"
				>
					${this.getHeader()}
					${this.getContentContainer(this.getMonthContainer())}
					${
						this.getDatePicker().isTimeEnabled()
						? (this.getDatePicker().isRangeMode() ? this.getTimeRangeContainer() : this.getTimeContainer())
						: null
					}
				</div>
			`;
		});
	}

	getHeader(): HTMLElement
	{
		const numberOfMonths = this.getDatePicker().getNumberOfMonths();

		if (this.getDatePicker().isFullYear())
		{
			return this.getHeaderContainer(
				this.getPrevBtn(),
				Tag.render`
					<div class="ui-date-picker-header-title" aria-live="polite">
						${this.getFullYearHeader()}
					</div>
				`,
				this.getNextBtn(),
			);
		}

		return this.getHeaderContainer(
			this.getPrevBtn(),
			...Array.from({ length: numberOfMonths }).map((_, monthNumber: number) => {
				return Tag.render`
					<div class="ui-date-picker-header-title" aria-live="polite">
						${this.getHeaderMonth(monthNumber)}
						${this.getHeaderYear(monthNumber)}
					</div>
				`;
			}),
			this.getNextBtn(),
		);
	}

	getFullYearHeader(): HTMLElement
	{
		return this.#refs.remember('header-full-year', () => {
			return Tag.render`
				<span class="ui-date-picker-header-full-year"></span>
			`;
		});
	}

	getHeaderMonth(monthNumber: number): HTMLElement
	{
		return this.#refs.remember(`header-month-${monthNumber}`, () => {
			return Tag.render`
				<button
					type="button"
					class="ui-date-picker-header-month"
					data-testid="ui-date-picker-month-view-btn"
					aria-label="${Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL')}"
					onclick="${this.#handleMonthClick.bind(this)}"
				></button>
			`;
		});
	}

	getMonthContainer(): HTMLElement
	{
		return this.#refs.remember('month-container', () => {
			return Tag.render`
				<div 
					class="ui-day-picker-content"
					role="none"
					onclick="${this.#handleDayClick.bind(this)}"
					onmouseover="${this.#handleDayMouseOver.bind(this)}"
					onmouseout="${this.#handleDayMouseOut.bind(this)}"
				></div>
			`;
		});
	}

	getHeaderYear(monthNumber: number): HTMLElement
	{
		return this.#refs.remember(`header-year-${monthNumber}`, () => {
			return Tag.render`
				<button 
					type="button" 
					class="ui-date-picker-header-year"
					data-testid="ui-date-picker-year-view-btn"
					aria-label="${Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL')}"
					onclick="${this.#handleYearClick.bind(this)}"
				></button>
			`;
		});
	}

	getTimeContainer(): HTMLElement
	{
		return this.#refs.remember('date-time-container', () => {
			return Tag.render`
				<div class="ui-date-picker-time-container">
					<button 
						type="button" 
						class="ui-date-picker-time-box"
						aria-label="${Loc.getMessage('UI_DATE_PICKER_TIME_LABEL')}"
						aria-describedby="${this.getDatePicker().getId()}-date-time-value"
						title="${Loc.getMessage('UI_DATE_PICKER_TIME_LABEL')}" 
						onclick="${this.#handleTimeClick.bind(this)}"
					>
						<span class="ui-date-picker-time-clock" aria-hidden="true"></span>
						${this.getTimeValueContainer()}
					</button>
				</div>
			`;
		});
	}

	getTimeRangeContainer(): HTMLElement
	{
		return this.#refs.remember('range-time-container', () => {
			return Tag.render`
				<div 
					class="ui-date-picker-time-container --range" 
					role="group" 
					aria-label="${Loc.getMessage('UI_DATE_PICKER_RANGE_TIME')}"
				>
					<div class="ui-date-picker-time-range-slot">
						<button 
							type="button" 
							class="ui-date-picker-time-box --range-start"
							aria-label="${Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_START')}"
							aria-describedby="${this.getDatePicker().getId()}-time-start-value"
							title="${Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_START')}"
							onclick="${this.#handleTimeRangeStartClick.bind(this)}"
						>
							<span class="ui-date-picker-time-clock" aria-hidden="true"></span>
							${this.getTimeRangeStartContainer()}
						</button>
					</div>
					<div class="ui-date-picker-time-range-slot">
						<button 
							type="button"
							class="ui-date-picker-time-box --range-end"
							aria-label="${Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_END')}"
							aria-describedby="${this.getDatePicker().getId()}-time-end-value"
							title="${Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_END')}"
							onclick="${this.#handleTimeRangeEndClick.bind(this)}"
						>
							<span class="ui-date-picker-time-clock" aria-hidden="true"></span>
							${this.getTimeRangeEndContainer()}
						</button>
					</div>
				</div>
			`;
		});
	}

	getTimeValueContainer(): HTMLElement
	{
		return this.#refs.remember('time-value', () => {
			return Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-date-time-value"></div>`;
		});
	}

	getTimeRangeStartContainer(): HTMLElement
	{
		return this.#refs.remember('time-range-start', () => {
			return Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-time-start-value"></div>`;
		});
	}

	getTimeRangeEndContainer(): HTMLElement
	{
		return this.#refs.remember('time-range-end', () => {
			return Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-time-end-value"></div>`;
		});
	}

	getWeekDays(): Array<[string, string]>
	{
		if (this.#weekdays !== null)
		{
			return this.#weekdays;
		}

		const firstWeekDay: number = this.getDatePicker().getFirstWeekDay();
		const weekDays: Array<[string, string]> = [
			[Loc.getMessage('DOW_0'), Loc.getMessage('DAY_OF_WEEK_0')],
			[Loc.getMessage('DOW_1'), Loc.getMessage('DAY_OF_WEEK_1')],
			[Loc.getMessage('DOW_2'), Loc.getMessage('DAY_OF_WEEK_2')],
			[Loc.getMessage('DOW_3'), Loc.getMessage('DAY_OF_WEEK_3')],
			[Loc.getMessage('DOW_4'), Loc.getMessage('DAY_OF_WEEK_4')],
			[Loc.getMessage('DOW_5'), Loc.getMessage('DAY_OF_WEEK_5')],
			[Loc.getMessage('DOW_6'), Loc.getMessage('DAY_OF_WEEK_6')],
		];

		this.#weekdays = [
			...[...weekDays].slice(firstWeekDay),
			...[...weekDays].splice(0, firstWeekDay),
		];

		return this.#weekdays;
	}

	#renderMonthContainer(monthNumber: number): HTMLElement
	{
		const cacheId = `month-${monthNumber}`;
		if (!this.#refs.has(cacheId))
		{
			const monthContainer = Tag.render`
				<div 
					class="ui-day-picker-month" 
					role="grid"
					aria-multiselectable="${this.getDatePicker().isSingleMode() ? 'false' : 'true'}"
				></div>
			`;

			this.#refs.set(cacheId, monthContainer);

			Dom.append(monthContainer, this.getMonthContainer());
		}

		return this.#refs.get(cacheId);
	}

	#renderMonthHeader(monthNumber: number, monthContainer: HTMLElement): HTMLElement
	{
		return this.#refs.remember(`month-header-${monthNumber}`, () => {
			const monthName = DateTimeFormat.format('f', createUtcDate(2000, monthNumber), null, true);
			const container = Tag.render`<div class="ui-day-picker-month-header">${Text.encode(monthName)}</div>`;
			Dom.append(container, monthContainer);

			return container;
		});
	}

	#renderWeekDays(monthNumber: number, monthContainer: HTMLElement): HTMLElement
	{
		return this.#refs.remember(`week-day-${monthNumber}`, () => {
			const weekDayContainer = Tag.render`<div class="ui-day-picker-week --week-days" role="row" aria-hidden="true"></div>`;
			Dom.append(weekDayContainer, monthContainer);

			if (this.getDatePicker().shouldShowWeekNumbers())
			{
				const dayContainer = Tag.render`<div class="ui-day-picker-week-day"></div>`;
				Dom.append(dayContainer, weekDayContainer);
			}

			this.getWeekDays().forEach((weekDay: [string, string]) => {
				const [shortName, longName] = weekDay;
				const dayContainer = Tag.render`
					<div 
						class="ui-day-picker-week-day"
						aria-label="${longName}" 
						role="columnheader"
					>${Text.encode(shortName)}</div>
				`;
				Dom.append(dayContainer, weekDayContainer);
			});

			return weekDayContainer;
		});
	}

	#renderWeek(monthNumber: number, weekNumber: number, monthContainer: HTMLElement): HTMLElement
	{
		return this.#refs.remember(`week-${monthNumber}-${weekNumber}`, () => {
			const weekContainer = Tag.render`<div class="ui-day-picker-week" role="row"></div>`;
			Dom.append(weekContainer, monthContainer);

			return weekContainer;
		});
	}

	#renderWeekNumber(monthNumber: number, weekNumber: number, week: DayPickerWeek, weekContainer: HTMLElement): void
	{
		const container = this.#refs.remember(`week-number-${monthNumber}-${weekNumber}`, () => {
			const weekNumberContainer = Tag.render`<div class="ui-day-picker-week-number">${
					DateTimeFormat.format('W', week[0].date, null, true)
				}</div>`
			;

			Dom.append(weekNumberContainer, weekContainer);

			return weekNumberContainer;
		});

		container.textContent = DateTimeFormat.format('W', week[0].date, null, true);
	}

	#renderDay(id: string, day: DayPickerDay, weekContainer: HTMLElement): HTMLElement
	{
		const button: HTMLElement = this.#refs.remember(id, () => {
			const dayContainer = Tag.render`
				<button
					type="button"
					id="${this.getDatePicker().getContainerId()}-${id}"
					class="ui-day-picker-day"
					data-testid="ui-date-picker-day-cell"
					data-day="${day.day}"
					data-month="${day.month}"
					data-year="${day.year}"
					data-tab-priority="true"
					role="gridcell"
				>
					<span class="ui-day-picker-day-inner">${day.day}</span>
					<span class="ui-day-picker-day-marks" aria-hidden="true"></span>
				</button>
			`;

			Dom.append(dayContainer, weekContainer);

			return dayContainer;
		});

		const dayLabel = DateTimeFormat.format(DateTimeFormat.getFormat('FULL_DATE_FORMAT'), day.date, null, true);
		if (button.getAttribute('aria-label') !== dayLabel)
		{
			button.setAttribute('aria-label', dayLabel);
		}

		const ariaSelected = day.selected || day.rangeIn ? 'true' : 'false';
		if (button.getAttribute('aria-selected') !== ariaSelected)
		{
			button.setAttribute('aria-selected', ariaSelected);
		}

		if (day.current)
		{
			if (button.getAttribute('aria-current') !== 'date')
			{
				button.setAttribute('aria-current', 'date');
			}
		}
		else if (button.hasAttribute('aria-current'))
		{
			button.removeAttribute('aria-current');
		}

		const currentDay: number = Number(button.dataset.day);
		const currentMonth: number = Number(button.dataset.month);
		const currentYear: number = Number(button.dataset.year);
		if (currentDay !== day.day || currentMonth !== day.month || currentYear !== day.year)
		{
			button.dataset.day = day.day;
			button.dataset.month = day.month;
			button.dataset.year = day.year;
			button.firstElementChild.textContent = day.day;
		}

		const statuses = {
			'--outside': day.outside,
			'--current': !day.outside && day.current,
			'--day-off': !day.outside && day.dayOff,
			'--disabled': day.disabled,
			'--selected': day.selected,
			'--hidden': day.hidden,
			'--range-from': day.rangeFrom,
			'--range-to': day.rangeTo,
			'--range-in': day.rangeIn,
			'--range-in-start': day.rangeInStart,
			'--range-in-end': day.rangeInEnd,
			'--range-in-selected': day.rangeInSelected,
			'--range-selected': day.rangeSelected,
			'--focused': day.focused,
			// Owned by KeyboardNavigation, kept so that rebuilding className does not drop the focus ring.
			'--focus-visible': Dom.hasClass(button, '--focus-visible'),
		};

		let classNames = 'ui-day-picker-day';
		for (const [className, enabled] of Object.entries(statuses))
		{
			if (enabled)
			{
				classNames = `${classNames} ${className}`;
			}
		}

		if (button.className !== classNames)
		{
			button.className = classNames;
		}

		const ariaDisabled = day.disabled ? 'true' : 'false';
		if (button.getAttribute('aria-disabled') !== ariaDisabled)
		{
			button.setAttribute('aria-disabled', ariaDisabled);
		}

		this.#renderDayColors(button, day);
		this.#renderDayMarks(button, day);

		button.tabIndex = day.tabIndex;

		return button;
	}

	#renderDayColors(button: HTMLElement, day: DayPickerDay): void
	{
		const currentBgColor: string | null = button.dataset.bgColor || null;
		const currentTextColor: string | null = button.dataset.textColor || null;
		if (currentBgColor !== day.bgColor)
		{
			Dom.style(button.firstElementChild, '--ui-day-picker-day-bg-color', day.bgColor);
			Dom.attr(button, 'data-bg-color', day.bgColor);
		}

		if (currentTextColor !== day.textColor)
		{
			Dom.style(button.firstElementChild, '--ui-day-picker-day-text-color', day.textColor);
			Dom.attr(button, 'data-text-color', day.textColor);
		}
	}

	#renderDayMarks(button: HTMLElement, day: DayPickerDay): void
	{
		const currentMarks: string = button.dataset.marks || '';
		if (currentMarks === day.marks.toString())
		{
			return;
		}

		Dom.clean(button.lastElementChild);
		for (const mark of day.marks)
		{
			Dom.append(
				Tag.render`
					<span class="ui-day-picker-day-mark" style="background-color: ${mark}"></span>
				`,
				button.lastElementChild,
			);
		}

		Dom.attr(button, 'data-marks', day.marks.toString());
	}

	#renderTime(): void
	{
		if (this.getDatePicker().isRangeMode())
		{
			const rangeStart = this.getDatePicker().getRangeStart();
			const startBtn: HTMLButtonElement = this.getTimeRangeStartContainer().parentNode;
			if (rangeStart === null)
			{
				Dom.removeClass(this.getTimeRangeContainer(), '--range-start-set');
				startBtn.disabled = true;
			}
			else
			{
				Dom.addClass(this.getTimeRangeContainer(), '--range-start-set');
				startBtn.disabled = false;
				this.getTimeRangeStartContainer().textContent = this.getDatePicker().formatTime(rangeStart);
			}

			const rangeEnd = this.getDatePicker().getRangeEnd();
			const endBtn: HTMLButtonElement = this.getTimeRangeEndContainer().parentNode;
			if (rangeEnd === null)
			{
				Dom.removeClass(this.getTimeRangeContainer(), '--range-end-set');
				endBtn.disabled = true;
			}
			else
			{
				Dom.addClass(this.getTimeRangeContainer(), '--range-end-set');
				endBtn.disabled = false;
				this.getTimeRangeEndContainer().textContent = this.getDatePicker().formatTime(rangeEnd);
			}
		}
		else
		{
			const selectedDate = this.getDatePicker().getSelectedDate();
			const button: HTMLButtonElement = this.getTimeContainer().firstElementChild;
			if (selectedDate === null)
			{
				Dom.removeClass(this.getTimeContainer(), '--time-set');
				button.disabled = true;
			}
			else
			{
				Dom.addClass(this.getTimeContainer(), '--time-set');
				button.disabled = false;
				this.getTimeValueContainer().textContent = this.getDatePicker().formatTime(selectedDate);
			}
		}
	}

	render(): void
	{
		let focusButton: HTMLElement = null;
		const isFocused = this.getDatePicker().isFocused();
		this.getMonths().forEach((month: DayPickerMonth, monthNumber: number) => {
			if (this.getDatePicker().isFullYear())
			{
				this.getFullYearHeader().textContent = DateTimeFormat.format('Y', month.date, null, true);
			}
			else
			{
				this.getHeaderMonth(monthNumber).textContent = DateTimeFormat.format('f', month.date, null, true);
				this.getHeaderYear(monthNumber).textContent = DateTimeFormat.format('Y', month.date, null, true);
			}

			const monthContainer = this.#renderMonthContainer(monthNumber);
			monthContainer.ariaLabel = DateTimeFormat.format('f Y', month.date, null, true);

			if (this.getDatePicker().isFullYear())
			{
				this.#renderMonthHeader(monthNumber, monthContainer);
			}

			if (this.getDatePicker().shouldShowWeekDays())
			{
				this.#renderWeekDays(monthNumber, monthContainer);
			}

			month.weeks.forEach((week: DayPickerWeek, weekNumber) => {
				const weekContainer = this.#renderWeek(monthNumber, weekNumber, monthContainer);
				if (this.getDatePicker().shouldShowWeekNumbers())
				{
					this.#renderWeekNumber(monthNumber, weekNumber, week, weekContainer);
				}

				week.forEach((day: DayPickerDay, dayIndex) => {
					const id = `day-${monthNumber}-${weekNumber}-${dayIndex}`;
					const button = this.#renderDay(id, day, weekContainer);
					if (day.focused)
					{
						focusButton = button;
					}
				});
			});
		});

		if (focusButton !== null && isFocused && this.getDatePicker().getFocusInputModality() === 'keyboard')
		{
			focusButton.focus({ preventScroll: true });
		}

		if (this.getDatePicker().isTimeEnabled())
		{
			this.#renderTime();
		}

		this.setPrevBtnDisabled(!this.getDatePicker().canNavigate('day', 'prev'));
		this.setNextBtnDisabled(!this.getDatePicker().canNavigate('day', 'next'));
	}

	getMonths(): DayPickerMonth[]
	{
		const months = [];
		const tabCells: DayPickerDay[] = [];
		const picker = this.getDatePicker();
		let date = picker.getViewDate();
		const numberOfMonths = picker.getNumberOfMonths();
		const today = picker.getToday();
		const focusDate = picker.getFocusDate();
		const anchorDate = picker.getInitialFocusDate();
		const showOutsideDays = picker.shouldShowOutsideDays();

		const { year, month } = picker.getViewDateParts();
		const firstAvailableDay = createUtcDate(year, month);
		const lastAvailableDay = ceilDate(createUtcDate(year, month + numberOfMonths - 1), 'month');

		const [from, to] = this.#getRangeDates();
		const rangeSelected = (
			picker.isRangeMode() && picker.getRangeStart() !== null && picker.getRangeEnd() !== null
		);

		for (let index = 0; index < numberOfMonths; index++)
		{
			const weeks = [];
			const firstMonthDay = floorDate(date, 'month');
			const currentMonthIndex = date.getUTCMonth();
			date = this.#getStartMonthDate(date);

			for (let weekIndex = 0; weekIndex < 6; weekIndex++)
			{
				const week = [];
				let prevDay: DayPickerDay = null;
				for (let weekDay = 0; weekDay < 7; weekDay++)
				{
					const outside = date.getUTCMonth() !== currentMonthIndex;
					const available = (
						!outside
						|| this.#isOutsideDayAvailable(date, firstAvailableDay, lastAvailableDay)
					);

					const disabled = available && !picker.isDateAllowed(date, 'day');
					const selected = available && picker.isDateSelected(date, 'day');
					const rangeFrom = available && from && to && isDatesEqual(date, from);
					const rangeTo = available && from && to && isDatesEqual(date, to);
					const rangeIn = (
						available && from && to
						&& (rangeFrom || rangeTo || (date.getTime() >= from.getTime() && date.getTime() <= to.getTime()))
					);

					const rangeInStart = rangeIn && (weekDay === 0 || !prevDay.rangeIn);
					const rangeInEnd = rangeIn && weekDay === 6;
					if (!rangeIn && prevDay && prevDay.rangeIn)
					{
						prevDay.rangeInEnd = true;
					}

					const rangeInSelected = selected && rangeIn && !rangeFrom && !rangeTo;
					const focused = available && isDatesEqual(date, focusDate, 'day');
					const dayColor = this.getDatePicker().getDayColor(date);
					const marks = this.getDatePicker().getDayMarks(date).map(
						(dayMark: DayMark): string => {
							return dayMark.bgColor;
						},
					);

					const day: DayPickerDay = {
						date: cloneDate(date),
						day: date.getUTCDate(),
						month: date.getUTCMonth(),
						year: date.getUTCFullYear(),
						outside,
						current: picker.shouldShowToday() && isDatesEqual(date, today, 'day'),
						selected,
						disabled,
						hidden: outside && !showOutsideDays,
						dayOff: picker.isDayOff(date),
						rangeSelected: selected && rangeSelected,
						focused,
						tabIndex: -1,
						rangeFrom,
						rangeTo,
						rangeIn,
						rangeInStart,
						rangeInEnd,
						rangeInSelected,
						bgColor: dayColor === null ? null : dayColor.bgColor,
						textColor: dayColor === null ? null : dayColor.textColor,
						marks,
					};

					week.push(day);
					prevDay = day;

					// A hidden cell and a cell repeating a neighbour month are out of the tab order.
					if (available)
					{
						tabCells.push(day);
					}

					date = addDate(date, 'day', 1);
				}

				weeks.push(week);
			}

			months.push({ weeks, date: firstMonthDay });
		}

		setTabAnchor(tabCells, (cell: DayPickerDay): boolean => isDatesEqual(cell.date, anchorDate, 'day'));

		return months;
	}

	// A day of a neighbour month is shown twice on a multi-month grid: the page it belongs to keeps it.
	#isOutsideDayAvailable(date: Date, firstAvailableDay: Date, lastAvailableDay: Date): boolean
	{
		const picker = this.getDatePicker();
		if (!picker.shouldShowOutsideDays())
		{
			return false;
		}

		if (picker.getNumberOfMonths() === 1)
		{
			return true;
		}

		return date.getTime() < firstAvailableDay || date.getTime() >= lastAvailableDay;
	}

	#getStartMonthDate(date: Date): Date
	{
		return getGridStartDate(date, this.getDatePicker().getFirstWeekDay());
	}

	getFirstDay(): DayPickerDay
	{
		const viewDate = this.getDatePicker().getViewDate();
		const currentMonthIndex = viewDate.getUTCMonth();
		const showOutsideDays = this.getDatePicker().shouldShowOutsideDays();

		const firstViewDay = this.#getStartMonthDate(this.getDatePicker().getViewDate());
		const outside = firstViewDay.getUTCMonth() !== currentMonthIndex;
		if (outside && !showOutsideDays)
		{
			return floorDate(viewDate, 'month');
		}

		return firstViewDay;
	}

	getLastDay(): DayPickerDay | null
	{
		const numberOfMonths = this.getDatePicker().getNumberOfMonths();
		const showOutsideDays = this.getDatePicker().shouldShowOutsideDays();

		const { year, month } = this.getDatePicker().getViewDateParts();
		let lastAvailableDay = ceilDate(createUtcDate(year, month + numberOfMonths - 1), 'month');

		if (showOutsideDays)
		{
			const firstAvailableDay = createUtcDate(year, month + numberOfMonths - 1);
			const firstViewDay = this.#getStartMonthDate(firstAvailableDay);

			lastAvailableDay = addDate(firstViewDay, 'day', 6 * 7);
		}

		return lastAvailableDay;
	}

	#getRangeDates(): Array
	{
		let from: Date = null;
		let to: Date = null;
		const focusDate = this.getDatePicker().getFocusDate();
		if (this.getDatePicker().isRangeMode())
		{
			const range = this.getDatePicker().getSelectedDates();
			from = range[0] || null;
			to = range[1] || null;

			if (focusDate !== null && range.length === 1)
			{
				if (focusDate > from.getTime())
				{
					to = focusDate;
				}
				else
				{
					to = from;
					from = focusDate;
				}
			}
		}

		return [from, to];
	}

	#handleDayClick(event: MouseEvent): void
	{
		const dayElement = event.target.closest('.ui-day-picker-day');
		// Keyboard activation reaches the handler past the pointer-events guard, so the cell is refused here.
		if (dayElement === null || InteractivityChecker.isDisabled(dayElement))
		{
			return;
		}

		const dataset = dayElement.dataset;
		const year = Text.toInteger(dataset.year);
		const month = Text.toInteger(dataset.month);
		const day = Text.toInteger(dataset.day);

		this.emit('onSelect', { year, month, day });
	}

	#handleDayMouseOver(event: MouseEvent): void
	{
		const dayElement = event.target.closest('.ui-day-picker-day');
		if (dayElement === null)
		{
			const weekElement = event.target.closest('.ui-day-picker-week');
			if (
				weekElement !== null
				&& this.#mouseOutTimeout !== null
				&& this.getDatePicker().getSelectedDates().length === 1
			)
			{
				clearTimeout(this.#mouseOutTimeout);
			}

			return;
		}

		if (this.#mouseOutTimeout !== null)
		{
			clearTimeout(this.#mouseOutTimeout);
		}

		const dataset = dayElement.dataset;

		const year = Text.toInteger(dataset.year);
		const month = Text.toInteger(dataset.month);
		const day = Text.toInteger(dataset.day);
		this.emit('onFocus', { year, month, day });
	}

	clearMouseOutTimeout(): void
	{
		if (this.#mouseOutTimeout !== null)
		{
			clearTimeout(this.#mouseOutTimeout);
		}
	}

	#handleDayMouseOut(event: MouseEvent): void
	{
		if (this.#mouseOutTimeout !== null)
		{
			clearTimeout(this.#mouseOutTimeout);
		}

		this.#mouseOutTimeout = setTimeout(() => {
			this.emit('onBlur');
			this.#mouseOutTimeout = null;
		}, 100);
	}

	#handleMonthClick(): void
	{
		this.emit('onMonthClick');
	}

	#handleYearClick(): void
	{
		this.emit('onYearClick');
	}

	#handleTimeClick(): void
	{
		const selectedDate = this.getDatePicker().getSelectedDate();
		if (selectedDate !== null)
		{
			this.emit('onTimeClick');
		}
	}

	#handleTimeRangeStartClick(): void
	{
		const rangeStart = this.getDatePicker().getRangeStart();
		if (rangeStart !== null)
		{
			this.emit('onRangeStartClick');
		}
	}

	#handleTimeRangeEndClick(): void
	{
		const rangeEnd = this.getDatePicker().getRangeEnd();
		if (rangeEnd !== null)
		{
			this.emit('onRangeEndClick');
		}
	}

	getPrevBtnLabel(): string
	{
		return Loc.getMessage(this.getDatePicker().isFullYear() ? 'UI_DATE_PICKER_PREV_YEAR' : 'UI_DATE_PICKER_PREV_MONTH');
	}

	getNextBtnLabel(): string
	{
		return Loc.getMessage(this.getDatePicker().isFullYear() ? 'UI_DATE_PICKER_NEXT_YEAR' : 'UI_DATE_PICKER_NEXT_MONTH');
	}
}
