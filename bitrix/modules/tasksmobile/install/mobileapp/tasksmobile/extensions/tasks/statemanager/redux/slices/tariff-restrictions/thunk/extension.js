/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions/thunk
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions/thunk', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { sliceName } = require('tasks/statemanager/redux/slices/tariff-restrictions/meta');

	const fetch = createAsyncThunk(
		`${sliceName}/fetch`,
		() => new Promise((resolve) => {
			(new RunActionExecutor('tasksmobile.TariffRestriction.getTariffRestrictions'))
				.setHandler(resolve)
				.call(false)
			;
		}),
	);

	module.exports = { fetch };
});
