/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, main_date, socialnetwork_v2_lib_timezone) {
	'use strict';

	const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.calendar');
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
	class Calendar {
		static get weekStart() {
			return settings.WEEK_START;
		}
		static get workdayDuration() {
			return workdayDuration;
		}
		static get workdayStart() {
			return settings.HOURS.START;
		}
		static get dayStartTime() {
			return `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
		}
		static get dayEndTime() {
			return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
		}
		static formatDateTime(timestamp, options = null) {
			if (!timestamp) {
				return '';
			}
			const {
				forceYear = false,
				removeOffset = false
			} = options || {};
			const showYear = forceYear || new Date(timestamp).getFullYear() !== new Date().getFullYear();
			const format = main_core.Loc.getMessage('SONET_EXT_V2_DATE_TIME_FORMAT', {
				'#DATE#': main_date.DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT') || '',
				'#TIME#': main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT') || ''
			});
			const offset = removeOffset ? 0 : socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		static formatDate(timestamp, options = null) {
			if (!timestamp) {
				return '';
			}
			const showYear = options?.forceYear || new Date(timestamp).getFullYear() !== new Date().getFullYear();
			const format = main_date.DateTimeFormat.getFormat(showYear ? 'LONG_DATE_FORMAT' : 'DAY_MONTH_FORMAT');
			const offset = socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		static formatTime(timestamp) {
			if (!timestamp) {
				return '';
			}
			const format = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const offset = socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp);
			return main_date.DateTimeFormat.format(format, (timestamp + offset) / 1000);
		}
		static calculateDuration(startTs, end) {
			const dayEnd = Calendar.setHours(startTs, endH, endM);
			if (end < dayEnd) {
				return end - startTs;
			}
			let start = Calendar.setHours(startTs + unitDurations.d, startH, startM);
			let duration = dayEnd - startTs;
			while (start < end) {
				if (Calendar.isWorkDay(start)) {
					duration += Math.min(start + workdayDuration, end) - start;
				}
				start += unitDurations.d;
			}
			return duration;
		}
		static isWorkDay(timestamp) {
			const date = new Date(timestamp);
			return !weekends.has(date.getUTCDay()) && !holidays.has(`${date.getUTCMonth() + 1}.${date.getUTCDate()}`);
		}
		static setHours(timestamp, hours, minutes) {
			return new Date(timestamp).setHours(hours, minutes, 0, 0) - socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp);
		}
		static createDateFromUtc(date) {
			return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
		}
		static isToday(timestamp) {
			if (!timestamp) {
				return false;
			}
			const date = new Date(timestamp);
			const nowDate = new Date();
			return Calendar.#isSameCalendarDay(date, nowDate);
		}
		static #isSameCalendarDay(firstDate, secondDate) {
			return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate();
		}
	}

	exports.Calendar = Calendar;

})(this.BX.Socialnetwork.V2.Lib = this.BX.Socialnetwork.V2.Lib || {}, BX, BX.Main, BX.Socialnetwork.V2.Lib);
//# sourceMappingURL=calendar.bundle.js.map
