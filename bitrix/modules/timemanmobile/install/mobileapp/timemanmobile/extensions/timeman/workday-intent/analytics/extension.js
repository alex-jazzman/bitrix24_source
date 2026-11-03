/**
 * @module timeman/workday-intent/analytics
 */
jn.define('timeman/workday-intent/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { BaseEnum } = require('utils/enums/base');
	const { StartDayTypeEnum } = require('timeman/workday-intent/analytics/src/enum/start-day-type');

	const TOOL = 'timeman';
	const CATEGORY = 'workday';
	const SECTION = 'timeman';
	const ELEMENT = 'start_day_popup';

	class StartDayPopupAnalytics
	{
		static sendPopupOpen()
		{
			this.#send('popup_open');
		}

		/**
		 * @param {StartDayTypeEnum} type
		 */
		static sendStartDay(type)
		{
			this.#send('start_day', { type });
		}

		static sendRemindLater()
		{
			this.#send('remind_later');
		}

		static sendAdviceClick()
		{
			this.#send('advice_click');
		}

		/**
		 * @private
		 * @param {string} event
		 * @param {{type?: BaseEnum}} [params]
		 */
		static #send(event, { type } = {})
		{
			const analytics = new AnalyticsEvent()
				.setTool(TOOL)
				.setCategory(CATEGORY)
				.setEvent(event)
				.setSection(SECTION)
				.setElement(ELEMENT);

			if (type instanceof BaseEnum)
			{
				analytics.setType(type.getValue());
			}

			analytics.send();
		}
	}

	module.exports = {
		StartDayPopupAnalytics,
		StartDayTypeEnum,
	};
});
