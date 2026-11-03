import { Dom } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.buttons';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';

import {
	type CalendarDay,
	type CalendarMonth,
	type DateNavigationService,
	DateNavigationStatus,
	parseCalendarDay,
} from 'im.v2.provider.service.date-navigation';

const MONTH_KEY_LENGTH = 7;
const MONTHS_WARMED_AHEAD = 2;
const POPUP_TEST_ID = 'im-sidebar-search-date-calendar-popup';

const formatDayKey = (year: number, month: number, day: number): CalendarDay => {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// The picker builds every rendered day as a UTC-normalized date, so its calendar parts live in the
// UTC getters; DateTimeFormat would name the previous day in negative timezones.
const toPickerDayKey = (day: Date): CalendarDay => {
	return formatDayKey(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
};

// A plain Date keeps its calendar parts in the local getters, and the client is the source of truth
// about the user's day.
const toLocalDayKey = (date: Date): CalendarDay => {
	return formatDayKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

// Month keys are 'YYYY-MM' and compare as strings; the shift itself is done on a UTC date, which
// rolls the month number over the year on its own.
const shiftMonth = (month: CalendarMonth, delta: number): CalendarMonth => {
	const [year, monthNumber] = month.split('-').map((part) => Number.parseInt(part, 10));
	const shifted = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

	return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
};

/**
 * The picker takes the preselected day as a plain option of its own: it both marks the day and,
 * through getDefaultViewDate(), decides the month the calendar opens on. An empty request means no
 * preselection at all and leaves the picker on the current month.
 */
export const getSelectedDates = (selectedDate: CalendarDay | ''): Date[] => {
	return selectedDate === '' ? [] : [parseCalendarDay(selectedDate)];
};

/**
 * The month the calendar opens on is asked for without picking a day: the picker reads startDate in
 * getDefaultViewDate() alone, and a selected day - the one the divider entry asks for - outranks it
 * there. No day to open on leaves the picker on the current month.
 */
export const getViewDate = (viewDate: CalendarDay | ''): Date | null => {
	return viewDate === '' ? null : parseCalendarDay(viewDate);
};

type CalendarMarkupConfig = {
	service: DateNavigationService,
	picker: DatePicker,
	today?: Date,
};

/**
 * Keeps the markup of an opened picker in sync with the service: decides whether a day is disabled,
 * asks the service for the markup of a month as soon as that month shows up, and pushes the answer
 * and the history boundaries back into the picker. Knows nothing about Vue and about the panel.
 */
export class CalendarMarkup
{
	#service: DateNavigationService;
	#picker: DatePicker;
	#todayKey: CalendarDay;
	#matcher: (day: Date) => boolean;
	#requestedMonths: Set<CalendarMonth> = new Set();
	#queuedMonths: Set<CalendarMonth> = new Set();
	#loadingQueue: boolean = false;
	#boundariesApplied: boolean = false;
	#destroyed: boolean = false;

	constructor(config: CalendarMarkupConfig)
	{
		const { service, picker, today = new Date() } = config;

		this.#service = service;
		this.#picker = picker;
		this.#todayKey = toLocalDayKey(today);
		this.#matcher = (day: Date): boolean => this.isDisabled(day);
	}

	getDisabledDayMatcher(): (day: Date) => boolean
	{
		return this.#matcher;
	}

	/**
	 * The picker asks about every rendered day, so this check doubles as the only signal that the
	 * shown month has changed: a day of an unknown month starts the loading of that month.
	 */
	isDisabled(day: Date): boolean
	{
		const dayKey = toPickerDayKey(day);
		if (dayKey > this.#todayKey)
		{
			return true;
		}

		// the service is asked, not a local mirror of it: with showOutsideDays a single render spans
		// two or three months, and a month already answered as a prefetch needs no request at all
		const month = dayKey.slice(0, MONTH_KEY_LENGTH);
		if (!this.#service.isMonthLoaded(month))
		{
			this.#scheduleLoad(month);

			return false;
		}

		return !this.#service.isDayActive(dayKey);
	}

	destroy(): void
	{
		this.#destroyed = true;
	}

	#scheduleLoad(month: CalendarMonth): void
	{
		if (this.#requestedMonths.has(month))
		{
			return;
		}

		this.#requestedMonths.add(month);
		this.#queuedMonths.add(month);
		if (this.#loadingQueue)
		{
			return;
		}

		this.#loadingQueue = true;
		// the check runs inside the picker's render, so the queue is drained only after it: loading
		// from the check itself would re-enter the render through setDisabledDates()
		void Promise.resolve().then(() => this.#loadQueuedMonths());
	}

	/**
	 * The months of one render are asked for one at a time, from the newest to the oldest: every
	 * answer brings the month before it as a prefetch, so the newest month closes the one preceding
	 * it and a grid spanning three months costs two requests instead of three. Once the render has
	 * nothing left to ask for, the months ahead of the shown one are warmed the same way.
	 */
	async #loadQueuedMonths(): Promise<void>
	{
		while (this.#queuedMonths.size > 0 && !this.#destroyed)
		{
			await this.#loadMonth(this.#takeLatestQueuedMonth());

			if (this.#queuedMonths.size === 0 && !this.#destroyed)
			{
				this.#queueForwardPrefetch();
			}
		}

		this.#loadingQueue = false;
	}

	/**
	 * Warms the months the user is about to page into. One window covers a month together with the
	 * one before it, so asking for the second month ahead closes the first one on the way: paging
	 * forward stops waiting for the network until the warmed pair runs out, the way paging back
	 * already does not wait. Nothing past the end of the history is asked for, so a calendar opened
	 * on the current month - the usual case - warms nothing at all.
	 */
	#queueForwardPrefetch(): void
	{
		// an opening whose first answer never came knows neither the end of the history nor whether
		// the network is there at all, and guessing the months to warm is not the way to find out
		if (!this.#service.getHistoryBoundaries().boundariesKnown)
		{
			return;
		}

		const month = this.#getForwardPrefetchMonth();
		if (month === null || this.#service.isMonthLoaded(month))
		{
			return;
		}

		this.#scheduleLoad(month);
	}

	#getForwardPrefetchMonth(): CalendarMonth | null
	{
		const upperBoundMonth = this.#getUpperBoundKey().slice(0, MONTH_KEY_LENGTH);
		const viewMonth = this.#getViewMonth();

		for (let ahead = MONTHS_WARMED_AHEAD; ahead > 0; ahead--)
		{
			const month = shiftMonth(viewMonth, ahead);
			if (month <= upperBoundMonth)
			{
				return month;
			}
		}

		return null;
	}

	#getViewMonth(): CalendarMonth
	{
		return toPickerDayKey(this.#picker.getViewDate()).slice(0, MONTH_KEY_LENGTH);
	}

	// The grid of one render spans the shown month and the tails of both its neighbours, so a month
	// warmed further ahead than that changes nothing on screen.
	#isShown(month: CalendarMonth): boolean
	{
		const viewMonth = this.#getViewMonth();

		return month >= shiftMonth(viewMonth, -1) && month <= shiftMonth(viewMonth, 1);
	}

	#takeLatestQueuedMonth(): CalendarMonth
	{
		// the months are 'YYYY-MM' keys, so the latest of them is the largest string
		const latest = [...this.#queuedMonths].sort().pop();
		this.#queuedMonths.delete(latest);

		return latest;
	}

	async #loadMonth(month: CalendarMonth): Promise<void>
	{
		// the prefetch of a newer month could close this one while it waited in the queue: then it
		// costs neither a request nor a redraw
		if (this.#service.isMonthLoaded(month))
		{
			return;
		}

		const { status } = await this.#service.loadMonth(month);
		if (this.#destroyed)
		{
			return;
		}

		if (status === DateNavigationStatus.Cancelled)
		{
			// the calendar was reset under the request, so the month stays unanswered and has to be
			// asked again on the next render
			this.#requestedMonths.delete(month);

			return;
		}

		if (status !== DateNavigationStatus.Success)
		{
			// a failed month keeps its days selectable and is not asked again within this opening
			return;
		}

		if (this.#applyHistoryBoundaries() || !this.#isShown(month))
		{
			return;
		}

		this.#picker.setDisabledDates(this.#matcher);
	}

	/**
	 * Before the first answer the boundaries are unknown, and forbidding by them would leave a
	 * calendar without network completely disabled; the future is cut by the check alone.
	 * Reports whether the picker was redrawn: both setters redraw it themselves, so forcing the
	 * disabled days on top of them would walk the grid a third time for nothing.
	 */
	#applyHistoryBoundaries(): boolean
	{
		if (this.#boundariesApplied)
		{
			return false;
		}

		const { firstAvailableDate, boundariesKnown } = this.#service.getHistoryBoundaries();
		if (!boundariesKnown)
		{
			return false;
		}

		this.#boundariesApplied = true;
		this.#picker.setMinDate(firstAvailableDate === null ? null : parseCalendarDay(firstAvailableDate));
		this.#picker.setMaxDate(parseCalendarDay(this.#getUpperBoundKey()));

		return true;
	}

	/**
	 * The end of the history, and never later than today. A chat whose last message is years old
	 * has no messages after it either, so those days are not days to pick; today alone as
	 * the boundary would leave them pickable in the day grid until their own month is answered, and
	 * pickable for good in the month and year views, where ui.date-picker applies no check but the
	 * boundaries.
	 */
	#getUpperBoundKey(): CalendarDay
	{
		const { lastAvailableDate } = this.#service.getHistoryBoundaries();

		return lastAvailableDate !== null && lastAvailableDate < this.#todayKey
			? lastAvailableDate
			: this.#todayKey;
	}
}

// @vue/component
export const DateCalendar = {
	name: 'DateCalendar',
	props:
	{
		// one service per dialog, owned by the panel: the markup of the calendar and the jump the
		// panel starts from it are two halves of the same state and share the reset of the closing
		service: {
			/** @type DateNavigationService */
			type: Object,
			required: true,
		},
		bindElement: {
			/** @type HTMLElement */
			type: Object,
			required: true,
		},
		selectedDate: {
			type: String,
			default: '',
		},
		viewDate: {
			type: String,
			default: '',
		},
	},
	emits: ['close', 'daySelect'],
	created()
	{
		this.datePicker = this.createDatePicker();
		this.markup = new CalendarMarkup({ service: this.service, picker: this.datePicker });
		// the check has to be in place before the first render: without it the picker asks about no
		// day at all, and the shown month would never be reported
		this.datePicker.setDisabledDates(this.markup.getDisabledDayMatcher());
	},
	mounted()
	{
		this.datePicker.show();
		Dom.attr(this.datePicker.getPopup().getPopupContainer(), 'data-testid', POPUP_TEST_ID);
	},
	beforeUnmount()
	{
		this.destroyCalendar();
	},
	methods:
	{
		createDatePicker(): DatePicker
		{
			return new DatePicker({
				targetNode: this.bindElement,
				selectedDates: getSelectedDates(this.selectedDate),
				startDate: getViewDate(this.viewDate),
				// Paging must not lean on the disabled day check: that check answers "no messages
				// that day", and the picker asks it about the border day of the neighbour month to
				// decide whether the arrow is available - an almost always disabled day there left
				// both arrows dead. The days themselves stay gated by the check and by min/max.
				restrictNavigation: false,
				// The picker hides its own popup while the Escape keyup is still on its way to the
				// document, and the messenger reads that same keyup to close the panel unless a
				// popup is still shown. main.popup delays its hiding, so the panel stays covered
				// and Escape takes away the calendar alone.
				hideByEsc: false,
				events: {
					[DatePickerEvent.BEFORE_DAY_SELECT]: this.onDaySelect,
					onHide: this.onHide,
				},
				popupOptions: {
					animation: 'fading-slide',
					buttons: [this.createTodayButton()],
					// Escape closes the calendar through main.popup instead of the picker itself.
					closeByEsc: true,
				},
			});
		},
		createTodayButton(): UiButton
		{
			return new UiButton({
				useAirDesign: true,
				style: AirButtonStyle.PLAIN_ACCENT,
				size: ButtonSize.SMALL,
				text: this.loc('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_TODAY'),
				dataset: { testid: 'im-sidebar-search-date-calendar-today-button' },
				onclick: this.showCurrentMonth,
			});
		},
		showCurrentMonth(): void
		{
			// setViewDate() only moves the shown month and emits no select event, so the chat stays
			// where the user left it
			this.datePicker.setViewDate(new Date());
			this.datePicker.setCurrentView('day');
		},
		onDaySelect(event: BaseEvent<{ date: Date }>): void
		{
			this.aimFocusAtBindElement();
			this.$emit('daySelect', { date: toPickerDayKey(event.getData().date) });
		},
		/**
		 * The pick closes the calendar and starts a jump that scrolls the message list, and the day
		 * divider the second entry came from is scrolled out of the list often enough to be
		 * unmounted - the focus restored onto it then falls to the body, and on a mouse path
		 * FocusMonitor leaves it there on purpose. The button the calendar is bound to owns the same
		 * dialog and outlives the jump, so it is named to ui.a11y as the element to restore to. A
		 * calendar dismissed without a pick keeps the standard restore untouched.
		 */
		aimFocusAtBindElement(): void
		{
			this.datePicker.getPopup().getFocusTrap()?.setRestoreFocus(this.bindElement);
		},
		onHide(): void
		{
			this.destroyCalendar();
			this.$emit('close');
		},
		destroyCalendar(): void
		{
			if (!this.datePicker)
			{
				return;
			}

			// the picker is dropped from the component first: its own destroy() closes the popup and
			// can bring the hide handler back here
			const picker = this.datePicker;
			this.datePicker = null;

			this.markup.destroy();
			picker.destroy();
			// nothing of the markup outlives the opened calendar, while the jump the pick has
			// already started outlives it on purpose
			this.service.reset();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// the calendar itself is drawn in the picker's own popup: the panel is 320px wide and would cut
	// it off by its own borders
	template: `
		<div data-testid="im-sidebar-search-date-calendar"></div>
	`,
};
