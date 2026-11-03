/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_application_core, im_v2_const, im_v2_lib_utils) {
	'use strict';

	const DAY = 1000 * 60 * 60 * 24;
	class UserStatusManager {
		static #instance;
		#absentList = new Set();
		#absentCheckTimeout = null;
		#absentCheckInterval = null;
		#birthdayLoadTimeout = null;
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
			clearTimeout(this.#absentCheckTimeout);
			clearInterval(this.#absentCheckInterval);
			this.#absentCheckTimeout = null;
			this.#absentCheckInterval = null;
			clearTimeout(this.#birthdayLoadTimeout);
			clearInterval(this.#birthdayLoadInterval);
			this.#birthdayLoadTimeout = null;
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
			if (this.#absentCheckTimeout || this.#absentCheckInterval) {
				return;
			}
			this.#absentCheckTimeout = setTimeout(() => {
				this.#absentCheckTimeout = null;
				this.#checkAbsentList();
				this.#absentCheckInterval = setInterval(() => {
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

		/**
		 * Birthday marks belong to the day they were computed for. Which recent list is on screen the
		 * status library does not know, so it announces the new day and the list reloads itself.
		 */
		#emitDayChanged() {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.dayChanged);
		}
		#startBirthdayLoadInterval() {
			if (this.#birthdayLoadTimeout || this.#birthdayLoadInterval) {
				return;
			}
			this.#birthdayLoadTimeout = setTimeout(() => {
				this.#birthdayLoadTimeout = null;
				this.#emitDayChanged();
				this.#birthdayLoadInterval = setInterval(() => {
					this.#emitDayChanged();
				}, DAY);
			}, im_v2_lib_utils.Utils.date.getTimeToNextMidnight());
		}
	}

	exports.UserStatusManager = UserStatusManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=user-status.bundle.js.map
