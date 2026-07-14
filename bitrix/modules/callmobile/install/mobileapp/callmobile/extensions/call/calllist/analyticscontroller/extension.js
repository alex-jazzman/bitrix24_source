/**
 * @module call/callList/analyticsController
 */
jn.define('call/callList/analyticsController', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, CallLogType } = require('call/const');

	const SCOPE_ANALYTICS_MAP = Object.freeze({
		[CallLogType.Status.MISSED]: Analytics.AnalyticsType.missed,
		[CallLogType.Type.INCOMING]: Analytics.AnalyticsType.incoming,
		[CallLogType.Type.OUTGOING]: Analytics.AnalyticsType.outgoing,
	});

	const SCOPE_SUB_SECTION_MAP = Object.freeze({
		[CallLogType.Status.MISSED]: Analytics.AnalyticsSubSection.missed,
		[CallLogType.Type.INCOMING]: Analytics.AnalyticsSubSection.incoming,
		[CallLogType.Type.OUTGOING]: Analytics.AnalyticsSubSection.outgoing,
		all: Analytics.AnalyticsSubSection.all,
	});

	function getCallType(item)
	{
		const dialogIdRaw = String(item.dialogId || '');
		const isGroup = dialogIdRaw.startsWith('chat') || item.chatType === 'group';

		if (isGroup)
		{
			return Analytics.AnalyticsType.group;
		}

		return Analytics.AnalyticsType.private;
	}

	class CallListAnalyticsController
	{
		static sendOpenCallTab(fromMenu = false)
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.messenger);
			analytics.setEvent(Analytics.AnalyticsEvent.openCallTab);

			if (fromMenu)
			{
				analytics.setSubSection(Analytics.AnalyticsSubSection.menu);
			}

			analytics.send();
		}

		static sendTabChange(scopeId)
		{
			const type = SCOPE_ANALYTICS_MAP[scopeId];
			if (!type)
			{
				return;
			}

			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.callList);
			analytics.setEvent(Analytics.AnalyticsEvent.openTab);
			analytics.setType(type);
			analytics.send();
		}

		static sendCallClick(item, isCallFromSearch = false, scopeId = null)
		{
			const type = getCallType(item);
			const analytics = new AnalyticsEvent();

			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.messenger);
			analytics.setEvent(Analytics.AnalyticsEvent.clickCallButton);
			analytics.setType(type);
			analytics.setSection(Analytics.AnalyticsSection.callTab);

			if (isCallFromSearch)
			{
				analytics.setSubSection(Analytics.AnalyticsSubSection.search);
			}
			else if (scopeId && SCOPE_SUB_SECTION_MAP[scopeId])
			{
				analytics.setSubSection(SCOPE_SUB_SECTION_MAP[scopeId]);
			}

			analytics.send();
		}

		static sendOpenChat()
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.callList);
			analytics.setEvent(Analytics.AnalyticsEvent.openChat);
			analytics.send();
		}

		static sendDeleteCall(item, scopeId = null)
		{
			const type = getCallType(item);
			const analytics = new AnalyticsEvent();

			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.callList);
			analytics.setEvent(Analytics.AnalyticsEvent.removeFromList);
			analytics.setType(type);
			analytics.setSection(Analytics.AnalyticsSection.callTab);

			if (scopeId && SCOPE_SUB_SECTION_MAP[scopeId])
			{
				analytics.setSubSection(SCOPE_SUB_SECTION_MAP[scopeId]);
			}

			analytics.send();
		}

		static sendStartSearch()
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.callList);
			analytics.setEvent(Analytics.AnalyticsEvent.startSearch);
			analytics.setSection(Analytics.AnalyticsSection.callTab);
			analytics.send();
		}

		static sendClickCreate(scopeId = null)
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.callList);
			analytics.setEvent(Analytics.AnalyticsEvent.clickCreate);
			analytics.setSection(Analytics.AnalyticsSection.callTab);

			if (scopeId && SCOPE_SUB_SECTION_MAP[scopeId])
			{
				analytics.setSubSection(SCOPE_SUB_SECTION_MAP[scopeId]);
			}

			analytics.send();
		}

		static sendClickConference()
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.videoconf);
			analytics.setEvent(Analytics.AnalyticsEvent.clickCreate);
			analytics.setType(Analytics.AnalyticsType.videoconf);
			analytics.setSection(Analytics.AnalyticsSection.callTab);
			analytics.send();
		}

		static sendSubmitConference()
		{
			const analytics = new AnalyticsEvent();
			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.videoconf);
			analytics.setEvent(Analytics.AnalyticsEvent.submitCreate);
			analytics.setType(Analytics.AnalyticsType.videoconf);
			analytics.setSection(Analytics.AnalyticsSection.callTab);
			analytics.send();
		}

		static sendClickRecentFromCreation(item)
		{
			const type = getCallType(item);
			const analytics = new AnalyticsEvent();

			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.messenger);
			analytics.setEvent(Analytics.AnalyticsEvent.clickCallButton);
			analytics.setType(type);
			analytics.setSection(Analytics.AnalyticsSection.callTab);
			analytics.setSubSection(Analytics.AnalyticsSubSection.creationBox);
			analytics.send();
		}

		static sendGroupCallCreation()
		{
			const analytics = new AnalyticsEvent();

			analytics.setTool(Analytics.AnalyticsTool.im);
			analytics.setCategory(Analytics.AnalyticsCategory.messenger);
			analytics.setEvent(Analytics.AnalyticsEvent.clickCallButton);
			analytics.setType(Analytics.AnalyticsType.group);
			analytics.setSection(Analytics.AnalyticsSection.callTab);
			analytics.setSubSection(Analytics.AnalyticsSubSection.creationBox);
			analytics.send();
		}
	}

	module.exports = { CallListAnalyticsController };
});
