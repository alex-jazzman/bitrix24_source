import { Type, Event, Dom } from 'main.core';

import { addDate } from './helpers/add-date';
import { cloneDate } from './helpers/clone-date';
import { getDate } from './helpers/get-date';
import { getDateOffset } from './helpers/get-date-offset';
import { getFocusableBoundaryElements } from './helpers/get-focusable-boundary-elements';
import { isDatesEqual } from './helpers/is-dates-equal';
import { setTime } from './helpers/set-time';

import { type DatePicker } from './date-picker';
import { type TimePickerGrid } from './time-picker-grid';

const keyMap = {
	ArrowRight: {
		day: 1,
		month: 1,
		year: 1,
		hours: 1,
		minutes: 1,
	},
	ArrowLeft: {
		day: -1,
		month: -1,
		year: -1,
		hours: -1,
		minutes: -1,
	},
	ArrowUp: {
		day: -7,
		month: -3,
		year: -3,
		hours: -4,
		minutes: -2,
	},
	ArrowDown: {
		day: 7,
		month: 3,
		year: 3,
		hours: 4,
		minutes: 2,
	},
};

// How far an arrow may step over the dates disabled inside the range before the move is given up.
const MAX_FOCUS_DATE_SEARCH_STEPS = 100;

export class KeyboardNavigation
{
	#datePicker: DatePicker = null;
	#lastFocusElement: HTMLElement = null;

	constructor(datePicker)
	{
		this.#datePicker = datePicker;
	}

	init(): void
	{
		Event.bind(this.#datePicker.getRootContainer(), 'keydown', this.#handleKeyDown.bind(this));
		Event.bind(this.#datePicker.getRootContainer(), 'focusin', this.#handleFocusIn.bind(this));
		Event.bind(this.#datePicker.getRootContainer(), 'focusout', this.#handleFocusOut.bind(this));
	}

	#handleKeyDown(event: KeyboardEvent): void
	{
		if (event.defaultPrevented)
		{
			return;
		}

		const picker = this.#datePicker;

		if (
			event.key === 'Backspace'
			&& picker.getType() === 'date'
			&& ['year', 'month', 'time'].includes(picker.getCurrentView())
		)
		{
			event.preventDefault();
			this.resetLastFocusElement();
			picker.setCurrentView('day');

			return;
		}

		if (event.key === 'Tab' && !picker.isInline())
		{
			this.#handleFocusChange(event);

			return;
		}

		const view = picker.getCurrentView();
		if (view === 'time' && picker.getTimePickerStyle() === 'wheel')
		{
			return;
		}

		if (event.key === 'Space' || event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			this.resetLastFocusElement();
			event.target.click();

			this.#adjustLastFocusElement();
		}
		else if (!Type.isUndefined(keyMap[event.key]))
		{
			event.preventDefault();
			this.resetLastFocusElement();
			const initialFocus = picker.getFocusDate() === null && this.#isRootContainerFocused();

			if (view === 'time')
			{
				this.#moveTimeFocus(event.key, initialFocus);
			}
			else
			{
				// Entering the grid starts from the date the picker opened on: the cursor is not in the grid yet.
				const openDate = cloneDate(picker.getInitialFocusDate());
				const currentFocusDate = initialFocus ? openDate : this.#getCursorDate(openDate, view);
				const focusDate = initialFocus
					? this.#findInitialFocusDate(currentFocusDate, view)
					: this.#findAllowedFocusDate(currentFocusDate, view, keyMap[event.key][view])
				;

				// The first arrow press only enters the grid: a date equal to the cursor is still a move.
				const boundaryReached = focusDate === null
					|| (!initialFocus && isDatesEqual(focusDate, currentFocusDate, view))
				;

				if (boundaryReached)
				{
					picker.announcePeriodBoundary();
				}
				else
				{
					picker.setFocusDate(focusDate, { inputModality: 'keyboard' });
				}

				this.#adjustLastFocusElement();
			}
		}
	}

	#moveTimeFocus(key: string, initialFocus: boolean): void
	{
		const picker = this.#datePicker;
		const timePicker: TimePickerGrid = picker.getPicker('time');
		let currentFocusDate = cloneDate(picker.getInitialFocusDate(timePicker.getMode()));
		const { hours, minutes } = getDate(currentFocusDate);

		if (initialFocus)
		{
			picker.setFocusDate(currentFocusDate, { inputModality: 'keyboard' });
			this.#adjustLastFocusElement();
		}
		else if (timePicker.getFocusColumn() === 'hours')
		{
			currentFocusDate = setTime(currentFocusDate, this.#wrapHours(hours + keyMap[key].hours), null, null);
			picker.setFocusDate(currentFocusDate, { inputModality: 'keyboard' });
			this.#adjustLastFocusElement();
		}
		else if (timePicker.getFocusColumn() === 'minutes')
		{
			const increment = timePicker.getCurrentMinuteStep() * keyMap[key].minutes;
			currentFocusDate = setTime(currentFocusDate, null, this.#wrapMinutes(minutes + increment), null);
			picker.setFocusDate(currentFocusDate, { inputModality: 'keyboard' });
			timePicker.adjustMinuteFocusPosition();
			this.#adjustLastFocusElement();
		}
	}

	#wrapHours(hours: number): number
	{
		if (hours < 0)
		{
			return hours + 24;
		}

		return hours > 23 ? hours - 24 : hours;
	}

	#wrapMinutes(minutes: number): number
	{
		if (minutes < 0)
		{
			return minutes + 60;
		}

		return minutes > 59 ? minutes - 60 : minutes;
	}

	// A changed boundary leaves the stored cursor outside the range, and the grid holds it at the bound.
	// The move counts in units of the grid, so the parts of the date it does not show are kept.
	#getCursorDate(openDate: Date, view: 'day' | 'month' | 'year'): Date
	{
		const boundDate = this.#datePicker.clampDate(openDate, view);

		return addDate(openDate, view, getDateOffset(openDate, boundDate, view));
	}

	#findAllowedFocusDate(currentFocusDate: Date, view: 'day' | 'month' | 'year', increment: number): Date | null
	{
		return this.#resolveAllowedDate(addDate(currentFocusDate, view, increment), view, increment);
	}

	// The first arrow press only moves the cursor into the grid: it starts from the date the picker opened on.
	// Nothing available ahead of that date still leaves the range behind it, so the search turns back.
	#findInitialFocusDate(focusDate: Date, view: 'day' | 'month' | 'year'): Date | null
	{
		return this.#resolveAllowedDate(focusDate, view, 1) ?? this.#resolveAllowedDate(focusDate, view, -1);
	}

	// A cursor on a date the range does not offer leaves the grid without a cell to focus. A target beyond
	// the bound goes to the bound itself, and the steps are left to the dates disabled inside the range.
	#resolveAllowedDate(targetDate: Date, view: 'day' | 'month' | 'year', increment: number): Date | null
	{
		const picker = this.#datePicker;
		let focusDate = picker.clampDate(targetDate, view);
		const searchIncrement = focusDate.getTime() === targetDate.getTime()
			? increment
			: Math.sign(focusDate.getTime() - targetDate.getTime())
		;

		for (let step = 0; step < MAX_FOCUS_DATE_SEARCH_STEPS; step++)
		{
			if (picker.isDateAllowed(focusDate, view))
			{
				return focusDate;
			}

			const nextDate = picker.clampDate(addDate(focusDate, view, searchIncrement), view);
			if (nextDate.getTime() === focusDate.getTime())
			{
				return null;
			}

			focusDate = nextDate;
		}

		return null;
	}

	#isRootContainerFocused(): boolean
	{
		const rootContainer = this.#datePicker.getRootContainer();

		return rootContainer.ownerDocument.activeElement === rootContainer;
	}

	#handleFocusChange(event: KeyboardEvent): void
	{
		let prev: HTMLElement = null;
		let next: HTMLElement = null;
		const rootContainer = this.#datePicker.getRootContainer();
		if (this.#isRootContainerFocused())
		{
			[prev = null, next = null] = getFocusableBoundaryElements(
				rootContainer,
				(element: HTMLElement) => element.dataset.tabPriority === 'true',
			);
		}

		if (prev === null && next === null)
		{
			[prev, next] = getFocusableBoundaryElements(rootContainer);
		}

		if (event.shiftKey)
		{
			prev?.focus({ preventScroll: true, focusVisible: true });
			this.setLastFocusElement(prev);
		}
		else
		{
			next?.focus({ preventScroll: true, focusVisible: true });
			this.setLastFocusElement(next);
		}

		event.preventDefault();
	}

	setLastFocusElement(element: HTMLElement): void
	{
		this.resetLastFocusElement();

		this.#lastFocusElement = element;
		Dom.addClass(this.#lastFocusElement, '--focus-visible');
	}

	resetLastFocusElement(): void
	{
		Dom.removeClass(this.#lastFocusElement, '--focus-visible');
		this.#lastFocusElement = null;
	}

	#adjustLastFocusElement(): void
	{
		const rootContainer = this.#datePicker.getRootContainer();
		const activeElement = rootContainer.ownerDocument.activeElement;
		if (rootContainer.contains(activeElement))
		{
			this.setLastFocusElement(activeElement);
		}
	}

	#handleFocusIn(event: FocusEvent): void
	{
		this.resetLastFocusElement();
		// this.#lastFocusElement = event.target;
	}

	#handleFocusOut(event: FocusEvent): void
	{
		this.resetLastFocusElement();
		// this.#lastFocusElement = event.target;
	}
}
