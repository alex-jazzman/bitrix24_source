/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	const FileUtil = {
		getBase64(file) {
			const reader = new FileReader();
			return new Promise(resolve => {
				main_core.Event.bind(reader, 'load', () => {
					const fullBase64 = reader.result;
					const commaPosition = fullBase64.indexOf(',');
					const cutBase64 = fullBase64.slice(commaPosition + 1);
					resolve(cutBase64);
				});
				reader.readAsDataURL(file);
			});
		}
	};
	const fileUtil = Object.seal(FileUtil);

	const TimeUtil = {
		getDefaultUTCTimezone(timezoneId = null) {
			const offsetM = new Date().getTimezoneOffset();
			const offsetH = -offsetM / 60;
			const sign = offsetH >= 0 ? '+' : '-';
			const hours = Math.abs(offsetH).toString().padStart(2, '0');
			const minutes = (Math.abs(offsetM) % 60).toString().padStart(2, '0');
			const offset = `${sign}${hours}:${minutes}`;
			return `(UTC ${offset}) ${timezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone}`;
		},
		getWeekStartTs(dateTs, firstWeekDay) {
			const firstWeekDate = new Date(dateTs);
			const diff = (firstWeekDate.getDay() - firstWeekDay + 7) % 7;
			firstWeekDate.setHours(0, 0, 0, 0);
			firstWeekDate.setDate(firstWeekDate.getDate() - diff);
			return firstWeekDate.getTime();
		},
		getMonthStartTs(dateTs) {
			const date = new Date(dateTs);
			return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
		},
		isSameDay(fromTs, toTs, offset = 0) {
			const from = new Date(fromTs + offset);
			const to = new Date(toTs + offset);
			from.setHours(0, 0, 0, 0);
			to.setHours(0, 0, 0, 0);
			return from.getTime() === to.getTime();
		}
	};
	const timeUtil = Object.seal(TimeUtil);

	const Utils = {
		file: fileUtil,
		time: timeUtil
	};

	exports.Utils = Utils;

})(this.BX.Booking = this.BX.Booking || {}, BX);
//# sourceMappingURL=utils.bundle.js.map
