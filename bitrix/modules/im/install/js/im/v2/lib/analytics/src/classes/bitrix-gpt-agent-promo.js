import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsTool,
	AnalyticsType,
} from '../const';

export class BitrixGptAgentPromo
{
	onBannerView(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoView);
	}

	onButtonClick(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoButtonClick);
	}

	onBannerClose(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoClose);
	}

	#sendData(event: string): void
	{
		sendData({
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.banners,
			type: AnalyticsType.ahaSpringRelease2026,
			c_section: AnalyticsSection.im,
			event,
		});
	}
}
