/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_utils, im_v2_provider_service_recent) {
	'use strict';

	const DAY = 1000 * 60 * 60 * 24;
	class UserStatusManager {
		static #instance;
		#absentList = new Set();
		#absentCheckInterval = null;
		#birthdayLoadInterval = null;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		onUserUpdate(user) {
			this.#startBirthdayLoadInterval();
			if (user.birthday && im_v2_lib_utils.Utils.user.isBirthdayToday(user.birthday)) {
				this.#setUserBirthdayFlag(user.id, true);
				setTimeout(() => {
					this.#setUserBirthdayFlag(user.id, false);
				}, im_v2_lib_utils.Utils.date.getTimeToNextMidnight());
			}
			if (main_core.Type.isDate(user.absent)) {
				this.#setUserAbsentFlag(user.id, true);
				this.#startAbsentCheckInterval(user.id);
			} else if (user.absent === false && this.#absentList.has(user.id)) {
				this.#setUserAbsentFlag(user.id, false);
				this.#stopAbsentCheckInterval(user.id);
			}
		}
		clear() {
			this.#absentList = new Set();
			clearTimeout(this.#absentCheckInterval);
			this.#absentCheckInterval = null;
			clearTimeout(this.#birthdayLoadInterval);
			this.#birthdayLoadInterval = null;
		}
		#setUserBirthdayFlag(userId, flag) {
			im_v2_application_core.Core.getStore().dispatch('users/update', {
				id: userId,
				fields: {
					isBirthday: flag
				}
			});
		}
		#setUserAbsentFlag(userId, flag) {
			im_v2_application_core.Core.getStore().dispatch('users/update', {
				id: userId,
				fields: {
					isAbsent: flag
				}
			});
		}
		#startAbsentCheckInterval(userId) {
			this.#absentList.add(userId);
			if (this.#absentCheckInterval) {
				return;
			}
			this.#absentCheckInterval = setTimeout(() => {
				this.#checkAbsentList();
				setInterval(() => {
					this.#checkAbsentList();
				}, DAY);
			}, im_v2_lib_utils.Utils.date.getTimeToNextMidnight());
		}
		#stopAbsentCheckInterval(userId) {
			this.#absentList.delete(userId);
		}
		#checkAbsentList() {
			for (const userId of this.#absentList) {
				const user = im_v2_application_core.Core.getStore().getters['users/get'](userId);
				if (!user || !main_core.Type.isDate(user.absent)) {
					this.#stopAbsentCheckInterval(userId);
					return;
				}
				const absentEnd = user.absent.getTime();
				if (absentEnd <= Date.now()) {
					this.#setUserAbsentFlag(user.id, false);
					this.#stopAbsentCheckInterval(user.id);
				}
			}
		}
		#startBirthdayLoadInterval() {
			if (this.#birthdayLoadInterval) {
				return;
			}
			this.#birthdayLoadInterval = setTimeout(() => {
				void im_v2_provider_service_recent.LegacyRecentService.getInstance().loadFirstPage();
				setInterval(() => {
					void im_v2_provider_service_recent.LegacyRecentService.getInstance().loadFirstPage();
				}, DAY);
			}, im_v2_lib_utils.Utils.date.getTimeToNextMidnight());
		}
	}

	exports.UserStatusManager = UserStatusManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Service);
//# sourceMappingURL=user-status.bundle.js.map
