import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsTool,
	AnalyticsType,
} from '../const';

export class SyncTabBanner
{
	onBannerView(): void
	{
		this.#sendData(AnalyticsEvent.syncTabBannerView);
	}

	onButtonClick(): void
	{
		this.#sendData(AnalyticsEvent.syncTabBannerButtonClick);
	}

	#sendData(event: string): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.syncPopup,
			type: AnalyticsType.syncTabPromo,
			event,
		});
	}
}
