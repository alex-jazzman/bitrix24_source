/**
 * @module im/messenger/lib/copilot
 */
jn.define('im/messenger/lib/copilot', (require, exports, module) => {
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class CopilotManager
	 */
	class CopilotManager
	{
		static async fillStore()
		{
			const copilotData = MessengerParams.get('COPILOT_DATA', null);
			if (Type.isNull(copilotData))
			{
				return;
			}

			await serviceLocator.get('core').getStore().dispatch('usersModel/set', [copilotData]);
		}
	}

	module.exports = { CopilotManager };
});
