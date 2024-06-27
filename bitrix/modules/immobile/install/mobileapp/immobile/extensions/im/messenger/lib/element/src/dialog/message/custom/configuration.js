/**
 * @module im/messenger/lib/element/dialog/message/custom/configuration
 */
jn.define('im/messenger/lib/element/dialog/message/custom/configuration', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class CustomMessageConfiguration
	 */
	class CustomMessageConfiguration
	{
		/**
		 * @param {string | number}messageId
		 * @param {object} metaData
		 */
		constructor(messageId, metaData = {})
		{
			/**
			 * @protected
			 */
			this.messageId = messageId;
			/**
			 * @protected
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
			/**
			 * @protected
			 * @type {MessengerCoreStore}
			 */
			this.metaData = metaData;
		}

		/**
		 * @abstract
		 * @protected
		 * @return {string}
		 */
		getMetaDataKey()
		{
			throw new Error('CustomMessageConfiguration: getMetaDataKey() must be override in subclass.');
		}

		/**
		 * @protected
		 * @return {*}
		 */
		getMetaData()
		{
			const key = this.getMetaDataKey();

			return this.metaData[key];
		}

		/**
		 * @protected
		 * @return {MessagesModelState | {}}
		 */
		getMessage()
		{
			return this.store.getters['messagesModel/getById'](this.messageId);
		}

		/**
		 * @protected
		 * @return {object | undefined}
		 */
		getMessageComponentParams()
		{
			return this.getMessage()?.params?.COMPONENT_PARAMS;
		}
	}

	module.exports = {
		CustomMessageConfiguration,
	};
});
