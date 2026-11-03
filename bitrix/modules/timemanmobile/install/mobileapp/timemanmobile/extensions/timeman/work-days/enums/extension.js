/**
 * @module timeman/work-days/enums
 */
jn.define('timeman/work-days/enums', (require, exports, module) => {
	const { Color } = require('tokens');

	const DAY_TYPES = {
		WORK: {
			id: 'work',
			color: Color.accentMainSuccess.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
			messageKey: 'M_TIMEMAN_WORK_DAYS_LEGEND_WORK',
		},
		SICK_LEAVE: {
			id: 'sickLeave',
			color: Color.accentMainAlert.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
			messageKey: 'M_TIMEMAN_WORK_DAYS_LEGEND_SICK_LEAVE',
		},
		VACATION: {
			id: 'vacation',
			color: Color.accentMainPrimary.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
			messageKey: 'M_TIMEMAN_WORK_DAYS_LEGEND_VACATION',
		},
		TIME_OFF: {
			id: 'timeOff',
			color: Color.accentMainWarning.toHex(),
			textColor: Color.baseWhiteFixed.toHex(),
			messageKey: 'M_TIMEMAN_WORK_DAYS_LEGEND_TIME_OFF',
		},
		DAY_OFF: {
			id: 'dayOff',
			color: Color.base7.toHex(),
			textColor: Color.base3.toHex(),
			messageKey: 'M_TIMEMAN_WORK_DAYS_LEGEND_DAY_OFF',
		},
	};

	const ABSENCE_TYPE_MAP = {
		VACATION: DAY_TYPES.VACATION,
		LEAVESICK: DAY_TYPES.SICK_LEAVE,
		LEAVEMATERINITY: DAY_TYPES.VACATION,
		LEAVEUNPAYED: DAY_TYPES.TIME_OFF,
		ASSIGNMENT: DAY_TYPES.WORK,
	};

	/**
	 * @param {string} absenceTypeXmlId
	 * @returns {Object}
	 */
	function getDayTypeByAbsence(absenceTypeXmlId)
	{
		return ABSENCE_TYPE_MAP[absenceTypeXmlId] || DAY_TYPES.DAY_OFF;
	}

	module.exports = {
		DAY_TYPES,
		ABSENCE_TYPE_MAP,
		getDayTypeByAbsence,
	};
});
