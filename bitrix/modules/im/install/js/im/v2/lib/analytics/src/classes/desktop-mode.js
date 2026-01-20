import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsTool,
	AnalyticsEvent,
	AnalyticsType,
	AnalyticsSection,
} from '../const';

export class DesktopMode
{
	onBannerShow()
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.viewPopup,
			type: AnalyticsType.selectAppMode,
		});
	}

	onBannerOneWindowEnable()
	{
		sendData(this.#buildModeEnableData(AnalyticsType.oneWindow, AnalyticsSection.popup));
	}

	onBannerTwoWindowEnable()
	{
		sendData(this.#buildModeEnableData(AnalyticsType.twoWindow, AnalyticsSection.popup));
	}

	onSettingsOneWindowEnable()
	{
		sendData(this.#buildModeEnableData(AnalyticsType.oneWindow, AnalyticsSection.settings));
	}

	onSettingsTwoWindowEnable()
	{
		sendData(this.#buildModeEnableData(AnalyticsType.twoWindow, AnalyticsSection.settings));
	}

	#buildModeEnableData(type: string, section: string): { [key: string]: string }
	{
		return {
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.selectAppMode,
			type,
			c_section: section,
		};
	}
}
