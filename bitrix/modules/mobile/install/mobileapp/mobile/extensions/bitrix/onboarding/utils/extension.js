/**
 * @module onboarding/utils
 */
jn.define('onboarding/utils', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * @param {Object} [context={}]
	 * @param {number} [context.ownerId]
	 * @param {Array<any>} [context.commonFields]
	 * @returns {Promise<Array<any>>|Array<any>}
	 */
	const getProfileFields = (context = {}) => {
		if (context?.commonFields?.length > 0)
		{
			return context.commonFields;
		}

		return new RunActionExecutor('mobile.Onboarding.getProfileFields', {
			ownerId: context.ownerId,
		})
			.enableJson()
			.call()
			.then((response) => {
				if (response && response.status === 'success')
				{
					return response.data;
				}

				return [];
			})
			.catch((error) => {
				console.error(error);

				return [];
			});
	};

	const isLonelyUser = () => {
		return new RunActionExecutor(
			'mobile.Onboarding.isUserAlone',
			{},
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
				console.error('Error checking if user is alone:', error);

				return false;
			});
	};

	module.exports = {
		getProfileFields,
		isLonelyUser,
	};
});
