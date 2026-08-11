import { sendData } from 'ui.analytics';

import { AnalyticsTool, AnalyticsCategory } from 'booking.const';

import { type BannerViewAiCallAnalyticsOptions, type BannerClickAiCallAnalyticsOptions, type BannerCloseAiCallAnalyticsOptions } from './types';

export class AiCallBannerAnalytics
{
	static sendBannerView(): void
	{
		const options: BannerViewAiCallAnalyticsOptions = {
			tool: AnalyticsTool.booking,
			category: AnalyticsCategory.banners,
			event: 'banner_view',
			type: 'ai_inform',
		};
		sendData(options);
	}

	static sendBannerClickStartFlow(): void
	{
		const options: BannerClickAiCallAnalyticsOptions = {
			tool: AnalyticsTool.booking,
			category: AnalyticsCategory.banners,
			event: 'banner_click',
			type: 'ai_inform',
			c_element: 'start_flow',
		};
		sendData(options);
	}

	static sendBannerCloseSkip(): void
	{
		const options: BannerCloseAiCallAnalyticsOptions = {
			tool: AnalyticsTool.booking,
			category: AnalyticsCategory.banners,
			event: 'banner_close',
			type: 'ai_inform',
			c_element: 'skip_button',
		};
		sendData(options);
	}

	static sendBannerCloseCross(): void
	{
		const options: BannerCloseAiCallAnalyticsOptions = {
			tool: AnalyticsTool.booking,
			category: AnalyticsCategory.banners,
			event: 'banner_close',
			type: 'ai_inform',
			c_element: 'close_button',
		};
		sendData(options);
	}
}
