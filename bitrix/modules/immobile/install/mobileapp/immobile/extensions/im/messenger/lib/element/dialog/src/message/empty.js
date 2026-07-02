/**
 * @module im/messenger/lib/element/dialog/message/empty
 */
jn.define('im/messenger/lib/element/dialog/message/empty', (require, exports, module) => {
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageType } = require('im/messenger/const');

	/**
	 * @class EmptyMessage
	 */
	class EmptyMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			this.setMessage();
		}

		setMessage(text, options)
		{
			this.message = [{ type: MessageType.text, text: '' }];
		}

		getType()
		{
			return MessageType.text;
		}
	}

	module.exports = {
		EmptyMessage,
	};
});
