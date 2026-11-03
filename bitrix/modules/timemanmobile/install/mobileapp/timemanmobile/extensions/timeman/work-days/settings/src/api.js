/**
 * @module timeman/work-days/settings/src/api
 */
jn.define('timeman/work-days/settings/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * @param {string} actionName
	 */
	function runVoidAction(actionName)
	{
		return new Promise((resolve) => {
			void new RunActionExecutor(actionName)
				.setHandler((response) => resolve(response?.status === 'success'))
				.call()
				.catch(console.error)
			;
		});
	}

	/**
	 * @returns {Promise<WorkDaysSettingsData|null>}
	 */
	function loadSettings()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timemanmobile.WorkDays.getSettings')
				.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
				.call()
				.catch(console.error)
			;
		});
	}

	function enableWorkShiftOption()
	{
		return runVoidAction('timemanmobile.WorkDays.enableWorkShiftOption');
	}

	function disableWorkShiftOption()
	{
		return runVoidAction('timemanmobile.WorkDays.disableWorkShiftOption');
	}

	module.exports = {
		loadSettings,
		enableWorkShiftOption,
		disableWorkShiftOption,
	};
});
