/**
 * @module timeman/work-days/analytics
 */
jn.define('timeman/work-days/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const TOOL = 'checkin';
	const SETTINGS_CATEGORY = 'settings';

	class WorkDaysAnalytics
	{
		/**
		 * @param {boolean} enabled
		 */
		static sendWorkShiftsToggle(enabled)
		{
			const type = enabled ? 'turn_on' : 'turn_off';
			this.#send('work_shifts', { type });
		}

		/**
		 * @private
		 */
		static #send(event, { type } = {})
		{
			const analytics = new AnalyticsEvent()
				.setTool(TOOL)
				.setCategory(SETTINGS_CATEGORY)
				.setEvent(event);

			if (typeof type === 'string' && type.length > 0)
			{
				analytics.setType(type);
			}

			analytics.send();
		}
	}

	module.exports = { WorkDaysAnalytics };
});
