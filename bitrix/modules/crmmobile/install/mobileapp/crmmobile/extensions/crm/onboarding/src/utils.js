/**
 * @module crm/onboarding/src/utils
 */
jn.define('crm/onboarding/src/utils', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const hasSMSProviderConnection = async (entityId = null, entityTypeId = null) => {
		if (!entityId || !entityTypeId)
		{
			return Promise.resolve(false);
		}

		const params = {
			entityId,
			entityTypeId,
		};

		return new RunActionExecutor(
			'crmmobile.ReceivePayment.ModeSelection.getModeSelectionParams',
			params,
		)
			.enableJson()
			.call()
			.then((response) => {
				if (response && response.status === 'success')
				{
					const { data = {} } = response;

					return Boolean(
						data
						&& data.contactHasPhone
						&& data.entityHasContact
						&& !data.isOrderLimitReached
						&& !data.isPaymentLimitReached,
					);
				}

				return false;
			})
			.catch((error) => {
				console.error('Error while checking if user has SMS Provider Connection:', error);

				return false;
			});
	};

	const getProductGrid = async (entityId = null, entityTypeId = null) => {
		if (!entityId || !entityTypeId)
		{
			return Promise.resolve(false);
		}

		const data = {
			entityId,
			entityTypeId,
			resendData: {
				resendMessageMode: false,
				documentId: 0,
			},
		};

		return new RunActionExecutor(
			'crmmobile.ReceivePayment.Wizard.getProductGrid',
			data,
		)
			.enableJson()
			.call()
			.then((response) => {
				if (response && response.status === 'success')
				{
					return response.data;
				}

				return false;
			})
			.catch((error) => {
				console.error('Error while checking if user has grid products', error);

				return false;
			});
	};

	module.exports = {
		hasSMSProviderConnection,
		getProductGrid,
	};
});
