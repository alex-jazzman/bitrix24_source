/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/lib/parser/functions/common
 */
jn.define('im/messenger/lib/parser/functions/common', (require, exports, module) => {
	const { NEW_LINE } = require('im/messenger/lib/parser/const');

	const parserCommon = {
		decodeNewLine(text)
		{
			text = text.replace(/\[br]/gi, NEW_LINE);

			return text;
		},

		collapseDuplicateBreaks(text)
		{
			text = text.replace(/\[br]\[br]/gi, '[br]');

			return text;
		},

		simplifyBreakLine(text, replaceLetter = ' ')
		{
			text = text.replace(/<br><br \/>/ig, '<br />');
			text = text.replace(/<br \/><br>/ig, '<br />');
			text = text.replace(/\[BR]/ig, '<br />');
			text = text.replace(/<br \/>/ig, replaceLetter);

			return text;
		},

		simplifyNbsp(text)
		{
			text = text.replace(/&nbsp;/ig, " ");

			return text;
		},

		simplifyNewLine(text, replaceSymbol = ' ')
		{
			if (replaceSymbol !== NEW_LINE)
			{
				text = text.replace(/\n/gi, replaceSymbol);
			}
			text = text.replace(/\[BR]/ig, replaceSymbol);

			return text;
		},
	};

	module.exports = {
		parserCommon,
	};
});
