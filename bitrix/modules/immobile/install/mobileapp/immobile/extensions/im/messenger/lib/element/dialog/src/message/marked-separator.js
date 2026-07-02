/**
 * @module im/messenger/lib/element/dialog/message/marked-separator
 */
jn.define('im/messenger/lib/element/dialog/message/marked-separator', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');

	const {
		MessageAlign,
		MessageTextAlign,
	} = require('im/messenger/lib/element/dialog/message/base');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageIdType, MessageType } = require('im/messenger/const');

	/**
	 * @class MarkedSeparatorMessage
	 */
	class MarkedSeparatorMessage extends Message
	{
		/**
		 * @param {MessagesModelState|{}} [modelMessage={}]
		 * @param {CreateMessageOptions|{}} [options={}]
		 */
		constructor(modelMessage = {}, options = {})
		{
			if (!modelMessage?.id)
			{
				// eslint-disable-next-line no-param-reassign
				modelMessage.id = MarkedSeparatorMessage.getDefaultId();
			}

			super(modelMessage, options);

			this.setMessage(Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_READ_LATER'));
			this.setShowReaction(null, false);
			this.setCanBeQuoted(false);
			this.setCanBeChecked(false);
			this.setIsBackgroundOn(true);
			this.setIsBackgroundWide(true);
			this.setMessageAlign(MessageAlign.center);
			this.setTextAlign(MessageTextAlign.center);
			this.setFontColor(Color.baseWhiteFixed.toHex());
			this.setBackgroundColor('#525C6966');
			this.setRoundedCorners(false);
			this.setMarginTop(12);
			this.setMarginBottom(4);
		}

		getType()
		{
			return MessageType.systemText;
		}

		setShowTail()
		{
			return this;
		}

		static getDefaultId()
		{
			return MessageIdType.templateSeparatorMarked;
		}
	}

	module.exports = {
		MarkedSeparatorMessage,
	};
});
