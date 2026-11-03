/**
 * @module timeman/layout/workday-intent-box/src/api
 */
jn.define('timeman/layout/workday-intent-box/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	function startWorkday()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timeman.V2.Record.start')
				.enableJson()
				.setHandler((response) => (response?.status === 'success' ? resolve(response.data) : resolve(null)))
				.call()
				.catch(console.error)
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

	module.exports = {
		startWorkday,
		addAbsence,
	};
});
