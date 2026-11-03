/**
 * @module timeman/work-reports/settings/src/api
 */
jn.define('timeman/work-reports/settings/src/api', (require, exports, module) => {
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
	 * @returns {Promise<WorkReportsSettingsData|null>}
	 */
	function loadSettings()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('timemanmobile.WorkReport.getSettings')
				.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
				.call()
				.catch(console.error)
			;
		});
	}

	function enableWorkReportOption()
	{
		return runVoidAction('timemanmobile.WorkReport.enableWorkReportOption');
	}

	function disableWorkReportOption()
	{
		return runVoidAction('timemanmobile.WorkReport.disableWorkReportOption');
	}

	module.exports = {
		loadSettings,
		enableWorkReportOption,
		disableWorkReportOption,
	};
});
