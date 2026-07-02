/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_date) {
	'use strict';

	const Interval = {
		tomorrow: 'tomorrow',
		today: 'today',
		yesterday: 'yesterday',
		week: 'week',
		year: 'year',
		olderThanYear: 'olderThanYear'
	};

	// camelCase versions of main formats
	// main/install/js/main/date/config.php
	const DateFormat = {
		shortTimeFormat: 'SHORT_TIME_FORMAT',
		longTimeFormat: 'LONG_TIME_FORMAT',
		shortDateFormat: 'SHORT_DATE_FORMAT',
		dayMonthFormat: 'DAY_MONTH_FORMAT',
		longDateFormat: 'LONG_DATE_FORMAT',
		dayOfWeekMonthFormat: 'DAY_OF_WEEK_MONTH_FORMAT',
		shortDayOfWeekMonthFormat: 'SHORT_DAY_OF_WEEK_MONTH_FORMAT',
		shortDayOfWeekShortMonthFormat: 'SHORT_DAY_OF_WEEK_SHORT_MONTH_FORMAT',
		fullDateFormat: 'FULL_DATE_FORMAT',
		dayShortMonthFormat: 'DAY_SHORT_MONTH_FORMAT',
		mediumDateFormat: 'MEDIUM_DATE_FORMAT',
		formatDatetime: 'FORMAT_DATETIME',
		formatDate: 'FORMAT_DATE'
	};
	// string codes for provided format
	// shortTimeFormat: 'H:i'
	const DateCode = {};
	Object.keys(DateFormat).forEach(format => {
		DateCode[format] = main_date.DateTimeFormat.getFormat(DateFormat[format]);
	});
	const DateTemplate = {
		notification: {
			[Interval.today]: `today, ${DateCode.shortTimeFormat}`,
			[Interval.yesterday]: `yesterday, ${DateCode.shortTimeFormat}`,
			[Interval.year]: `${DateCode.dayMonthFormat}, ${DateCode.shortTimeFormat}`,
			[Interval.olderThanYear]: `${DateCode.longDateFormat}, ${DateCode.shortTimeFormat}`
		},
		dateGroup: {
			[Interval.today]: 'today',
			[Interval.yesterday]: 'yesterday',
			[Interval.year]: DateCode.dayOfWeekMonthFormat,
			[Interval.olderThanYear]: DateCode.fullDateFormat
		},
		meeting: {
			[Interval.tomorrow]: `tomorrow, ${DateCode.shortTimeFormat}`,
			[Interval.today]: `today, ${DateCode.shortTimeFormat}`,
			[Interval.yesterday]: `yesterday, ${DateCode.shortTimeFormat}`,
			[Interval.year]: `${DateCode.dayShortMonthFormat}, ${DateCode.shortTimeFormat}`,
			[Interval.olderThanYear]: `${DateCode.mediumDateFormat}, ${DateCode.shortTimeFormat}`
		},
		recent: {
			[Interval.today]: DateCode.shortTimeFormat,
			[Interval.week]: 'D',
			[Interval.year]: DateCode.dayShortMonthFormat,
			[Interval.olderThanYear]: DateCode.mediumDateFormat
		},
		messageReadStatus: {
			[Interval.today]: `today, ${DateCode.shortTimeFormat}`,
			[Interval.yesterday]: `yesterday, ${DateCode.shortTimeFormat}`,
			[Interval.year]: `${DateCode.dayMonthFormat},  ${DateCode.shortTimeFormat}`,
			[Interval.olderThanYear]: `${DateCode.dayMonthFormat} Y, ${DateCode.shortTimeFormat}`
		}
	};

	class DateFormatter {
		#date;
		#matchingFunctions;
		static formatByCode(date, formatCode) {
			return new DateFormatter(date).formatByCode(formatCode);
		}
		static formatByTemplate(date, template = {}) {
			return new DateFormatter(date).formatByTemplate(template);
		}
		formatByCode(formatCode) {
			return main_date.DateTimeFormat.format(formatCode, this.#date);
		}
		formatByTemplate(template = {}) {
			const intervals = Object.keys(Interval);
			const matchingInterval = intervals.find(interval => {
				const templateHasInterval = Boolean(template[interval]);
				if (!templateHasInterval) {
					return false;
				}
				const matchingFunction = this.#matchingFunctions[interval];
				const intervalIsMatching = matchingFunction();
				if (!intervalIsMatching) {
					return false;
				}

				// it's a matching code from provided template
				return true;
			});
			if (!matchingInterval) {
				console.error('DateFormatter: no matching intervals were found for', template);
				return '';
			}
			const matchingCode = template[matchingInterval];
			return this.formatByCode(matchingCode);
		}
		constructor(date) {
			this.#date = date;
			this.#matchingFunctions = {
				[Interval.tomorrow]: () => this.#isTomorrow(),
				[Interval.today]: () => this.#isToday(),
				[Interval.yesterday]: () => this.#isYesterday(),
				[Interval.week]: () => this.#isCurrentWeek(),
				[Interval.year]: () => this.#isCurrentYear(),
				[Interval.olderThanYear]: () => !this.#isCurrentYear()
			};
		}
		#isYesterday() {
			const yesterday = this.#shiftDate(-1);
			return this.#isSame(yesterday);
		}
		#isToday() {
			return this.#isSame(new Date());
		}
		#isTomorrow() {
			const tomorrow = this.#shiftDate(1);
			return this.#isSame(tomorrow);
		}
		#isCurrentWeek() {
			const date = new Date();
			const currentWeekNumber = Number(main_date.DateTimeFormat.format('W', date));
			const setWeekNumber = Number(main_date.DateTimeFormat.format('W', this.#date));
			const sameYear = this.#isCurrentYear();
			return currentWeekNumber === setWeekNumber && sameYear;
		}
		#isCurrentYear() {
			const date = new Date();
			const currentYear = date.getFullYear();
			const setYear = this.#date.getFullYear();
			return currentYear === setYear;
		}
		#isSame(date) {
			const dateLocale = date.toLocaleDateString();
			const setDateLocale = this.#date.toLocaleDateString();
			return dateLocale === setDateLocale;
		}
		#shiftDate(shift) {
			const date = new Date();
			date.setDate(date.getDate() + shift);
			return date;
		}
	}

	exports.DateCode = DateCode;
	exports.DateFormat = DateFormat;
	exports.DateFormatter = DateFormatter;
	exports.DateTemplate = DateTemplate;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Main);
//# sourceMappingURL=date-formatter.bundle.js.map
