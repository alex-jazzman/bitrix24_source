/**
 * @module im/messenger/lib/element/dialog/message/builder/button/custom-configuration
 */
jn.define('im/messenger/lib/element/dialog/message/builder/button/custom-configuration', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class CustomButtonConfiguration
	 */
	class CustomButtonConfiguration
	{
		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @return {CustomButtonMetaData|null}
		 */
		static getMeta(messageId, actionId)
		{
			const requestParams = this.getRequestParams(messageId, actionId);

			return {
				callback: () => {
					// TODO add service logic from MessageService

					// return runAction(RestMethod.imV2ChatMessageDelete, { data: requestParams });
				},
			};
		}

		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @return {object | null}
		 */
		static getRequestParams(messageId, actionId)
		{
			const messageModel = this.getMessageModel(messageId);
			if (!messageModel.id)
			{
				return null;
			}

			const buttonData = messageModel.builder.blocks.find(
				(button) => button.actionId === actionId,
			);

			if (!buttonData)
			{
				return null;
			}

			return buttonData.params;
		}

		/**
		 * @param {string} messageId
		 * @return {MessagesModelState | {}}
		 */
		getMessageModel(messageId)
		{
			return serviceLocator.get('core').getStore().getters['messagesModel/getById'](messageId);
		}
	}

	module.exports = {
		CustomButtonConfiguration,
	};
});
