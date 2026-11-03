/**
 * @module intranet/self-delete/src/dispatcher
 */
jn.define('intranet/self-delete/src/dispatcher', (require, exports, module) => {
	const { PortalDeleteScreen } = require('intranet/self-delete/src/screen/portal-delete');
	const { TransferRightsFreeScreen } = require('intranet/self-delete/src/screen/transfer-rights-free');
	const { TransferRightsPaidScreen } = require('intranet/self-delete/src/screen/transfer-rights-paid');
	const { RequestChatScreen } = require('intranet/self-delete/src/screen/request-chat');

	/**
	 * Scenario values returned by backend.
	 */
	const Scenario = {
		NOT_LAST_ADMIN: 'NotLastAdmin',
		LAST_ADMIN: 'LastAdmin',
		LAST_ADMIN_FREE_LICENSE: 'LastAdminFreeLicense',
		LAST_ADMIN_PAYED_LICENSE: 'LastAdminPayedLicense',
	};

	/**
	 * Maps each scenario to its screen. All 4 enum values must be covered.
	 *
	 * LastAdmin              → portal delete
	 * LastAdminFreeLicense   → transfer rights, free license
	 * LastAdminPayedLicense  → paid license / mailto
	 * NotLastAdmin           → request chat
	 */
	const Screens = {
		[Scenario.LAST_ADMIN]: PortalDeleteScreen,
		[Scenario.LAST_ADMIN_FREE_LICENSE]: TransferRightsFreeScreen,
		[Scenario.LAST_ADMIN_PAYED_LICENSE]: TransferRightsPaidScreen,
		[Scenario.NOT_LAST_ADMIN]: RequestChatScreen,
	};

	/**
	 * Opens the screen matching the backend scenario.
	 *
	 * @param {SelfDeleteOptions} data — full response from getOptionsForCurrentUser
	 * @param {PageManager} parentWidget
	 */
	function dispatch(data, parentWidget)
	{
		const Screen = Screens[data?.scenario];
		if (!Screen)
		{
			// Unknown scenario — log and close safely, no crash.
			console.warn(`intranet/self-delete: unknown scenario "${data?.scenario}", ignoring`);

			return;
		}

		Screen.open(data, parentWidget);
	}

	module.exports = { dispatch, Scenario };
});
