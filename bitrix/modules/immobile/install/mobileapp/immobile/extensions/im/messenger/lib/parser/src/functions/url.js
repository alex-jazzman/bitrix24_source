/* eslint-disable flowtype/require-return-type */
/* eslint-disable bitrix-rules/no-bx */
/* eslint-disable bitrix-rules/no-pseudo-private */

/**
 * @module im/messenger/lib/parser/functions/url
 */
jn.define('im/messenger/lib/parser/functions/url', (require, exports, module) => {
	const parserUrl = {
		simplify(text)
		{
			text = text.replace(/\[url(?:=([^[\]]+))?](.*?)\[\/url]/gi, (whole, link, text) => {
				return text || link;
			});

			text = text.replace(/\[url(?:=(.+))?](.*?)\[\/url]/gi, (whole, link, text) => {
				return text || link;
			});

			return text;
		},

		removeSimpleUrlTag(text)
		{
			text = text.replace(/\[url](.*?)\[\/url]/gi, (whole, link) => link);

			return text;
		},

		prepareGifUrl(text)
		{
			text = text.replace(/(\[url=|\[url])?http.*?\.gif(\[\/url])?/gim, (match, p1) => {
				if (p1 !== '')
				{
					return match.replace(/\[\/url]/gim, '[/IMG]').replace(/\[url=|(\[url])/gim, '[IMG]');
				}

				return `[IMG]${match}[/IMG]`;
			});

			text = text.replace(/(.)(\[img)/gim, '$1\n$2');
			text = text.replace(/(\/img])(.)/gim, '$1\n$2');

			return text;
		},
	};

	module.exports = {
		parserUrl,
	};
});
