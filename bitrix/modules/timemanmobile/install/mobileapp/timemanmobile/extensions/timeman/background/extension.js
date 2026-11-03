/**
 * @module timeman/background
 */
jn.define('timeman/background', (require, exports, module) => {
	const { WorkdayIntent } = require('timeman/workday-intent');
	const { subscribeDayCloseListener } = require('timeman/work-reports/listeners');

	class Background
	{
		static init()
		{
			new WorkdayIntent();
			subscribeDayCloseListener();
		}
	}

	module.exports = { Background };
});
