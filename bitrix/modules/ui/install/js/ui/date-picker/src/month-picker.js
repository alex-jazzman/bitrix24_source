import { Dom, Loc, Tag, Text, Event } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { BasePicker } from './base-picker';

import { createUtcDate } from './helpers/create-utc-date';
import { getDate } from './helpers/get-date';
import { isDatesEqual } from './helpers/is-dates-equal';

export type MonthPickerQuarter = Array<MonthPickerMonth>;
export type MonthPickerMonth = {
	name: string,
	date: Date,
	year: number,
	month: number,
	current: boolean,
	selected: boolean,
	disabled: boolean,
	focused: boolean,
	tabIndex: number,
};

import './css/month-picker.css';

export class MonthPicker extends BasePicker
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div class="ui-month-picker" role="none">
					${this.getHeaderContainer(
						this.getPrevBtn(),
						this.getHeaderTitle(),
						this.getNextBtn(),
					)}
					${this.getContentContainer(this.getYearContainer())}
				</div>
			`;
		});
	}

	getHeaderTitle(): HTMLElement
	{
		return this.#refs.remember('header-title', () => {
			return Tag.render`
				<button
					type="button" 
					class="ui-month-picker-header-title" 
					onclick="${this.#handleTitleClick.bind(this)}"
					aria-live="polite" 
					aria-label="${Loc.getMessage('UI_DATE_PICKER_YEAR_VIEW_LABEL')}"
				></button>
			`;
		});
	}

	getYearContainer(): HTMLElement
	{
		return this.#refs.remember('year-container', () => {
			return Tag.render`
				<div 
					class="ui-month-picker-content"
					role="grid"
					aria-label="${Loc.getMessage('UI_DATE_PICKER_MONTH_VIEW_LABEL')}"
					aria-multiselectable="${this.getDatePicker().isSingleMode() ? 'false' : 'true'}"
				></div>
			`;
		});
	}

	getMonths(): MonthPickerQuarter[]
	{
		const { year } = getDate(this.getDatePicker().getViewDate());
		const today = this.getDatePicker().getToday();
		const focusDate = this.getDatePicker().getFocusDate();
		const initialFocusDate = this.getDatePicker().getInitialFocusDate();
		// const formatter = new Intl.DateTimeFormat(
		// 	this.getDatePicker().getLocale(),
		// 	{ month: 'short', timeZone: 'UTC' },
		// );

		const months: MonthPickerQuarter[] = [];
		let currentMonthIndex = 0;
		for (let quarterIndex = 0; quarterIndex < 4; quarterIndex++)
		{
			const quarter: MonthPickerQuarter = [];
			for (let monthIndex = 0; monthIndex < 3; monthIndex++)
			{
				const date = createUtcDate(year, currentMonthIndex);
				const focused = isDatesEqual(date, focusDate, 'month');
				const month: MonthPickerMonth = {
					name: DateTimeFormat.format('f', date, null, true),
					// name: formatter.format(date),
					date,
					year,
					month: currentMonthIndex,
					current: isDatesEqual(date, today, 'month'),
					selected: this.getDatePicker().isDateSelected(date, 'month'),
					disabled: !this.getDatePicker().isDateAllowed(date, 'month'),
					focused,
					tabIndex: focused || isDatesEqual(date, initialFocusDate, 'month') ? 0 : -1,
				};

				quarter.push(month);
				currentMonthIndex++;
			}

			months.push(quarter);
		}

		return months;
	}

	renderTo(container: HTMLElement)
	{
		super.renderTo(container);

		Event.bind(this.getContentContainer(), 'click', this.#handleMonthClick.bind(this));
	}

	render(): void
	{
		const isFocused = this.getDatePicker().isFocused();
		let focusButton: HTMLButtonElement = null;
		this.getMonths().forEach((quarter: MonthPickerQuarter, index) => {
			const quarterContainer: HTMLElement = this.#renderQuarter(index);
			quarter.forEach((month: MonthPickerMonth) => {
				const button = this.#renderMonth(month, quarterContainer);
				if (month.focused)
				{
					focusButton = button;
				}
			});
		});

		if (focusButton !== null && isFocused && this.getDatePicker().getFocusInputModality() === 'keyboard')
		{
			focusButton.focus({ preventScroll: true });
		}

		const { year: currentYear } = getDate(this.getDatePicker().getViewDate());
		this.getHeaderTitle().textContent = currentYear;

		this.getPrevBtn().disabled = !this.getDatePicker().canNavigate('month', 'prev');
		this.getNextBtn().disabled = !this.getDatePicker().canNavigate('month', 'next');
	}

	#renderQuarter(index: number): HTMLElement
	{
		return this.#refs.remember(`quarter-${index}`, () => {
			const container: HTMLElement = Tag.render`<div class="ui-month-picker-quarter" role="row"></div>`;
			Dom.append(container, this.getYearContainer());

			return container;
		});
	}

	#renderMonth(month, quarterContainer: HTMLElement): HTMLButtonElement
	{
		const button: HTMLElement = this.#refs.remember(`month-${month.month}`, () => {
			const monthButton: HTMLElement = Tag.render`
				<button
					type="button"
					class="ui-month-picker-month"
					role="gridcell"
					data-year="${month.year}"
					data-month="${month.month}"
					data-tab-priority="true"
					onmouseenter="${this.#handleMouseEnter.bind(this)}"
					onmouseleave="${this.#handleMouseLeave.bind(this)}"
				>${Text.encode(month.name)}</button>
			`;

			Dom.append(monthButton, quarterContainer);

			return monthButton;
		});

		const currentYear: number = Number(button.dataset.year);
		if (currentYear !== month.year)
		{
			button.dataset.year = month.year;
		}

		const ariaLabel = DateTimeFormat.format('f Y', month.date, null, true);
		if (button.getAttribute('aria-label') !== ariaLabel)
		{
			button.setAttribute('aria-label', ariaLabel);
		}

		const ariaSelected = month.selected ? 'true' : 'false';
		if (button.getAttribute('aria-selected') !== ariaSelected)
		{
			button.setAttribute('aria-selected', ariaSelected);
		}

		if (month.current)
		{
			Dom.addClass(button, '--current');
			if (button.getAttribute('aria-current') !== 'date')
			{
				button.setAttribute('aria-current', 'date');
			}
		}
		else
		{
			Dom.removeClass(button, '--current');
			if (button.hasAttribute('aria-current'))
			{
				button.removeAttribute('aria-current');
			}
		}

		if (month.selected)
		{
			Dom.addClass(button, '--selected');
		}
		else
		{
			Dom.removeClass(button, '--selected');
		}

		if (month.focused)
		{
			Dom.addClass(button, '--focused');
		}
		else
		{
			Dom.removeClass(button, '--focused');
		}

		if (month.disabled)
		{
			Dom.addClass(button, '--disabled');
		}
		else
		{
			Dom.removeClass(button, '--disabled');
		}

		button.disabled = Boolean(month.disabled);
		button.tabIndex = month.tabIndex;

		return button;
	}

	#handleMouseEnter(event: MouseEvent): void
	{
		const dataset = event.target.dataset;
		const year = Text.toInteger(dataset.year);
		const month = Text.toInteger(dataset.month);
		this.emit('onFocus', { year, month });
	}

	#handleMouseLeave(event: MouseEvent): void
	{
		this.emit('onBlur');
	}

	#handleMonthClick(event: MouseEvent): void
	{
		if (!Dom.hasClass(event.target, 'ui-month-picker-month') || event.target.disabled)
		{
			return;
		}

		const year = Text.toInteger(event.target.dataset.year);
		const month = Text.toInteger(event.target.dataset.month);
		this.emit('onSelect', { year, month });
	}

	#handleTitleClick(event: MouseEvent): void
	{
		this.emit('onTitleClick');
	}

	getPrevBtnLabel(): string
	{
		return Loc.getMessage('UI_DATE_PICKER_PREV_YEAR');
	}

	getNextBtnLabel(): string
	{
		return Loc.getMessage('UI_DATE_PICKER_NEXT_YEAR');
	}
}
