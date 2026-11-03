import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { RestMethod } from 'im.v2.const';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

import { DateNavigationStatus } from './const';
import { parseCalendarDay, parseCalendarMonth } from './day-key';
import type {
	CalendarDay,
	CalendarDto,
	CalendarLoadResult,
	CalendarMonth,
	CalendarRequestTimezone,
	CalendarRequestWindow,
	HistoryBoundaries,
	RequestErrorCode,
	ResolveDateResult,
	ResolvedDate,
} from './types';

const DAY_FORMAT = 'Y-m-d';
const MONTH_FORMAT = 'Y-m';
const SECONDS_IN_MINUTE = 60;
const NOON_HOUR = 12;

/**
 * Owns the markup of an opened calendar: the months already fetched, the days having messages
 * and the history boundaries. The server answer is the only source of truth for the markup,
 * and no markup outlives the opened calendar - reset() drops it whole. Resolving a picked day
 * into a message is the second half of the same contract: only the latest resolution is applied,
 * the ones it superseded report themselves as cancelled.
 */
export class DateNavigationService
{
	#dialogId: string;
	#monthsLoaded: Set<CalendarMonth> = new Set();
	#activeDays: Set<CalendarDay> = new Set();
	#firstAvailableDate: CalendarDay | null = null;
	#lastAvailableDate: CalendarDay | null = null;
	#boundariesKnown: boolean = false;
	#markupGeneration: number = 0;
	#resolveGeneration: number = 0;

	constructor(dialogId: string)
	{
		this.#dialogId = dialogId;
	}

	async loadMonth(month: CalendarMonth): Promise<CalendarLoadResult>
	{
		if (this.#monthsLoaded.has(month))
		{
			return { status: DateNavigationStatus.Success, errorCode: null };
		}

		// months shown by one render are loaded side by side, so an answer is told apart by the
		// generation of the calendar it was asked for and never by a cancellation slot they share
		const generation = this.#markupGeneration;

		try
		{
			const calendar = await this.#requestCalendar(getRequestWindow(month));

			if (generation !== this.#markupGeneration)
			{
				return { status: DateNavigationStatus.Cancelled, errorCode: null };
			}

			this.#applyCalendar(month, calendar);

			return { status: DateNavigationStatus.Success, errorCode: null };
		}
		catch (errors: unknown)
		{
			if (generation !== this.#markupGeneration)
			{
				return { status: DateNavigationStatus.Cancelled, errorCode: null };
			}

			return { status: DateNavigationStatus.Error, errorCode: getErrorCode(errors) };
		}
	}

	async resolveDate(date: CalendarDay): Promise<ResolveDateResult>
	{
		// a picked day supersedes the day picked before it, so an answer is told apart by the
		// generation of the pick it belongs to - the same way the markup tells its months apart
		this.#resolveGeneration += 1;
		const generation = this.#resolveGeneration;

		try
		{
			const { resolvedDate }: { resolvedDate: ResolvedDate } = await runAction(
				RestMethod.imV2ChatMessageDateNavigationResolveDate,
				{ data: { dialogId: this.#dialogId, date, ...getRequestTimezone(date) } },
			);

			if (generation !== this.#resolveGeneration)
			{
				return { status: DateNavigationStatus.Cancelled, errorCode: null, resolvedDate: null };
			}

			return { status: DateNavigationStatus.Success, errorCode: null, resolvedDate };
		}
		catch (errors: unknown)
		{
			if (generation !== this.#resolveGeneration)
			{
				return { status: DateNavigationStatus.Cancelled, errorCode: null, resolvedDate: null };
			}

			return { status: DateNavigationStatus.Error, errorCode: getErrorCode(errors), resolvedDate: null };
		}
	}

	isDayActive(day: CalendarDay): boolean
	{
		return this.#activeDays.has(day);
	}

	isMonthLoaded(month: CalendarMonth): boolean
	{
		return this.#monthsLoaded.has(month);
	}

	getHistoryBoundaries(): HistoryBoundaries
	{
		return {
			firstAvailableDate: this.#firstAvailableDate,
			lastAvailableDate: this.#lastAvailableDate,
			boundariesKnown: this.#boundariesKnown,
		};
	}

	// Drops the markup of the closed calendar: the generation of the markup moves, the generation of
	// the resolution stays. A resolution in flight survives on purpose - the picker closes itself the
	// moment a day is picked, so the jump it started outlives the calendar.
	reset(): void
	{
		this.#markupGeneration += 1;
		this.#monthsLoaded.clear();
		this.#activeDays.clear();
		this.#firstAvailableDate = null;
		this.#lastAvailableDate = null;
		this.#boundariesKnown = false;
	}

	async #requestCalendar(window: CalendarRequestWindow): Promise<CalendarDto>
	{
		const { from, to } = window;
		const { calendar }: { calendar: CalendarDto } = await runAction(
			RestMethod.imV2ChatMessageDateNavigationGetCalendar,
			{ data: { dialogId: this.#dialogId, from, to, ...getRequestTimezone(from) } },
		);

		return calendar;
	}

	#applyCalendar(month: CalendarMonth, calendar: CalendarDto): void
	{
		calendar.days.forEach((day: CalendarDay) => this.#activeDays.add(day));

		this.#monthsLoaded.add(getPreviousMonth(month));
		this.#monthsLoaded.add(month);
		this.#firstAvailableDate = knownDay(calendar.firstAvailableDate);
		this.#lastAvailableDate = knownDay(calendar.lastAvailableDate);
		this.#boundariesKnown = true;
	}
}

/**
 * The shown month plus the previous one for backward prefetch. The widest pair of months is 61 days
 * apart, which keeps every window within DateNavigationService::MAX_CALENDAR_RANGE_DAYS; widening the
 * prefetch would break that, so the limit is guarded by a test over consecutive months instead of by
 * a clamp that can never fire.
 */
const getRequestWindow = (month: CalendarMonth): CalendarRequestWindow => {
	const { year, monthIndex } = getMonthParts(month);

	return {
		from: DateTimeFormat.format(DAY_FORMAT, new Date(year, monthIndex - 1, 1)),
		to: DateTimeFormat.format(DAY_FORMAT, new Date(year, monthIndex + 1, 0)),
	};
};

const getPreviousMonth = (month: CalendarMonth): CalendarMonth => {
	const { year, monthIndex } = getMonthParts(month);

	return DateTimeFormat.format(MONTH_FORMAT, new Date(year, monthIndex - 1, 1));
};

const getMonthParts = (month: CalendarMonth): { year: number, monthIndex: number } => {
	const firstDay = parseCalendarMonth(month);

	return { year: firstDay.getFullYear(), monthIndex: firstDay.getMonth() };
};

/**
 * How the server is told which time to cut days by, the same answer for the calendar markup and for
 * the resolution of a picked day: read them apart and a day marked active resolves into another day.
 *
 * The identifier is sent whenever the browser reports one. It carries the offset of every date of
 * the request, while a single offset describes a window by one number - and a window wider than a
 * day may cross a clock change no single number describes, which used to cost the client a request
 * per part of the window. The offset is kept for a runtime without a resolvable timezone; it is the
 * offset of the day named and never of today.
 */
const getRequestTimezone = (day: CalendarDay): CalendarRequestTimezone => {
	const timezoneId = getBrowserTimezoneId();

	return timezoneId === null ? { timezoneOffset: getDayUtcOffset(parseCalendarDay(day)) } : { timezoneId };
};

const getBrowserTimezoneId = (): string | null => {
	const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;

	return Type.isStringFilled(timezoneId) ? timezoneId : null;
};

/**
 * The server counts seconds east of UTC, getTimezoneOffset() counts minutes westward.
 *
 * Probed at noon and not at midnight: a zone shifting its clock at 00:00 would otherwise report the
 * whole day by the offset of the hour it skipped or repeated.
 */
const getDayUtcOffset = (day: Date): number => {
	const noon = new Date(day.getFullYear(), day.getMonth(), day.getDate(), NOON_HOUR);
	const offset = -noon.getTimezoneOffset() * SECONDS_IN_MINUTE;

	// in UTC the product is -0, and -0 is not 0 under Object.is; the mobile client of the same
	// contract straightens it the same way
	return offset === 0 ? 0 : offset;
};

// An end answered as anything but a filled day means the chat has no visible history at all; an
// empty string kept instead would sort ahead of every real day and pass itself off as the first one.
const knownDay = (day: CalendarDay | null | undefined): CalendarDay | null => {
	return Type.isStringFilled(day) ? day : null;
};

// The transport rejects with the server error list, but a broken request rejects with a bare failure.
const getErrorCode = (errors: unknown): RequestErrorCode => {
	if (!Type.isArrayFilled(errors))
	{
		return null;
	}

	const [firstError] = errors as RunActionError[];

	return firstError.code ?? null;
};
