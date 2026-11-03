/**
 * @module im/messenger/lib/date-navigation/src/date-navigation-service
 */
jn.define('im/messenger/lib/date-navigation/src/date-navigation-service', (require, exports, module) => {
	const { DateNavigationRest } = require('im/messenger/lib/date-navigation/src/rest');
	const { DateNavigationTimezone } = require('im/messenger/lib/date-navigation/src/timezone');

	const DateNavigationStatus = Object.freeze({
		success: 'success',
		cancelled: 'cancelled',
		error: 'error',
	});

	const getFirstDayOfMonth = (month) => DateNavigationTimezone.fromServerDay(`${month}-01`);

	/**
	 * The shown month plus the previous one for backward prefetch. The widest pair of months is 61
	 * days apart, which keeps every window inside DateNavigationService::MAX_CALENDAR_RANGE_DAYS of
	 * the server; widening the prefetch would break that, so the limit is guarded by a test over
	 * consecutive months instead of by a clamp that can never fire.
	 *
	 * @param {DateNavigationMonth} month
	 * @return {DateNavigationRequestWindow}
	 */
	const getRequestWindow = (month) => {
		const firstDay = getFirstDayOfMonth(month);
		const year = firstDay.getFullYear();
		const monthIndex = firstDay.getMonth();

		return {
			from: DateNavigationTimezone.toServerDay(new Date(year, monthIndex - 1, 1)),
			to: DateNavigationTimezone.toServerDay(new Date(year, monthIndex + 1, 0)),
		};
	};

	/**
	 * FALLBACK path, for the builds reporting no timezone identifier: parts of the window the offset
	 * of the user stays the same over. The server marks the WHOLE window it is given by the ONE
	 * offset it is given, so a window holding a daylight saving change has to be asked for part by
	 * part. Every other window comes back as a single part.
	 *
	 * A window is a multiple of 24 hours to the server, and the day an offset GROWS on lasts 23, so
	 * the last hour of the day before it stays marked as the day of the change. Telling the two
	 * apart takes a boundary finer than a day, which one offset leaves no room for - which is why
	 * the identifier is preferred and this path is only the fallback.
	 *
	 * @param {DateNavigationRequestWindow} window
	 * @return {DateNavigationRequestSegment[]}
	 */
	const splitWindowByOffset = ({ from, to }) => {
		const segments = [];
		const lastDay = DateNavigationTimezone.fromServerDay(to);
		let current = null;

		for (
			let cursor = DateNavigationTimezone.fromServerDay(from);
			cursor.getTime() <= lastDay.getTime();
			cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
		)
		{
			const day = DateNavigationTimezone.toServerDay(cursor);
			const timezoneOffset = DateNavigationTimezone.getServerOffsetForDay(day);

			// the day an offset FALLS on belongs to both parts: it lasts more than 24 hours, the two
			// of them cover it exactly, and without the seam the hours before the change fall out
			// of the window whole. The day an offset GROWS on belongs to the part of its own offset
			// alone: it lasts less than 24 hours, so the part behind would reach an hour past its
			// end and mark that hour of the next day as this one
			if (current && timezoneOffset <= current.timezoneOffset)
			{
				current.to = day;
			}

			if (current?.timezoneOffset !== timezoneOffset)
			{
				current = { from: day, to: day, timezoneOffset };
				segments.push(current);
			}
		}

		return segments;
	};

	/**
	 * The parts one window is asked for. With a timezone identifier there is always exactly one: the
	 * server knows the offset of every date of the window by the identifier itself. Without one the
	 * window still has to be cut where the clock changes, and the cut is never finer than a day.
	 *
	 * @param {DateNavigationRequestWindow} window
	 * @return {DateNavigationRequestSegment[]}
	 */
	const buildRequestSegments = (window) => {
		const timezoneId = DateNavigationTimezone.getTimezoneId();

		if (timezoneId === null)
		{
			return splitWindowByOffset(window);
		}

		return [{ from: window.from, to: window.to, timezoneId }];
	};

	/**
	 * An end answered as anything but a filled day means the chat has no visible history at all. The
	 * web client of the same contract drops such an answer through Type.isStringFilled; an empty
	 * string kept instead would sort ahead of every real day and pass itself off as the first one.
	 *
	 * @param {DateNavigationDay|null|undefined} day
	 * @return {DateNavigationDay|null}
	 */
	const knownDay = (day) => (typeof day === 'string' && day !== '' ? day : null);

	/**
	 * @param {DateNavigationDay|null|undefined} left
	 * @param {DateNavigationDay|null|undefined} right
	 * @return {DateNavigationDay|null}
	 */
	const earlierDay = (left, right) => {
		const first = knownDay(left);
		const second = knownDay(right);

		if (first === null || second === null)
		{
			return first ?? second;
		}

		return first < second ? first : second;
	};

	/**
	 * @param {DateNavigationDay|null|undefined} left
	 * @param {DateNavigationDay|null|undefined} right
	 * @return {DateNavigationDay|null}
	 */
	const laterDay = (left, right) => {
		const first = knownDay(left);
		const second = knownDay(right);

		if (first === null || second === null)
		{
			return first ?? second;
		}

		return first > second ? first : second;
	};

	/**
	 * One markup out of the answers of the parts. The boundaries of the history are taken over the
	 * whole chat and not over the window (`DateNavigationService::getBoundaryDate`), so the parts
	 * answer the same pair - except for a boundary message sitting right by midnight, which two
	 * offsets can name by neighbouring days. The wider pair is kept: a boundary that is too narrow
	 * shuts off days that do have messages.
	 *
	 * @param {DateNavigationCalendar[]} calendars
	 * @return {DateNavigationCalendar}
	 */
	const mergeCalendars = (calendars) => {
		const days = new Set();
		let firstAvailableDate = null;
		let lastAvailableDate = null;

		calendars.forEach((calendar) => {
			(calendar?.days ?? []).forEach((day) => days.add(day));
			firstAvailableDate = earlierDay(firstAvailableDate, calendar?.firstAvailableDate);
			lastAvailableDate = laterDay(lastAvailableDate, calendar?.lastAvailableDate);
		});

		return { days: [...days], firstAvailableDate, lastAvailableDate };
	};

	/**
	 * @param {DateNavigationMonth} month
	 * @return {DateNavigationMonth}
	 */
	const getPreviousMonth = (month) => {
		const firstDay = getFirstDayOfMonth(month);

		return DateNavigationTimezone.toServerMonth(new Date(firstDay.getFullYear(), firstDay.getMonth() - 1, 1));
	};

	/**
	 * Markup of an OPENED calendar: the months already fetched, the days having messages and the
	 * boundaries of the history. The server answer is the only source of truth for the markup, and
	 * none of it outlives the opened calendar - reset() drops it whole.
	 *
	 * The service knows nothing about the UI: neither the widget, nor the buttons, nor the search
	 * overlay it is opened from.
	 *
	 * @class DateNavigationService
	 */
	class DateNavigationService
	{
		#dialogId;
		#monthsLoaded = new Set();
		/**
		 * Requests of a month still in flight, keyed by that month. A month is marked loaded only
		 * by its answer, so without this a second ask for the same month while the first is on the
		 * wire goes to the server again: on iOS the mount reports a month switch the same tick the
		 * markup was bound, and the prefetch of the neighbour races the shown month the same way.
		 *
		 * @type {Map<DateNavigationMonth, Promise<DateNavigationLoadResult>>}
		 */
		#monthsInFlight = new Map();
		#activeDays = new Set();
		#firstAvailableDate = null;
		#lastAvailableDate = null;
		#boundariesKnown = false;
		#markupGeneration = 0;
		#resolveGeneration = 0;

		/**
		 * @param {string} dialogId
		 */
		constructor(dialogId)
		{
			this.#dialogId = dialogId;
		}

		/**
		 * @param {DateNavigationMonth} month
		 * @return {Promise<DateNavigationLoadResult>}
		 */
		async loadMonth(month)
		{
			if (this.#monthsLoaded.has(month))
			{
				return { status: DateNavigationStatus.success, errorCode: null };
			}

			const inFlight = this.#monthsInFlight.get(month);
			if (inFlight)
			{
				return inFlight;
			}

			const request = this.#loadMonth(month).finally(() => {
				// the slot is freed by the request that still holds it and never by a request left
				// behind: reset() empties the map, and a request of the calendar opened after it may
				// already sit under the very same month. Freeing that one would hide a request that
				// is on the wire, and the next ask for the month would go to the server again
				if (this.#monthsInFlight.get(month) === request)
				{
					this.#monthsInFlight.delete(month);
				}
			});

			this.#monthsInFlight.set(month, request);

			return request;
		}

		/**
		 * @param {DateNavigationMonth} month
		 * @return {Promise<DateNavigationLoadResult>}
		 */
		async #loadMonth(month)
		{
			// months shown by one calendar are loaded side by side, so an answer is told apart by
			// the generation of the calendar it was asked for and never by a slot they share
			const generation = this.#markupGeneration;
			const segments = buildRequestSegments(getRequestWindow(month));

			try
			{
				// one request per part: a window named by its timezone is a single part, and a window
				// named by an offset is cut where that offset changes
				const calendars = await Promise.all(segments.map((segment) => DateNavigationRest.getCalendar({
					dialogId: this.#dialogId,
					...segment,
				})));

				if (generation !== this.#markupGeneration)
				{
					return { status: DateNavigationStatus.cancelled, errorCode: null };
				}

				this.#applyCalendar(month, mergeCalendars(calendars));

				return { status: DateNavigationStatus.success, errorCode: null };
			}
			catch (errors)
			{
				// a failed part fails the month whole: a day left unmarked looks exactly like a day
				// without messages, so half a markup is worse than none
				if (generation !== this.#markupGeneration)
				{
					return { status: DateNavigationStatus.cancelled, errorCode: null };
				}

				return { status: DateNavigationStatus.error, errorCode: DateNavigationRest.getErrorCode(errors) };
			}
		}

		/**
		 * @param {DateNavigationDay} day
		 * @return {Promise<DateNavigationResolveResult>}
		 */
		async resolveDate(day)
		{
			// a picked day supersedes the day picked before it, so an answer is told apart by the
			// generation of the pick it belongs to - the same way the markup tells its months apart
			this.#resolveGeneration += 1;
			const generation = this.#resolveGeneration;

			try
			{
				const resolvedDate = await DateNavigationRest.resolveDate({
					dialogId: this.#dialogId,
					date: day,
					...DateNavigationTimezone.getRequestTimezone(day),
				});

				if (generation !== this.#resolveGeneration)
				{
					return { status: DateNavigationStatus.cancelled, errorCode: null, resolvedDate: null };
				}

				return { status: DateNavigationStatus.success, errorCode: null, resolvedDate };
			}
			catch (errors)
			{
				if (generation !== this.#resolveGeneration)
				{
					return { status: DateNavigationStatus.cancelled, errorCode: null, resolvedDate: null };
				}

				return {
					status: DateNavigationStatus.error,
					errorCode: DateNavigationRest.getErrorCode(errors),
					resolvedDate: null,
				};
			}
		}

		/**
		 * @param {DateNavigationDay} day
		 * @return {boolean}
		 */
		isDayActive(day)
		{
			return this.#activeDays.has(day);
		}

		/**
		 * A month whose markup has NOT arrived is not a month without days: the snapshot of the
		 * unavailable days is built from the loaded months only.
		 *
		 * @param {DateNavigationMonth} month
		 * @return {boolean}
		 */
		isMonthLoaded(month)
		{
			return this.#monthsLoaded.has(month);
		}

		/**
		 * @return {DateNavigationBoundaries}
		 */
		getHistoryBoundaries()
		{
			return {
				firstAvailableDate: this.#firstAvailableDate,
				lastAvailableDate: this.#lastAvailableDate,
				boundariesKnown: this.#boundariesKnown,
			};
		}

		/**
		 * Drops the markup of the closed calendar: the generation of the markup moves, the
		 * generation of the resolution stays. A resolution in flight survives on purpose - the
		 * calendar closes itself the moment a day is picked, so the jump outlives it.
		 */
		reset()
		{
			this.#markupGeneration += 1;
			this.#monthsLoaded.clear();
			// the answers of these are cut off by the generation above; dropping the entries keeps
			// a closed calendar from handing its own request to the next one
			this.#monthsInFlight.clear();
			this.#activeDays.clear();
			this.#firstAvailableDate = null;
			this.#lastAvailableDate = null;
			this.#boundariesKnown = false;
		}

		/**
		 * @param {DateNavigationMonth} month
		 * @param {DateNavigationCalendar} calendar
		 */
		#applyCalendar(month, calendar)
		{
			(calendar?.days ?? []).forEach((day) => this.#activeDays.add(day));
			this.#monthsLoaded.add(getPreviousMonth(month));
			this.#monthsLoaded.add(month);
			this.#firstAvailableDate = calendar?.firstAvailableDate ?? null;
			this.#lastAvailableDate = calendar?.lastAvailableDate ?? null;
			this.#boundariesKnown = true;
		}
	}

	module.exports = { DateNavigationService, DateNavigationStatus };
});
