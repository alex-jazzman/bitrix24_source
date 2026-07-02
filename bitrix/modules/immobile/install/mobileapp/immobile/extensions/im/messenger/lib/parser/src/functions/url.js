/* eslint-disable flowtype/require-return-type */
/* eslint-disable bitrix-rules/no-bx */
/* eslint-disable bitrix-rules/no-pseudo-private */

/**
 * @module im/messenger/lib/parser/functions/url
 */
jn.define('im/messenger/lib/parser/functions/url', (require, exports, module) => {
	const { NEW_LINE } = require('im/messenger/lib/parser/const');

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

		removeBR(text)
		{
			text = text.replace(/\[\/?br]/gim, '');

			return text;
		},

		removeSimpleUrlTag(text)
		{
			text = text.replace(/\[url](.*?)\[\/url]/gi, (whole, link) => link);

			return text;
		},

		/**
		 * @param {string} text
		 * @return {string[]}
		 */
		splitByUrlTag(text)
		{
			return text.split(/(\[url(?:=[^[\]]+)?].*?\[\/url])/gi);
		},

		/**
		 * @param {string} part
		 * @return {boolean}
		 */
		isUrlTag(part)
		{
			return /^\[url[=\]]/i.test(part);
		},

		prepareGifUrl(text)
		{
			return this.prepareImageUrlByExtensions(text, {
				extensions: ['gif', 'webp'],
				wrapPlainUrls: false,
				wrapUrlTags: false,
				wrapUrlWithValue: true,
			});
		},

		prepareImageUrl(text)
		{
			return this.prepareImageUrlByExtensions(text, {
				extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'],
				wrapPlainUrls: true,
				wrapUrlTags: true,
				wrapUrlWithValue: false,
			});
		},

		prepareImageUrls(text)
		{
			return this.prepareImageUrlByExtensions(text, {
				extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
				wrapPlainUrls: true,
				wrapUrlTags: true,
				wrapUrlWithValue: false,
			});
		},

		prepareImageUrlByExtensions(text, options)
		{
			const {
				extensions = [],
				wrapPlainUrls = false,
				wrapUrlTags = true,
				wrapUrlWithValue = false,
			} = options;

			const extensionPattern = extensions.join('|');
			if (!extensionPattern)
			{
				return text;
			}

			const imageUrlPattern = new RegExp(`https?:\\/\\/[^\\s\\]]+?\\.(${extensionPattern})(?:\\?[^\\s\\]]*)?`, 'gi');

			if (wrapUrlWithValue)
			{
				const legacyPattern = new RegExp(`(\\[url=|\\[url])?http.*?\\.(${extensionPattern})(\\[\\/url])?`, 'gim');
				text = text.replace(legacyPattern, (match, p1, p2, p3) => {
					if (p1 && p3)
					{
						return match.replace(/\[\/url]/gim, '[/IMG]').replace(/\[url=|(\[url])/gim, '[IMG]');
					}

					if (p1 === undefined || p3 === undefined)
					{
						return match;
					}

					return `[IMG]${match}[/IMG]`;
				});
			}
			else if (wrapUrlTags)
			{
				const imageUrlTagPattern = new RegExp(`\\[url](${imageUrlPattern.source})\\[\\/url]`, 'gi');
				text = text.replace(imageUrlTagPattern, (whole, url) => `[IMG]${url}[/IMG]`);
			}

			if (wrapPlainUrls)
			{
				const TAG_PLACEHOLDER = '####IMAGE_URL_TAG_';
				const replacedTags = [];

				text = text.replace(/\[(.+?)](.*?)\[\/(.+?)]/gi, (tag) => {
					const id = replacedTags.length;
					replacedTags.push(tag);

					return `${TAG_PLACEHOLDER}${id}`;
				});

				text = text.replace(imageUrlPattern, (url) => `[IMG]${url}[/IMG]`);

				replacedTags.forEach((originalTag, index) => {
					text = text.replace(`${TAG_PLACEHOLDER}${index}`, () => originalTag);
				});
			}

			text = text.replace(/(.)(\[img)/gim, `$1${NEW_LINE}$2`);
			text = text.replace(/(\/img])(.)/gim, `$1${NEW_LINE}$2`);

			return text;
		},
	};

	module.exports = {
		parserUrl,
	};
});
