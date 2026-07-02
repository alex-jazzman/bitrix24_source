/**
 * @module im/messenger/lib/element/dialog/message/deleted
 */
jn.define('im/messenger/lib/element/dialog/message/deleted', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');

	const { MessageType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');

	/**
	 * @class DeletedMessage
	 */
	class DeletedMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			const message = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_DELETED');

			this.setMessage(message);
			this.setFontColor(Color.chatOtherBase1_2.toHex());
			this.forwardText = '';
			this.setUserNameColor(modelMessage.authorId);
		}

		getType()
		{
			return MessageType.deleted;
		}
	}

	module.exports = {
		DeletedMessage,
	};
});
