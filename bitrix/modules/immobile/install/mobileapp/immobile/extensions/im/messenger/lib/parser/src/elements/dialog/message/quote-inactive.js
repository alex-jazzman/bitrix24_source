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
		constructor(title = '', text = '')
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
