import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsTool,
	AnalyticsEvent,
	AnalyticsType,
	AnalyticsSection,
} from '../const';

export class Settings
{
	onOpenHotkeySection(): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.openSettings,
			type: AnalyticsType.hotkeys,
			c_section: AnalyticsSection.settings,
		});
	}

	onOpenFromFolderMenu(): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.openSettings,
			c_section: AnalyticsSection.folderMenu,
		});
	}
}
