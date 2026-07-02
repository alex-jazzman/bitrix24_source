/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_core_cache, main_core_events, main_date, main_popup, ui_a11y) {
	'use strict';

	class BasePicker extends main_core_events.EventEmitter {
		#datePicker = null;
		#refs = new main_core_cache.MemoryCache();
		#rendered = false;
		constructor(datePicker) {
			super();
			this.setEventNamespace('BX.UI.DatePicker.BasePicker');
			this.#datePicker = datePicker;
		}
		getContainer() {
			throw new Error('You must implement getContainer method');
		}
		getHeaderContainer(...children) {
			return this.#refs.remember('header', () => {
				return main_core.Tag.render`<div class="ui-date-picker-header" role="none">${children}</div>`;
			});
		}
		getContentContainer(...children) {
			return this.#refs.remember('content', () => {
				return main_core.Tag.render`<div class="ui-date-picker-content" role="none">${children}</div>`;
			});
		}
		getPrevBtn() {
			return this.#refs.remember('prev-button', () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-date-picker-button --left-arrow"
					aria-label="${this.getPrevBtnLabel()}"
					title="${this.getPrevBtnLabel()}"
					onclick="${this.handlePrevBtnClick.bind(this)}"
				>
					<span class="ui-icon-set --chevron-left" aria-hidden="true" style="--ui-icon-set__icon-size: 20px"></span>
				</button>
			`;
			});
		}
		getNextBtn() {
			return this.#refs.remember('next-button', () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-date-picker-button --right-arrow"
					aria-label="${this.getNextBtnLabel()}"
					title="${this.getNextBtnLabel()}"
					onclick="${this.handleNextBtnClick.bind(this)}"
				>
					<span class="ui-icon-set --chevron-right" aria-hidden="true" style="--ui-icon-set__icon-size: 20px"></span>
				</button>
			`;
			});
		}
		getPrevBtnLabel() {
			return '';
		}
		getNextBtnLabel() {
			return '';
		}
		handlePrevBtnClick() {
			this.emit('onPrevBtnClick');
		}
		handleNextBtnClick() {
			this.emit('onNextBtnClick');
		}
		render() {
			throw new Error('You must implement render method');
		}
		onShow() {
			// you can override this method
		}
		onHide() {
			// you can override this method
		}
		getDatePicker() {
			return this.#datePicker;
		}
		isRendered() {
			return this.#rendered;
		}
		renderTo(container) {
			main_core.Dom.append(this.getContainer(), container);
			this.#rendered = true;
		}
	}

	function cloneDate(date) {
		const newDate = new Date(date.getTime());
		if (date.__utc) {
			newDate.__utc = true;
		}
		return newDate;
	}

	function getDaysInMonth(date) {
		const month = date.getUTCMonth();
		const year = date.getUTCFullYear();
		const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (month !== 1 || year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
			return daysInMonth[month];
		}
		return 28;
	}

	function addDate(date, unit, increment) {
		let newDate = cloneDate(date);
		if (!unit || increment === 0) {
			return newDate;
		}
		switch (unit.toLowerCase()) {
			case 'milli':
				newDate = new Date(date.getTime() + increment);
				break;
			case 'second':
				newDate = new Date(date.getTime() + increment * 1000);
				break;
			case 'minute':
				newDate = new Date(date.getTime() + increment * 60000);
				break;
			case 'hour':
				newDate = new Date(date.getTime() + increment * 3_600_000);
				break;
			case 'day':
				newDate.setUTCDate(date.getUTCDate() + increment);
				break;
			case 'week':
				newDate.setUTCDate(date.getUTCDate() + increment * 7);
				break;
			case 'month':
				{
					let day = date.getUTCDate();
					if (day > 28) {
						const firstDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
						day = Math.min(day, getDaysInMonth(addDate(firstDayOfMonth, 'month', increment)));
					}
					newDate.setUTCDate(day);
					newDate.setUTCMonth(newDate.getUTCMonth() + increment);
					break;
				}
			case 'quarter':
				newDate = addDate(date, 'month', increment * 3);
				break;
			case 'year':
				newDate.setUTCFullYear(date.getUTCFullYear() + increment);
				break;
			// nothing
		}
		if (date.__utc) {
			newDate.__utc = true;
		}
		return newDate;
	}

	function floorDate(date, unit, firstWeekDay) {
		let newDate = cloneDate(date);
		switch (unit) {
			case 'day':
				newDate.setUTCHours(0, 0, 0, 0);
				break;
			case 'week':
				{
					const day = newDate.getUTCDay();
					newDate.setUTCHours(0, 0, 0, 0);
					if (day !== firstWeekDay) {
						const diff = (day - firstWeekDay + 7) % 7;
						newDate = addDate(newDate, 'day', -diff); // Move back to the first day of the week
					}
					break;
				}
			case 'month':
				newDate.setUTCHours(0, 0, 0, 0);
				newDate.setUTCDate(1);
				break;
			case 'hour':
				newDate.setUTCMinutes(0, 0, 0);
				break;
			case 'minute':
				newDate.setUTCSeconds(0);
				newDate.setUTCMilliseconds(0);
				break;
			case 'second':
				newDate.setUTCMilliseconds(0);
				break;
			case 'year':
				newDate = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
				break;
			case 'quarter':
				{
					newDate.setUTCHours(0, 0, 0, 0);
					newDate.setUTCDate(1);
					newDate = addDate(newDate, 'month', -(newDate.getUTCMonth() % 3));
					break;
				}
			// No default
		}
		if (date.__utc) {
			newDate.__utc = true;
		}
		return newDate;
	}

	function getNextDate(date, unit, increment = 1, firstWeekDay = 0) {
		let newDate = cloneDate(date);
		switch (unit) {
			case 'day':
				newDate.setUTCMinutes(0, 0, 0);
				newDate = addDate(newDate, 'day', increment);
				break;
			case 'week':
				{
					const dayOfWeek = newDate.getUTCDay();
					newDate = addDate(newDate, 'day', 7 * (increment - 1) + (dayOfWeek < firstWeekDay ? firstWeekDay - dayOfWeek : 7 - dayOfWeek + firstWeekDay));
					break;
				}
			case 'month':
				newDate = addDate(newDate, 'month', increment);
				newDate.setUTCDate(1);
				break;
			case 'quarter':
				newDate = addDate(newDate, 'month', (increment - 1) * 3 + (3 - newDate.getUTCMonth() % 3));
				break;
			case 'year':
				newDate = new Date(Date.UTC(newDate.getUTCFullYear() + increment, 0, 1));
				break;
			default:
				newDate = addDate(date, unit, increment);
		}
		if (date.__utc) {
			newDate.__utc = true;
		}
		return newDate;
	}

	function ceilDate(date, unit, increment, firstWeekDay) {
		const newDate = cloneDate(date);
		if (unit === 'week') {
			newDate.setUTCHours(0, 0, 0, 0);
			return addDate(floorDate(newDate, unit, firstWeekDay), unit, 1);
		}
		switch (unit) {
			case 'hour':
				newDate.setUTCMinutes(0, 0, 0);
				break;
			case 'minute':
				newDate.setUTCSeconds(0, 0);
				break;
			case 'second':
				newDate.setUTCMilliseconds(0);
				break;
			default:
				newDate.setUTCHours(0, 0, 0, 0);
		}
		return getNextDate(newDate, unit, increment);
	}

	function createUtcDate(year, monthIndex = 0, day = 1, hours = 0, minutes = 0, seconds = 0, ms = 0) {
		const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));

		// The year from 0 to 99 will be incremented by 1900 automatically.
		if (year < 100 && year >= 0) {
			date.setUTCFullYear(year);
		}
		date.__utc = true;
		return date;
	}

	function getDate(date) {
		const hours = date.getUTCHours();
		const hours12 = hours % 12 === 0 ? 12 : hours % 12;
		const dayPeriod = hours > 11 ? 'pm' : 'am';
		return {
			day: date.getUTCDate(),
			// 1-31
			month: date.getUTCMonth(),
			// 0-11
			year: date.getUTCFullYear(),
			weekDay: date.getUTCDay(),
			// 0-6
			hours,
			// 0-23
			hours12,
			// 1-12
			minutes: date.getUTCMinutes(),
			// 0-59
			seconds: date.getUTCSeconds(),
			// 0-59
			dayPeriod,
			fullDay: String(date.getUTCDate()).padStart(2, '0'),
			fullHours: String(hours).padStart(2, '0'),
			fullHours12: String(hours12).padStart(2, '0'),
			fullMinutes: String(date.getUTCMinutes()).padStart(2, '0')
		};
	}

	function isDatesEqual(dateA, dateB, precision = 'day') {
		if (!main_core.Type.isDate(dateA) || !main_core.Type.isDate(dateB)) {
			return false;
		}
		const {
			day: dayA,
			month: monthA,
			year: yearA,
			hours: hoursA,
			minutes: minutesA,
			seconds: secondsA
		} = getDate(dateA);
		const {
			day: dayB,
			month: monthB,
			year: yearB,
			hours: hoursB,
			minutes: minutesB,
			seconds: secondsB
		} = getDate(dateB);
		if (precision === 'day') {
			return dayA === dayB && monthA === monthB && yearA === yearB;
		}
		if (precision === 'datetime') {
			return dayA === dayB && monthA === monthB && yearA === yearB && hoursA === hoursB && minutesA === minutesB && secondsA === secondsB;
		}
		if (precision === 'month') {
			return monthA === monthB && yearA === yearB;
		}
		if (precision === 'year') {
			return yearA === yearB;
		}
		return false;
	}

	class DayPicker extends BasePicker {
		#refs = new main_core_cache.MemoryCache();
		#weekdays = null;
		#mouseOutTimeout = null;
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-day-picker${this.getDatePicker().isFullYear() ? ' --full-year' : ''}" role="none">
					${this.getHeader()}
					${this.getContentContainer(this.getMonthContainer())}
					${this.getDatePicker().isTimeEnabled() ? this.getDatePicker().isRangeMode() ? this.getTimeRangeContainer() : this.getTimeContainer() : null}
				</div>
			`;
			});
		}
		getHeader() {
			const numberOfMonths = this.getDatePicker().getNumberOfMonths();
			if (this.getDatePicker().isFullYear()) {
				return this.getHeaderContainer(this.getPrevBtn(), main_core.Tag.render`
					<div class="ui-date-picker-header-title" aria-live="polite">
						${this.getFullYearHeader()}
					</div>
				`, this.getNextBtn());
			}
			return this.getHeaderContainer(this.getPrevBtn(), ...Array.from({
				length: numberOfMonths
			}).map((_, monthNumber) => {
				return main_core.Tag.render`
					<div class="ui-date-picker-header-title" aria-live="polite">
						${this.getHeaderMonth(monthNumber)}
						${this.getHeaderYear(monthNumber)}
					</div>
				`;
			}), this.getNextBtn());
		}
		getFullYearHeader() {
			return this.#refs.remember('header-full-year', () => {
				return main_core.Tag.render`
				<span class="ui-date-picker-header-full-year"></span>
			`;
			});
		}
		getHeaderMonth(monthNumber) {
			return this.#refs.remember(`header-month-${monthNumber}`, () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-date-picker-header-month"
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL')}"
					onclick="${this.#handleMonthClick.bind(this)}"
				></button>
			`;
			});
		}
		getMonthContainer() {
			return this.#refs.remember('month-container', () => {
				return main_core.Tag.render`
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
		getHeaderYear(monthNumber) {
			return this.#refs.remember(`header-year-${monthNumber}`, () => {
				return main_core.Tag.render`
				<button 
					type="button" 
					class="ui-date-picker-header-year"
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL')}"
					onclick="${this.#handleYearClick.bind(this)}"
				></button>
			`;
			});
		}
		getTimeContainer() {
			return this.#refs.remember('date-time-container', () => {
				return main_core.Tag.render`
				<div class="ui-date-picker-time-container">
					<button 
						type="button" 
						class="ui-date-picker-time-box"
						aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_TIME_LABEL')}"
						aria-describedby="${this.getDatePicker().getId()}-date-time-value"
						title="${main_core.Loc.getMessage('UI_DATE_PICKER_TIME_LABEL')}" 
						onclick="${this.#handleTimeClick.bind(this)}"
					>
						<span class="ui-date-picker-time-clock" aria-hidden="true"></span>
						${this.getTimeValueContainer()}
					</button>
				</div>
			`;
			});
		}
		getTimeRangeContainer() {
			return this.#refs.remember('range-time-container', () => {
				return main_core.Tag.render`
				<div 
					class="ui-date-picker-time-container --range" 
					role="group" 
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_RANGE_TIME')}"
				>
					<div class="ui-date-picker-time-range-slot">
						<button 
							type="button" 
							class="ui-date-picker-time-box --range-start"
							aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_START')}"
							aria-describedby="${this.getDatePicker().getId()}-time-start-value"
							title="${main_core.Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_START')}"
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
							aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_END')}"
							aria-describedby="${this.getDatePicker().getId()}-time-end-value"
							title="${main_core.Loc.getMessage('UI_DATE_PICKER_RANGE_TIME_END')}"
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
		getTimeValueContainer() {
			return this.#refs.remember('time-value', () => {
				return main_core.Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-date-time-value"></div>`;
			});
		}
		getTimeRangeStartContainer() {
			return this.#refs.remember('time-range-start', () => {
				return main_core.Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-time-start-value"></div>`;
			});
		}
		getTimeRangeEndContainer() {
			return this.#refs.remember('time-range-end', () => {
				return main_core.Tag.render`<div class="ui-date-picker-time-value" id="${this.getDatePicker().getId()}-time-end-value"></div>`;
			});
		}
		getWeekDays() {
			if (this.#weekdays !== null) {
				return this.#weekdays;
			}
			const firstWeekDay = this.getDatePicker().getFirstWeekDay();
			const weekDays = [[main_core.Loc.getMessage('DOW_0'), main_core.Loc.getMessage('DAY_OF_WEEK_0')], [main_core.Loc.getMessage('DOW_1'), main_core.Loc.getMessage('DAY_OF_WEEK_1')], [main_core.Loc.getMessage('DOW_2'), main_core.Loc.getMessage('DAY_OF_WEEK_2')], [main_core.Loc.getMessage('DOW_3'), main_core.Loc.getMessage('DAY_OF_WEEK_3')], [main_core.Loc.getMessage('DOW_4'), main_core.Loc.getMessage('DAY_OF_WEEK_4')], [main_core.Loc.getMessage('DOW_5'), main_core.Loc.getMessage('DAY_OF_WEEK_5')], [main_core.Loc.getMessage('DOW_6'), main_core.Loc.getMessage('DAY_OF_WEEK_6')]];
			this.#weekdays = [...[...weekDays].slice(firstWeekDay), ...[...weekDays].splice(0, firstWeekDay)];
			return this.#weekdays;
		}
		#renderMonthContainer(monthNumber) {
			const cacheId = `month-${monthNumber}`;
			if (!this.#refs.has(cacheId)) {
				const monthContainer = main_core.Tag.render`
				<div 
					class="ui-day-picker-month" 
					role="grid"
					aria-multiselectable="${this.getDatePicker().isSingleMode() ? 'false' : 'true'}"
				></div>
			`;
				this.#refs.set(cacheId, monthContainer);
				main_core.Dom.append(monthContainer, this.getMonthContainer());
			}
			return this.#refs.get(cacheId);
		}
		#renderMonthHeader(monthNumber, monthContainer) {
			return this.#refs.remember(`month-header-${monthNumber}`, () => {
				const monthName = main_date.DateTimeFormat.format('f', createUtcDate(2000, monthNumber), null, true);
				const container = main_core.Tag.render`<div class="ui-day-picker-month-header">${main_core.Text.encode(monthName)}</div>`;
				main_core.Dom.append(container, monthContainer);
				return container;
			});
		}
		#renderWeekDays(monthNumber, monthContainer) {
			return this.#refs.remember(`week-day-${monthNumber}`, () => {
				const weekDayContainer = main_core.Tag.render`<div class="ui-day-picker-week --week-days" role="row" aria-hidden="true"></div>`;
				main_core.Dom.append(weekDayContainer, monthContainer);
				if (this.getDatePicker().shouldShowWeekNumbers()) {
					const dayContainer = main_core.Tag.render`<div class="ui-day-picker-week-day"></div>`;
					main_core.Dom.append(dayContainer, weekDayContainer);
				}
				this.getWeekDays().forEach(weekDay => {
					const [shortName, longName] = weekDay;
					const dayContainer = main_core.Tag.render`
					<div 
						class="ui-day-picker-week-day"
						aria-label="${longName}" 
						role="columnheader"
					>${main_core.Text.encode(shortName)}</div>
				`;
					main_core.Dom.append(dayContainer, weekDayContainer);
				});
				return weekDayContainer;
			});
		}
		#renderWeek(monthNumber, weekNumber, monthContainer) {
			return this.#refs.remember(`week-${monthNumber}-${weekNumber}`, () => {
				const weekContainer = main_core.Tag.render`<div class="ui-day-picker-week" role="row"></div>`;
				main_core.Dom.append(weekContainer, monthContainer);
				return weekContainer;
			});
		}
		#renderWeekNumber(monthNumber, weekNumber, week, weekContainer) {
			const container = this.#refs.remember(`week-number-${monthNumber}-${weekNumber}`, () => {
				const weekNumberContainer = main_core.Tag.render`<div class="ui-day-picker-week-number">${main_date.DateTimeFormat.format('W', week[0].date, null, true)}</div>`;
				main_core.Dom.append(weekNumberContainer, weekContainer);
				return weekNumberContainer;
			});
			container.textContent = main_date.DateTimeFormat.format('W', week[0].date, null, true);
		}
		#renderDay(id, day, weekContainer) {
			const button = this.#refs.remember(id, () => {
				const dayContainer = main_core.Tag.render`
				<button
					type="button"
					class="ui-day-picker-day"
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
				main_core.Dom.append(dayContainer, weekContainer);
				return dayContainer;
			});
			const dayLabel = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FULL_DATE_FORMAT'), day.date, null, true);
			if (button.getAttribute('aria-label') !== dayLabel) {
				button.setAttribute('aria-label', dayLabel);
			}
			const ariaSelected = day.selected || day.rangeIn ? 'true' : 'false';
			if (button.getAttribute('aria-selected') !== ariaSelected) {
				button.setAttribute('aria-selected', ariaSelected);
			}
			if (day.current) {
				if (button.getAttribute('aria-current') !== 'date') {
					button.setAttribute('aria-current', 'date');
				}
			} else if (button.hasAttribute('aria-current')) {
				button.removeAttribute('aria-current');
			}
			const currentDay = Number(button.dataset.day);
			const currentMonth = Number(button.dataset.month);
			const currentYear = Number(button.dataset.year);
			if (currentDay !== day.day || currentMonth !== day.month || currentYear !== day.year) {
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
				'--focused': day.focused
			};
			let classNames = 'ui-day-picker-day';
			for (const [className, enabled] of Object.entries(statuses)) {
				if (enabled) {
					classNames = `${classNames} ${className}`;
				}
			}
			if (button.className !== classNames) {
				button.className = classNames;
			}
			button.disabled = Boolean(day.disabled);

			// Day Colors
			const currentBgColor = button.dataset.bgColor || null;
			const currentTextColor = button.dataset.textColor || null;
			if (currentBgColor !== day.bgColor) {
				main_core.Dom.style(button.firstElementChild, '--ui-day-picker-day-bg-color', day.bgColor);
				main_core.Dom.attr(button, 'data-bg-color', day.bgColor);
			}
			if (currentTextColor !== day.textColor) {
				main_core.Dom.style(button.firstElementChild, '--ui-day-picker-day-text-color', day.textColor);
				main_core.Dom.attr(button, 'data-text-color', day.textColor);
			}

			// Day Marks
			const currentMarks = button.dataset.marks || '';
			if (currentMarks !== day.marks.toString()) {
				main_core.Dom.clean(button.lastElementChild);
				if (day.marks.length > 0) {
					for (const mark of day.marks) {
						main_core.Dom.append(main_core.Tag.render`
							<span class="ui-day-picker-day-mark" style="background-color: ${mark}"></span>
						`, button.lastElementChild);
					}
				}
				main_core.Dom.attr(button, 'data-marks', day.marks.toString());
			}
			button.tabIndex = day.tabIndex;
			return button;
		}
		#renderTime() {
			if (this.getDatePicker().isRangeMode()) {
				const rangeStart = this.getDatePicker().getRangeStart();
				const startBtn = this.getTimeRangeStartContainer().parentNode;
				if (rangeStart === null) {
					main_core.Dom.removeClass(this.getTimeRangeContainer(), '--range-start-set');
					startBtn.disabled = true;
				} else {
					main_core.Dom.addClass(this.getTimeRangeContainer(), '--range-start-set');
					startBtn.disabled = false;
					this.getTimeRangeStartContainer().textContent = this.getDatePicker().formatTime(rangeStart);
				}
				const rangeEnd = this.getDatePicker().getRangeEnd();
				const endBtn = this.getTimeRangeEndContainer().parentNode;
				if (rangeEnd === null) {
					main_core.Dom.removeClass(this.getTimeRangeContainer(), '--range-end-set');
					endBtn.disabled = true;
				} else {
					main_core.Dom.addClass(this.getTimeRangeContainer(), '--range-end-set');
					endBtn.disabled = false;
					this.getTimeRangeEndContainer().textContent = this.getDatePicker().formatTime(rangeEnd);
				}
			} else {
				const selectedDate = this.getDatePicker().getSelectedDate();
				const button = this.getTimeContainer().firstElementChild;
				if (selectedDate === null) {
					main_core.Dom.removeClass(this.getTimeContainer(), '--time-set');
					button.disabled = true;
				} else {
					main_core.Dom.addClass(this.getTimeContainer(), '--time-set');
					button.disabled = false;
					this.getTimeValueContainer().textContent = this.getDatePicker().formatTime(selectedDate);
				}
			}
		}
		render() {
			let focusButton = null;
			const isFocused = this.getDatePicker().isFocused();
			this.getMonths().forEach((month, monthNumber) => {
				if (this.getDatePicker().isFullYear()) {
					this.getFullYearHeader().textContent = main_date.DateTimeFormat.format('Y', month.date, null, true);
				} else {
					this.getHeaderMonth(monthNumber).textContent = main_date.DateTimeFormat.format('f', month.date, null, true);
					this.getHeaderYear(monthNumber).textContent = main_date.DateTimeFormat.format('Y', month.date, null, true);
				}
				const monthContainer = this.#renderMonthContainer(monthNumber);
				monthContainer.ariaLabel = main_date.DateTimeFormat.format('f Y', month.date, null, true);
				if (this.getDatePicker().isFullYear()) {
					this.#renderMonthHeader(monthNumber, monthContainer);
				}
				if (this.getDatePicker().shouldShowWeekDays()) {
					this.#renderWeekDays(monthNumber, monthContainer);
				}
				month.weeks.forEach((week, weekNumber) => {
					const weekContainer = this.#renderWeek(monthNumber, weekNumber, monthContainer);
					if (this.getDatePicker().shouldShowWeekNumbers()) {
						this.#renderWeekNumber(monthNumber, weekNumber, week, weekContainer);
					}
					week.forEach((day, dayIndex) => {
						const id = `day-${monthNumber}-${weekNumber}-${dayIndex}`;
						const button = this.#renderDay(id, day, weekContainer);
						if (day.focused) {
							focusButton = button;
						}
					});
				});
			});
			if (focusButton !== null && isFocused && this.getDatePicker().getFocusInputModality() === 'keyboard') {
				focusButton.focus({
					preventScroll: true
				});
			}
			if (this.getDatePicker().isTimeEnabled()) {
				this.#renderTime();
			}
			this.getPrevBtn().disabled = !this.getDatePicker().canNavigate('day', 'prev');
			this.getNextBtn().disabled = !this.getDatePicker().canNavigate('day', 'next');
		}
		getMonths() {
			const months = [];
			const picker = this.getDatePicker();
			let date = picker.getViewDate();
			const numberOfMonths = picker.getNumberOfMonths();
			const today = picker.getToday();
			const focusDate = picker.getFocusDate();
			const initialFocusDate = this.getDatePicker().getInitialFocusDate();
			const showOutsideDays = picker.shouldShowOutsideDays();
			const {
				year,
				month
			} = picker.getViewDateParts();
			const firstAvailableDay = createUtcDate(year, month);
			const lastAvailableDay = ceilDate(createUtcDate(year, month + numberOfMonths - 1), 'month');
			const [from, to] = this.#getRangeDates();
			const rangeSelected = picker.isRangeMode() && picker.getRangeStart() !== null && picker.getRangeEnd() !== null;
			for (let index = 0; index < numberOfMonths; index++) {
				const weeks = [];
				const firstMonthDay = floorDate(date, 'month');
				const currentMonthIndex = date.getUTCMonth();
				date = this.#getStartMonthDate(date);
				for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
					const week = [];
					let prevDay = null;
					for (let weekDay = 0; weekDay < 7; weekDay++) {
						let available = true;
						const outside = date.getUTCMonth() !== currentMonthIndex;
						if (outside) {
							if (showOutsideDays && numberOfMonths > 1) {
								available = date.getTime() < firstAvailableDay || date.getTime() >= lastAvailableDay;
							} else if (!showOutsideDays) {
								available = false;
							}
						}
						const disabled = available && !picker.isDateAllowed(date, 'day');
						const selected = available && picker.isDateSelected(date, 'day');
						const rangeFrom = available && from && to && isDatesEqual(date, from);
						const rangeTo = available && from && to && isDatesEqual(date, to);
						const rangeIn = available && from && to && (rangeFrom || rangeTo || date.getTime() >= from.getTime() && date.getTime() <= to.getTime());
						const rangeInStart = rangeIn && (weekDay === 0 || !prevDay.rangeIn);
						const rangeInEnd = rangeIn && weekDay === 6;
						if (!rangeIn && prevDay && prevDay.rangeIn) {
							prevDay.rangeInEnd = true;
						}
						const rangeInSelected = selected && rangeIn && !rangeFrom && !rangeTo;
						const focused = available && isDatesEqual(date, focusDate, 'day');
						const tabIndex = available && (isDatesEqual(date, focusDate, 'day') || isDatesEqual(date, initialFocusDate, 'day')) ? 0 : -1;
						const dayColor = this.getDatePicker().getDayColor(date);
						const marks = this.getDatePicker().getDayMarks(date).map(dayMark => {
							return dayMark.bgColor;
						});
						const day = {
							date: cloneDate(date),
							day: date.getUTCDate(),
							month: date.getUTCMonth(),
							year: date.getUTCFullYear(),
							outside,
							current: isDatesEqual(date, today, 'day'),
							selected,
							disabled,
							hidden: outside && !showOutsideDays,
							dayOff: picker.isDayOff(date),
							rangeSelected: selected && rangeSelected,
							focused,
							tabIndex,
							rangeFrom,
							rangeTo,
							rangeIn,
							rangeInStart,
							rangeInEnd,
							rangeInSelected,
							bgColor: dayColor === null ? null : dayColor.bgColor,
							textColor: dayColor === null ? null : dayColor.textColor,
							marks
						};
						week.push(day);
						prevDay = day;
						date = addDate(date, 'day', 1);
					}
					weeks.push(week);
				}
				months.push({
					weeks,
					date: firstMonthDay
				});
			}
			return months;
		}
		#getStartMonthDate(date) {
			const picker = this.getDatePicker();
			const firstWeekDay = picker.getFirstWeekDay();
			const firstMonthDay = floorDate(date, 'month');
			let daysFromPrevMonth = firstMonthDay.getUTCDay() - firstWeekDay;
			daysFromPrevMonth = daysFromPrevMonth < 0 ? daysFromPrevMonth + 7 : daysFromPrevMonth;
			return addDate(firstMonthDay, 'day', -daysFromPrevMonth);
		}
		getFirstDay() {
			const viewDate = this.getDatePicker().getViewDate();
			const currentMonthIndex = viewDate.getUTCMonth();
			const showOutsideDays = this.getDatePicker().shouldShowOutsideDays();
			const firstViewDay = this.#getStartMonthDate(this.getDatePicker().getViewDate());
			const outside = firstViewDay.getUTCMonth() !== currentMonthIndex;
			if (outside && !showOutsideDays) {
				return floorDate(viewDate, 'month');
			}
			return firstViewDay;
		}
		getLastDay() {
			const numberOfMonths = this.getDatePicker().getNumberOfMonths();
			const showOutsideDays = this.getDatePicker().shouldShowOutsideDays();
			const {
				year,
				month
			} = this.getDatePicker().getViewDateParts();
			let lastAvailableDay = ceilDate(createUtcDate(year, month + numberOfMonths - 1), 'month');
			if (showOutsideDays) {
				const firstAvailableDay = createUtcDate(year, month + numberOfMonths - 1);
				const firstViewDay = this.#getStartMonthDate(firstAvailableDay);
				lastAvailableDay = addDate(firstViewDay, 'day', 6 * 7);
			}
			return lastAvailableDay;
		}
		#getRangeDates() {
			let from = null;
			let to = null;
			const focusDate = this.getDatePicker().getFocusDate();
			if (this.getDatePicker().isRangeMode()) {
				const range = this.getDatePicker().getSelectedDates();
				from = range[0] || null;
				to = range[1] || null;
				if (focusDate !== null) {
					if (range.length === 1) {
						if (focusDate > from.getTime()) {
							to = focusDate;
						} else {
							to = from;
							from = focusDate;
						}
					}
					/* else if (range.length === 2)
					{
						if (focusDate > to.getTime())
						{
							to = focusDate;
						}
						else if (focusDate < from.getTime())
						{
							from = focusDate;
						}
					} */
				}
			}
			return [from, to];
		}
		#handleDayClick(event) {
			const dayElement = event.target.closest('.ui-day-picker-day');
			if (dayElement === null || dayElement.disabled) {
				return;
			}
			const dataset = dayElement.dataset;
			const year = main_core.Text.toInteger(dataset.year);
			const month = main_core.Text.toInteger(dataset.month);
			const day = main_core.Text.toInteger(dataset.day);
			this.emit('onSelect', {
				year,
				month,
				day
			});
		}
		#handleDayMouseOver(event) {
			const dayElement = event.target.closest('.ui-day-picker-day');
			if (dayElement === null) {
				const weekElement = event.target.closest('.ui-day-picker-week');
				if (weekElement !== null && this.#mouseOutTimeout !== null && this.getDatePicker().getSelectedDates().length === 1) {
					clearTimeout(this.#mouseOutTimeout);
				}
				return;
			}
			if (this.#mouseOutTimeout !== null) {
				clearTimeout(this.#mouseOutTimeout);
			}
			const dataset = dayElement.dataset;
			const year = main_core.Text.toInteger(dataset.year);
			const month = main_core.Text.toInteger(dataset.month);
			const day = main_core.Text.toInteger(dataset.day);
			this.emit('onFocus', {
				year,
				month,
				day
			});
		}
		clearMouseOutTimeout() {
			if (this.#mouseOutTimeout !== null) {
				clearTimeout(this.#mouseOutTimeout);
			}
		}
		#handleDayMouseOut(event) {
			if (this.#mouseOutTimeout !== null) {
				clearTimeout(this.#mouseOutTimeout);
			}
			this.#mouseOutTimeout = setTimeout(() => {
				this.emit('onBlur');
				this.#mouseOutTimeout = null;
			}, 100);
		}
		#handleMonthClick() {
			this.emit('onMonthClick');
		}
		#handleYearClick() {
			this.emit('onYearClick');
		}
		#handleTimeClick() {
			const selectedDate = this.getDatePicker().getSelectedDate();
			if (selectedDate !== null) {
				this.emit('onTimeClick');
			}
		}
		#handleTimeRangeStartClick() {
			const rangeStart = this.getDatePicker().getRangeStart();
			if (rangeStart !== null) {
				this.emit('onRangeStartClick');
			}
		}
		#handleTimeRangeEndClick() {
			const rangeEnd = this.getDatePicker().getRangeEnd();
			if (rangeEnd !== null) {
				this.emit('onRangeEndClick');
			}
		}
		getPrevBtnLabel() {
			return main_core.Loc.getMessage(this.getDatePicker().isFullYear() ? 'UI_DATE_PICKER_PREV_YEAR' : 'UI_DATE_PICKER_PREV_MONTH');
		}
		getNextBtnLabel() {
			return main_core.Loc.getMessage(this.getDatePicker().isFullYear() ? 'UI_DATE_PICKER_NEXT_YEAR' : 'UI_DATE_PICKER_NEXT_MONTH');
		}
	}

	const DatePickerEvent = {
		SELECT_CHANGE: 'onSelectChange',
		BEFORE_SELECT: 'onBeforeSelect',
		SELECT: 'onSelect',
		BEFORE_DESELECT: 'onBeforeDeselect',
		BEFORE_DAY_SELECT: 'onBeforeDaySelect',
		DESELECT: 'onDeselect',
		PRESET_SELECT: 'onPresetSelect',
		DESTROY: 'onDestroy'
	};

	function isDateAfter(date, dateToCompare) {
		return date.getTime() > dateToCompare.getTime();
	}

	function isDateBefore(date, dateToCompare) {
		return date.getTime() < dateToCompare.getTime();
	}

	function copyTime(from, to) {
		to.setUTCHours(from.getUTCHours());
		to.setUTCMinutes(from.getUTCMinutes());
		to.setUTCSeconds(from.getUTCSeconds());
	}

	function addToRange(date, range = []) {
		const [from = null, to = null] = main_core.Type.isArray(range) ? range : [];
		if (from !== null && to !== null) {
			if (isDatesEqual(to, date) && isDatesEqual(from, date)) {
				return [];
			}
			if (isDatesEqual(to, date)) {
				return [to];
			}
			if (isDatesEqual(from, date)) {
				// return [from];
				return [];
			}
			if (isDateAfter(from, date)) {
				copyTime(from, date);
				return [date, to];
			}
			copyTime(to, date);
			return [from, date];
		}
		if (to !== null) {
			if (isDateAfter(date, to)) {
				return [to, date];
			}
			return [date, to];
		}
		if (from !== null) {
			if (isDateBefore(date, from)) {
				return [date, from];
			}
			return [from, date];
		}
		return [date];
	}

	const replacements = {
		Y: 'YYYY',
		// 1999
		M: 'MMM',
		// Jan - Dec
		f: 'MMMM',
		// January - December
		m: 'MM',
		// 01 - 12
		d: 'DD',
		// 01 - 31
		A: 'TT',
		// AM - PM
		a: 'T',
		// am - pm
		i: 'MI',
		// 00 - 59
		s: 'SS',
		// 00 - 59
		H: 'HH',
		// 00 - 24
		h: 'H',
		// 01 - 12
		G: 'GG',
		// 0 - 24
		g: 'G',
		// 1 - 12
		j: 'DD',
		// 1 to 31
		n: 'MM' // 1 to 31
	};
	function convertToDbFormat(format) {
		let result = format;
		for (const [from, to] of Object.entries(replacements)) {
			result = result.replace(from, to);
		}
		return result;
	}

	// const tests = {
	// 	'Y-m-d H:i': 'YYYY-MM-DD HH:MI:SS',
	// 	'Y/m/d G:i': 'YYYY/MM/DD HH:MI:SS',
	// 	'd-m-Y H:i': 'DD/MM/YYYY HH:MI:SS',
	// 	'd.m.Y H:i': 'DD.MM.YYYY HH:MI:SS',
	// 	'd/m/Y H:i': 'DD/MM/YYYY HH:MI:SS',
	// 	'd/m/Y H:i \น\.': 'DD/MM/YYYY HH:MI:SS',
	// 	'd/m/Y g:i a': 'DD/MM/YYYY H:MI:SS T',
	// 	'd/m/Y g:i a': 'DD/MM/YYYY HH:MI:SS',
	// 	'j.m.Y H:i': 'DD.MM.YYYY HH:MI:SS',
	// 	'j/n/Y G:i': 'DD.MM.YYYY HH:MI:SS',
	// 	'j/n/Y G:i': 'DD/MM/YYYY HH:MI:SS',
	// 	'j/n/Y H:i': 'DD/MM/YYYY HH:MI:SS',
	// 	'j/n/Y g:i a': 'DD/MM/YYYY HH:MI:SS', //
	// 	'j/n/Y g:i a': 'DD/MM/YYYY H:MI:SS T', // co
	// 	'n/j/Y g:i a': 'MM/DD/YYYY H:MI:SS T',
	// 	// 'n/j/Y g:i a': 'DD-MM-YYYY H:MI:SS T', // hi
	// };

	const WORD_REGEX = /[^\p{L}\p{N}\u0600-\u06FF_]/u;
	const YEAR_REGEX = /^[1-9]\d{3}$/;
	const DAY_REGEX = /^(0?[1-9]|[12]\d|3[01])$/;
	const MONTH_REGEX = /^(0?[1-9]|1[0-2])$/;
	const HOURS24_REGEX = /^(\d|0\d|1\d|2[0-3])$/;
	// const HOURS12_REGEX = /^(1[0-2]|0?[1-9])$/;
	const MINUTES_REGEX = /^(\d|[0-5]\d)$/;
	const SECONDS_REGEX = /^(\d|[0-5]\d)$/;
	function parseDate(dateValue, format) {
		const tokens = format.split(WORD_REGEX);
		const values = dateValue.split(WORD_REGEX);
		const parts = {};
		const errors = new Map();
		for (const [i, token] of tokens.entries()) {
			const valuePart = getDatePart(token, values[i]);
			if (valuePart !== null) {
				const [part, value, initialValue] = valuePart;
				if (value === 'error') {
					errors.set(part, initialValue);
					continue;
				}
				parts[part] = value;
			}
		}
		const hasDay = main_core.Type.isNumber(parts.day);
		const hasMonth = main_core.Type.isNumber(parts.month);
		const hasYear = main_core.Type.isNumber(parts.year);
		if (errors.size > 0) {
			const hasDate = hasYear && hasMonth && hasDay;
			const emptyTime = errors.has('hours') && errors.has('minutes') && main_core.Type.isUndefined(errors.get('hours')) && main_core.Type.isUndefined(errors.get('minutes')) && (errors.has('seconds') && main_core.Type.isUndefined(errors.get('seconds')) || !errors.has('seconds'));
			if (!hasDate || !emptyTime) {
				return null;
			}
		}
		const now = new Date();
		const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), 0));
		today.__utc = true;
		const {
			day: currentDay,
			month: currentMonth,
			year: currentYear
		} = getDate(today);
		const defaultYear = currentYear;
		const defaultMonth = hasYear ? 0 : currentMonth;
		const defaultDay = hasYear || hasMonth ? 1 : currentDay;
		const {
			meridiem
		} = parts;
		const is12Hours = tokens.includes('H') || tokens.includes('G');
		const isPM = main_core.Type.isStringFilled(meridiem) && meridiem.toLowerCase() === 'pm';
		let {
			hours
		} = parts;
		if (is12Hours) {
			if (isPM) {
				hours += hours === 12 ? 0 : 12;
			} else {
				hours = hours < 12 ? hours : 0;
			}
		}
		const {
			year = defaultYear,
			month = defaultMonth,
			day = defaultDay,
			minutes = 0,
			seconds = 0
		} = parts;
		return createUtcDate(year, month, day, hours, minutes, seconds);
	}
	function getDatePart(token, value) {
		// DD|MI|MMMM|MM|M|YYYY|HH|H|SS|TT|T|GG|G
		switch (token) {
			case 'YYYY':
				{
					if (!YEAR_REGEX.test(value)) {
						return ['year', 'error', value];
					}
					const year = main_core.Text.toInteger(value);
					return ['year', year, value];
				}
			case 'MMMM':
			case 'MMM':
				{
					const monthIndex = main_date.DateTimeFormat.getMonthIndex(value);
					if (main_core.Type.isNumber(monthIndex)) {
						return ['month', monthIndex - 1, value];
					}
					return ['month', 'error', value];
				}
			case 'MM':
			case 'M':
				{
					if (!MONTH_REGEX.test(value)) {
						return ['month', 'error', value];
					}
					const monthIndex = main_core.Text.toInteger(value);
					return ['month', monthIndex === 0 ? monthIndex : Math.min(Math.max(monthIndex, 1), 12) - 1, value];
				}
			case 'DD':
			case 'D':
				{
					if (!DAY_REGEX.test(value)) {
						return ['day', 'error', value];
					}
					const day = main_core.Text.toInteger(value);
					return ['day', Math.min(Math.max(day, 1), 31), value];
				}
			case 'HH':
			case 'GG':
				{
					if (!HOURS24_REGEX.test(value)) {
						return ['hours', 'error', value];
					}
					const hours = main_core.Text.toInteger(value);
					return ['hours', Math.min(Math.max(hours, 0), 23), value];
				}
			case 'H':
			case 'G':
				{
					if (!HOURS24_REGEX.test(value)) {
						return ['hours', 'error', value];
					}
					const hours = main_core.Text.toInteger(value);
					return ['hours', hours > 12 ? hours - 12 : hours, value];
				}
			case 'MI':
				{
					if (!MINUTES_REGEX.test(value)) {
						return ['minutes', 'error', value];
					}
					const minutes = main_core.Text.toInteger(value);
					return ['minutes', Math.min(Math.max(minutes, 0), 59), value];
				}
			case 'SS':
				{
					if (main_core.Type.isStringFilled(value) && ['am', 'pm'].includes(value.toLowerCase())) {
						return ['meridiem', value, value];
					}
					if (main_core.Type.isStringFilled(value) && !SECONDS_REGEX.test(value)) {
						return ['seconds', 'error', value];
					}
					const seconds = main_core.Text.toInteger(value);
					return ['seconds', Math.min(Math.max(seconds, 0), 59), value];
				}
			case 'T':
			case 'TT':
				if (main_core.Type.isStringFilled(value)) {
					return ['meridiem', value, value];
				}
				return null;
			default:
				return null;
		}
	}

	function createDate(value, formatDate = null) {
		let date = null;
		if (main_core.Type.isStringFilled(value) && main_core.Type.isStringFilled(formatDate)) {
			date = parseDate(value, convertToDbFormat(formatDate));
		} else if (main_core.Type.isNumber(value)) {
			date = new Date(value);
			date = createUTC(date);
		} else if (main_core.Type.isDate(value)) {
			date = value.__utc ? value : createUTC(value);
		}
		if (date === null) {
			console.warn(`DatePicker: invalid date or format (${value}).`);
		} else {
			date.__utc = true;
		}
		return date;
	}
	function createUTC(date) {
		return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0));
	}

	const FOCUSABLE_ELEMENTS_SELECTOR = ['button:not([disabled]):not([tabindex="-1"])', '[tabindex]:not([tabindex="-1"]):not([disabled])'].join(', ');
	function isElementFocused(element) {
		return element.ownerDocument.activeElement === element;
	}
	function getFocusableBoundaryElements(element, matcher = null) {
		const matcherFn = main_core.Type.isFunction(matcher) ? matcher : () => true;
		const elements = [...element.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR)].filter(el => {
			return ui_a11y.InteractivityChecker.isTabbable(el) && matcherFn(el);
		});
		if (elements.length === 0) {
			return [];
		}
		if (elements.length === 1) {
			return [elements[0], elements[0]];
		}
		let next = elements.at(0);
		let prev = elements.at(-1);
		for (const [index, currentElement] of elements.entries()) {
			if (isElementFocused(currentElement)) {
				prev = index > 0 ? elements[index - 1] : elements.at(-1);
				next = main_core.Type.isUndefined(elements[index + 1]) ? elements.at(0) : elements[index + 1];
				break;
			}
		}
		return [prev, next];
	}

	function getPresetSubtitle(preset, dates, buildAutoSubtitle) {
		if (dates === null) {
			return null;
		}
		if (preset.subtitle === '') {
			return null;
		}
		if (main_core.Type.isFunction(preset.subtitle)) {
			let result = null;
			try {
				result = preset.subtitle(dates);
			} catch (error) {
				console.warn('DatePicker: failed to compute preset subtitle.', error);
				return null;
			}
			return main_core.Type.isStringFilled(result) ? result : null;
		}
		if (main_core.Type.isString(preset.subtitle)) {
			return preset.subtitle;
		}
		return buildAutoSubtitle(dates);
	}

	function isDateLike(date) {
		return main_core.Type.isStringFilled(date) || main_core.Type.isNumber(date) || main_core.Type.isDate(date);
	}

	function resolvePresetValue(preset, selectionMode, dateFormat = null) {
		let raw = null;
		try {
			raw = main_core.Type.isFunction(preset.value) ? preset.value() : preset.value;
		} catch (error) {
			console.warn('DatePicker: failed to resolve preset value.', error);
			return null;
		}
		if (selectionMode === 'range') {
			const arr = main_core.Type.isArray(raw) ? raw.slice(0, 2) : [raw, raw];
			if (arr.length < 2) {
				return null;
			}
			let start = createDate(arr[0], dateFormat);
			let end = createDate(arr[1], dateFormat);
			if (start === null || end === null) {
				return null;
			}
			if (start > end) {
				[start, end] = [end, start];
			}
			return [start, end];
		}
		if (selectionMode === 'multiple') {
			const arr = main_core.Type.isArray(raw) ? raw : [raw];
			const dates = arr.map(value => createDate(value, dateFormat)).filter(value => value !== null);
			return dates.length === 0 ? null : dates;
		}
		const value = main_core.Type.isArray(raw) ? raw[0] : raw;
		const date = createDate(value, dateFormat);
		return date === null ? null : [date];
	}

	function setTime(date, hours = 0, minutes = 0, seconds = 0) {
		const newDate = cloneDate(date);
		if (hours !== null) {
			newDate.setUTCHours(hours);
		}
		if (minutes !== null) {
			newDate.setUTCMinutes(minutes);
		}
		if (seconds !== null) {
			newDate.setUTCSeconds(seconds);
		}
		return newDate;
	}

	function isDateMatch(day, matchers) {
		return matchers.some(matcher => {
			if (main_core.Type.isFunction(matcher)) {
				return matcher(day);
			}
			if (main_core.Type.isDate(matcher)) {
				return isDatesEqual(day, matcher);
			}
			if (main_core.Type.isArray(matcher)) {
				return matcher.some(date => {
					return isDatesEqual(day, date);
				});
			}
			if (main_core.Type.isBoolean(matcher)) {
				return matcher;
			}
			if (main_core.Type.isPlainObject(matcher)) {
				return isExtraMatch(day, matcher);
			}
			return false;
		});
	}
	function isExtraMatch(day, matcher) {
		if (main_core.Type.isArray(matcher.dayOfWeek)) {
			return matcher.dayOfWeek.includes(day.getUTCDay());
		}
		if (main_core.Type.isArray(matcher.dayOfMonth)) {
			return matcher.dayOfMonth.includes(day.getUTCDate());
		}
		const t = day.getTime();
		if (main_core.Type.isDate(matcher.from) || main_core.Type.isDate(matcher.to)) {
			const fromOk = !main_core.Type.isDate(matcher.from) || t >= matcher.from.getTime();
			const toOk = !main_core.Type.isDate(matcher.to) || t <= matcher.to.getTime();
			return fromOk && toOk;
		}
		if (main_core.Type.isDate(matcher.before) && main_core.Type.isDate(matcher.after)) {
			return t > matcher.after.getTime() && t < matcher.before.getTime();
		}
		if (main_core.Type.isDate(matcher.before)) {
			return t < matcher.before.getTime();
		}
		if (main_core.Type.isDate(matcher.after)) {
			return t > matcher.after.getTime();
		}
		return false;
	}

	const keyMap = {
		ArrowRight: {
			day: 1,
			month: 1,
			year: 1,
			hours: 1,
			minutes: 1
		},
		ArrowLeft: {
			day: -1,
			month: -1,
			year: -1,
			hours: -1,
			minutes: -1
		},
		ArrowUp: {
			day: -7,
			month: -3,
			year: -3,
			hours: -4,
			minutes: -2
		},
		ArrowDown: {
			day: 7,
			month: 3,
			year: 3,
			hours: 4,
			minutes: 2
		}
	};
	class KeyboardNavigation {
		#datePicker = null;
		#lastFocusElement = null;
		constructor(datePicker) {
			this.#datePicker = datePicker;
		}
		init() {
			main_core.Event.bind(this.#datePicker.getRootContainer(), 'keydown', this.#handleKeyDown.bind(this));
			main_core.Event.bind(this.#datePicker.getRootContainer(), 'focusin', this.#handleFocusIn.bind(this));
			main_core.Event.bind(this.#datePicker.getRootContainer(), 'focusout', this.#handleFocusOut.bind(this));
		}
		#handleKeyDown(event) {
			if (event.defaultPrevented) {
				return;
			}
			const picker = this.#datePicker;
			if (event.key === 'Backspace' && picker.getType() === 'date' && ['year', 'month', 'time'].includes(picker.getCurrentView())) {
				event.preventDefault();
				this.resetLastFocusElement();
				picker.setCurrentView('day');
				return;
			}
			if (event.key === 'Tab' && !picker.isInline()) {
				this.#handleFocusChange(event);
				return;
			}
			const view = picker.getCurrentView();
			if (view === 'time' && picker.getTimePickerStyle() === 'wheel') {
				return;
			}
			if (event.key === 'Space' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.resetLastFocusElement();
				event.target.click();
				this.#adjustLastFocusElement();
			} else if (!main_core.Type.isUndefined(keyMap[event.key])) {
				event.preventDefault();
				this.resetLastFocusElement();
				const initialFocus = picker.getFocusDate() === null && this.#isRootContainerFocused();
				if (view === 'time') {
					const timePicker = this.#datePicker.getPicker('time');
					let currentFocusDate = cloneDate(picker.getInitialFocusDate(timePicker.getMode()));
					let {
						hours,
						minutes
					} = getDate(currentFocusDate);
					if (initialFocus) {
						picker.setFocusDate(currentFocusDate, {
							inputModality: 'keyboard'
						});
						this.#adjustLastFocusElement();
					} else if (timePicker.getFocusColumn() === 'hours') {
						const increment = keyMap[event.key].hours;
						hours += increment;
						if (hours < 0) {
							hours += 24;
						} else if (hours > 23) {
							hours -= 24;
						}
						currentFocusDate = setTime(currentFocusDate, hours, null, null);
						picker.setFocusDate(currentFocusDate, {
							inputModality: 'keyboard'
						});
						this.#adjustLastFocusElement();
					} else if (timePicker.getFocusColumn() === 'minutes') {
						const increment = keyMap[event.key].minutes;
						minutes += timePicker.getCurrentMinuteStep() * increment;
						if (minutes < 0) {
							minutes += 60;
						} else if (minutes > 59) {
							minutes -= 60;
						}
						currentFocusDate = setTime(currentFocusDate, null, minutes, null);
						picker.setFocusDate(currentFocusDate, {
							inputModality: 'keyboard'
						});
						timePicker.adjustMinuteFocusPosition();
						this.#adjustLastFocusElement();
					}
				} else {
					const currentFocusDate = cloneDate(picker.getInitialFocusDate());
					if (initialFocus) {
						picker.setFocusDate(currentFocusDate, {
							inputModality: 'keyboard'
						});
					} else {
						const increment = keyMap[event.key][view];
						const focusDate = addDate(currentFocusDate, view, increment);
						picker.setFocusDate(focusDate, {
							inputModality: 'keyboard'
						});
					}
					this.#adjustLastFocusElement();
				}
			}
		}
		#isRootContainerFocused() {
			const rootContainer = this.#datePicker.getRootContainer();
			return rootContainer.ownerDocument.activeElement === rootContainer;
		}
		#handleFocusChange(event) {
			let prev = null;
			let next = null;
			const rootContainer = this.#datePicker.getRootContainer();
			if (this.#isRootContainerFocused()) {
				[prev = null, next = null] = getFocusableBoundaryElements(rootContainer, element => element.dataset.tabPriority === 'true');
			}
			if (prev === null && next === null) {
				[prev, next] = getFocusableBoundaryElements(rootContainer);
			}
			if (event.shiftKey) {
				prev?.focus({
					preventScroll: true,
					focusVisible: true
				});
				this.setLastFocusElement(prev);
			} else {
				next?.focus({
					preventScroll: true,
					focusVisible: true
				});
				this.setLastFocusElement(next);
			}
			event.preventDefault();
		}
		setLastFocusElement(element) {
			this.resetLastFocusElement();
			this.#lastFocusElement = element;
			main_core.Dom.addClass(this.#lastFocusElement, '--focus-visible');
		}
		resetLastFocusElement() {
			main_core.Dom.removeClass(this.#lastFocusElement, '--focus-visible');
			this.#lastFocusElement = null;
		}
		#adjustLastFocusElement() {
			const rootContainer = this.#datePicker.getRootContainer();
			const activeElement = rootContainer.ownerDocument.activeElement;
			if (rootContainer.contains(activeElement)) {
				this.setLastFocusElement(activeElement);
			}
		}
		#handleFocusIn(event) {
			this.resetLastFocusElement();
			// this.#lastFocusElement = event.target;
		}
		#handleFocusOut(event) {
			this.resetLastFocusElement();
			// this.#lastFocusElement = event.target;
		}
	}

	class MonthPicker extends BasePicker {
		#refs = new main_core_cache.MemoryCache();
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-month-picker" role="none">
					${this.getHeaderContainer(this.getPrevBtn(), this.getHeaderTitle(), this.getNextBtn())}
					${this.getContentContainer(this.getYearContainer())}
				</div>
			`;
			});
		}
		getHeaderTitle() {
			return this.#refs.remember('header-title', () => {
				return main_core.Tag.render`
				<button
					type="button" 
					class="ui-month-picker-header-title" 
					onclick="${this.#handleTitleClick.bind(this)}"
					aria-live="polite" 
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL')}"
				></button>
			`;
			});
		}
		getYearContainer() {
			return this.#refs.remember('year-container', () => {
				return main_core.Tag.render`
				<div 
					class="ui-month-picker-content"
					role="grid"
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL')}"
					aria-multiselectable="${this.getDatePicker().isSingleMode() ? 'false' : 'true'}"
				></div>
			`;
			});
		}
		getMonths() {
			const {
				year
			} = getDate(this.getDatePicker().getViewDate());
			const today = this.getDatePicker().getToday();
			const focusDate = this.getDatePicker().getFocusDate();
			const initialFocusDate = this.getDatePicker().getInitialFocusDate();
			// const formatter = new Intl.DateTimeFormat(
			// 	this.getDatePicker().getLocale(),
			// 	{ month: 'short', timeZone: 'UTC' },
			// );

			const months = [];
			let currentMonthIndex = 0;
			for (let quarterIndex = 0; quarterIndex < 4; quarterIndex++) {
				const quarter = [];
				for (let monthIndex = 0; monthIndex < 3; monthIndex++) {
					const date = createUtcDate(year, currentMonthIndex);
					const focused = isDatesEqual(date, focusDate, 'month');
					const month = {
						name: main_date.DateTimeFormat.format('f', date, null, true),
						// name: formatter.format(date),
						date,
						year,
						month: currentMonthIndex,
						current: isDatesEqual(date, today, 'month'),
						selected: this.getDatePicker().isDateSelected(date, 'month'),
						disabled: !this.getDatePicker().isDateAllowed(date, 'month'),
						focused,
						tabIndex: focused || isDatesEqual(date, initialFocusDate, 'month') ? 0 : -1
					};
					quarter.push(month);
					currentMonthIndex++;
				}
				months.push(quarter);
			}
			return months;
		}
		renderTo(container) {
			super.renderTo(container);
			main_core.Event.bind(this.getContentContainer(), 'click', this.#handleMonthClick.bind(this));
		}
		render() {
			const isFocused = this.getDatePicker().isFocused();
			let focusButton = null;
			this.getMonths().forEach((quarter, index) => {
				const quarterContainer = this.#renderQuarter(index);
				quarter.forEach(month => {
					const button = this.#renderMonth(month, quarterContainer);
					if (month.focused) {
						focusButton = button;
					}
				});
			});
			if (focusButton !== null && isFocused && this.getDatePicker().getFocusInputModality() === 'keyboard') {
				focusButton.focus({
					preventScroll: true
				});
			}
			const {
				year: currentYear
			} = getDate(this.getDatePicker().getViewDate());
			this.getHeaderTitle().textContent = currentYear;
			this.getPrevBtn().disabled = !this.getDatePicker().canNavigate('month', 'prev');
			this.getNextBtn().disabled = !this.getDatePicker().canNavigate('month', 'next');
		}
		#renderQuarter(index) {
			return this.#refs.remember(`quarter-${index}`, () => {
				const container = main_core.Tag.render`<div class="ui-month-picker-quarter" role="row"></div>`;
				main_core.Dom.append(container, this.getYearContainer());
				return container;
			});
		}
		#renderMonth(month, quarterContainer) {
			const button = this.#refs.remember(`month-${month.month}`, () => {
				const monthButton = main_core.Tag.render`
				<button
					type="button"
					class="ui-month-picker-month"
					role="gridcell"
					data-year="${month.year}"
					data-month="${month.month}"
					data-tab-priority="true"
					onmouseenter="${this.#handleMouseEnter.bind(this)}"
					onmouseleave="${this.#handleMouseLeave.bind(this)}"
				>${main_core.Text.encode(month.name)}</button>
			`;
				main_core.Dom.append(monthButton, quarterContainer);
				return monthButton;
			});
			const currentYear = Number(button.dataset.year);
			if (currentYear !== month.year) {
				button.dataset.year = month.year;
			}
			const ariaLabel = main_date.DateTimeFormat.format('f Y', month.date, null, true);
			if (button.getAttribute('aria-label') !== ariaLabel) {
				button.setAttribute('aria-label', ariaLabel);
			}
			const ariaSelected = month.selected ? 'true' : 'false';
			if (button.getAttribute('aria-selected') !== ariaSelected) {
				button.setAttribute('aria-selected', ariaSelected);
			}
			if (month.current) {
				main_core.Dom.addClass(button, '--current');
				if (button.getAttribute('aria-current') !== 'date') {
					button.setAttribute('aria-current', 'date');
				}
			} else {
				main_core.Dom.removeClass(button, '--current');
				if (button.hasAttribute('aria-current')) {
					button.removeAttribute('aria-current');
				}
			}
			if (month.selected) {
				main_core.Dom.addClass(button, '--selected');
			} else {
				main_core.Dom.removeClass(button, '--selected');
			}
			if (month.focused) {
				main_core.Dom.addClass(button, '--focused');
			} else {
				main_core.Dom.removeClass(button, '--focused');
			}
			if (month.disabled) {
				main_core.Dom.addClass(button, '--disabled');
			} else {
				main_core.Dom.removeClass(button, '--disabled');
			}
			button.disabled = Boolean(month.disabled);
			button.tabIndex = month.tabIndex;
			return button;
		}
		#handleMouseEnter(event) {
			const dataset = event.target.dataset;
			const year = main_core.Text.toInteger(dataset.year);
			const month = main_core.Text.toInteger(dataset.month);
			this.emit('onFocus', {
				year,
				month
			});
		}
		#handleMouseLeave(event) {
			this.emit('onBlur');
		}
		#handleMonthClick(event) {
			if (!main_core.Dom.hasClass(event.target, 'ui-month-picker-month') || event.target.disabled) {
				return;
			}
			const year = main_core.Text.toInteger(event.target.dataset.year);
			const month = main_core.Text.toInteger(event.target.dataset.month);
			this.emit('onSelect', {
				year,
				month
			});
		}
		#handleTitleClick(event) {
			this.emit('onTitleClick');
		}
		getPrevBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_PREV_YEAR');
		}
		getNextBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_NEXT_YEAR');
		}
	}

	function isValidDate(date) {
		if (!main_core.Type.isDate(date)) {
			return false;
		}
		return !Number.isNaN(date.getTime());
	}

	class TimePickerBase extends BasePicker {
		#mode = 'datetime';
		#currentMinuteStep = Infinity;
		#focusColumn = 'hours';
		getTimeDate() {
			if (this.#mode === 'range-start') {
				return this.getDatePicker().getRangeStart();
			}
			if (this.#mode === 'range-end') {
				return this.getDatePicker().getRangeEnd();
			}
			return this.getDatePicker().getSelectedDate();
		}
		setMode(mode) {
			this.#mode = mode;
		}
		getMode() {
			return this.#mode;
		}
		getFocusColumn() {
			return this.#focusColumn;
		}
		setFocusColumn(column) {
			if (main_core.Type.isStringFilled(column) && ['hours', 'minutes'].includes(column)) {
				this.#focusColumn = column;
			}
		}
		getHours() {
			const selectedDate = this.getTimeDate();
			const selectedHour = selectedDate === null ? -1 : selectedDate.getUTCHours();
			const isAmPmMode = this.getDatePicker().isAmPmMode();
			const focusDate = this.getDatePicker().getFocusDate();
			const focusHour = focusDate === null ? selectedHour : focusDate.getUTCHours();
			const initialFocusHour = this.getDatePicker().getInitialFocusDate(this.getMode()).getUTCHours();
			const hours = [];
			for (let hour = 0, index = 0; hour < 24; hour++, index++) {
				let hourToDisplay = hour;
				if (isAmPmMode) {
					hourToDisplay %= 12;
					hourToDisplay = hourToDisplay === 0 ? 12 : hourToDisplay;
				}
				hours.push({
					index,
					name: isAmPmMode ? hourToDisplay : String(hourToDisplay).padStart(2, '0'),
					value: hour,
					selected: selectedHour === hour,
					focused: focusHour === hour && this.getFocusColumn() === 'hours',
					tabIndex: focusHour === hour || initialFocusHour === hour ? 0 : -1
				});
			}
			return hours;
		}
		getMinutes() {
			const selectedDate = this.getTimeDate();
			const selectedMinute = selectedDate === null ? -1 : selectedDate.getUTCMinutes();
			const step = Math.min(this.getDatePicker().getMinuteStepByDate(selectedDate), this.#currentMinuteStep);
			const focusDate = this.getDatePicker().getFocusDate();
			const focusMinute = focusDate === null ? selectedMinute : focusDate.getUTCMinutes();
			const initialFocusMinute = this.getDatePicker().getInitialFocusDate(this.getMode()).getUTCMinutes();
			this.#currentMinuteStep = step;
			const minutes = [];
			for (let minute = 0, index = 0; minute < 60; minute++) {
				const hidden = minute % step !== 0;
				minutes.push({
					index,
					name: String(minute).padStart(2, '0'),
					value: minute,
					selected: selectedMinute === minute,
					hidden,
					focused: !hidden && focusMinute === minute && this.getFocusColumn() === 'minutes',
					tabIndex: !hidden && (focusMinute === minute || initialFocusMinute === minute) ? 0 : -1
				});
				if (!hidden) {
					index++;
				}
			}
			return minutes;
		}
		getMeridiems() {
			const selectedDate = this.getTimeDate();
			const selectedHour = selectedDate === null ? -1 : selectedDate.getUTCHours();
			const isPm = selectedHour >= 12;
			return [{
				index: 0,
				name: 'AM',
				value: 'am',
				selected: !isPm
			}, {
				index: 1,
				name: 'PM',
				value: 'pm',
				selected: isPm
			}];
		}
		getCurrentMinuteStep() {
			return this.#currentMinuteStep;
		}
		onHide() {
			this.setFocusColumn('hours');
		}
		render() {
			const picker = this.getDatePicker();
			const timeDate = this.getTimeDate();
			if (timeDate === null) {
				this.getHeaderTitle().textContent = '';
			} else {
				this.getHeaderTitle().textContent = picker.getType() === 'time' ? picker.formatTime(timeDate) : picker.formatDate(timeDate);
			}
		}
	}

	class TimePickerWheel extends TimePickerBase {
		#refs = new main_core_cache.MemoryCache();
		#focusSelectorId = null;
		#selectorScrollHandler = main_core.Runtime.debounce(this.#handleSelectorScroll, 200, this);
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-time-picker" role="none">
					${this.getDatePicker().getType() === 'time' ? null : this.getHeaderContainer(this.getPrevBtn(), this.getHeaderTitle())}
					<div class="ui-time-picker-content" role="none">
						${this.getTimeHighlighter()}
						<div
							class="ui-time-picker-selector"
							role="none"
							data-selector-id="hour"
							onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
						>
							<div 
								class="ui-time-picker-selector-title" 
								id="${this.getSelectorId('hours')}"
							>${main_core.Loc.getMessage('UI_DATE_PICKER_HOURS')}</div>
							<div class="ui-time-picker-viewport" role="none">
								<div class="ui-time-picker-scroll-container"
									tabindex="0"
									role="listbox"
									aria-labelledby="${this.getSelectorId('hours')}"
									onscroll="${this.#selectorScrollHandler}"
									onfocus="${this.#handleFocus.bind(this)}"
								>
									${this.getHoursContainer()}
								</div>
							</div>
						</div>
						<div class="ui-time-picker-time-separator" aria-hidden="true"></div>
						<div
							class="ui-time-picker-selector"
							role="none"
							data-selector-id="minute"
							onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
						>
							<div 
								class="ui-time-picker-selector-title" 
								id="${this.getSelectorId('minutes')}"
							>${main_core.Loc.getMessage('UI_DATE_PICKER_MINUTES')}</div>
							<div class="ui-time-picker-viewport" role="none">
								<div class="ui-time-picker-scroll-container"
									tabindex="0"
									role="listbox"
									aria-labelledby="${this.getSelectorId('minutes')}"
									onscroll="${this.#selectorScrollHandler}"
									onfocus="${this.#handleFocus.bind(this)}"
								>
									${this.getMinutesContainer()}
								</div>
							</div>
						</div>
						${this.getDatePicker().isAmPmMode() ? main_core.Tag.render`
									<div
										class="ui-time-picker-selector"
										role="none"
										onmouseenter="${this.#handleSelectorMouseEnter.bind(this)}"
										data-selector-id="meridiem"
									>
										<div 
											class="ui-time-picker-selector-title" 
											id="${this.getSelectorId('meridiem')}"
										>AM/PM</div>
										<div class="ui-time-picker-viewport" role="none">
											<div class="ui-time-picker-scroll-container"
												tabindex="0"
												role="listbox"
												aria-labelledby="${this.getSelectorId('meridiem')}"
												onscroll="${this.#selectorScrollHandler}"
												onfocus="${this.#handleFocus.bind(this)}"
											>
												${this.getMeridiemsContainer()}
											</div>
										</div>
									</div>
								` : null}
					</div>
				</div>
			`;
			});
		}
		getHeaderTitle() {
			return this.#refs.remember('header-title', () => {
				return main_core.Tag.render`
				<div class="ui-time-picker-header-title" onclick="${this.#handleTitleClick.bind(this)}"></div>
			`;
			});
		}
		getHoursContainer() {
			return this.#refs.remember('hours', () => {
				return main_core.Tag.render`
				<div 
					class="ui-time-picker-list-container"
					role="none"
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
			});
		}
		getMinutesContainer() {
			return this.#refs.remember('minutes', () => {
				return main_core.Tag.render`
				<div 
					class="ui-time-picker-list-container" 
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
			});
		}
		getMeridiemsContainer() {
			return this.#refs.remember('meridiems', () => {
				return main_core.Tag.render`
				<div 
					class="ui-time-picker-list-container" 
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
			});
		}
		getSelectorId(id) {
			return `${this.getDatePicker().getId()}-time-selector${id}`;
		}
		getTimeHighlighter() {
			return this.#refs.remember('time-highlighter', () => {
				return main_core.Tag.render`<div class="ui-time-picker-time-highlighter" aria-hidden="true"></div>`;
			});
		}
		onShow() {
			super.onShow();
			this.focusSelector('hour', !this.getDatePicker().isInline());
		}
		renderTo(container) {
			super.renderTo(container);
			this.#adjustScrollHeight(this.getHoursContainer());
			this.#adjustScrollHeight(this.getMinutesContainer());
			if (this.getDatePicker().isAmPmMode()) {
				this.#adjustScrollHeight(this.getMeridiemsContainer());
			}
		}
		render() {
			super.render();
			let selectedHourIndex = 0;
			this.getHours().forEach(hour => {
				if (hour.selected) {
					selectedHourIndex = hour.index;
				}
				this.#renderHour(hour);
			});
			this.#adjustScrollPosition(this.getHoursContainer(), selectedHourIndex, false);
			let selectedMinuteIndex = 0;
			this.getMinutes().forEach(minute => {
				if (minute.selected) {
					selectedMinuteIndex = minute.index;
				}
				this.#renderMinute(minute);
			});
			this.#adjustScrollPosition(this.getMinutesContainer(), selectedMinuteIndex, false);
			const picker = this.getDatePicker();
			if (picker.isAmPmMode()) {
				let selectedMeridiemIndex = 0;
				this.getMeridiems().forEach(meridiem => {
					if (meridiem.selected) {
						selectedMeridiemIndex = meridiem.index;
					}
					this.#renderMeridiem(meridiem);
				});
				this.#adjustScrollPosition(this.getMeridiemsContainer(), selectedMeridiemIndex, false);
			}
		}
		getItemHeight() {
			return 30;
		}
		focusSelector(id, changePageFocus = true) {
			if (this.#focusSelectorId === id) {
				return;
			}
			if (this.#focusSelectorId !== null) {
				const currentSelector = this.getContainer().querySelector(`[data-selector-id="${this.#focusSelectorId}"]`);
				main_core.Dom.removeClass(currentSelector, '--focused');
			}
			this.#focusSelectorId = id;
			const newSelector = this.getContainer().querySelector(`[data-selector-id="${id}"]`);
			const scrollContainer = newSelector.querySelector('[tabindex]:not([tabindex="-1"])');
			main_core.Dom.addClass(newSelector, '--focused');
			if (changePageFocus) {
				scrollContainer.focus({
					preventScroll: true
				});
			}
		}
		#renderHour(hour) {
			const div = this.#refs.remember(`hour-${hour.value}`, () => {
				const label = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), createUtcDate(1970, 0, 1, hour.value), null, true);
				const hourContainer = main_core.Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					aria-label="${label}"
					data-index="${hour.index}"
					data-value="${hour.value}"
				>${hour.name}</div>
			`;
				main_core.Dom.append(hourContainer, this.getHoursContainer());
				return hourContainer;
			});
			if (hour.selected) {
				main_core.Dom.addClass(div, '--selected');
			} else {
				main_core.Dom.removeClass(div, '--selected');
			}
			div.setAttribute('aria-selected', hour.selected ? 'true' : 'false');
		}
		#renderMinute(minute) {
			const div = this.#refs.remember(`minute-${minute.value}`, () => {
				const label = main_date.DateTimeFormat.format('idiff', createUtcDate(1970, 0, 1, 0, 0), createUtcDate(1970, 0, 1, 0, minute.value), true);
				const minuteContainer = main_core.Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					aria-label="${label}"
					data-index="${minute.index}"
					data-value="${minute.value}"
				>${minute.name}</div>
			`;
				main_core.Dom.append(minuteContainer, this.getMinutesContainer());
				return minuteContainer;
			});
			if (minute.selected) {
				main_core.Dom.addClass(div, '--selected');
			} else {
				main_core.Dom.removeClass(div, '--selected');
			}
			div.setAttribute('aria-selected', minute.selected ? 'true' : 'false');
			if (minute.hidden) {
				div.dataset.index = '';
				main_core.Dom.addClass(div, '--hidden');
				div.setAttribute('aria-hidden', 'true');
			} else {
				div.dataset.index = minute.index;
				main_core.Dom.removeClass(div, '--hidden');
				div.removeAttribute('aria-hidden');
			}
		}
		#renderMeridiem(meridiem) {
			const div = this.#refs.remember(`meridiem-${meridiem.value}`, () => {
				const meridiemContainer = main_core.Tag.render`
				<div
					class="ui-time-picker-list-item"
					role="option"
					data-index="${meridiem.index}"
					data-value="${meridiem.value}"
				>${meridiem.name}</div>
			`;
				main_core.Dom.append(meridiemContainer, this.getMeridiemsContainer());
				return meridiemContainer;
			});
			if (meridiem.selected) {
				main_core.Dom.addClass(div, '--selected');
			} else {
				main_core.Dom.removeClass(div, '--selected');
			}
			div.setAttribute('aria-selected', meridiem.selected ? 'true' : 'false');
		}
		#adjustScrollHeight(listContainer) {
			const viewport = listContainer.parentNode.parentNode;
			const offset = viewport.offsetHeight / 2 - this.getItemHeight() / 2;
			main_core.Dom.style(listContainer, {
				marginTop: `${offset}px`,
				marginBottom: `${offset}px`
			});
		}
		#adjustScrollPosition(listContainer, index, smooth = true) {
			const scrollContainer = listContainer.parentNode;
			const scrollTop = this.getItemHeight() * index;
			if (scrollContainer.scrollTop !== scrollTop) {
				scrollContainer.scrollTo({
					top: scrollTop,
					behavior: smooth ? 'smooth' : 'instant'
				});
				return true;
			}
			return false;
		}
		#handleItemClick(event) {
			const item = event.target;
			if (!item.closest('.ui-time-picker-list-item')) {
				return;
			}
			const listContainer = item.parentNode;
			const index = Number(item.dataset.index);
			const scrollChanged = this.#adjustScrollPosition(listContainer, index);
			if (!scrollChanged) {
				this.#selectTime(listContainer.parentNode);
			}
		}
		#handleTitleClick(event) {
			this.emit('onTitleClick');
		}
		getPrevBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_BACK_TO_DAYS');
		}
		getNextBtnLabel() {
			return '';
		}
		#handleSelectorMouseEnter(event) {
			this.focusSelector(event.target.dataset.selectorId);
		}
		#handleFocus(event) {
			this.focusSelector(event.target.parentNode.parentNode.dataset.selectorId);
		}
		#handleSelectorScroll(event) {
			const scrollContainer = event.target;
			const scrollTop = scrollContainer.scrollTop;
			const atSnappingPoint = scrollTop % this.getItemHeight() === 0;
			if (atSnappingPoint) {
				this.#selectTime(scrollContainer);
			}
		}
		#selectTime(scrollContainer) {
			const scrollTop = scrollContainer.scrollTop;
			const index = scrollTop / this.getItemHeight();
			const selector = scrollContainer.parentNode.parentNode;
			const selectorId = selector.dataset.selectorId;
			const item = selector.querySelector(`[data-index="${index}"]`);
			const selectedDate = this.getTimeDate();
			const currentHour = selectedDate === null ? -1 : selectedDate.getUTCHours();
			const currentMinute = selectedDate === null ? -1 : selectedDate.getUTCMinutes();
			switch (selectorId) {
				case 'hour':
					{
						const hour = Number(item.dataset.value);
						if (currentHour !== hour) {
							this.emit('onSelect', {
								hour
							});
						}
						break;
					}
				case 'minute':
					{
						const minute = Number(item.dataset.value);
						if (currentMinute !== minute) {
							this.emit('onSelect', {
								minute
							});
						}
						break;
					}
				case 'meridiem':
					{
						const meridiem = item.dataset.value;
						if (meridiem === 'am' && currentHour >= 12) {
							const hour = currentHour - 12;
							this.emit('onSelect', {
								hour
							});
						} else if (meridiem === 'pm' && currentHour >= 0 && currentHour < 12) {
							const hour = currentHour + 12;
							this.emit('onSelect', {
								hour
							});
						}
						break;
					}
			}
		}
	}

	class TimePickerGrid extends TimePickerBase {
		#refs = new main_core_cache.MemoryCache();
		#firstRender = true;
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-time-picker-grid${this.getDatePicker().isAmPmMode() ? ' --am-pm' : ''}">
					${this.getDatePicker().getType() === 'time' ? null : this.getHeaderContainer(this.getPrevBtn(), this.getHeaderTitle())}
					<div class="ui-time-picker-grid-content">
						<div class="ui-time-picker-grid-column">
							<div 
								class="ui-time-picker-grid-column-title" 
								id="${this.getHoursColumnId()}"
							>${main_core.Loc.getMessage('UI_DATE_PICKER_HOURS')}</div>
							<div class="ui-time-picker-grid-column-content">
								${this.getHoursContainer()}
							</div>
						</div>
						<div class="ui-time-picker-grid-column-separator"></div>
						<div class="ui-time-picker-grid-column">
							<div 
								class="ui-time-picker-grid-column-title" 
								id="${this.getMinutesColumnId()}"
							>${main_core.Loc.getMessage('UI_DATE_PICKER_MINUTES')}</div>
							<div class="ui-time-picker-grid-column-content">
								${this.getMinutesContainer()}
							</div>
						</div>
					</div>
				</div>
			`;
			});
		}
		getHeaderTitle() {
			return this.#refs.remember('header-title', () => {
				return main_core.Tag.render`
				<div class="ui-time-picker-grid-header-title" onclick="${this.#handleTitleClick.bind(this)}"></div>
			`;
			});
		}
		getHoursContainer() {
			return this.#refs.remember('hours', () => {
				return main_core.Tag.render`
				<div
					role="listbox"
					aria-labelledby="${this.getHoursColumnId()}"
					class="ui-time-picker-grid-column-items --hours" 
					onclick="${this.#handleItemClick.bind(this)}"
				></div>
			`;
			});
		}
		getHoursColumnId() {
			return `${this.getDatePicker().getId()}-hours-column`;
		}
		getMinutesContainer() {
			return this.#refs.remember('minutes', () => {
				return main_core.Tag.render`
				<div
					role="listbox"
					aria-labelledby="${this.getMinutesColumnId()}"
					class="ui-time-picker-grid-column-items --minutes" 
					onclick="${this.#handleItemClick.bind(this)}"
					onscroll="${main_core.Runtime.debounce(this.#adjustScrollShadows, 100, this)}"
				></div>
			`;
			});
		}
		getMinutesColumnId() {
			return `${this.getDatePicker().getId()}-minutes-column`;
		}
		onHide() {
			super.onHide();
			this.#firstRender = true;
		}
		render() {
			super.render();
			let focusedHourBtn = null;
			this.getHours().forEach(hour => {
				const button = this.#renderHour(hour, this.getHoursContainer());
				if (hour.focused) {
					focusedHourBtn = button;
				}
			});
			let selectedMinute = null;
			let focusedMinute = null;
			this.getMinutes().forEach(minute => {
				const button = this.#renderMinute(minute, this.getMinutesContainer());
				if (minute.selected) {
					selectedMinute = button;
				}
				if (minute.focused) {
					focusedMinute = button;
				}
			});
			if (this.#firstRender) {
				main_core.Dom.style(this.getMinutesContainer(), 'height', `${this.getHoursContainer().offsetHeight}px`);
				if (selectedMinute !== null) {
					this.#adjustScrollPosition(selectedMinute, false);
				}
				this.#adjustScrollShadows();
				this.#firstRender = false;
			}
			if (this.getDatePicker().isFocused()) {
				if (this.getFocusColumn() === 'hours' && focusedHourBtn !== null && this.getDatePicker().getFocusInputModality() === 'keyboard') {
					focusedHourBtn.focus({
						preventScroll: true
					});
				} else if (this.getFocusColumn() === 'minutes' && focusedMinute !== null && this.getDatePicker().getFocusInputModality() === 'keyboard') {
					focusedMinute.focus({
						preventScroll: true
					});
				}
			}
		}
		#renderHour(hour, container) {
			const button = this.#refs.remember(`hour-${hour.value}`, () => {
				const label = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), createUtcDate(1970, 0, 1, hour.value), null, true);
				const hourContainer = main_core.Tag.render`
				<button
					type="button"
					role="option"
					class="ui-time-picker-grid-item"
					aria-label="${label}"
					data-index="${hour.index}" 
					data-hour="${hour.value}"
					data-tab-priority="true"
					onmouseenter="${this.#handleMouseEnter.bind(this)}"
					onmouseleave="${this.#handleMouseLeave.bind(this)}"
					onfocus="${this.#handleFocus.bind(this)}"
				><span class="ui-time-picker-grid-item-inner">${hour.name}</span></button>
			`;
				if (this.getDatePicker().isAmPmMode()) {
					if (hour.value === 0) {
						hourContainer.dataset.meridiem = 'AM';
						main_core.Dom.addClass(hourContainer, '--has-meridiem');
					} else if (hour.value === 12) {
						hourContainer.dataset.meridiem = 'PM';
						main_core.Dom.addClass(hourContainer, '--has-meridiem');
					}
				}
				main_core.Dom.append(hourContainer, container);
				return hourContainer;
			});
			if (hour.selected) {
				main_core.Dom.addClass(button, '--selected');
			} else {
				main_core.Dom.removeClass(button, '--selected');
			}
			const ariaSelected = hour.selected ? 'true' : 'false';
			if (button.getAttribute('aria-selected') !== ariaSelected) {
				button.setAttribute('aria-selected', ariaSelected);
			}
			if (hour.focused) {
				main_core.Dom.addClass(button, '--focused');
			} else {
				main_core.Dom.removeClass(button, '--focused');
			}
			button.tabIndex = hour.tabIndex;
			return button;
		}
		#renderMinute(minute, container) {
			const button = this.#refs.remember(`minute-${minute.value}`, () => {
				const label = main_date.DateTimeFormat.format('idiff', createUtcDate(1970, 0, 1, 0, 0), createUtcDate(1970, 0, 1, 0, minute.value), true);
				const minuteContainer = main_core.Tag.render`
				<button
					type="button"
					class="ui-time-picker-grid-item"
					role="option"
					aria-label="${label}"
					data-index="${minute.index}" 
					data-minute="${minute.value}"
					onmouseenter="${this.#handleMouseEnter.bind(this)}"
					onmouseleave="${this.#handleMouseLeave.bind(this)}"
					onfocus="${this.#handleFocus.bind(this)}"
				><span class="ui-time-picker-grid-item-inner">${minute.name}</span></button>
			`;
				main_core.Dom.append(minuteContainer, container);
				return minuteContainer;
			});
			if (minute.selected) {
				main_core.Dom.addClass(button, '--selected');
			} else {
				main_core.Dom.removeClass(button, '--selected');
			}
			const ariaSelected = minute.selected ? 'true' : 'false';
			if (button.getAttribute('aria-selected') !== ariaSelected) {
				button.setAttribute('aria-selected', ariaSelected);
			}
			if (minute.hidden) {
				button.dataset.index = '';
				main_core.Dom.addClass(button, '--hidden');
			} else {
				button.dataset.index = minute.index;
				main_core.Dom.removeClass(button, '--hidden');
			}
			if (minute.focused) {
				main_core.Dom.addClass(button, '--focused');
			} else {
				main_core.Dom.removeClass(button, '--focused');
			}
			button.tabIndex = minute.tabIndex;
			return button;
		}
		#adjustScrollPosition(selectedMinute, smooth = true) {
			const shadowHeight = 20;
			const scrollTop = this.getMinutesContainer().scrollTop;
			const viewportTop = scrollTop + shadowHeight;
			const offsetTop = selectedMinute.offsetTop;
			const offsetBottom = offsetTop + selectedMinute.offsetHeight;
			const viewportHeight = this.getMinutesContainer().offsetHeight;
			const viewportBottom = scrollTop + viewportHeight - shadowHeight;
			const isVisible = offsetTop >= viewportTop && offsetTop <= viewportBottom && offsetBottom <= viewportBottom && offsetBottom >= viewportTop;
			if (!isVisible) {
				this.getMinutesContainer().scrollTo({
					top: selectedMinute.offsetTop - viewportHeight / 2,
					behavior: smooth ? 'smooth' : 'instant'
				});
			}
		}
		adjustMinuteFocusPosition() {
			const item = this.getContainer().ownerDocument.activeElement;
			if (!item.closest('.ui-time-picker-grid-item')) {
				return;
			}
			this.#adjustScrollPosition(item);
		}
		#adjustScrollShadows() {
			const scrollTop = this.getMinutesContainer().scrollTop;
			const scrollHeight = this.getMinutesContainer().scrollHeight;
			const offsetHeight = this.getMinutesContainer().offsetHeight;
			const columnContainer = this.getMinutesContainer().parentNode.parentNode;
			if (scrollTop > 0) {
				main_core.Dom.addClass(columnContainer, '--top-shadow');
			} else {
				main_core.Dom.removeClass(columnContainer, '--top-shadow');
			}
			if (scrollTop === scrollHeight - offsetHeight) {
				main_core.Dom.removeClass(columnContainer, '--bottom-shadow');
			} else {
				main_core.Dom.addClass(columnContainer, '--bottom-shadow');
			}
		}
		#handleItemClick(event) {
			const item = event.target;
			if (!item.closest('.ui-time-picker-grid-item')) {
				return;
			}
			if (main_core.Type.isStringFilled(item.dataset.hour)) {
				this.setFocusColumn('hours');
				const hour = Number(item.dataset.hour);
				this.emit('onSelect', {
					hour
				});
			} else if (main_core.Type.isStringFilled(item.dataset.minute)) {
				this.setFocusColumn('minutes');
				this.#adjustScrollPosition(item);
				const minute = Number(item.dataset.minute);
				this.emit('onSelect', {
					minute
				});
			}
		}
		#handleMouseEnter(event) {
			const {
				hour,
				minute
			} = event.target.dataset;
			if (main_core.Type.isStringFilled(hour)) {
				this.setFocusColumn('hours');
				this.emit('onFocus', {
					hour: main_core.Text.toInteger(hour)
				});
			} else if (main_core.Type.isStringFilled(minute)) {
				this.setFocusColumn('minutes');
				this.emit('onFocus', {
					minute: main_core.Text.toInteger(minute)
				});
			}
		}
		#handleMouseLeave(event) {
			this.emit('onBlur');
		}
		#handleFocus(event) {
			const {
				hour,
				minute
			} = event.target.dataset;
			const currentColumn = this.getFocusColumn();
			if (main_core.Type.isStringFilled(hour)) {
				this.setFocusColumn('hours');
			} else if (main_core.Type.isStringFilled(minute)) {
				this.setFocusColumn('minutes');
			}
			if (currentColumn !== this.getFocusColumn()) {
				this.render();
			}
		}
		#handleTitleClick(event) {
			this.emit('onTitleClick');
		}
		getPrevBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_BACK_TO_DAYS');
		}
		getNextBtnLabel() {
			return '';
		}
	}

	class YearPicker extends BasePicker {
		#refs = new main_core_cache.MemoryCache();
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div
					class="ui-year-picker"
					role="none"
				>
					${this.getHeaderContainer(this.getPrevBtn(), this.getHeaderTitle(), this.getNextBtn())}
					${this.getContentContainer(this.getTrioContainer())}
				</div>
			`;
			});
		}
		getTrioContainer() {
			return this.#refs.remember('trio-container', () => {
				return main_core.Tag.render`
				<div 
					class="ui-year-picker-content"
					role="grid"
					aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL')}"
					aria-multiselectable="${this.getDatePicker().isSingleMode() ? 'false' : 'true'}"
				></div>
			`;
			});
		}
		getHeaderTitle() {
			return this.#refs.remember('header-title', () => {
				return main_core.Tag.render`
				<div class="ui-year-picker-header-title" aria-live="polite"></div>
			`;
			});
		}
		getYears() {
			const {
				year: currentYear
			} = getDate(this.getDatePicker().getToday());
			const focusDate = this.getDatePicker().getFocusDate();
			const initialFocusYear = this.getDatePicker().getInitialFocusDate().getUTCFullYear();
			const years = [];
			let index = 0;
			let year = this.#getStartYear();
			for (let i = 0; i < 4; i++) {
				const quarter = [];
				for (let j = 0; j < 3; j++) {
					const focused = focusDate !== null && focusDate.getUTCFullYear() === year;
					quarter.push({
						index,
						year,
						name: year,
						current: currentYear === year,
						selected: this.getDatePicker().isDateSelected(createUtcDate(year), 'year'),
						disabled: !this.getDatePicker().isDateAllowed(createUtcDate(year), 'year'),
						focused,
						tabIndex: focused || year === initialFocusYear ? 0 : -1
					});
					year++;
					index++;
				}
				years.push(quarter);
			}
			return years;
		}
		#getStartYear() {
			const {
				year: viewYear
			} = this.getDatePicker().getViewDateParts();
			const {
				year: currentYear
			} = getDate(this.getDatePicker().getToday());
			let year = currentYear - 4;
			year -= 12 * Math.ceil((year - viewYear) / 12);
			return year;
		}
		getFirstYear() {
			return this.#getStartYear();
		}
		getLastYear() {
			return this.#getStartYear() + 11;
		}
		renderTo(container) {
			super.renderTo(container);
			main_core.Event.bind(this.getContentContainer(), 'click', this.#handleYearClick.bind(this));
		}
		render() {
			let focusButton = null;
			const isFocused = this.getDatePicker().isFocused();
			const years = this.getYears();
			years.forEach((quarter, index) => {
				const quarterContainer = this.#renderQuarter(index);
				quarter.forEach(year => {
					const button = this.#renderYear(year, quarterContainer);
					if (year.focused) {
						focusButton = button;
					}
				});
			});
			if (focusButton !== null && isFocused && this.getDatePicker().getFocusInputModality() === 'keyboard') {
				focusButton.focus({
					preventScroll: true
				});
			}
			const firstYear = years[0][0].name;
			const lastYear = years.at(-1).at(-1).name;
			this.getHeaderTitle().textContent = `${firstYear} — ${lastYear}`;
			this.getPrevBtn().disabled = !this.getDatePicker().canNavigate('year', 'prev');
			this.getNextBtn().disabled = !this.getDatePicker().canNavigate('year', 'next');
		}
		#renderQuarter(index) {
			return this.#refs.remember(`quarter-${index}`, () => {
				const container = main_core.Tag.render`<div class="ui-year-picker-trio" role="row"></div>`;
				main_core.Dom.append(container, this.getTrioContainer());
				return container;
			});
		}
		#renderYear(year, quarterContainer) {
			const button = this.#refs.remember(`year-${year.index}`, () => {
				const yearButton = main_core.Tag.render`
				<button
					type="button"
					class="ui-year-picker-year"
					role="gridcell"
					data-year="${year}"
					data-tab-priority="true"
					onmouseenter="${this.#handleMouseEnter.bind(this)}"
					onmouseleave="${this.#handleMouseLeave.bind(this)}"
				>${main_core.Text.encode(year.name)}</button>
			`;
				main_core.Dom.append(yearButton, quarterContainer);
				return yearButton;
			});
			const currentYear = Number(button.dataset.year);
			if (currentYear !== year.year) {
				button.dataset.year = year.year;
				button.textContent = year.name;
			}
			const ariaSelected = year.selected ? 'true' : 'false';
			if (button.getAttribute('aria-selected') !== ariaSelected) {
				button.setAttribute('aria-selected', ariaSelected);
			}
			if (year.current) {
				main_core.Dom.addClass(button, '--current');
				if (button.getAttribute('aria-current') !== 'date') {
					button.setAttribute('aria-current', 'date');
				}
			} else {
				main_core.Dom.removeClass(button, '--current');
				if (button.hasAttribute('aria-current')) {
					button.removeAttribute('aria-current');
				}
			}
			if (year.selected) {
				main_core.Dom.addClass(button, '--selected');
			} else {
				main_core.Dom.removeClass(button, '--selected');
			}
			if (year.focused) {
				main_core.Dom.addClass(button, '--focused');
			} else {
				main_core.Dom.removeClass(button, '--focused');
			}
			if (year.disabled) {
				main_core.Dom.addClass(button, '--disabled');
			} else {
				main_core.Dom.removeClass(button, '--disabled');
			}
			button.disabled = Boolean(year.disabled);
			button.tabIndex = year.tabIndex;
			return button;
		}
		#handleMouseEnter(event) {
			const dataset = event.target.dataset;
			const year = main_core.Text.toInteger(dataset.year);
			this.emit('onFocus', {
				year
			});
		}
		#handleMouseLeave(event) {
			this.emit('onBlur');
		}
		#handleYearClick(event) {
			if (!main_core.Dom.hasClass(event.target, 'ui-year-picker-year') || event.target.disabled) {
				return;
			}
			const year = main_core.Text.toInteger(event.target.dataset.year);
			this.emit('onSelect', {
				year
			});
		}
		getPrevBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_PREV_DECADE');
		}
		getNextBtnLabel() {
			return main_core.Loc.getMessage('UI_DATE_PICKER_NEXT_DECADE');
		}
	}

	let singleOpenDatePicker = null;

	/**
	 * @namespace BX.UI.DatePicker
	 */
	class DatePicker extends main_core_events.EventEmitter {
		#id = null;
		#viewDate = null;
		#startDate = null;
		#selectedDates = [];
		#focusDate = null;
		#focusInputModality = null;
		#type = 'date';
		#currentView = null;
		#selectionMode = 'single';
		#views = new Map();
		#firstWeekDay = 1;
		#showWeekDays = true;
		#showWeekNumbers = false;
		#showOutsideDays = true;
		#numberOfMonths = 1;
		#maxDays = Infinity;
		#minDays = 0;
		#minDate = null;
		#maxDate = null;
		#restrictNavigation = true;
		#fullYear = false;
		#weekends = [0, 6];
		#holidays = [];
		#workdays = [];
		#enableTime = false;
		#allowSeconds = false;
		#amPmMode = false;
		#minuteStep = 5;
		#defaultTime = '00:00:00';
		#defaultTimeSpan = 60;
		#timePickerStyle = 'grid';
		#cutZeroTime = true;
		#targetNode = null;
		#inputField = null;
		#rangeStartInput = null;
		#rangeEndInput = null;
		#useInputEvents = true;
		#dateSeparator = ', ';
		#popup = null;
		#popupOptions = {};
		#hideByEsc = true;
		#autoHide = true;
		#cacheable = true;
		#singleOpening = true;
		#refs = new main_core_cache.MemoryCache();
		#rendered = false;
		#inline = false;
		#autoFocus = true;
		#dateFormat = null;
		#timeFormat = null;
		#toggleSelected = null;
		#hideOnSelect = true;
		#locale = null;
		#hideHeader = false;
		#dayColors = [];
		#dayMarks = [];
		#disabledDateMatchers = [];
		#presets = [];
		#presetsContainer = null;
		#presetsFocusZone = null;
		#keyboardNavigation = null;
		#destroying = false;
		constructor(pickerOptions) {
			super();
			this.setEventNamespace('BX.UI.DatePicker');
			const settings = main_core.Extension.getSettings('ui.date-picker');
			const options = main_core.Type.isPlainObject(pickerOptions) ? pickerOptions : {};
			this.#id = main_core.Text.getRandom();
			this.#setType(options.type);
			this.#setSelectionMode(options.selectionMode);
			this.#locale = main_core.Type.isStringFilled(options.locale) ? options.locale : settings.get('locale', 'en');
			this.#enableTime = main_core.Type.isBoolean(options.enableTime) ? options.enableTime : this.#enableTime;
			if (this.isMultipleMode()) {
				this.#enableTime = false;
			}
			this.#allowSeconds = main_core.Type.isBoolean(options.allowSeconds) ? options.allowSeconds : this.#allowSeconds;
			this.#amPmMode = main_core.Type.isBoolean(options.amPmMode) ? options.amPmMode : main_date.DateTimeFormat.isAmPmMode();
			this.#cutZeroTime = main_core.Type.isBoolean(options.cutZeroTime) ? options.cutZeroTime : this.#cutZeroTime;
			this.#dateFormat = main_core.Type.isStringFilled(options.dateFormat) ? options.dateFormat : this.#getDefaultDateFormat();
			this.setDefaultTime(options.defaultTime);
			this.setDefaultTimeSpan(options.defaultTimeSpan);
			this.#timeFormat = main_core.Type.isStringFilled(options.timeFormat) ? options.timeFormat : main_date.DateTimeFormat.getFormat(this.#allowSeconds ? 'LONG_TIME_FORMAT' : 'SHORT_TIME_FORMAT');
			this.#minuteStep = main_core.Type.isNumber(options.minuteStep) && [1, 5, 10, 15, 30].includes(options.minuteStep) ? options.minuteStep : this.#minuteStep;
			this.#timePickerStyle = options.timePickerStyle === 'wheel' ? 'wheel' : this.#timePickerStyle;
			this.#viewDate = this.getToday();
			this.#useInputEvents = main_core.Type.isBoolean(options.useInputEvents) ? options.useInputEvents : this.#useInputEvents;
			this.setAutoFocus(options.autoFocus);
			this.setInputField(options.inputField);
			this.setRangeStartInput(options.rangeStartInput);
			this.setRangeEndInput(options.rangeEndInput);
			this.setDateSeparator(options.dateSeparator);
			this.selectDates(options.selectedDates, {
				emitEvents: false
			});
			this.#startDate = isDateLike(options.startDate) ? this.createDate(options.startDate) : null;
			const viewDate = this.getDefaultViewDate();
			this.setViewDate(viewDate);
			this.#inline = options.inline === true;
			let firstWeekDay = settings.get('firstWeekDay', this.#firstWeekDay);
			firstWeekDay = main_core.Type.isNumber(options.firstWeekDay) ? options.firstWeekDay : firstWeekDay;
			this.#firstWeekDay = Math.min(Math.max(0, firstWeekDay), 6);
			this.#numberOfMonths = main_core.Type.isNumber(options.numberOfMonths) ? options.numberOfMonths : this.#numberOfMonths;
			this.#fullYear = options.fullYear === true;
			if (this.#fullYear) {
				this.#enableTime = false;
				this.#numberOfMonths = 12;
				this.setViewDate(createUtcDate(viewDate.getUTCFullYear(), 0, 1));
			}
			this.#showWeekDays = main_core.Type.isBoolean(options.showWeekDays) ? options.showWeekDays : this.#showWeekDays;
			this.#showWeekNumbers = main_core.Type.isBoolean(options.showWeekNumbers) ? options.showWeekNumbers : this.#showWeekNumbers;
			const defaultWeekends = settings.get('weekends', []);
			this.#weekends = main_core.Type.isArray(options.weekends) ? options.weekends : main_core.Type.isArrayFilled(defaultWeekends) ? defaultWeekends : this.#weekends;
			const defaultHolidays = settings.get('holidays', []);
			this.#holidays = main_core.Type.isArray(options.holidays) ? options.holidays : defaultHolidays;
			const defaultWorkdays = settings.get('workdays', []);
			this.#workdays = main_core.Type.isArray(options.workdays) ? options.workdays : defaultWorkdays;
			this.#showOutsideDays = this.#numberOfMonths > 1 ? false : this.#showOutsideDays;
			this.#showOutsideDays = main_core.Type.isBoolean(options.showOutsideDays) ? options.showOutsideDays : this.#showOutsideDays;
			this.#popupOptions = main_core.Type.isPlainObject(options.popupOptions) ? options.popupOptions : this.#popupOptions;
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
		getId() {
			return this.#id;
		}
		setViewDate(date) {
			let newDate = this.createDate(date);
			if (newDate === null) {
				return;
			}
			newDate = setTime(newDate, 0, 0, 0);
			this.#viewDate = newDate;
			if (this.isDateOutOfView(this.getFocusDate())) {
				this.setFocusDate(null, {
					adjustViewDate: false,
					render: false
				});
			}
			if (this.isRendered()) {
				this.getPicker().render();
			}
		}
		getViewDate() {
			return this.#viewDate;
		}
		getDefaultViewDate() {
			return this.getSelectedDate() || this.#startDate || this.getToday();
		}
		adjustViewDate(date) {
			if (this.isSingleMode()) {
				if (this.getNumberOfMonths() === 1) {
					if (!isDatesEqual(date, this.getViewDate(), 'month')) {
						this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
					}
				} else {
					const {
						year,
						month
					} = this.getViewDateParts();
					const firstMonth = createUtcDate(year, month);
					const lastMonth = ceilDate(createUtcDate(year, month + this.getNumberOfMonths() - 1), 'month');
					if (date < firstMonth || date >= lastMonth) {
						this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
					}
				}
			} else {
				const dayPicker = this.getPicker('day');
				const months = dayPicker.getMonths();
				const firstDay = months[0].weeks[0][0].date;
				const lastDay = months.at(-1).weeks.at(-1).at(-1).date;
				if (date < firstDay || date > lastDay) {
					this.setViewDate(createUtcDate(date.getUTCFullYear(), date.getUTCMonth()));
				}
			}
		}
		getViewDateParts() {
			return getDate(this.#viewDate);
		}
		selectDate(date, options = {}) {
			if (this.isRangeMode()) {
				throw new Error('DatePicker: to select a range use selectRange method.');
			}
			if (!isDateLike(date)) {
				return false;
			}
			const selectedDate = this.createDate(date);
			if (this.isDateSelected(selectedDate, 'datetime')) {
				return false;
			}
			if (!this.isDateAllowed(selectedDate)) {
				return false;
			}
			const updateTime = this.isDateSelected(selectedDate, 'day');
			if (!updateTime && this.isMultipleMode() && this.#selectedDates.length >= this.getMaxDays()) {
				return false;
			}
			const {
				emitEvents,
				render,
				updateInputs
			} = {
				emitEvents: true,
				render: true,
				updateInputs: true,
				...options
			};
			if (emitEvents && !this.#canSelectDate(selectedDate)) {
				return false;
			}
			if (this.isMultipleMode()) {
				if (updateTime) {
					const index = this.#selectedDates.findIndex(currentDate => {
						return isDatesEqual(currentDate, selectedDate, 'day');
					});

					// replace existing date
					if (index !== -1) {
						this.#selectedDates.splice(index, 1, selectedDate);
					}
				} else {
					const index = this.#selectedDates.findIndex(currentDate => {
						return currentDate > selectedDate;
					});
					if (index === -1) {
						this.#selectedDates.push(selectedDate);
					} else if (index === 0) {
						this.#selectedDates.unshift(selectedDate);
					} else {
						this.#selectedDates.splice(index, 0, selectedDate);
					}
				}
			} else {
				const currentDate = this.#selectedDates[0] || null;
				if (emitEvents && currentDate !== null) {
					if (!this.#canDeselectDate(currentDate)) {
						return false;
					}
					this.deselectDate(currentDate, {
						emitEvents: false,
						render: false
					});
					this.emit(DatePickerEvent.DESELECT, {
						date: currentDate
					});
				}
				this.#selectedDates = [selectedDate];
			}
			this.adjustViewDate(selectedDate);
			if (this.isRendered() && render) {
				this.getPicker().render();
			}
			this.#refreshPresetsActive();
			if (updateInputs) {
				this.updateInputFields();
			}
			if (emitEvents) {
				this.emit(DatePickerEvent.SELECT, {
					date: selectedDate
				});
				this.emit(DatePickerEvent.SELECT_CHANGE);
			}
			return true;
		}
		selectDates(dates, options = {}) {
			if (!main_core.Type.isArrayFilled(dates)) {
				return;
			}
			if (this.isRangeMode()) {
				const [start, end] = dates;
				this.selectRange(start, end, options);
			} else {
				dates.forEach(date => {
					this.selectDate(date, options);
				});
			}
		}
		selectRange(start, end = null, options = {}) {
			if (!this.isRangeMode()) {
				throw new Error('DatePicker: to select a date use selectDate method.');
			}
			if (!isDateLike(start) || end !== null && !isDateLike(end)) {
				return false;
			}
			let newStart = this.createDate(start);
			let newEnd = end === null ? null : this.createDate(end);
			if (newStart === null && newEnd === null) {
				return false;
			}
			if (newStart !== null && newEnd !== null && newStart > newEnd) {
				[newStart, newEnd] = [newEnd, newStart];
			}
			if (newStart !== null && !this.isDateAllowed(newStart)) {
				return false;
			}
			if (newEnd !== null && !this.isDateAllowed(newEnd)) {
				return false;
			}
			const currentStart = this.#selectedDates[0] || null;
			const currentEnd = this.#selectedDates[1] || null;
			if (isDatesEqual(newStart, currentStart, 'datetime') && (newEnd === null && currentEnd === null || isDatesEqual(newEnd, currentEnd, 'datetime'))) {
				return false;
			}
			const {
				emitEvents,
				updateInputs
			} = {
				emitEvents: true,
				updateInputs: true,
				...options
			};
			const deselectStart = currentStart !== null && emitEvents && !isDatesEqual(newStart, currentStart, 'datetime') && !isDatesEqual(newEnd, currentStart, 'datetime');
			const deselectEnd = currentEnd !== null && emitEvents && !isDatesEqual(newStart, currentEnd, 'datetime') && !isDatesEqual(newEnd, currentEnd, 'datetime');
			const selectStart = !this.isDateSelected(newStart, 'datetime');
			const selectEnd = newEnd !== null && (!this.isDateSelected(newEnd, 'datetime') || currentEnd === null && isDatesEqual(newEnd, newStart, 'datetime'));
			if (deselectStart && !this.#canDeselectDate(currentStart)) {
				return false;
			}
			if (deselectEnd && !this.#canDeselectDate(currentEnd)) {
				return false;
			}
			if (selectStart && !this.#canSelectDate(newStart)) {
				return false;
			}
			if (selectEnd && !this.#canSelectDate(newEnd)) {
				return false;
			}
			if (deselectStart) {
				this.deselectDate(currentStart, {
					emitEvents: false,
					render: false
				});
				this.emit(DatePickerEvent.DESELECT, {
					date: currentStart
				});
			}
			if (deselectEnd) {
				this.deselectDate(currentEnd, {
					emitEvents: false,
					render: false
				});
				this.emit(DatePickerEvent.DESELECT, {
					date: currentEnd
				});
			}
			this.#selectedDates = newEnd === null ? [newStart] : [newStart, newEnd];
			this.adjustViewDate(newStart);
			if (this.isRendered()) {
				this.getPicker().render();
			}
			this.#refreshPresetsActive();
			if (updateInputs) {
				this.updateInputFields();
			}
			if (emitEvents) {
				if (selectStart) {
					this.emit(DatePickerEvent.SELECT, {
						date: newStart
					});
				}
				if (selectEnd) {
					this.emit(DatePickerEvent.SELECT, {
						date: newEnd
					});
				}
				this.emit(DatePickerEvent.SELECT_CHANGE);
			}
			return true;
		}
		deselectDate(date, options = {}) {
			if (!isDateLike(date)) {
				return false;
			}
			const dateToDeselect = this.createDate(date);
			const {
				emitEvents,
				render,
				updateInputs
			} = {
				emitEvents: true,
				render: true,
				updateInputs: true,
				...options
			};
			if (emitEvents && !this.#canDeselectDate(dateToDeselect)) {
				return false;
			}
			if (this.isMultipleMode() && this.#selectedDates.length <= this.getMinDays()) {
				return false;
			}
			const index = this.#selectedDates.findIndex(selectedDate => {
				return isDatesEqual(dateToDeselect, selectedDate);
			});
			if (index === -1) {
				return false;
			}
			this.#selectedDates.splice(index, 1);
			if (emitEvents) {
				this.emit(DatePickerEvent.DESELECT, {
					date: dateToDeselect
				});
				this.emit(DatePickerEvent.SELECT_CHANGE);
			}
			if (this.isRendered() && render) {
				this.getPicker().render();
			}
			this.#refreshPresetsActive();
			if (updateInputs) {
				this.updateInputFields();
			}
			return true;
		}
		deselectAll(options = {}) {
			const dates = [...this.#selectedDates];
			dates.forEach(date => {
				this.deselectDate(date, options);
			});
			return this.#selectedDates.length === 0;
		}
		#canSelectDate(date) {
			const event = new main_core_events.BaseEvent({
				data: {
					date
				}
			});
			this.emit(DatePickerEvent.BEFORE_SELECT, event);
			return !event.isDefaultPrevented();
		}
		#canDeselectDate(date) {
			const event = new main_core_events.BaseEvent({
				data: {
					date
				}
			});
			this.emit(DatePickerEvent.BEFORE_DESELECT, event);
			return !event.isDefaultPrevented();
		}
		getSelectedDates() {
			return this.#selectedDates;
		}
		getSelectedDate() {
			return this.#selectedDates[0] || null;
		}
		getRangeStart() {
			return this.#selectedDates[0] || null;
		}
		getRangeEnd() {
			return this.#selectedDates[1] || null;
		}
		isDateSelected(date, precision = 'day') {
			return this.#selectedDates.some(selectedDate => {
				return isDatesEqual(date, selectedDate, precision);
			});
		}
		setFocusDate(date, options = {}) {
			if (!isDateLike(date) && date !== null) {
				return;
			}
			this.#focusDate = date === null ? null : this.createDate(date);
			const {
				render,
				adjustViewDate,
				inputModality
			} = {
				render: true,
				adjustViewDate: true,
				inputModality: 'pointer',
				...options
			};
			this.setFocusInputModality(this.#focusDate === null ? null : inputModality);
			if (adjustViewDate && this.isDateOutOfView(this.#focusDate)) {
				this.setViewDate(createUtcDate(this.#focusDate.getUTCFullYear(), this.#focusDate.getUTCMonth()));
			}
			if (this.isRendered() && render) {
				this.getPicker().render();
			}
		}
		getFocusDate() {
			return this.#focusDate;
		}
		getInitialFocusDate(mode = 'datetime') {
			const focusDate = this.getFocusDate();
			if (focusDate !== null) {
				return focusDate;
			}
			if (mode === 'range-start') {
				const {
					year,
					month,
					day
				} = this.getViewDateParts();
				return this.getRangeStart() || createUtcDate(year, month, day);
			}
			if (mode === 'range-end') {
				const {
					year,
					month,
					day
				} = this.getViewDateParts();
				return this.getRangeEnd() || createUtcDate(year, month, day);
			}
			const selectedDates = this.getSelectedDates();
			if (main_core.Type.isArrayFilled(selectedDates)) {
				const date = selectedDates.find(selectedDate => {
					return !this.isDateOutOfView(selectedDate);
				});
				if (main_core.Type.isDate(date)) {
					return date;
				}
			}
			return this.getViewDate();
		}
		getFocusInputModality() {
			return this.#focusInputModality;
		}
		setFocusInputModality(modality) {
			this.#focusInputModality = modality;
		}
		isDateOutOfView(date) {
			if (date === null) {
				return false;
			}
			let isOutOfView = false;
			const {
				year: currentViewYear
			} = this.getViewDateParts();
			const {
				year: focusYear
			} = getDate(date);
			if (this.getCurrentView() === 'day') {
				const dayPicker = this.getPicker('day');
				const firstDay = dayPicker.getFirstDay();
				const lastDay = dayPicker.getLastDay();
				const focusDate = createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
				isOutOfView = focusDate < firstDay || focusDate >= lastDay;
			} else if (this.getCurrentView() === 'month') {
				isOutOfView = currentViewYear !== focusYear;
			} else if (this.getCurrentView() === 'year') {
				const yearPicker = this.getPicker('year');
				const firstYear = yearPicker.getFirstYear();
				const lastYear = yearPicker.getLastYear();
				isOutOfView = focusYear < firstYear || focusYear > lastYear;
			}
			return isOutOfView;
		}
		setCurrentView(view) {
			if (this.#currentView === view) {
				return;
			}
			const picker = this.getPicker(view);
			if (picker === null) {
				return;
			}
			main_core.Dom.style(this.getPicker()?.getContainer(), 'display', 'none');
			main_core.Dom.attr(this.getPicker()?.getContainer(), 'inert', true);
			this.getPicker()?.onHide();
			this.#currentView = view;
			this.setFocusDate(null, {
				render: false
			});
			if (!picker.isRendered()) {
				picker.renderTo(this.getViewsContainer());
			}
			main_core.Dom.style(picker.getContainer(), 'display', null);
			main_core.Dom.attr(picker.getContainer(), 'inert', null);
			picker.onShow();
			picker.render();
			this.focus();
		}
		getCurrentView() {
			return this.#currentView;
		}
		getPicker(pickerId) {
			const currentPickerId = main_core.Type.isStringFilled(pickerId) ? pickerId : this.#currentView;
			let view = this.#views.get(currentPickerId) || null;
			if (view === null) {
				view = this.#createPicker(currentPickerId);
				if (view !== null) {
					this.#views.set(currentPickerId, view);
				}
			}
			return view;
		}
		#setType(type) {
			if (['date', 'year', 'month', 'time'].includes(type)) {
				this.#type = type;
			}
		}
		getType() {
			return this.#type;
		}
		getFirstWeekDay() {
			return this.#firstWeekDay;
		}
		getNumberOfMonths() {
			return this.#numberOfMonths;
		}
		shouldShowWeekDays() {
			return this.#showWeekDays;
		}
		shouldShowWeekNumbers() {
			return this.#showWeekNumbers;
		}
		shouldShowOutsideDays() {
			return this.#showOutsideDays;
		}
		getWeekends() {
			return this.#weekends;
		}
		isWeekend(date) {
			return this.#weekends.includes(date.getUTCDay());
		}
		isHoliday(date) {
			return this.#holidays.some(([day, month]) => {
				return date.getUTCDate() === day && date.getUTCMonth() === month;
			});
		}
		isWorkday(date) {
			return this.#workdays.some(([day, month]) => {
				return date.getUTCDate() === day && date.getUTCMonth() === month;
			});
		}
		isDayOff(date) {
			return !this.isWorkday(date) && (this.isWeekend(date) || this.isHoliday(date));
		}
		isTimeEnabled() {
			return this.#enableTime;
		}
		setDefaultTime(time) {
			if (main_core.Type.isStringFilled(time) && /([01]{1,2}\d|2[0-3]):[0-5]\d(:[0-5]\d)?/.test(time)) {
				this.#defaultTime = time;
			}
		}
		getDefaultTime() {
			return this.#defaultTime;
		}
		setDefaultTimeSpan(minutes) {
			if (main_core.Type.isNumber(minutes) && minutes >= 0) {
				this.#defaultTimeSpan = minutes;
			}
		}
		getDefaultTimeSpan() {
			return this.#defaultTimeSpan;
		}
		getDefaultTimeParts() {
			const parts = this.getDefaultTime().split(':');
			return {
				hours: Number(parts[0] || 0),
				minutes: Number(parts[1] || 0),
				seconds: Number(parts[2] || 0)
			};
		}
		getTimePickerStyle() {
			return this.#timePickerStyle;
		}
		shouldCutZeroTime() {
			return this.#cutZeroTime;
		}
		shouldAllowSeconds() {
			return this.#allowSeconds;
		}
		setToggleSelected(flag) {
			if (main_core.Type.isBoolean(flag) || main_core.Type.isNull(flag)) {
				this.#toggleSelected = flag;
			}
		}
		shouldToggleSelected() {
			if (this.#toggleSelected !== null) {
				return this.#toggleSelected;
			}
			return this.isMultipleMode();
		}
		setMaxDays(days) {
			if (main_core.Type.isNumber(days) && days > 0) {
				this.#maxDays = days;
			}
		}
		getMaxDays() {
			return this.#maxDays;
		}
		setMinDays(days) {
			if (main_core.Type.isNumber(days) && days > 0) {
				this.#minDays = days;
			}
		}
		getMinDays() {
			return this.#minDays;
		}
		setMinDate(date) {
			if (date === null || main_core.Type.isUndefined(date)) {
				this.#minDate = null;
			} else if (isDateLike(date)) {
				this.#minDate = this.createDate(date);
			}
			if (this.isRendered()) {
				this.getPicker()?.render();
			}
		}
		getMinDate() {
			return this.#minDate;
		}
		setMaxDate(date) {
			if (date === null || main_core.Type.isUndefined(date)) {
				this.#maxDate = null;
			} else if (isDateLike(date)) {
				this.#maxDate = this.createDate(date);
			}
			if (this.isRendered()) {
				this.getPicker()?.render();
			}
		}
		getMaxDate() {
			return this.#maxDate;
		}
		setRestrictNavigation(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#restrictNavigation = flag;
				if (this.isRendered()) {
					this.getPicker()?.render();
				}
			}
		}
		isNavigationRestricted() {
			return this.#restrictNavigation;
		}
		isDateAllowed(date, precision = 'datetime') {
			if (this.#minDate === null && this.#maxDate === null && this.#disabledDateMatchers.length === 0) {
				return true;
			}
			const toComparable = d => {
				switch (precision) {
					case 'year':
						return d.getUTCFullYear();
					case 'month':
						return d.getUTCFullYear() * 12 + d.getUTCMonth();
					case 'day':
						return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
					default:
						return d.getTime();
				}
			};
			const ref = toComparable(date);
			if (this.#minDate !== null && ref < toComparable(this.#minDate)) {
				return false;
			}
			if (this.#maxDate !== null && ref > toComparable(this.#maxDate)) {
				return false;
			}
			if ((precision === 'day' || precision === 'datetime') && this.isDateDisabled(date)) {
				return false;
			}
			return true;
		}
		canNavigate(view, direction) {
			if (!this.#restrictNavigation) {
				return true;
			}
			const bound = direction === 'prev' ? this.#minDate : this.#maxDate;
			if (bound === null) {
				return true;
			}
			if (view === 'day') {
				const {
					year,
					month
				} = this.getViewDateParts();
				const numberOfMonths = this.getNumberOfMonths();
				const firstDay = createUtcDate(year, month, 1);
				const lastDay = addDate(createUtcDate(year, month + numberOfMonths, 1), 'day', -1);
				const checkDate = direction === 'prev' ? addDate(firstDay, 'day', -1) : addDate(lastDay, 'day', 1);
				return this.isDateAllowed(checkDate, 'day');
			}
			if (view === 'month') {
				const viewYear = this.getViewDate().getUTCFullYear();
				return direction === 'prev' ? bound.getUTCFullYear() < viewYear : bound.getUTCFullYear() > viewYear;
			}
			if (view === 'year') {
				const yearPicker = this.getPicker('year');
				if (yearPicker === null) {
					return true;
				}
				return direction === 'prev' ? bound.getUTCFullYear() < yearPicker.getFirstYear() : bound.getUTCFullYear() > yearPicker.getLastYear();
			}
			return true;
		}
		isFullYear() {
			return this.#fullYear;
		}
		isAmPmMode() {
			return this.#amPmMode;
		}
		getMinuteStep() {
			return this.#minuteStep;
		}
		getMinuteStepByDate(date) {
			let step = this.getMinuteStep();
			if (!main_core.Type.isDate(date)) {
				return step;
			}
			const selectedMinute = date.getUTCMinutes();
			if (selectedMinute > 0 && selectedMinute % step !== 0) {
				// Reduce a step to show a selected minute
				const availableSteps = [30, 15, 10, 5, 1];
				const index = availableSteps.indexOf(selectedMinute);
				const steps = index === -1 ? [1] : availableSteps.slice(index);
				for (const newStep of steps) {
					if (selectedMinute % newStep === 0) {
						step = newStep;
						break;
					}
				}
			}
			return step;
		}
		getToday() {
			return this.createDate(new Date());
		}
		show() {
			this.updateFromInputFields();
			if (this.isInline()) {
				if (!this.isRendered()) {
					this.#render();
				}

				// Dom.removeClass(this.getContainer(), '--hidden');
			} else {
				this.getPopup().show();
			}
		}
		hide() {
			if (!this.isRendered() || this.isInline()) {
				return;
			}

			// if (this.isInline())
			// {
			// Dom.addClass(this.getContainer(), '--hidden');
			// }

			this.getPopup().close();
		}
		isOpen() {
			return this.#popup !== null && this.#popup.isShown();
		}
		adjustPosition() {
			if (this.isRendered() && this.isOpen()) {
				this.getPopup().adjustPosition();
			}
		}
		toggle() {
			if (this.isOpen()) {
				this.hide();
			} else {
				this.show();
			}
		}
		focus() {
			if (this.isRendered()) {
				const rootContainer = this.getRootContainer();
				const [, next = null] = getFocusableBoundaryElements(rootContainer, element => element.dataset.tabPriority === 'true');
				if (next === null) {
					this.getRootContainer().focus({
						preventScroll: true
					});
				} else {
					next.focus({
						preventScroll: true,
						focusVisible: true
					});
					this.#keyboardNavigation.setLastFocusElement(next);
				}
			}
		}
		setSingleOpening(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#singleOpening = flag;
			}
		}
		isSingleOpening() {
			return this.#singleOpening;
		}
		setDayColors(options) {
			if (!main_core.Type.isArray(options)) {
				return;
			}
			const dayColors = [];
			for (const option of options) {
				if (!main_core.Type.isStringFilled(option.bgColor) && !main_core.Type.isStringFilled(option.textColor)) {
					continue;
				}
				const matchers = this.#createDateMatchers(option.matcher);
				if (main_core.Type.isArrayFilled(matchers)) {
					dayColors.push({
						bgColor: main_core.Type.isStringFilled(option.bgColor) ? option.bgColor : null,
						textColor: main_core.Type.isStringFilled(option.textColor) ? option.textColor : null,
						matchers
					});
				}
			}
			this.#dayColors = dayColors;
			if (this.isRendered()) {
				this.getPicker().render();
			}
		}
		getDayColor(day) {
			return this.#dayColors.find(dayColor => isDateMatch(day, dayColor.matchers)) || null;
		}
		setDayMarks(options) {
			if (!main_core.Type.isArray(options)) {
				return;
			}
			const dayMarks = [];
			for (const option of options) {
				if (!main_core.Type.isStringFilled(option.bgColor)) {
					continue;
				}
				const matchers = this.#createDateMatchers(option.matcher);
				if (main_core.Type.isArrayFilled(matchers)) {
					dayMarks.push({
						bgColor: option.bgColor,
						matchers
					});
				}
			}
			this.#dayMarks = dayMarks;
			if (this.isRendered()) {
				this.getPicker().render();
			}
		}
		getDayMarks(day) {
			return this.#dayMarks.filter(dayMark => isDateMatch(day, dayMark.matchers));
		}
		setDisabledDates(matcher) {
			if (main_core.Type.isUndefined(matcher) || matcher === null) {
				this.#disabledDateMatchers = [];
			} else {
				this.#disabledDateMatchers = this.#createDateMatchers(matcher);
			}
			if (this.isRendered()) {
				this.getPicker()?.render();
				this.#refreshPresetsActive();
			}
		}
		getDisabledDates() {
			return this.#disabledDateMatchers;
		}
		isDateDisabled(date) {
			if (this.#disabledDateMatchers.length === 0) {
				return false;
			}
			return isDateMatch(date, this.#disabledDateMatchers);
		}
		setPresets(presets) {
			if (!main_core.Type.isArray(presets)) {
				return;
			}
			this.#presets = presets.filter(preset => {
				return main_core.Type.isPlainObject(preset) && main_core.Type.isStringFilled(preset.label) && !main_core.Type.isUndefined(preset.value);
			});
			if (!this.isRendered()) {
				return;
			}
			const body = this.#refs.get('body');
			if (this.#shouldRenderPresets()) {
				const fresh = this.#createPresetsContainer();
				if (this.#presetsContainer !== null) {
					main_core.Dom.replace(this.#presetsContainer, fresh);
				} else if (body) {
					main_core.Dom.append(fresh, body);
				}
				this.#presetsContainer = fresh;
				this.#presetsFocusZone?.activate();
			} else if (this.#presetsContainer !== null) {
				this.#destroyPresetsFocusZone();
				main_core.Dom.remove(this.#presetsContainer);
				this.#presetsContainer = null;
			}
		}
		getPresets() {
			return this.#presets;
		}
		#shouldRenderPresets() {
			return this.#presets.length > 0 && this.#selectionMode !== 'none' && this.getType() === 'date';
		}
		#createPresetsContainer() {
			const container = main_core.Tag.render`
			<div
				class="ui-date-picker-presets"
				role="listbox"
				aria-label="${main_core.Loc.getMessage('UI_DATE_PICKER_PRESETS_LABEL')}"
			></div>
		`;
			this.#presets.forEach((preset, index) => {
				const button = this.#renderPreset(preset, index);
				if (button !== null) {
					main_core.Dom.append(button, container);
				}
			});
			this.#destroyPresetsFocusZone();
			this.#presetsFocusZone = new ui_a11y.FocusZone(container, {
				focusOutBehavior: 'wrap'
			});
			return container;
		}
		#destroyPresetsFocusZone() {
			if (this.#presetsFocusZone !== null) {
				this.#presetsFocusZone.deactivate();
				this.#presetsFocusZone = null;
			}
		}
		#renderPreset(preset, index) {
			const dates = this.#resolvePresetValue(preset);
			const disabled = !this.#isPresetAllowed(preset, dates);
			const isActive = !disabled && this.#isPresetActive(preset, dates);
			const subtitle = this.#getPresetSubtitle(preset, dates);
			const classes = ['ui-date-picker-preset'];
			if (isActive) {
				classes.push('--active');
			}
			if (disabled) {
				classes.push('--disabled');
			}
			const subtitleNode = subtitle === null ? '' : main_core.Tag.render`<span class="ui-date-picker-preset-subtitle">${subtitle}</span>`;
			const button = main_core.Tag.render`
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
		#isPresetAllowed(preset, resolvedDates = null) {
			if (this.#minDate === null && this.#maxDate === null) {
				return true;
			}
			const dates = resolvedDates === null ? this.#resolvePresetValue(preset) : resolvedDates;
			if (dates === null) {
				return true;
			}
			return dates.every(date => this.isDateAllowed(date));
		}
		#resolvePresetValue(preset) {
			return resolvePresetValue(preset, this.#selectionMode, this.getDateFormat());
		}
		#isPresetActive(preset, resolvedDates = null) {
			const dates = resolvedDates === null ? this.#resolvePresetValue(preset) : resolvedDates;
			if (dates === null) {
				return false;
			}
			const precision = this.isTimeEnabled() || this.getType() === 'time' ? 'datetime' : 'day';
			if (this.isSingleMode()) {
				const selected = this.getSelectedDate();
				return selected !== null && isDatesEqual(dates[0], selected, precision);
			}
			if (this.isRangeMode()) {
				const rangeStart = this.getRangeStart();
				const rangeEnd = this.getRangeEnd();
				return rangeStart !== null && rangeEnd !== null && isDatesEqual(dates[0], rangeStart, precision) && isDatesEqual(dates[1], rangeEnd, precision);
			}
			if (this.isMultipleMode()) {
				const selected = this.getSelectedDates();
				if (selected.length !== dates.length) {
					return false;
				}
				return dates.every(presetDate => {
					return selected.some(selectedDate => {
						return isDatesEqual(presetDate, selectedDate, precision);
					});
				});
			}
			return false;
		}
		#getPresetSubtitle(preset, dates) {
			return getPresetSubtitle(preset, dates, resolved => this.#buildAutoSubtitle(resolved));
		}
		#buildAutoSubtitle(dates) {
			const withTime = this.isTimeEnabled();
			const timeFormat = this.getTimeFormat();
			const formatBy = (date, format) => {
				return main_date.DateTimeFormat.format(format, date, null, true);
			};
			const formatTime = date => formatBy(date, timeFormat);
			const formatDate = (date, formatName) => {
				const datePart = formatBy(date, main_date.DateTimeFormat.getFormat(formatName));
				return withTime ? `${datePart} ${formatTime(date)}` : datePart;
			};
			if (this.isRangeMode()) {
				const [start, end] = dates;
				const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
				if (withTime && isDatesEqual(start, end, 'day')) {
					return `${formatDate(start, 'SHORT_DAY_OF_WEEK_SHORT_MONTH_FORMAT')} – ${formatTime(end)}`;
				}
				let formatName = null;
				if (withTime) {
					formatName = sameYear ? 'SHORT_DAY_OF_WEEK_SHORT_MONTH_FORMAT' : 'MEDIUM_DATE_FORMAT';
				} else {
					formatName = sameYear ? 'DAY_MONTH_FORMAT' : 'MEDIUM_DATE_FORMAT';
				}
				return `${formatDate(start, formatName)} – ${formatDate(end, formatName)}`;
			}
			if (this.isMultipleMode()) {
				if (dates.length === 1) {
					return formatDate(dates[0], 'DAY_OF_WEEK_MONTH_FORMAT');
				}
				if (dates.length === 2) {
					return `${formatDate(dates[0], 'DAY_MONTH_FORMAT')}, ${formatDate(dates[1], 'DAY_MONTH_FORMAT')}`;
				}
				return null;
			}
			return formatDate(dates[0], 'DAY_OF_WEEK_MONTH_FORMAT');
		}
		#handlePresetClick(preset) {
			const dates = this.#resolvePresetValue(preset);
			if (dates === null || !this.#isPresetAllowed(preset, dates)) {
				return;
			}
			if (this.isSingleMode()) {
				this.selectDate(dates[0]);
			} else if (this.isRangeMode()) {
				this.selectRange(dates[0], dates[1]);
			} else if (this.isMultipleMode()) {
				this.deselectAll({
					emitEvents: false
				});
				this.selectDates(dates);
			}
			this.emit(DatePickerEvent.PRESET_SELECT, {
				preset,
				dates
			});
			if (this.shouldHideOnSelect()) {
				this.hide();
			}
		}
		#handlePresetMouseEnter(preset) {
			if (!this.isSingleMode()) {
				return;
			}
			const dates = this.#resolvePresetValue(preset);
			if (dates === null || !this.#isPresetAllowed(preset, dates)) {
				return;
			}
			const dayPicker = this.getPicker('day');
			dayPicker?.clearMouseOutTimeout();
			this.setFocusDate(dates[0]);
		}
		#handlePresetMouseLeave() {
			this.setFocusDate(null);
		}
		#refreshPresetsActive() {
			if (this.#presetsContainer === null) {
				return;
			}
			const buttons = this.#presetsContainer.querySelectorAll('.ui-date-picker-preset');
			this.#presets.forEach((preset, index) => {
				const button = buttons[index];
				if (!button) {
					return;
				}
				const dates = this.#resolvePresetValue(preset);
				const disabled = !this.#isPresetAllowed(preset, dates);
				const isActive = !disabled && this.#isPresetActive(preset, dates);
				button.disabled = disabled;
				if (disabled) {
					main_core.Dom.addClass(button, '--disabled');
				} else {
					main_core.Dom.removeClass(button, '--disabled');
				}
				if (isActive) {
					main_core.Dom.addClass(button, '--active');
				} else {
					main_core.Dom.removeClass(button, '--active');
				}
				button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
			});
		}
		#createDateMatchers(matcher) {
			if (main_core.Type.isUndefined(matcher)) {
				return [];
			}
			const result = [];
			const matchers = main_core.Type.isArray(matcher) ? [...matcher] : [matcher];
			matchers.forEach(matcherValue => {
				if (main_core.Type.isArray(matcherValue)) {
					const dates = [];
					matcherValue.forEach(dateLike => {
						if (!isDateLike(dateLike)) {
							return;
						}
						const date = this.createDate(dateLike);
						if (date !== null) {
							dates.push(date);
						}
					});
					result.push(dates);
				} else if (isDateLike(matcherValue)) {
					const date = this.createDate(matcherValue);
					if (date !== null) {
						result.push(date);
					}
				} else if (main_core.Type.isBoolean(matcherValue) || main_core.Type.isFunction(matcherValue)) {
					result.push(matcherValue);
				} else if (main_core.Type.isPlainObject(matcherValue)) {
					const converted = this.#convertExtraMatcher(matcherValue);
					if (converted !== null) {
						result.push(converted);
					}
				}
			});
			return result;
		}
		#convertExtraMatcher(matcher) {
			if (main_core.Type.isArray(matcher.dayOfWeek)) {
				return {
					dayOfWeek: matcher.dayOfWeek
				};
			}
			if (main_core.Type.isArray(matcher.dayOfMonth)) {
				return {
					dayOfMonth: matcher.dayOfMonth
				};
			}
			const converted = {};
			for (const key of ['from', 'to', 'before', 'after']) {
				if (!(key in matcher) || main_core.Type.isUndefined(matcher[key]) || main_core.Type.isNull(matcher[key])) {
					continue;
				}
				const date = this.createDate(matcher[key]);
				if (date === null) {
					return null;
				}
				converted[key] = date;
			}
			return Object.keys(converted).length > 0 ? converted : null;
		}
		getPopup() {
			if (this.#popup !== null) {
				return this.#popup;
			}
			const popupOptions = {
				...this.#popupOptions
			};
			const userEvents = popupOptions.events;
			delete popupOptions.events;
			const defaultAriaLabel = this.getTitle();
			const ariaLabel = main_core.Type.isStringFilled(popupOptions.ariaLabel) || main_core.Type.isStringFilled(popupOptions.title) ? popupOptions.ariaLabel : defaultAriaLabel;
			delete popupOptions.ariaLabel;
			this.#popup = new main_popup.Popup({
				contentPadding: 0,
				padding: 0,
				offsetTop: 5,
				bindElement: this.getTargetNode(),
				bindOptions: {
					forceBindPosition: true
				},
				autoHide: this.isAutoHide(),
				closeByEsc: this.shouldHideByEsc(),
				cacheable: this.isCacheable(),
				content: this.getContainer(),
				ariaLabel,
				focusTrap: {
					initialFocus: false
				},
				autoHideHandler: this.#handleAutoHide.bind(this),
				events: {
					onFirstShow: this.#handlePopupFirstShow.bind(this),
					onShow: this.#handlePopupShow.bind(this),
					onClose: this.#handlePopupClose.bind(this),
					onDestroy: this.#handlePopupDestroy.bind(this)
				},
				...popupOptions
			});
			this.#popup.subscribeFromOptions(userEvents);
			return this.#popup;
		}
		#setSelectionMode(mode) {
			if (this.getType() !== 'date') {
				this.#selectionMode = 'single';
			} else if (['single', 'multiple', 'range', 'none'].includes(mode)) {
				this.#selectionMode = mode;
			}
		}
		setHideOnSelect(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#hideOnSelect = flag;
			}
		}
		shouldHideOnSelect() {
			if (this.isInline()) {
				return false;
			}
			return this.#hideOnSelect;
		}
		setDateSeparator(separator) {
			if (main_core.Type.isStringFilled(separator)) {
				this.#dateSeparator = separator;
			}
		}
		getDateSeparator() {
			return this.#dateSeparator;
		}
		setInputField(field) {
			const input = this.#getInputField(field);
			if (input !== null) {
				this.#inputField = input;
				this.#bindInputEvents(input);
				this.#applyInputAriaAttributes(input);
			}
		}
		setRangeStartInput(field) {
			const input = this.#getInputField(field);
			if (input !== null) {
				this.#rangeStartInput = input;
				this.#bindInputEvents(input);
				this.#applyInputAriaAttributes(input);
			}
		}
		setRangeEndInput(field) {
			const input = this.#getInputField(field);
			if (input !== null) {
				this.#rangeEndInput = input;
				this.#bindInputEvents(input);
				this.#applyInputAriaAttributes(input);
			}
		}
		#applyInputAriaAttributes(input) {
			if (this.isInline()) {
				return;
			}
			input.setAttribute('aria-haspopup', 'dialog');
			input.setAttribute('aria-expanded', this.isOpen() ? 'true' : 'false');
		}
		#syncInputsAriaExpanded(open) {
			const expanded = open ? 'true' : 'false';
			[this.#inputField, this.#rangeStartInput, this.#rangeEndInput].forEach(input => {
				if (input !== null && input.hasAttribute('aria-haspopup')) {
					input.setAttribute('aria-expanded', expanded);
				}
			});
		}
		#getInputField(field) {
			if (main_core.Type.isStringFilled(field)) {
				const element = document.querySelector(field);
				if (main_core.Type.isElementNode(element) || element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
					return element;
				}
				console.error(`Date Picker: a form element was not found (${field}).`);
			} else if (main_core.Type.isElementNode(field) && (field.nodeName === 'INPUT' || field.nodeName === 'TEXTAREA')) {
				return field;
			}
			return null;
		}
		#bindInputEvents(input) {
			if (!this.shouldUseInputEvents()) {
				return;
			}
			main_core.Event.bind(input, 'click', this.#refs.remember('click-handler', () => {
				return this.#handleInputClick.bind(this);
			}));
			main_core.Event.bind(input, 'focusout', this.#refs.remember('focusout-handler', () => {
				return this.#handleInputFocusOut.bind(this);
			}));
			main_core.Event.bind(input, 'keydown', this.#refs.remember('keydown-handler', () => {
				return this.#handleInputKeyDown.bind(this);
			}));
			main_core.Event.bind(input, 'input', this.#refs.remember('change-handler', () => {
				return this.#handleInputChange.bind(this);
			}));
		}
		#unbindInputEvents(input) {
			main_core.Event.unbind(input, 'click', this.#refs.get('click-handler'));
			main_core.Event.unbind(input, 'focusout', this.#refs.get('focusout-handler'));
			main_core.Event.unbind(input, 'keydown', this.#refs.get('keydown-handler'));
			main_core.Event.unbind(input, 'input', this.#refs.get('change-handler'));
		}
		#handleInputClick(event) {
			if (this.isRangeMode()) {
				this.setTargetNode(event.target);
				if (!this.isOpen()) {
					this.show();
				}
			} else {
				this.show();
			}
		}
		#handleInputFocusOut(event) {
			if (!this.getRootContainer().contains(event.relatedTarget)) {
				this.hide();
			}
		}
		#handleInputKeyDown(event) {
			if (event.key === 'Tab' && !event.shiftKey && this.isOpen()) {
				event.preventDefault();
				this.focus();
			}
		}
		#handleInputChange(event) {
			if (this.isOpen()) {
				this.updateFromInputFields();
			}
		}
		#handleAutoHide(event) {
			const target = event.target;
			const el = this.getPopup().getPopupContainer();
			if (target === el || el.contains(target)) {
				return false;
			}
			if (this.isRangeMode()) {
				const anotherInput = (this.getRangeStartInput() === target || this.getRangeEndInput() === target) && this.getTargetNode() !== target;
				return !anotherInput;
			}
			return true;
		}
		shouldUseInputEvents() {
			return this.#useInputEvents;
		}
		getInputField() {
			return this.#inputField;
		}
		getRangeStartInput() {
			return this.#rangeStartInput;
		}
		getRangeEndInput() {
			return this.#rangeEndInput;
		}
		updateInputFields() {
			if (this.isSingleMode()) {
				if (this.getType() === 'time') {
					this.#setInputDate(this.getInputField(), this.getSelectedDate(), this.getTimeFormat());
				} else {
					this.#setInputDate(this.getInputField(), this.getSelectedDate());
				}
			} else if (this.isMultipleMode()) {
				this.#setInputDate(this.getInputField(), this.getSelectedDates().map(date => this.formatDate(date)).join(this.getDateSeparator()));
			} else if (this.isRangeMode()) {
				this.#setInputDate(this.getRangeStartInput(), this.getRangeStart());
				this.#setInputDate(this.getRangeEndInput(), this.getRangeEnd());
			}
		}
		#focusInputField() {
			if (this.getInputField() !== null) {
				this.getInputField().focus({
					preventScroll: true
				});
			} else if (this.getRangeStartInput() !== null) {
				this.getRangeStartInput().focus({
					preventScroll: true
				});
			}
		}
		updateFromInputFields() {
			if (this.isSingleMode() && this.getInputField() !== null) {
				const inputDate = this.#getDateFromInput(this.getInputField());
				if (inputDate === null) {
					this.deselectAll({
						updateInputs: false,
						emitEvents: false
					});
				} else {
					this.selectDate(inputDate, {
						updateInputs: false,
						emitEvents: false
					});
				}
			} else if (this.isMultipleMode() && this.getInputField() !== null) {
				const value = this.getInputField().value.trim();
				const inputDates = value.split(this.getDateSeparator().trim()).map(part => this.createDate(part.trim())).filter(date => date !== null);
				this.deselectAll({
					updateInputs: false,
					emitEvents: false
				});
				this.selectDates(inputDates, {
					updateInputs: false,
					emitEvents: false
				});
			} else if (this.isRangeMode() && this.getRangeStartInput() !== null) {
				const rangeStart = this.#getDateFromInput(this.getRangeStartInput());
				const rangeEnd = this.#getDateFromInput(this.getRangeEndInput());
				if (rangeStart === null) {
					this.deselectAll({
						updateInputs: false,
						emitEvents: false
					});
				} else {
					this.selectRange(rangeStart, rangeEnd, {
						updateInputs: false,
						emitEvents: false
					});
				}
			}
		}
		#getDateFromInput(input) {
			if (input === null) {
				return null;
			}
			const value = input.value.trim();
			if (!main_core.Type.isStringFilled(value)) {
				return null;
			}
			if (this.getType() === 'time') {
				return createDate(value, this.getTimeFormat());
			}
			return this.createDate(value);
		}
		#setInputDate(input, date, format = null) {
			if (input !== null) {
				let value = '';
				if (date === null) {
					value = '';
				} else if (main_core.Type.isString(date)) {
					value = date;
				} else {
					value = this.formatDate(date, format);
				}

				// eslint-disable-next-line no-param-reassign
				input.value = value;
			}
		}
		getLocale() {
			return this.#locale;
		}
		isRendered() {
			return this.#rendered;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				const classes = ['ui-date-picker'];
				if (this.isInline()) {
					classes.push('--inline');
				}
				if (this.shouldHideHeader()) {
					classes.push('--hide-header');
				}
				classes.push(`--${this.getType()}-picker`);
				const container = main_core.Tag.render`
				<div
					id="${this.getContainerId()}"
					tabindex="-1"
					onkeyup="${this.#handleContainerKeyUp.bind(this)}"
					class="${classes.join(' ')}"
				>
					${this.getBodyContainer()}
				</div>
			`;
				if (this.isInline()) {
					container.setAttribute('role', 'group');
					container.setAttribute('aria-label', this.getTitle());
				}
				return container;
			});
		}
		getRootContainer() {
			return this.isInline() ? this.getContainer() : this.getPopup().getPopupContainer();
		}
		getTitle() {
			if (this.getType() === 'time') {
				return main_core.Loc.getMessage('UI_DATE_PICKER_TIME_VIEW_LABEL');
			}
			if (this.getType() === 'month') {
				return main_core.Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL');
			}
			if (this.getType() === 'year') {
				return main_core.Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL');
			}
			return main_core.Loc.getMessage('UI_DATE_PICKER_DIALOG_LABEL');
		}
		getContainerId() {
			return `ui-date-picker-${this.#id}`;
		}
		getBodyContainer() {
			return this.#refs.remember('body', () => {
				const body = main_core.Tag.render`<div class="ui-date-picker-body" role="none">${this.getViewsContainer()}</div>`;
				if (this.#shouldRenderPresets()) {
					this.#presetsContainer = this.#createPresetsContainer();
					main_core.Dom.append(this.#presetsContainer, body);
				}
				return body;
			});
		}
		getViewsContainer() {
			return this.#refs.remember('views', () => {
				return main_core.Tag.render`<div role="none" class="ui-date-picker-views" id="${this.getContainerId()}-views"></div>`;
			});
		}
		getViewsContainerId() {
			return this.getViewsContainer().id;
		}
		isMultipleMode() {
			return this.#selectionMode === 'multiple';
		}
		isSingleMode() {
			return this.#selectionMode === 'single';
		}
		isRangeMode() {
			return this.#selectionMode === 'range';
		}
		isInline() {
			return this.#inline;
		}
		isFocused() {
			const rootContainer = this.getRootContainer();
			const activeElement = rootContainer.ownerDocument.activeElement;
			return rootContainer.contains(activeElement) || rootContainer === activeElement;
		}
		setAutoFocus(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#autoFocus = flag;
			}
		}
		isAutoFocus() {
			return this.#autoFocus;
		}
		setTargetNode(node) {
			if (!main_core.Type.isDomNode(node) && !main_core.Type.isNull(node) && !main_core.Type.isObject(node)) {
				return;
			}
			this.#targetNode = node;
			if (this.isRendered()) {
				this.getPopup().setBindElement(this.#targetNode);
				this.getPopup().adjustPosition();
			}
		}
		getTargetNode() {
			return this.#targetNode;
		}
		setAutoHide(enable) {
			if (main_core.Type.isBoolean(enable)) {
				this.#autoHide = enable;
				if (this.isRendered()) {
					this.getPopup().setAutoHide(enable);
				}
			}
		}
		isAutoHide() {
			return this.#autoHide;
		}
		setHideByEsc(enable) {
			if (main_core.Type.isBoolean(enable)) {
				this.#hideByEsc = enable;
				if (this.isRendered()) {
					this.getPopup().setClosingByEsc(enable);
				}
			}
		}
		shouldHideByEsc() {
			return this.#hideByEsc;
		}
		isCacheable() {
			return this.#cacheable;
		}
		setCacheable(cacheable) {
			if (main_core.Type.isBoolean(cacheable)) {
				this.#cacheable = cacheable;
				if (this.isRendered()) {
					this.getPopup().setCacheable(cacheable);
				}
			}
		}
		setHideHeader(enable) {
			if (main_core.Type.isBoolean(enable)) {
				this.#hideHeader = enable;
				if (this.isRendered()) {
					if (enable) {
						main_core.Dom.addClass(this.getContainer(), '--hide-header');
					} else {
						main_core.Dom.removeClass(this.getContainer(), '--hide-header');
					}
				}
			}
		}
		shouldHideHeader() {
			return this.#hideHeader;
		}
		createDate(date) {
			return createDate(date, this.getDateFormat());
		}
		formatDate(date, format = null) {
			const midnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
			const dateFormat = format === null ? this.getDateFormat() : format;
			let result = main_date.DateTimeFormat.format(dateFormat, date, null, true);
			if (this.isTimeEnabled() && midnight && this.shouldCutZeroTime()) {
				result = result.replaceAll(/\s*12:00:00 am\s*/gi, '').replaceAll(/\s*12:00 am\s*/gi, '').replaceAll(/\s*00:00:00\s*/g, '').replaceAll(/\s*00:00\s*/g, '');
			}
			return result;
		}
		formatTime(date, format = null) {
			return main_date.DateTimeFormat.format(format === null ? this.getTimeFormat() : format, date, null, true);
		}
		getDateFormat() {
			return this.#dateFormat;
		}
		#getDefaultDateFormat() {
			if (this.getType() === 'year') {
				return 'Y';
			}
			if (this.getType() === 'month') {
				return 'f - Y';
			}
			if (this.isTimeEnabled()) {
				if (this.shouldAllowSeconds()) {
					return main_date.DateTimeFormat.getFormat('FORMAT_DATETIME');
				}
				return main_date.DateTimeFormat.getFormat('FORMAT_DATETIME').replace(/:s/i, '');
			}
			return main_date.DateTimeFormat.getFormat('FORMAT_DATE');
		}
		getTimeFormat() {
			return this.#timeFormat;
		}
		#render() {
			if (this.isRendered()) {
				return;
			}
			if (this.isInline() && this.getTargetNode() !== null) {
				main_core.Dom.append(this.getContainer(), this.getTargetNode());
			}
			const views = ['day', 'month', 'year', 'time'];
			const index = views.indexOf(this.getType());
			const view = index === -1 ? 'day' : views[index];
			this.setCurrentView(view);
			this.#rendered = true;
			if (this.#keyboardNavigation !== null) {
				this.#keyboardNavigation.init();
			}
			this.#presetsFocusZone?.activate();
		}
		#createPicker(pickerId) {
			if (pickerId === 'day') {
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
			if (pickerId === 'month') {
				const monthPicker = new MonthPicker(this);
				monthPicker.subscribe('onSelect', this.#handleMonthSelect.bind(this));
				monthPicker.subscribe('onFocus', this.#handleMonthFocus.bind(this));
				monthPicker.subscribe('onBlur', this.#handleMonthBlur.bind(this));
				monthPicker.subscribe('onPrevBtnClick', () => {
					const {
						year,
						month
					} = getDate(this.getViewDate());
					const viewDate = createUtcDate(year - 1, month, 1);
					this.setViewDate(viewDate);
				});
				monthPicker.subscribe('onNextBtnClick', () => {
					const {
						year,
						month
					} = getDate(this.getViewDate());
					const viewDate = createUtcDate(year + 1, month, 1);
					this.setViewDate(viewDate);
				});
				monthPicker.subscribe('onTitleClick', () => this.setCurrentView('year'));
				return monthPicker;
			}
			if (pickerId === 'year') {
				const yearPicker = new YearPicker(this);
				yearPicker.subscribe('onSelect', this.#handleYearSelect.bind(this));
				yearPicker.subscribe('onFocus', this.#handleYearFocus.bind(this));
				yearPicker.subscribe('onBlur', this.#handleYearBlur.bind(this));
				yearPicker.subscribe('onPrevBtnClick', () => {
					const {
						year
					} = getDate(this.getViewDate());
					const viewDate = createUtcDate(year - 12, 0, 1);
					this.setViewDate(viewDate);
				});
				yearPicker.subscribe('onNextBtnClick', () => {
					const {
						year
					} = getDate(this.getViewDate());
					const viewDate = createUtcDate(year + 12, 0, 1);
					this.setViewDate(viewDate);
				});
				return yearPicker;
			}
			if (pickerId === 'time') {
				const timePicker = this.getTimePickerStyle() === 'wheel' ? new TimePickerWheel(this) : new TimePickerGrid(this);
				if (this.isRangeMode()) {
					timePicker.subscribe('onSelect', this.#handleTimeRangeSelect.bind(this));
				} else {
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
		#handleContainerKeyUp(event) {
			if (this.isInline()) {
				return;
			}
			if (event.key === 'Escape' && this.shouldHideByEsc()) {
				this.hide();
			}
		}
		#handleTimeClick(mode) {
			const timePicker = this.getPicker('time');
			const selectTime = mode === 'range-start' && this.getRangeStart() !== null || mode === 'range-end' && this.getRangeEnd() !== null || this.getSelectedDate() !== null;
			if (selectTime) {
				timePicker.setMode(mode);
				this.setCurrentView('time');
			}
		}
		#handleDaySelect(event) {
			const {
				year,
				month,
				day
			} = event.getData();
			let selectedDate = createUtcDate(year, month, day);
			const dayEvent = new main_core_events.BaseEvent({
				data: {
					date: selectedDate
				}
			});
			this.emit(DatePickerEvent.BEFORE_DAY_SELECT, dayEvent);
			if (dayEvent.isDefaultPrevented()) {
				return;
			}
			if (this.isRangeMode()) {
				const currentRange = this.#selectedDates;
				if (currentRange.length === 0) {
					const {
						hours,
						minutes,
						seconds
					} = this.getDefaultTimeParts();
					selectedDate = setTime(selectedDate, hours, minutes, seconds);
				} else if (currentRange.length === 1) {
					let {
						hours,
						minutes,
						seconds
					} = this.getDefaultTimeParts();
					if (this.isDateSelected(selectedDate, 'day')) {
						({
							hours,
							minutes,
							seconds
						} = getDate(this.getRangeStart()));
						minutes += this.getDefaultTimeSpan();
					}
					selectedDate = setTime(selectedDate, hours, minutes, seconds);
				}
				const range = addToRange(selectedDate, currentRange);
				const [start, end] = range;
				if (range.length === 0) {
					this.deselectAll();
				} else {
					this.selectRange(start, end);
				}
			} else if (this.isDateSelected(selectedDate)) {
				if (this.shouldToggleSelected()) {
					this.deselectDate(selectedDate);
				} else if (this.shouldHideOnSelect() && this.isSingleMode()) {
					this.hide();
				}
			} else {
				let {
					hours,
					minutes,
					seconds
				} = this.getDefaultTimeParts();
				if (this.isSingleMode() && this.getSelectedDate() !== null) {
					// save previous time
					({
						hours,
						minutes,
						seconds
					} = getDate(this.getSelectedDate()));
				}
				this.selectDate(createUtcDate(year, month, day, hours, minutes, seconds));
				if (this.shouldHideOnSelect() && this.isSingleMode() && !this.isTimeEnabled()) {
					this.hide();
				}
			}
		}
		#handleDayFocus(event) {
			const {
				year,
				month,
				day
			} = event.getData();
			const focusDate = createUtcDate(year, month, day);
			if (!isDatesEqual(focusDate, this.getFocusDate())) {
				this.setFocusDate(focusDate);
			}
		}
		#handleDayBlur(event) {
			this.setFocusDate(null);
		}
		#handleMonthFocus(event) {
			const {
				year,
				month
			} = event.getData();
			const focusDate = createUtcDate(year, month);
			if (!isDatesEqual(focusDate, this.getFocusDate(), 'month')) {
				this.setFocusDate(focusDate);
			}
		}
		#handleMonthBlur(event) {
			this.setFocusDate(null);
		}
		#handleYearFocus(event) {
			const {
				year
			} = event.getData();
			const focusDate = createUtcDate(year);
			if (!isDatesEqual(focusDate, this.getFocusDate(), 'year')) {
				this.setFocusDate(focusDate);
			}
		}
		#handleYearBlur(event) {
			this.setFocusDate(null);
		}
		#handleTimeFocus(event) {
			const {
				hour,
				minute
			} = event.getData();
			let focusDate = cloneDate(this.getInitialFocusDate());
			if (main_core.Type.isNumber(hour)) {
				focusDate = setTime(focusDate, hour, null, null);
				this.setFocusDate(focusDate);
			} else if (main_core.Type.isNumber(minute)) {
				focusDate = setTime(focusDate, null, minute, null);
				this.setFocusDate(focusDate);
			}
		}
		#handleTimeBlur(event) {
			this.setFocusDate(null);
		}
		#handleMonthSelect(event) {
			const {
				year
			} = getDate(this.getViewDate());
			const month = event.getData().month;
			const date = createUtcDate(year, month);
			if (this.getType() === 'month') {
				this.selectDate(date);
				if (this.shouldHideOnSelect()) {
					this.hide();
				}
			} else {
				this.setViewDate(date);
				this.setCurrentView('day');
			}
		}
		#handleYearSelect(event) {
			const {
				month
			} = getDate(this.getViewDate());
			const year = event.getData().year;
			const date = createUtcDate(year, month);
			if (this.getType() === 'year') {
				this.selectDate(createUtcDate(year));
				if (this.shouldHideOnSelect()) {
					this.hide();
				}
			} else {
				this.setViewDate(date);
				this.setCurrentView('day');
			}
		}
		#handleTimeSelect(event) {
			let selectedDate = null;
			if (this.getType() === 'time') {
				selectedDate = this.getSelectedDate() === null ? ceilDate(this.getToday(), 'day') : cloneDate(this.getSelectedDate());
			} else if (this.getSelectedDate() === null) {
				return;
			} else {
				selectedDate = cloneDate(this.getSelectedDate());
			}
			const hideOrSwitchToDayView = () => {
				if (this.shouldHideOnSelect()) {
					this.hide();
				} else if (this.getType() === 'date') {
					this.setCurrentView('day');
				}
			};
			const {
				hour,
				minute
			} = event.getData();
			if (main_core.Type.isNumber(hour)) {
				const currentHour = this.getSelectedDate() === null ? -1 : selectedDate.getUTCHours();
				if (currentHour === hour) {
					hideOrSwitchToDayView();
				} else {
					selectedDate.setUTCHours(hour);
					this.selectDate(selectedDate);
				}
			} else if (main_core.Type.isNumber(minute)) {
				const currentMinute = this.getSelectedDate() === null ? -1 : selectedDate.getUTCMinutes();
				if (currentMinute !== minute) {
					selectedDate.setUTCMinutes(minute);
					this.selectDate(selectedDate);
				}
				if (this.getTimePickerStyle() === 'grid') {
					hideOrSwitchToDayView();
				}
			}
		}
		#handleTimeRangeSelect(event) {
			const timePicker = event.getTarget();
			const rangeEndChange = timePicker.getMode() === 'range-end';
			let rangeStart = this.getRangeStart() === null ? null : cloneDate(this.getRangeStart());
			let rangeEnd = this.getRangeEnd() === null ? null : cloneDate(this.getRangeEnd());
			if (rangeStart === null || rangeEnd === null && rangeEndChange) {
				return;
			}
			const switchToDayView = () => {
				if (this.getType() === 'date' && this.getTimePickerStyle() === 'grid') {
					this.setCurrentView('day');
				}
			};
			const {
				hour,
				minute
			} = event.getData();
			if (main_core.Type.isNumber(hour)) {
				if (rangeEndChange) {
					const currentHour = rangeEnd.getUTCHours();
					if (currentHour === hour) {
						switchToDayView();
						return;
					}
					rangeEnd.setUTCHours(hour);
				} else {
					const currentHour = rangeStart.getUTCHours();
					if (currentHour === hour) {
						switchToDayView();
						return;
					}
					rangeStart.setUTCHours(hour);
				}
			} else if (main_core.Type.isNumber(minute)) {
				if (rangeEndChange) {
					const currentMinute = rangeEnd.getUTCMinutes();
					if (currentMinute === minute) {
						switchToDayView();
						return;
					}
					rangeEnd.setUTCMinutes(minute);
				} else {
					const currentMinute = rangeStart.getUTCMinutes();
					if (currentMinute === minute) {
						switchToDayView();
						return;
					}
					rangeStart.setUTCMinutes(minute);
				}
			}
			if (rangeEnd !== null && rangeStart > rangeEnd) {
				if (rangeEndChange) {
					rangeStart = addDate(rangeEnd, 'minute', -this.getDefaultTimeSpan());
				} else {
					rangeEnd = addDate(rangeStart, 'minute', this.getDefaultTimeSpan());
				}
			}
			this.selectRange(rangeStart, rangeEnd);
			if (main_core.Type.isNumber(minute)) {
				switchToDayView();
			}
		}
		#handlePopupShow() {
			if (!this.isFocused() && this.isAutoFocus()) {
				this.focus();
			}
			if (this.isSingleOpening()) {
				if (singleOpenDatePicker !== null) {
					singleOpenDatePicker.hide();
				}

				// eslint-disable-next-line unicorn/no-this-assignment
				singleOpenDatePicker = this;
			}
			this.#syncInputsAriaExpanded(true);
			this.emit('onShow');
		}
		#handlePopupFirstShow() {
			this.#render();
			this.emit('onFirstShow');
		}
		#handlePopupClose() {
			if (this.getType() === 'date') {
				this.setCurrentView('day');
			}
			this.setFocusDate(null);
			this.setViewDate(this.getDefaultViewDate());
			if (this.isSingleOpening()) {
				singleOpenDatePicker = null;
			}
			if (this.isFocused()) {
				this.#focusInputField();
			}
			this.#syncInputsAriaExpanded(false);
			this.emit('onHide');
		}
		#handlePopupDestroy() {
			this.destroy();
		}
		destroy() {
			if (this.#destroying) {
				return;
			}
			this.#destroying = true;
			this.emit(DatePickerEvent.DESTROY);
			this.#destroyPresetsFocusZone();
			if (this.isRendered()) {
				main_core.Dom.remove(this.getContainer());
			}
			this.#unbindInputEvents(this.getInputField());
			this.#unbindInputEvents(this.getRangeStartInput());
			this.#unbindInputEvents(this.getRangeEndInput());
			if (this.#popup !== null) {
				this.#popup.destroy();
			}
			this.#refs = null;
			this.#views = null;
			this.#selectedDates = null;
			if (this.isSingleOpening()) {
				singleOpenDatePicker = null;
			}
			Object.setPrototypeOf(this, null);
		}
	}

	exports.DatePicker = DatePicker;
	exports.DatePickerEvent = DatePickerEvent;
	exports.addDate = addDate;
	exports.addToRange = addToRange;
	exports.ceilDate = ceilDate;
	exports.cloneDate = cloneDate;
	exports.convertToDbFormat = convertToDbFormat;
	exports.copyTime = copyTime;
	exports.createDate = createDate;
	exports.createUtcDate = createUtcDate;
	exports.floorDate = floorDate;
	exports.getDate = getDate;
	exports.getDaysInMonth = getDaysInMonth;
	exports.getFocusableBoundaryElements = getFocusableBoundaryElements;
	exports.getNextDate = getNextDate;
	exports.isDateAfter = isDateAfter;
	exports.isDateBefore = isDateBefore;
	exports.isDateLike = isDateLike;
	exports.isDateMatch = isDateMatch;
	exports.isDatesEqual = isDatesEqual;
	exports.isValidDate = isValidDate;
	exports.parseDate = parseDate;
	exports.setTime = setTime;

})(this.BX.UI.DatePicker = this.BX.UI.DatePicker || {}, BX, BX.Cache, BX.Event, BX.Main, BX.Main, BX.UI.Accessibility);
//# sourceMappingURL=date-picker.bundle.js.map
