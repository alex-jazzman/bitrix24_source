import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsSubSection,
	AnalyticsType,
} from '../const';
import { getCallTool } from '../utils';

export class Sync
{
	onOpenSection()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.openSection,
			type: AnalyticsType.sync,
		});
	}

	onStartCallClick()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.clickCallButton,
			type: AnalyticsType.video,
			c_section: AnalyticsSection.syncPage,
			c_sub_section: AnalyticsSubSection.mainButton,
		});
	}

	onJoinClick()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.clickJoin,
			type: AnalyticsType.video,
			c_section: AnalyticsSection.syncPage,
		});
	}

	onJoinCall()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.joinCall,
			type: AnalyticsType.video,
			c_section: AnalyticsSection.syncPage,
		});
	}

	onCreateEventClick()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.clickCreateEvent,
			c_section: AnalyticsSection.syncPage,
		});
	}

	onOpenSlotsClick()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.clickOpenSlots,
			c_section: AnalyticsSection.syncPage,
		});
	}

	onBookingClick()
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.sync,
			event: AnalyticsEvent.clickBooking,
			c_section: AnalyticsSection.syncPage,
		});
	}
}
