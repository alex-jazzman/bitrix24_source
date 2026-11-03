/**
 * @module timeman/work-days/api
 */
jn.define('timeman/work-days/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const DAY_IN_SECONDS = 86400;

	const fetchWorkDaysData = ({ userId, dateFrom, dateTo, onCache }) => {
		const executor = new RunActionExecutor(
			'timemanmobile.WorkDays.getData',
			{ userId, dateFrom, dateTo },
		)
			.setCacheTtl(DAY_IN_SECONDS)
			.setHandler((response) => response);

		if (onCache)
		{
			executor.setCacheHandler(onCache);
		}

		return executor.call(true);
	};

	module.exports = { fetchWorkDaysData };
});
