/**
 * @module intranet/self-delete/src/screen/portal-delete
 */
jn.define('intranet/self-delete/src/screen/portal-delete', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseScreen } = require('intranet/self-delete/src/screen/base-screen');

	class PortalDeleteScreen extends BaseScreen
	{
		getTestIdPrefix()
		{
			return 'portal-delete';
		}

		getDescription()
		{
			return [
				Loc.getMessage('M_INTRANET_SELF_DELETE_PORTAL_DELETE_DESC_1'),
				Loc.getMessage('M_INTRANET_SELF_DELETE_PORTAL_DELETE_DESC_2'),
			].join('\n\n');
		}

		getPrimaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_PORTAL_DELETE_BTN_SETTINGS'),
				onClick: () => this.openGoToWeb(),
			};
		}
	}

	module.exports = { PortalDeleteScreen };
});
