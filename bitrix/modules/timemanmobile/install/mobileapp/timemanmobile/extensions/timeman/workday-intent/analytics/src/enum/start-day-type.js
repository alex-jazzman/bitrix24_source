/**
 * @module timeman/workday-intent/analytics/src/enum/start-day-type
 */
jn.define('timeman/workday-intent/analytics/src/enum/start-day-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class StartDayTypeEnum
	 */
	class StartDayTypeEnum extends BaseEnum
	{
		static WORK_DAY = new StartDayTypeEnum('WORK_DAY', 'work_day');
		static WEEKEND = new StartDayTypeEnum('WEEKEND', 'weekend');
		static DAY_OFF = new StartDayTypeEnum('DAY_OFF', 'day_off');
		static VACATION_DAY = new StartDayTypeEnum('VACATION_DAY', 'vacation_day');
		static SICK_DAY = new StartDayTypeEnum('SICK_DAY', 'sick_day');
	}

	module.exports = { StartDayTypeEnum };
});
