import { sendData } from 'ui.analytics';

import { AnalyticsCategory, AnalyticsTool, AnalyticsEvent, AnalyticsType } from '../const';

export class DesktopUpdateBanner
{
	onShow()
	{
		sendData(this.#buildAnalyticsData(AnalyticsEvent.view));
	}

	onClickUpdate()
	{
		sendData(this.#buildAnalyticsData(AnalyticsEvent.clickUpdate));
	}

	onClickMoreInformation()
	{
		sendData(this.#buildAnalyticsData(AnalyticsEvent.clickMoreInformation));
	}

	onOpenWebVersion()
	{
		sendData(this.#buildAnalyticsData(AnalyticsEvent.goToWeb));
	}

	#buildAnalyticsData(event: string): { [key: string]: string }
	{
		return {
			tool: AnalyticsTool.inform,
			category: AnalyticsCategory.updateAppPopup,
			event,
			type: AnalyticsType.may25DesktopRelease,
		};
	}
}
