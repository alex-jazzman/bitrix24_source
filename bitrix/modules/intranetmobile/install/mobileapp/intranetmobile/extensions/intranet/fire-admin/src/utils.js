/**
 * @module intranet/fire-admin/src/utils
 */
jn.define('intranet/fire-admin/src/utils', (require, exports, module) => {
	const { Loc } = require('loc');
	const { showErrorToast } = require('toast');
	/**
	 * @typedef {Object} FirstAdminCommand
	 * @property {string} action
	 * @property {(params: {initiator: {id: number}, user: {id: number}}) => Object} buildPayload
	 */
	/** @type {FirstAdminCommand} */
	const FirstAdminAction = {
		cancelFire: {
			action: 'bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireDecline',
			buildPayload: ({ currentAdminId, initiatorId }) => ({
				fromUserId: currentAdminId,
				toUserId: initiatorId,
			}),
		},
		confirmFire: {
			action: 'bitrix24.v2.FirstAdmin.FirstAdminRightsController.fire',
			buildPayload: ({ currentAdminId, initiatorId }) => ({
				newFirstAdminId: initiatorId,
				willBeFiredAdminId: currentAdminId,
			}),
		},
		confirmTransfer: {
			action: 'bitrix24.v2.FirstAdmin.FirstAdminRightsController.takeAdminRights',
			buildPayload: ({ currentAdminId, initiatorId }) => ({
				firstAdminUserId: currentAdminId,
				initiatorUserId: initiatorId,
			}),
		},
		cancelTransfer: {
			action: 'bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendTransferDecline',
			buildPayload: ({ currentAdminId, initiatorId }) => ({
				fromUserId: currentAdminId,
				toUserId: initiatorId,
			}),
		},
	};

	/**
	 * @param {FirstAdminAction} command
	 * @param {Object} requestParams
	 * @returns {Promise<Object>}
	 */
	const sendFirstAdminRequest = async (command, requestParams) => {
		if (!command || !command.action || !command.buildPayload)
		{
			return Promise.reject(new Error('Invalid first-admin command passed'));
		}

		const data = command.buildPayload(requestParams);

		try
		{
			await BX.ajax.runAction(command.action, { data });

			return deleteFirstAdminRequestMessage(requestParams?.messageId);
		}
		catch (error)
		{
			await deleteFirstAdminRequestMessage(requestParams?.messageId);
			showErrorToast({
				message: Loc.getMessage('M_INTRANET_FIRE_ADMIN_REQUEST_ERROR'),
			});
			throw error;
		}
	};

	const deleteFirstAdminRequestMessage = (messageId) => {
		if (!messageId)
		{
			return Promise.reject(new Error('Missing messageId in deleteFirstAdminRequestMessage'));
		}

		return BX.ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.deleteMessage', {
			data: {
				messageId,
			},
		}).catch((error) => {
			console.error('Error in deleting message', error);
		});
	};

	module.exports = {
		FirstAdminAction,
		sendFirstAdminRequest,
	};
});
