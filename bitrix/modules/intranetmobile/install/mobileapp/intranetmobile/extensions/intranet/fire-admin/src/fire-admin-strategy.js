/**
 * @module intranet/fire-admin/src/fire-admin-strategy
 */
jn.define('intranet/fire-admin/src/fire-admin-strategy', (require, exports, module) => {
	const { ConfirmationStrategy, AdminHintType } = require('intranet/fire-admin/src/strategy');
	const { Loc } = require('loc');
	const { FirstAdminAction, sendFirstAdminRequest } = require('intranet/fire-admin/src/utils');

	class FireAdminStrategy extends ConfirmationStrategy
	{
		getTitle()
		{
			return Loc.getMessage('M_INTRANET_FIRE_ADMIN_AND_TRANSFER_RIGHTS_TITLE');
		}

		getAdminHintType()
		{
			return AdminHintType.NEXT;
		}

		getHintPhraseId()
		{
			return 'M_INTRANET_FIRE_ADMIN_AND_TRANSFER_RIGHTS_HINT';
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
					return new Promise((resolve, reject) => {
						sendFirstAdminRequest(FirstAdminAction.confirmFire, {
							currentAdminId,
							initiatorId,
							messageId,
						})
							.then(() => {
								Application.exit();
								resolve();
							})
							.catch((error) => {
								console.error('Error firing admin:', error);
								reject(error);
							});
					});
				});
			};
		}

		executeCancelCallback(params)
		{
			return () => {
				const { layoutWidget, currentAdminId, initiatorId, messageId } = params;

				layoutWidget?.close(() => {
					void sendFirstAdminRequest(FirstAdminAction.cancelFire, {
						currentAdminId,
						initiatorId,
						messageId,
					});
				});
			};
		}
	}

	module.exports = {
		FireAdminStrategy,
	};
});
