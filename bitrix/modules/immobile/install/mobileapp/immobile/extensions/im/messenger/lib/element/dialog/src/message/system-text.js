/**
 * @module im/messenger/lib/element/dialog/message/system-text
 */
jn.define('im/messenger/lib/element/dialog/message/system-text', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Feature } = require('im/messenger/lib/feature');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageType } = require('im/messenger/const');

	/**
	 * @class SystemTextMessage
	 */
	class SystemTextMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
			this.setMessage(modelMessage.text);

			if (!this.isSystemStyled)
			{
				this.setSystemStyle();
			}
		}

		getType()
		{
			return MessageType.systemText;
		}

		setSystemStyle()
		{
			if (Feature.isSystemMessageStyleSupported)
			{
				return super.setSystemStyle();
			}

			this.setIsBackgroundOn(true);
			this.setBackgroundColor(Color.chatOverallTech.toHex());
			this.setFontColor(Color.baseWhiteFixed.toHex());
			this.setShowAvatarForce(false);
			this.setAvatarUri(null);

			return this;
		}
	}

	module.exports = {
		SystemTextMessage,
	};
});
