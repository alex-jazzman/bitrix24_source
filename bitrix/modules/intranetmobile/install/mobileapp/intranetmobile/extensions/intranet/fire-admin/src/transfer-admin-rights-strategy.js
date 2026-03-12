/**
 * @module intranet/fire-admin/src/transfer-admin-rights-strategy
 */
jn.define('intranet/fire-admin/src/transfer-admin-rights-strategy', (require, exports, module) => {
	const { ConfirmationStrategy, AdminHintType } = require('intranet/fire-admin/src/strategy');
	const { Loc } = require('loc');
	const { FirstAdminAction, sendFirstAdminRequest } = require('intranet/fire-admin/src/utils');

	class TransferAdminRightsStrategy extends ConfirmationStrategy
	{
		getTitle()
		{
			return Loc.getMessage('M_INTRANET_TRANSFER_ADMIN_RIGHTS_TITLE');
		}

		getAdminHintType()
		{
			return AdminHintType.NEXT;
		}

		getHintPhraseId()
		{
			return 'M_INTRANET_TRANSFER_ADMIN_RIGHTS_HINT';
		}

		getDescription()
		{
			return Loc.getMessage('M_INTRANET_TRANSFER_ADMIN_RIGHTS_DESCRIPTION');
		}

		hasInput()
		{
			return true;
		}

		executeAcceptCallback(params)
		{
			return () => {
				const { layoutWidget, currentAdminId, initiatorId, messageId } = params;

				layoutWidget?.close(() => {
					void sendFirstAdminRequest(FirstAdminAction.confirmTransfer, {
						currentAdminId,
						initiatorId,
						messageId,
					});
				});
			};
		}

		executeCancelCallback(params)
		{
			return () => {
				const { layoutWidget, currentAdminId, initiatorId, messageId } = params;

				layoutWidget?.close(() => {
					void sendFirstAdminRequest(FirstAdminAction.cancelTransfer, {
						currentAdminId,
						initiatorId,
						messageId,
					});
				});
			};
		}
	}

	module.exports = {
		TransferAdminRightsStrategy,
	};
});
