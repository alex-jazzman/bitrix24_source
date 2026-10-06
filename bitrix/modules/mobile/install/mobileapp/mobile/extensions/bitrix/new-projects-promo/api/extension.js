/**
 * @module new-projects-promo/api
 */
jn.define('new-projects-promo/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Type } = require('type');

	const SHOULD_SHOW_ACTION = 'mobile.ProjectPromotion.shouldShow';
	const SET_VIEWED_ACTION = 'mobile.ProjectPromotion.setViewed';

	/**
	 * @param {NewProjectsPromoActionResponse|null|undefined} response
	 * @return {boolean}
	 */
	function getBooleanResult(response)
	{
		const hasNoErrors = Type.isNil(response?.errors)
			|| (Type.isArray(response.errors) && response.errors.length === 0);

		if (response?.status !== 'success' || !hasNoErrors || !Type.isBoolean(response.data))
		{
			return false;
		}

		return response.data;
	}

	/**
	 * @param {string} action
	 * @return {Promise<boolean>}
	 */
	async function execute(action)
	{
		try
		{
			const response = await (new RunActionExecutor(action, {}))
				.enableJson()
				.call();

			return getBooleanResult(response);
		}
		catch (error)
		{
			return false;
		}
	}

	/**
	 * @return {Promise<boolean>}
	 */
	function shouldShow()
	{
		return execute(SHOULD_SHOW_ACTION);
	}

	/**
	 * @return {Promise<boolean>}
	 */
	function setViewed()
	{
		return execute(SET_VIEWED_ACTION);
	}

	module.exports = {
		shouldShow,
		setViewed,
	};
});
