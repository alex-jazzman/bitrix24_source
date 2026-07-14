/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_date, tasks_v2_lib_timezone) {
	'use strict';

	const settings = main_core.Extension.getSettings('tasks.v2.lib.calendar').calendarSettings;
	const holidays = new Set(settings.HOLIDAYS.map(({
		M,
		D
	}) => `${M}.${D}`));
	const weekends = new Set(settings.WEEKEND.map(it => ({
		SU: 0,
		MO: 1,
		TU: 2,
		WE: 3,
		TH: 4,
		FR: 5,
		SA: 6
	})[it]));
	const {
		H: startH,
		M: startM
	} = settings.HOURS.START;
	const {
		H: endH,
		M: endM
	} = settings.HOURS.END;
	const unitDurations = main_date.DurationFormat.getUnitDurations();
	const workdayDuration = (endH * 60 + endM - (startH * 60 + startM)) * 60000;
	const workWeekDuration = workdayDuration * (7 - weekends.size);
	const calendar = new class {
		get weekStart() {
			return settings.WEEK_START;
		}
		get workdayDuration() {
			return workdayDuration;
		}
		get workdayStart() {
			return settings.HOURS.START;
		}
		get dayStartTime() {
			return `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
		}
		get dayEndTime() {
			return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
		}
		get todyTs() {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return today.getTime();
		}
		formatDateTime(timestamp, {
			forceYear,
			removeOffset
		} = {}) {
			if (!timestamp) {
				return '';
			}
			const showYear = forceYear || new Date(timestamp).getFullYear() !== new Date().getFullYear();
			const format = main_core.Loc.getMessage('TASKS_V2_DATE_TIME_FORMAT', {
				'#DATE#': main_date.DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT'),
				'#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
			});
			const offset = removeOffset ? 0 : tasks_v2_lib_timezone.timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		formatDate(timestamp, {
			forceYear
		} = {}) {
			if (!timestamp) {
				return '';
			}
			const showYear = forceYear || new Date(timestamp).getFullYear() !== new Date().getFullYear();
			const format = main_date.DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT');
			const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		formatTime(timestamp) {
			if (!timestamp) {
				return '';
			}
			const format = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		formatDuration(durationTs, matchWorkTime) {
			const dayDuration = matchWorkTime ? this.workdayDuration : unitDurations.d;
			const {
				format,
				value
			} = this.#resolveDurationUnitValue(durationTs, dayDuration);
			const duration = value * unitDurations[format];
			return new main_date.DurationFormat(duration).format({
				format
			});
		}
		recalculateDurationByMatchWorkTime(durationTs, fromMatchesWorkTime, toMatchesWorkTime) {
			if (!durationTs || fromMatchesWorkTime === toMatchesWorkTime) {
				return durationTs;
			}
			const fromDayDuration = fromMatchesWorkTime ? this.workdayDuration : unitDurations.d;
			const toDayDuration = toMatchesWorkTime ? this.workdayDuration : unitDurations.d;
			const {
				format,
				value
			} = this.#resolveDurationUnitValue(durationTs, fromDayDuration);
			if (format === 'd') {
				return value * toDayDuration;
			}
			return value * unitDurations[format];
		}
		calculateDuration(startTs, end) {
			const dayEnd = this.setHours(startTs, endH, endM);
			if (end < dayEnd) {
				return end - startTs;
			}
			let start = this.setHours(startTs + unitDurations.d, startH, startM);
			let duration = dayEnd - startTs;
			while (start < end) {
				if (this.isWorkDay(start)) {
					duration += Math.min(start + workdayDuration, end) - start;
				}
				start += unitDurations.d;
			}
			return duration;
		}
		calculateStartTs(startTs, endTs, duration) {
			return startTs ?? this.#calculateRangeTs(endTs, duration, true);
		}
		calculateEndTs(startTs, endTs, durationTs) {
			if (!startTs) {
				return endTs;
			}
			let duration = durationTs;
			let start = startTs;
			const daysUntilNextMonday = (1 + 7 - new Date(start - tasks_v2_lib_timezone.timezone.getOffset(start)).getDay()) % 7;
			const nextMondayTs = this.setHours(start + unitDurations.d * daysUntilNextMonday, startH, startM);
			const mondayDuration = this.calculateDuration(start, nextMondayTs);
			if (duration <= mondayDuration) {
				return this.#calculateRangeTs(start, duration);
			}
			duration -= mondayDuration;
			start = nextMondayTs;
			const beforeSkip = new Date(start).setHours(0, 0, 0);
			const weeks = Math.max(Math.floor(duration / workWeekDuration) - 1, 0);
			duration -= workWeekDuration * weeks;
			start = this.setHours(start + unitDurations.d * weeks * 7, startH, startM);
			const afterSkip = new Date(start).setHours(0, 0, 0) - unitDurations.d;
			const fromYear = new Date(beforeSkip).getFullYear();
			const toYear = new Date(afterSkip).getFullYear();
			const missedHolidays = Array.from({
				length: toYear - fromYear + 1
			}, (_, i) => i + fromYear).flatMap(year => settings.HOLIDAYS.map(({
				M,
				D
			}) => new Date(year, M - 1, D).getTime())).filter(it => beforeSkip <= it && it <= afterSkip && !weekends.has(new Date(it).getDay()));
			if (missedHolidays.length > 0) {
				return this.calculateEndTs(start, endTs, duration + workdayDuration * missedHolidays.length);
			}
			return this.#calculateRangeTs(start, duration);
		}
		#calculateRangeTs(anchorTs, durationTs, backwards) {
			const direction = backwards ? -1 : 1;
			const anchorHours = backwards ? settings.HOURS.END : settings.HOURS.START;
			const oppositeHours = backwards ? settings.HOURS.START : settings.HOURS.END;
			let anchor = anchorTs;
			let duration = durationTs;
			while (duration > 0) {
				if (this.isWorkDay(anchor)) {
					const dayLength = Math.abs(anchor - this.setHours(anchor, oppositeHours.H, oppositeHours.M));
					const opposite = anchor + Math.min(dayLength, duration, workdayDuration) * direction;
					duration -= Math.abs(anchor - opposite);
					if (duration === 0) {
						return opposite;
					}
				}
				anchor = this.setHours(anchor + unitDurations.d * direction, anchorHours.H, anchorHours.M);
			}
			return anchorTs;
		}
		clampWorkDateTime(timestamp) {
			if (!timestamp) {
				return null;
			}
			let workday = timestamp;
			while (!this.isWorkDay(workday)) {
				workday = this.setHours(workday + unitDurations.d, startH, startM);
			}
			const dayStart = this.setHours(workday, startH, startM);
			const dayEnd = this.setHours(workday, endH, endM);
			return Math.min(Math.max(workday, dayStart), dayEnd);
		}
		isWorkDay(timestamp) {
			const date = new Date(timestamp);
			return !weekends.has(date.getUTCDay()) && !holidays.has(`${date.getUTCMonth() + 1}.${date.getUTCDate()}`);
		}
		setHours(timestamp, hours, minutes) {
			return new Date(timestamp).setHours(hours, minutes, 0, 0) - tasks_v2_lib_timezone.timezone.getOffset(timestamp);
		}
		createDateFromUtc(date) {
			return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
		}
		isToday(timestamp) {
			if (!timestamp) {
				return false;
			}
			const date = new Date(timestamp);
			const nowDate = new Date();
			return this.#isSameCalendarDay(date, nowDate);
		}
		isTomorrow(timestamp) {
			if (!timestamp) {
				return false;
			}
			const date = new Date(timestamp);
			const tomorrowDate = new Date();
			tomorrowDate.setDate(tomorrowDate.getDate() + 1);
			return this.#isSameCalendarDay(date, tomorrowDate);
		}
		isThisWeek(timestamp) {
			if (!timestamp) {
				return false;
			}
			const date = new Date(timestamp);
			const today = new Date();
			const firstWeekDay = this.#getWeekStartDate(today);
			const thisWeekDays = this.#getWeekDaysRange(firstWeekDay);
			return this.#isDateInList(date, thisWeekDays);
		}
		isNextWeek(timestamp) {
			if (!timestamp) {
				return false;
			}
			const date = new Date(timestamp);
			const today = new Date();
			today.setDate(today.getDate() + 7);
			const firstWeekDay = this.#getWeekStartDate(today);
			const nextWeekDays = this.#getWeekDaysRange(firstWeekDay);
			return this.#isDateInList(date, nextWeekDays);
		}
		parseDateTs(dateTime) {
			const date = new Date(dateTime);
			date.setHours(0, 0, 0, 0);
			return date.getTime();
		}
		#isSameCalendarDay(firstDate, secondDate) {
			return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate();
		}
		#getWeekStartDate(referenceDate) {
			const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
			const jsDay = date.getDay();
			const isoDay = jsDay === 0 ? 7 : jsDay;
			const diffToMonday = isoDay - 1;
			date.setDate(date.getDate() - diffToMonday);
			return date;
		}
		#getWeekDaysRange(firstDay) {
			const days = [];
			const current = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
			for (let i = 0; i < 7; i++) {
				days.push(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
				current.setDate(current.getDate() + 1);
			}
			return days;
		}
		#isDateInList(date, dates) {
			return dates.some(candidate => this.#isSameCalendarDay(date, candidate));
		}
		#resolveDurationUnitValue(durationTs, dayDuration) {
			const days = durationTs / dayDuration;
			if (Number.isInteger(days)) {
				return {
					format: 'd',
					value: days
				};
			}
			const hours = durationTs / unitDurations.H;
			if (Number.isInteger(hours)) {
				return {
					format: 'H',
					value: hours
				};
			}
			const minutes = durationTs / unitDurations.i;
			return {
				format: 'i',
				value: Math.floor(minutes)
			};
		}
	}();

	exports.calendar = calendar;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Main, BX.Tasks.V2.Lib);
//# sourceMappingURL=calendar.bundle.js.map
