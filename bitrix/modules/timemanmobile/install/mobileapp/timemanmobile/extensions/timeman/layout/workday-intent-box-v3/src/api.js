/**
 * @module timeman/layout/workday-intent-box-v3/src/api
 */
jn.define('timeman/layout/workday-intent-box-v3/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Moment } = require('utils/date');

	function startWorkday()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timeman.V2.Record.start')
				.enableJson()
				.setHandler((response) => (response?.status === 'success' ? resolve(response.data) : resolve(null)))
				.call()
			;
		});
	}

	function addAbsence(absenceType, shifts)
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timemanmobile.WorkdayIntent.addAbsence', { absenceType, shifts })
				.setHandler((response) => {
					resolve({
						isSuccess: response?.status === 'success',
						errors: response?.data?.errors ?? [],
					});
				})
				.call()
			;
		});
	}

	/**
	 * Bounds of the calendar month the way the work days screen gets them: the device time zone
	 * decides the month on both sides, which is what makes the counter and that screen agree.
	 *
	 * @return {{ dateFrom: number, dateTo: number }} bounds in seconds
	 */
	function getCurrentMonthRange()
	{
		const moment = new Moment();

		return {
			dateFrom: new Moment(moment.startOfMonth.date.getTime()).timestamp,
			dateTo: new Moment(moment.endOfMonth.date.getTime()).timestamp,
		};
	}

	/**
	 * @return {Promise<number>} shifts of the current month, zero when the counter is unavailable
	 */
	function getMonthShiftCount()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timemanmobile.WorkDays.getMonthRecordCount', getCurrentMonthRange())
				.setHandler((response) => resolve(
					response?.status === 'success' ? Number(response.data?.count) || 0 : 0,
				))
				.call()
			;
		});
	}

	module.exports = {
		startWorkday,
		addAbsence,
		getMonthShiftCount,
	};
});
