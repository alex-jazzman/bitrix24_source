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
		/**
		 * @param {string} title
		 * @param {string} text
		 * @param {string|number} dialogId
		 * @param {string} messageId
		 * @param {QuotePreview|null} [preview] — structured media preview; native renders this if supported,
		 *   falls back to text if not. Never null-assigned — omit if no preview.
		 */
		constructor(title, text, dialogId, messageId, preview = null)
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

			if (preview !== null && Type.isPlainObject(preview))
			{
				this.preview = preview;
			}
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
