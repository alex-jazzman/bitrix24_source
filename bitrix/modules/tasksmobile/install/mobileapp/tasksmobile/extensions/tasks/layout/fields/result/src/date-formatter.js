/**
 * @module tasks/layout/fields/result/date-formatter
 */
jn.define('tasks/layout/fields/result/date-formatter', (require, exports, module) => {
	const { Moment } = require('utils/date');
	const { dayMonth, longDate, shortTime } = require('utils/date/formats');

	function getFormattedTaskResultDate(sourceDate)
	{
		if (!sourceDate)
		{
			return '';
		}

		const date = new Moment(sourceDate * 1000);
		const dateFormat = (date.inThisYear ? dayMonth : longDate);

		return date.format(`${dateFormat()}, ${shortTime()}`);
	}

	module.exports = { getFormattedTaskResultDate };
});
