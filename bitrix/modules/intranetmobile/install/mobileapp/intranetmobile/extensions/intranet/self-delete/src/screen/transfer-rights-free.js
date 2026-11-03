/**
 * @module intranet/self-delete/src/screen/transfer-rights-free
 */
jn.define('intranet/self-delete/src/screen/transfer-rights-free', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseScreen } = require('intranet/self-delete/src/screen/base-screen');

	class TransferRightsFreeScreen extends BaseScreen
	{
		getTestIdPrefix()
		{
			return 'transfer-rights-free';
		}

		getTitle()
		{
			return Loc.getMessage('M_INTRANET_SELF_DELETE_TRANSFER_RIGHTS_FREE_HEADING');
		}

		getDescription()
		{
			return [
				Loc.getMessage('M_INTRANET_SELF_DELETE_TRANSFER_RIGHTS_FREE_DESC_1'),
				Loc.getMessage('M_INTRANET_SELF_DELETE_TRANSFER_RIGHTS_FREE_DESC_2'),
			].join('\n\n');
		}

		getPrimaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_TRANSFER_RIGHTS_FREE_BTN_SETTINGS'),
				onClick: () => this.openGoToWeb(),
			};
		}

		getSecondaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_TRANSFER_RIGHTS_FREE_BTN_HELP'),
				onClick: () => this.openTransferRightsHelp(),
			};
		}
	}

	module.exports = { TransferRightsFreeScreen };
});
