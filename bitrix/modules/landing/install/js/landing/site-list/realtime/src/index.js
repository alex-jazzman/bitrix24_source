import {refreshSiteList} from './feature/refresh-site-list/refresh-site-list';
import {subscribeToSiteChanged} from './infrastructure/realtime/subscribe';

const REFRESH_DEBOUNCE_TIMEOUT = 500;

const log = (...args) => {
	if (typeof console !== 'undefined' && typeof console.info === 'function')
	{
		console.info('[LandingSiteListRealtime]', ...args);
	}
};

export class SiteListRealtime
{
	static isInitialized = false;
	static refreshTimeout = null;

	static init(siteChangedSubscriber: Function = subscribeToSiteChanged): void
	{
		log('Init called', {
			isInitialized: this.isInitialized,
		});

		if (this.isInitialized)
		{
			return;
		}

		this.isInitialized = true;
		log('Subscribing to site.changed');
		siteChangedSubscriber((payload) => {
			log('site.changed payload received', payload);

			if (payload.entityType !== 'site')
			{
				log('Payload ignored by entityType', payload.entityType);

				return;
			}

			this.scheduleRefresh();
		});
	}

	static scheduleRefresh(): void
	{
		if (this.refreshTimeout)
		{
			log('Resetting pending refresh debounce');
			clearTimeout(this.refreshTimeout);
		}

		log('Scheduling refresh', {
			timeout: REFRESH_DEBOUNCE_TIMEOUT,
		});
		this.refreshTimeout = setTimeout(() => {
			this.refreshTimeout = null;
			log('Debounced refresh fired');
			refreshSiteList();
		}, REFRESH_DEBOUNCE_TIMEOUT);
	}
}

SiteListRealtime.init();

export const __testHooks = {
	reset(): void
	{
		if (SiteListRealtime.refreshTimeout)
		{
			clearTimeout(SiteListRealtime.refreshTimeout);
		}

		SiteListRealtime.isInitialized = false;
		SiteListRealtime.refreshTimeout = null;
	},
};
