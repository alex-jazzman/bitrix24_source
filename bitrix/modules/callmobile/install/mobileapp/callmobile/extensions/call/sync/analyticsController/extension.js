/**
 * @module call/sync/analyticsController
 */
jn.define('call/sync/analyticsController', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('call/const');

	class SyncAnalyticsController
	{
		static sendStartCall()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.clickCallButton)
				.setType(Analytics.AnalyticsType.video)
				.setSection(Analytics.AnalyticsSection.syncPage)
				.setSubSection(Analytics.AnalyticsSubSection.mainButton)
				.send()
			;
		}

		static sendClickJoin()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.clickJoin)
				.setType(Analytics.AnalyticsType.video)
				.setSection(Analytics.AnalyticsSection.syncPage)
				.send()
			;
		}

		static sendJoinCall()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.joinCall)
				.setType(Analytics.AnalyticsType.video)
				.setSection(Analytics.AnalyticsSection.syncPage)
				.send()
			;
		}

		static sendClickCreateEvent()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.clickCreateEvent)
				.setSection(Analytics.AnalyticsSection.syncPage)
				.send()
			;
		}

		static sendClickOpenSlots()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.clickOpenSlots)
				.setSection(Analytics.AnalyticsSection.syncPage)
				.send()
			;
		}

		static sendOpenSyncTab()
		{
			new AnalyticsEvent()
				.setTool(Analytics.AnalyticsTool.im)
				.setCategory(Analytics.AnalyticsCategory.sync)
				.setEvent(Analytics.AnalyticsEvent.openSyncTab)
				.send()
			;
		}

		static sendOpenSection({ type, section })
		{
			const event = new AnalyticsEvent();
			event.setTool(Analytics.AnalyticsTool.im);
			event.setCategory(Analytics.AnalyticsCategory.sync);
			event.setEvent(Analytics.AnalyticsEvent.openSection);
			event.setType(type);

			if (section !== undefined && section !== null)
			{
				event.setSection(section);
			}

			event.send();
		}
	}

	module.exports = { SyncAnalyticsController };
});
