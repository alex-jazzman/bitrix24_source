/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk/src/data-provider
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk/src/data-provider', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	function loadFeatureRestrictions()
	{
		return new Promise((resolve) => {
			const handler = (response) => {
				resolve(response);
			};

			(new RunActionExecutor('tasksmobile.FeatureRestriction.getFeatureRestrictions'))
				.setHandler(handler)
				.call(false)
			;
		});
	}

	module.exports = {
		loadFeatureRestrictions,
	};
});
