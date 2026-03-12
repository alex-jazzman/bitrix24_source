/**
 * @module intranet/simple-list/items/user-redux/src/actions/src/utils
 */
jn.define('intranet/simple-list/items/user-redux/src/actions/src/utils', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { isModuleInstalled } = require('module');

	const isRequestAdminFireEnabled = () => {
		return new Promise((resolve) => {
			if (!isModuleInstalled('bitrix24'))
			{
				resolve(false);

				return;
			}

			new RunActionExecutor('bitrix24.v2.FirstAdmin.FirstAdminRightsController.isFirstAdminConfirmationEnabled')
				.setHandler((response) => resolve(response.data?.isFirstAdminConfirmationEnabled))
				.call()
			;
		});
	};

	module.exports = {
		isRequestAdminFireEnabled,
	};
});
