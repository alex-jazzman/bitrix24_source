/**
 * @module intranet/fire-admin/src/request-admin-fire-strategy
 */
jn.define('intranet/fire-admin/src/request-admin-fire-strategy', (require, exports, module) => {
	const { ConfirmationStrategy, AdminHintType } = require('intranet/fire-admin/src/strategy');
	const { Loc } = require('loc');
	const { showToast, showErrorToast } = require('toast');

	class RequestAdminFireStrategy extends ConfirmationStrategy
	{
		getTitle()
		{
			return Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_TITLE');
		}

		getAdminHintType()
		{
			return AdminHintType.CURRENT;
		}

		getHintPhraseId()
		{
			return 'M_INTRANET_REQUEST_ADMIN_FIRE_HINT';
		}

		getDescription()
		{
			return Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_DESCRIPTION');
		}

		getInstruction()
		{
			return Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_CONSENT_INSTRUCTION');
		}

		getAcceptButtonText()
		{
			return Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_CONFIRM_BUTTON');
		}

		getCancelButtonText()
		{
			return Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_REJECT_BUTTON');
		}

		executeAcceptCallback(params)
		{
			const { layoutWidget, currentAdminId, initiatorId } = params;

			return () => {
				layoutWidget?.close(() => {
					this.#sendRequestToFireAdmin(currentAdminId, initiatorId)
						.then((response) => this.#showToast(response))
						.catch(() => this.#showToast({ status: 'error' }));
				});
			};
		}

		executeCancelCallback(params)
		{
			return () => {
				const { layoutWidget } = params;

				layoutWidget?.close();
			};
		}

		#showToast(response)
		{
			if (response?.status === 'success')
			{
				showToast({
					message: Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_TOAST'),
				});

				return;
			}

			showErrorToast({
				message: Loc.getMessage('M_INTRANET_REQUEST_ADMIN_FIRE_ERROR_TOAST'),
			});
		}

		#sendRequestToFireAdmin(currentAdminId, initiatorId)
		{
			const fromUserId = Number(initiatorId);
			const toUserId = Number(currentAdminId);

			if (!fromUserId || !toUserId)
			{
				return Promise.reject(new Error('Invalid user IDs'));
			}

			return BX.ajax.runAction(
				'bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest',
				{
					data: {
						userId: fromUserId,
						toUser: toUserId,
					},
				},
			);
		}
	}

	module.exports = {
		RequestAdminFireStrategy,
	};
});
