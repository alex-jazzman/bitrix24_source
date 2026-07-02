/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
(function (exports, ui_bannerDispatcher, ui_autoLaunch, main_core) {
	'use strict';

	const Priority = {
		LOW: 'low',
		NORMAL: 'normal',
		HIGH: 'high',
		CRITICAL: 'critical'
	};
	class BannerDispatcher {
		#isBannerDispatcherDefined;
		constructor() {
			this.#isBannerDispatcherDefined = main_core.Type.isPlainObject(ui_bannerDispatcher.BannerDispatcher);
		}
		isAvailable() {
			return this.#isBannerDispatcherDefined;
		}
		toQueue(callback, priority = Priority.NORMAL, options = {}) {
			if (!this.isAvailable()) {
				callback(() => {});
				return false;
			}
			const bannerDispatcher = ui_bannerDispatcher.BannerDispatcher[priority];
			if (!this.#isCorrectBannerDispatcher(bannerDispatcher)) {
				throw new RangeError('Priority property is invalid');
			}
			bannerDispatcher.toQueue(callback, options);
			return true;
		}
		#isCorrectBannerDispatcher(bannerDispatcher) {
			return main_core.Type.isPlainObject(bannerDispatcher) && Object.prototype.hasOwnProperty.call(bannerDispatcher, 'toQueue');
		}
	}

	exports.BannerDispatcher = BannerDispatcher;
	exports.Priority = Priority;

})(this.BX.Crm.Integration.UI = this.BX.Crm.Integration.UI || {}, BX.UI, BX.UI.AutoLaunch, BX);
//# sourceMappingURL=banner-dispatcher.bundle.js.map
