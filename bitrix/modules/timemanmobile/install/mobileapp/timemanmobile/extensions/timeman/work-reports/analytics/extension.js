/**
 * @module timeman/work-reports/analytics
 */
jn.define('timeman/work-reports/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const TOOL = 'checkin';
	const CATEGORY = 'work_report';
	const SETTINGS_CATEGORY = 'settings';

	const SECTION = 'checkin';
	const ELEMENT = 'reports_tab';

	class WorkReportsAnalytics
	{
		/**
		 * @param {boolean} hasComment
		 */
		static sendReportSent(hasComment)
		{
			const p1 = hasComment ? 'comment_y' : 'comment_n';
			this.#send(CATEGORY, 'report_sent', { section: SECTION, element: ELEMENT, p1 });
		}

		static sendReportDiscuss()
		{
			this.#send(CATEGORY, 'report_discuss', { section: SECTION, element: ELEMENT });
		}

		/**
		 * @param {boolean} enabled
		 */
		static sendPlanReportsToggle(enabled)
		{
			const type = enabled ? 'turn_on' : 'turn_off';
			this.#send(SETTINGS_CATEGORY, 'plan_reports', { type });
		}

		/**
		 * @private
		 */
		static #send(category, event, { type, section, element, p1 } = {})
		{
			const analytics = new AnalyticsEvent()
				.setTool(TOOL)
				.setCategory(category)
				.setEvent(event);

			if (typeof type === 'string' && type.length > 0)
			{
				analytics.setType(type);
			}

			if (typeof section === 'string' && section.length > 0)
			{
				analytics.setSection(section);
			}

			if (typeof element === 'string' && element.length > 0)
			{
				analytics.setElement(element);
			}

			if (typeof p1 === 'string' && p1.length > 0)
			{
				analytics.setP1(p1);
			}

			analytics.send();
		}
	}

	module.exports = { WorkReportsAnalytics };
});
