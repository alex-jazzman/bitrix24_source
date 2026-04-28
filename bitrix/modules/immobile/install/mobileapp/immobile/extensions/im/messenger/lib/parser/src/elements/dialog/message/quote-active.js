/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/lib/parser/elements/dialog/message/quote-active
 */
jn.define('im/messenger/lib/parser/elements/dialog/message/quote-active', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class QuoteActive
	 */
	class QuoteActive
	{
		constructor(title, text, dialogId, messageId)
		{
			this.type = QuoteActive.getType();

			if (Type.isStringFilled(title))
			{
				this.title = title;
			}

			if (Type.isStringFilled(text))
			{
				this.text = text;
			}

			if (Type.isStringFilled(dialogId) || Type.isNumber(dialogId))
			{
				this.dialogId = dialogId.toString();
			}

			if (Type.isStringFilled(messageId))
			{
				this.messageId = messageId;
			}

			this.displayLinesNumber = 4;
		}

		static getType()
		{
			return 'quote-active';
		}
	}

	module.exports = {
		QuoteActive,
	};
});
