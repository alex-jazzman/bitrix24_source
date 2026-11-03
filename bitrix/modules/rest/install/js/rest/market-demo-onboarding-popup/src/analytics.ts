import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { type MarketDemoOnboardingAnalyticsEvent } from './types';

type AnalyticsSender = (data: AnalyticsOptions) => void;

export class MarketDemoOnboardingAnalytics
{
	#sender: AnalyticsSender;

	constructor(sender: AnalyticsSender = sendData)
	{
		this.#sender = sender;
	}

	sendShow(): void
	{
		this.#send('show');
	}

	sendClose(): void
	{
		this.#send('close');
	}

	sendDownload(): void
	{
		this.#send('download');
	}

	#send(event: MarketDemoOnboardingAnalyticsEvent): void
	{
		try
		{
			this.#sender({
				tool: 'infohelper',
				category: 'popup',
				type: 'market-demo-onboarding-popup',
				event,
			});
		}
		catch
		{
			// Analytics must not affect the popup flow.
		}
	}
}
