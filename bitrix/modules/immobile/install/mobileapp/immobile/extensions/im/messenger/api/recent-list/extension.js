/**
 * @module im/messenger/api/recent-list
 */
jn.define('im/messenger/api/recent-list', (require, exports, module) => {
	const {
		MessengerComponentRequestMethod,
	} = require('im/messenger/const');

	const { executeMethodInMessengerComponent } = require('im/messenger/api/lib/component-request');

	/**
	 * @return {Promise<Array<UserListToCallItem>>}
	 */
	async function getRecentUserListToCall()
	{
		try
		{
			return await executeMethodInMessengerComponent(MessengerComponentRequestMethod.getRecentUserListToCall);
		}
		catch (error)
		{
			console.error(error);

			return [];
		}
	}

	module.exports = {
		getRecentUserListToCall,
	};
});
