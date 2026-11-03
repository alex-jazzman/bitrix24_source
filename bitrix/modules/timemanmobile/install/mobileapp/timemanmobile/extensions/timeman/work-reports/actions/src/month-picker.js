/**
 * @module timeman/work-reports/actions/src/month-picker
 */
jn.define('timeman/work-reports/actions/src/month-picker', (require, exports, module) => {
	const { Loc } = require('timeman/work-reports/loc');

	/**
	 * @param {OpenMonthPickerParams} params
	 */
	function openMonthPicker({ timestamp, onPicked } = {})
	{
		dialogs.showDatePicker(
			{
				title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_MONTH_PICKER_TITLE'),
				type: 'monthyear',
				value: timestamp,
				dateFormat: 'LLLL Y',
			},
			(eventName, selectedTimestamp) => {
				if (eventName === 'onPick' && selectedTimestamp)
				{
					onPicked?.(selectedTimestamp);
				}
			},
		);
	}

	module.exports = {
		openMonthPicker,
	};
});
