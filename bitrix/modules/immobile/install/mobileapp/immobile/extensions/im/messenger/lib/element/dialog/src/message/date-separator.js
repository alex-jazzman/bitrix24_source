/**
 * @module im/messenger/lib/element/dialog/message/date-separator
 */
jn.define('im/messenger/lib/element/dialog/message/date-separator', (require, exports, module) => {
	const { Color } = require('tokens');
	const {
		MessageAlign,
		MessageTextAlign,
	} = require('im/messenger/lib/element/dialog/message/base');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');
	const { MessageType } = require('im/messenger/const');

	/**
	 * @class DateSeparatorMessage
	 */
	class DateSeparatorMessage extends Message
	{
		constructor(id, date, options = {})
		{
			super({
				id,
			}, options);

			this.setMessage(date);
			this.setShowReaction(null, false);
			this.setCanBeQuoted(false);
			this.setCanBeChecked(false);
			this.setMessageAlign(MessageAlign.center);
			this.setTextAlign(MessageTextAlign.center);
			this.setFontColor(Color.baseWhiteFixed.toHex());
			this.setBackgroundColor(Color.chatOverallTech.toHex());
			this.setMarginTop(12);
			this.setMarginBottom(4);
		}

		getType()
		{
			return MessageType.systemText;
		}

		setMessage(date)
		{
			const text = DateFormatter.getDateGroupFormat(date);

			super.setMessage(text);
		}
	}

	module.exports = {
		DateSeparatorMessage,
	};
});
