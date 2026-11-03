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
	onPopupView(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoView);
	}

	onButtonClick(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoButtonClick);
	}

	onPopupClose(): void
	{
		this.#sendData(AnalyticsEvent.bitrixGptAgentPromoClose);
	}

	#sendData(event: string): void
	{
		sendData({
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.popups,
			type: AnalyticsType.ahaSpringRelease2026,
			c_section: AnalyticsSection.im,
			event,
		});
	}
}
