/**
 * @module calendar/onboarding/src/condition
 */
jn.define('calendar/onboarding/src/condition', (require, exports, module) => {
	const { ConditionBase } = require('onboarding/condition');
	const { Type } = require('type');

	class Condition extends ConditionBase
	{
		static hasSync()
		{
			return (context) => {
				const services = context?.syncInfo;
				if (!services || !Type.isObject(services))
				{
					return false;
				}

				return Object.values(services).some((service) => (
					service && Type.isObject(service) && Object.values(service).includes(true)
				));
			};
		}

		static hasCalendarEventsAtLeast(minCount)
		{
			return (context) => {
				return context?.events >= minCount;
			};
		}

		static shouldShowNewMenuHint()
		{
			return (context) => {
				return !env.isCollaber;
			};
		}

		static shouldShowSyncErrorHint()
		{
			return (context) => {
				return !env.isCollaber && context?.moreMenuHasCounters;
			};
		}
	}

	module.exports = {
		Condition,
	};
});