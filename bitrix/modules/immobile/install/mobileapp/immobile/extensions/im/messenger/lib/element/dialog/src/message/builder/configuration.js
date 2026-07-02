/**
 * @module im/messenger/lib/element/dialog/message/builder/configuration
 */
jn.define('im/messenger/lib/element/dialog/message/builder/configuration', (require, exports, module) => {
	const { SystemButtonConfiguration } = require('im/messenger/lib/element/dialog/message/builder/button/system-configuration')
	const { CustomButtonConfiguration } = require('im/messenger/lib/element/dialog/message/builder/button/custom-configuration')

	/**
	 * @class BuilderConfiguration
	 */
	class BuilderConfiguration
	{
		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @return {SystemButtonMetaData|CustomButtonMetaData|null}
		 */
		static getButtonMetaData(messageId, actionId)
		{
			if (SystemButtonConfiguration.isSystemButton(actionId))
			{
				return SystemButtonConfiguration.getMetaByActionId(actionId);
			}

			return CustomButtonConfiguration.getMeta(messageId, actionId);
		}
	}

	module.exports = {
		BuilderConfiguration,
	};
});
