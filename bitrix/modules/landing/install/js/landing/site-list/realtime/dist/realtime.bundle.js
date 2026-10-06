/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.SiteList = this.BX.Landing.SiteList || {};
(function (exports, landing_realtime) {
	'use strict';

	const REFRESH_DEBOUNCE_TIMEOUT = 500;
	const log = (...args) => {
		if (typeof console !== 'undefined' && typeof console.info === 'function') {
			console.info('[LandingSiteListRealtime]', ...args);
		}
	};
	const getTopBx = () => {
		try {
			return top?.BX || BX;
		} catch (error) {
			return BX;
		}
	};
	const refreshSiteList = () => {
		const bx = getTopBx();
		if (bx && typeof bx.onCustomEvent === 'function') {
			log('Calling BX.Landing.Filter:apply');
			bx.onCustomEvent('BX.Landing.Filter:apply');
			return;
		}
		log('Cannot refresh: BX.onCustomEvent is unavailable', {
			hasBx: Boolean(bx),
			onCustomEventType: typeof bx?.onCustomEvent
		});
	};
	const subscribeToSiteChanged = handler => {
		return landing_realtime.Realtime.subscribe('site.changed', handler);
	};
	class SiteListRealtime {
		static isInitialized = false;
		static refreshTimeout = null;
		static init(siteChangedSubscriber = subscribeToSiteChanged) {
			log('Init called', {
				isInitialized: this.isInitialized
			});
			if (this.isInitialized) {
				return;
			}
			this.isInitialized = true;
			log('Subscribing to site.changed');
			siteChangedSubscriber(payload => {
				log('site.changed payload received', payload);
				if (payload.entityType !== 'site') {
					log('Payload ignored by entityType', payload.entityType);
					return;
				}
				this.scheduleRefresh();
			});
		}
		static scheduleRefresh() {
			if (this.refreshTimeout) {
				log('Resetting pending refresh debounce');
				clearTimeout(this.refreshTimeout);
			}
			log('Scheduling refresh', {
				timeout: REFRESH_DEBOUNCE_TIMEOUT
			});
			this.refreshTimeout = setTimeout(() => {
				this.refreshTimeout = null;
				log('Debounced refresh fired');
				refreshSiteList();
			}, REFRESH_DEBOUNCE_TIMEOUT);
		}
	}
	SiteListRealtime.init();
	const __testHooks = {
		reset() {
			if (SiteListRealtime.refreshTimeout) {
				clearTimeout(SiteListRealtime.refreshTimeout);
			}
			SiteListRealtime.isInitialized = false;
			SiteListRealtime.refreshTimeout = null;
		}
	};

	exports.SiteListRealtime = SiteListRealtime;
	exports.__testHooks = __testHooks;

})(this.BX.Landing.SiteList = this.BX.Landing.SiteList || {}, BX.Landing);
