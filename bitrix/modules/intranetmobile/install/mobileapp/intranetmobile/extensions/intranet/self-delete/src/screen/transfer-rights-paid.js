/**
 * @module intranet/self-delete/src/screen/transfer-rights-paid
 */
jn.define('intranet/self-delete/src/screen/transfer-rights-paid', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseScreen } = require('intranet/self-delete/src/screen/base-screen');

	class TransferRightsPaidScreen extends BaseScreen
	{
		getTestIdPrefix()
		{
			return 'transfer-rights-paid';
		}

		getTitle()
		{
			return Loc.getMessage('M_INTRANET_SELF_DELETE_PAID_LICENSE_HEADING');
		}

		getDescription()
		{
			return [
				Loc.getMessage('M_INTRANET_SELF_DELETE_PAID_LICENSE_DESC_1'),
				Loc.getMessage('M_INTRANET_SELF_DELETE_PAID_LICENSE_DESC_WITH_EMAIL', {
					'#EMAIL#': `[URL]${this.data.supportEmail ?? ''}[/URL]`,
				}),
			].join('\n\n');
		}

		getDescriptionLinkClick()
		{
			return () => {
				if (this.data.supportEmail)
				{
					Application.openUrl(`mailto:${this.data.supportEmail}`);
				}
			};
		}

		getPrimaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_PAID_LICENSE_BTN_HELP'),
				onClick: () => this.openTransferRightsHelp(),
			};
		}
	}

	module.exports = { TransferRightsPaidScreen };
});
