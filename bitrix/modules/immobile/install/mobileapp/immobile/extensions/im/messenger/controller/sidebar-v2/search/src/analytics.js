/**
 * @module im/messenger/controller/sidebar-v2/search/src/analytics
 */
jn.define('im/messenger/controller/sidebar-v2/search/src/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const/analytics');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

	const toLocalMidnight = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

	/**
	 * Full days between the picked day and today in the calendar of the user: both ends are reduced
	 * to local midnight, so rounding absorbs the 23- and 25-hour days of a daylight saving change.
	 * An unusable day gives null - the caller drops the label instead of sending `daysCnt_NaN`.
	 * Mirrors the helper of the same event on the web.
	 *
	 * @param {DateNavigationDay} day - `Y-m-d` in the calendar of the user
	 * @param {Date} [today]
	 * @return {number|null}
	 */
	const getDaysFromToday = (day, today = new Date()) => {
		const [year, month, date] = String(day ?? '').split('-').map((part) => Number.parseInt(part, 10));
		const picked = new Date(year, month - 1, date);

		if (Number.isNaN(picked.getTime()))
		{
			return null;
		}

		return Math.round((toLocalMidnight(today).getTime() - toLocalMidnight(picked).getTime()) / MILLISECONDS_IN_DAY);
	};

	/**
	 * @class SidebarSearchAnalytics
	 */
	class SidebarSearchAnalytics
	{
		constructor(dialogHelper)
		{
			this.dialogHelper = dialogHelper;

			this.analytics = this.getCommonAnalyticsData();
		}

		get isAllowedAnalytics()
		{
			return true;
		}

		/**
		 * Bare chat type, the one `p1` carries with the `chatType_` prefix. Only the jump to a date
		 * reports it as a field of its own - that is how the go-to-date event is built.
		 *
		 * @return {string}
		 */
		get chatType()
		{
			const dialog = this.dialogHelper?.dialogModel;

			return dialog ? AnalyticsHelper.getTypeByDialog(dialog) : Analytics.Type.Dialog.custom;
		}

		sendOpenSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.openSearch)
			;
			this.sendEvent(event);
		}

		sendStartSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.startSearch)
			;
			this.sendEvent(event);
		}

		sendSearchResultEventNotFound()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.searchResult)
				.setStatus(Analytics.Status.notFound)
			;
			this.sendEvent(event);
		}

		sendSearchResultEventSuccess()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.searchResult)
				.setStatus(Analytics.Status.success)
			;
			this.sendEvent(event);
		}

		sendCancelSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.cancelSearch)
			;
			this.sendEvent(event);
		}

		/**
		 * The first result is `position_1`: the analytics owner of the event picked that scale as
		 * the canonical one, and web recentSearch and the emitter of the recent search already
		 * count it so. The list index of this one used to start the same event at zero.
		 *
		 * @param {number} position - index of the result in the list
		 */
		sendSelectSearchResultEvent(position)
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.selectSearchResult)
				.setP3(`position_${position + 1}`)
			;
			this.sendEvent(event);
		}

		/**
		 * Owner of the event is the web: the fields and the format of their values are read from
		 * there. Sent at the start of the jump, so it counts attempts and not hits. The only event
		 * of the wrapper that replaces the section of the panel: it reports the entry it was
		 * started from instead.
		 *
		 * @param {{ entryPoint: string, day: DateNavigationDay }} params
		 */
		sendGoToDateEvent({ entryPoint, day })
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.goToDate)
				.setType(this.chatType)
				.setSection(entryPoint)
			;

			const daysFromToday = getDaysFromToday(day);
			if (daysFromToday !== null)
			{
				event.setP2(`daysCnt_${daysFromToday}`);
			}

			this.sendEvent(event);
		}

		sendBackToSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.backToSearch);
			this.sendEvent(event);
		}

		/**
		 * @param {AnalyticsEvent} event
		 */
		sendEvent(event)
		{
			if (this.isAllowedAnalytics)
			{
				event.send();
			}
		}

		getCommonAnalyticsData()
		{
			// Project-aware resolvers, as in the rest of the emitters: a chat under a project
			// reports category project, a project root chat reports p1 chatType_project.
			// getP1ByDialog also covers the AI assistant and notes branches. For the search events the
			// chat type lives in p1 only, mirroring web MessageSearch; the jump to a date adds the
			// bare type of its own, because the go-to-date event asks for it, and overrides the
			// section set here with its entry point.
			const dialog = this.dialogHelper?.dialogModel;

			return new AnalyticsEvent()
				.setTool('im')
				.setCategory(AnalyticsHelper.getCategoryByChat(dialog))
				.setSection(Analytics.Section.chatSidebar)
				.setP1(dialog ? AnalyticsHelper.getP1ByDialog(dialog) : `chatType_${Analytics.Type.Dialog.custom}`)
			;
		}
	}

	module.exports = {
		SidebarSearchAnalytics,
		AnalyticsEvent,
	};
});
