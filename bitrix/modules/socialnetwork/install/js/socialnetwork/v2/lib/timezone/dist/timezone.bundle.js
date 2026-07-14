/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core) {
	'use strict';

	const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.timezone');
	class Timezone {
		static getOffset(dateTs, timeZone = Timezone.getTimezone()) {
			return Timezone.getTimezoneOffset(dateTs, timeZone) + new Date(dateTs).getTimezoneOffset() * 60 * 1000;
		}
		static getTimezoneOffset(dateTs, timeZone = Timezone.getTimezone()) {
			const date = new Date(dateTs);
			const dateInTimezone = new Date(date.toLocaleString('en-US', {
				timeZone
			}));
			const dateInUTC = new Date(date.toLocaleString('en-US', {
				timeZone: 'UTC'
			}));
			return dateInTimezone.getTime() - dateInUTC.getTime();
		}
		static getTimezone() {
			return settings.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	}

	exports.Timezone = Timezone;

})(this.BX.Socialnetwork.V2.Lib = this.BX.Socialnetwork.V2.Lib || {}, BX);
//# sourceMappingURL=timezone.bundle.js.map
