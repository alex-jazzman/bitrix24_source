/**
 * @module im/messenger/lib/reasoning
 */
jn.define('im/messenger/lib/reasoning', (require, exports, module) => {
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class Reasoning
	 */
	class Reasoning
	{
		/**
		 * @param {DialogId} dialogId
		 * @return {boolean}
		 */
		static isSupported(dialogId)
		{
			const copilotModel = serviceLocator.get('core').getStore().getters['dialoguesModel/copilotModel/getByDialogId'](dialogId);
			if (!copilotModel)
			{
				return false;
			}

			if (Type.isBoolean(copilotModel.engine?.supportsReasoning))
			{
				return copilotModel.engine.supportsReasoning;
			}

			const engineCode = copilotModel.engine?.code || copilotModel.chats?.[0]?.engine;
			const engine = MessengerParams.getCopilotAvailableEngines().find((item) => item.code === engineCode);

			return Boolean(engine.supportsReasoning);
		}
	}

	module.exports = {
		Reasoning,
	};
});
