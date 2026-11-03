/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_date, im_v2_const, im_v2_lib_rest) {
	'use strict';

	const DateNavigationStatus = Object.freeze({
		Success: 'success',
		Cancelled: 'cancelled',
		Error: 'error'
	});
	const DateNavigationErrorCode = Object.freeze({
		NotAvailable: 'DATE_NAVIGATION_NOT_AVAILABLE',
		WrongDateFormat: 'DATE_NAVIGATION_WRONG_DATE_FORMAT',
		WrongRange: 'DATE_NAVIGATION_WRONG_RANGE',
		WrongTimezone: 'DATE_NAVIGATION_WRONG_TIMEZONE',
		MessageNotFound: 'DATE_NAVIGATION_MESSAGE_NOT_FOUND'
	});

	const parseCalendarDay = day => {
		const [year, month, date] = day.split('-').map(part => Number.parseInt(part, 10));
		return new Date(year, month - 1, date);
	};
	const parseCalendarMonth = month => {
		return parseCalendarDay(`${month}-01`);
	};

	const DAY_FORMAT = 'Y-m-d';
	const MONTH_FORMAT = 'Y-m';
	const SECONDS_IN_MINUTE = 60;
	const NOON_HOUR = 12;
	class DateNavigationService {
		#dialogId;
		#monthsLoaded = new Set();
		#activeDays = new Set();
		#firstAvailableDate = null;
		#lastAvailableDate = null;
		#boundariesKnown = false;
		#markupGeneration = 0;
		#resolveGeneration = 0;
		constructor(dialogId) {
			this.#dialogId = dialogId;
		}
		async loadMonth(month) {
			if (this.#monthsLoaded.has(month)) {
				return {
					status: DateNavigationStatus.Success,
					errorCode: null
				};
			}
			const generation = this.#markupGeneration;
			try {
				const calendar = await this.#requestCalendar(getRequestWindow(month));
				if (generation !== this.#markupGeneration) {
					return {
						status: DateNavigationStatus.Cancelled,
						errorCode: null
					};
				}
				this.#applyCalendar(month, calendar);
				return {
					status: DateNavigationStatus.Success,
					errorCode: null
				};
			} catch (errors) {
				if (generation !== this.#markupGeneration) {
					return {
						status: DateNavigationStatus.Cancelled,
						errorCode: null
					};
				}
				return {
					status: DateNavigationStatus.Error,
					errorCode: getErrorCode(errors)
				};
			}
		}
		async resolveDate(date) {
			this.#resolveGeneration += 1;
			const generation = this.#resolveGeneration;
			try {
				const {
					resolvedDate
				} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageDateNavigationResolveDate, {
					data: {
						dialogId: this.#dialogId,
						date,
						...getRequestTimezone(date)
					}
				});
				if (generation !== this.#resolveGeneration) {
					return {
						status: DateNavigationStatus.Cancelled,
						errorCode: null,
						resolvedDate: null
					};
				}
				return {
					status: DateNavigationStatus.Success,
					errorCode: null,
					resolvedDate
				};
			} catch (errors) {
				if (generation !== this.#resolveGeneration) {
					return {
						status: DateNavigationStatus.Cancelled,
						errorCode: null,
						resolvedDate: null
					};
				}
				return {
					status: DateNavigationStatus.Error,
					errorCode: getErrorCode(errors),
					resolvedDate: null
				};
			}
		}
		isDayActive(day) {
			return this.#activeDays.has(day);
		}
		isMonthLoaded(month) {
			return this.#monthsLoaded.has(month);
		}
		getHistoryBoundaries() {
			return {
				firstAvailableDate: this.#firstAvailableDate,
				lastAvailableDate: this.#lastAvailableDate,
				boundariesKnown: this.#boundariesKnown
			};
		}
		reset() {
			this.#markupGeneration += 1;
			this.#monthsLoaded.clear();
			this.#activeDays.clear();
			this.#firstAvailableDate = null;
			this.#lastAvailableDate = null;
			this.#boundariesKnown = false;
		}
		async #requestCalendar(window) {
			const {
				from,
				to
			} = window;
			const {
				calendar
			} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageDateNavigationGetCalendar, {
				data: {
					dialogId: this.#dialogId,
					from,
					to,
					...getRequestTimezone(from)
				}
			});
			return calendar;
		}
		#applyCalendar(month, calendar) {
			calendar.days.forEach(day => this.#activeDays.add(day));
			this.#monthsLoaded.add(getPreviousMonth(month));
			this.#monthsLoaded.add(month);
			this.#firstAvailableDate = knownDay(calendar.firstAvailableDate);
			this.#lastAvailableDate = knownDay(calendar.lastAvailableDate);
			this.#boundariesKnown = true;
		}
	}
	const getRequestWindow = month => {
		const {
			year,
			monthIndex
		} = getMonthParts(month);
		return {
			from: main_date.DateTimeFormat.format(DAY_FORMAT, new Date(year, monthIndex - 1, 1)),
			to: main_date.DateTimeFormat.format(DAY_FORMAT, new Date(year, monthIndex + 1, 0))
		};
	};
	const getPreviousMonth = month => {
		const {
			year,
			monthIndex
		} = getMonthParts(month);
		return main_date.DateTimeFormat.format(MONTH_FORMAT, new Date(year, monthIndex - 1, 1));
	};
	const getMonthParts = month => {
		const firstDay = parseCalendarMonth(month);
		return {
			year: firstDay.getFullYear(),
			monthIndex: firstDay.getMonth()
		};
	};
	const getRequestTimezone = day => {
		const timezoneId = getBrowserTimezoneId();
		return timezoneId === null ? {
			timezoneOffset: getDayUtcOffset(parseCalendarDay(day))
		} : {
			timezoneId
		};
	};
	const getBrowserTimezoneId = () => {
		const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return main_core.Type.isStringFilled(timezoneId) ? timezoneId : null;
	};
	const getDayUtcOffset = day => {
		const noon = new Date(day.getFullYear(), day.getMonth(), day.getDate(), NOON_HOUR);
		const offset = -noon.getTimezoneOffset() * SECONDS_IN_MINUTE;
		return offset === 0 ? 0 : offset;
	};
	const knownDay = day => {
		return main_core.Type.isStringFilled(day) ? day : null;
	};
	const getErrorCode = errors => {
		if (!main_core.Type.isArrayFilled(errors)) {
			return null;
		}
		const [firstError] = errors;
		return firstError.code ?? null;
	};

	exports.DateNavigationErrorCode = DateNavigationErrorCode;
	exports.DateNavigationService = DateNavigationService;
	exports.DateNavigationStatus = DateNavigationStatus;
	exports.parseCalendarDay = parseCalendarDay;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX, BX.Main, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=date-navigation.bundle.js.map
