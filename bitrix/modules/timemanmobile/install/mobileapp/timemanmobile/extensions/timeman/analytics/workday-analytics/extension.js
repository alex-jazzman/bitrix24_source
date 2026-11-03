/**
 * @module timeman/analytics/workday-analytics
 */
jn.define('timeman/analytics/workday-analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const TOOL = 'timeman';
	const CATEGORY = 'workday';

	const STATE_TRANSITION_MAP = {
		not_started: {
			opened: 'sendStartDay',
		},
		opened: {
			paused: 'sendPauseDay',
			closed: 'sendFinishDay',
		},
		paused: {
			opened: 'sendResumeDay',
			closed: 'sendFinishDay',
		},
		closed: {
			opened: 'sendReopenDay',
		},
	};

	class WorkdayAnalytics
	{
		/**
		 * @param {string} prevState
		 * @param {string} newState
		 * @param {string} section
		 * @param {string} element
		 */
		static handleStateChange(prevState, newState, section, element)
		{
			const method = STATE_TRANSITION_MAP[prevState]?.[newState];
			if (method)
			{
				WorkdayAnalytics[method](section, element);
			}
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendStartDay(section, element)
		{
			this.#send('start_day', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendPauseDay(section, element)
		{
			this.#send('break_start', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendResumeDay(section, element)
		{
			this.#send('resume_day', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendFinishDay(section, element)
		{
			this.#send('finish_day', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendReopenDay(section, element)
		{
			this.#send('reopen_day', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 */
		static sendDaySummaryOpen(section, element)
		{
			this.#send('day_summary_open', { section, element });
		}

		/**
		 * @param {string} section
		 * @param {string} element
		 * @param {boolean} hasComment
		 */
		static sendDaySummarySave(section, element, hasComment)
		{
			const p1 = hasComment ? 'comment_y' : 'comment_n';
			this.#send('day_summary_save', { section, element, p1 });
		}

		/**
		 * @private
		 */
		static #send(event, { section, element, p1 })
		{
			const analytics = new AnalyticsEvent()
				.setTool(TOOL)
				.setCategory(CATEGORY)
				.setEvent(event);

			if (section)
			{
				analytics.setSection(section);
			}

			if (element)
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

	module.exports = { WorkdayAnalytics };
});
