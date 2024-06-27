/**
 * @module im/messenger/lib/element/dialog/message/create-banner/message
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/message', (require, exports, module) => {
	const { CustomMessage } = require('im/messenger/lib/element/dialog/message/custom/message');
	/**
	 * @class CreateBannerMessage
	 */
	class CreateBannerMessage extends CustomMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
		}

		static getComponentId()
		{
			return 'banner';
		}

		getType()
		{
			return 'banner';
		}
	}

	module.exports = {
		CreateBannerMessage,
	};
});
