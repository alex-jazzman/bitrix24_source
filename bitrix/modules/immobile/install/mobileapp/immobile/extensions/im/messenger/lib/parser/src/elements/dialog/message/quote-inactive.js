/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/lib/parser/elements/dialog/message/quote-inactive
 */
jn.define('im/messenger/lib/parser/elements/dialog/message/quote-inactive', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');

	/**
	 * @class QuoteInactive
	 */
	class QuoteInactive
	{
		/**
		 * @param {string} title
		 * @param {string} text
		 * @param {QuotePreview|null} [preview] — structured media preview; native renders this if supported,
		 *   falls back to text if not. Never null-assigned — omit if no preview.
		 */
		constructor(title = '', text = '', preview = null)
		{
			this.type = QuoteInactive.getType();

			if (Type.isStringFilled(text))
			{
				this.text = text;
			}

			if (Type.isStringFilled(title))
			{
				this.title = title;
			}

			if (Feature.isChatDialogExpandingQuoteSupported)
			{
				this.displayLinesNumber = 4;
			}

			if (preview !== null && Type.isPlainObject(preview))
			{
				this.preview = preview;
			}
		}

		static getType()
		{
			return 'quote-inactive';
		}
	}

	module.exports = {
		QuoteInactive,
	};
});
