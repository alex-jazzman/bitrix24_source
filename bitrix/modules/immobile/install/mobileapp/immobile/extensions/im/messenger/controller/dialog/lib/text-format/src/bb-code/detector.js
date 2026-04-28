/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/detector
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/detector', (require, exports, module) => {
	const {
		escapeRegex,
		createOpenTagPattern,
		createCloseTagPattern,
		createCompleteWrapPattern,
	} = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/utils');

	/**
	 * @class BBCodeDetector
	 */
	class BBCodeDetector
	{
		static PARTIAL_OPEN_TAG_REGEX = /\[([A-Za-z]+)(?:=[^\]]*)?$/;
		static PARTIAL_CLOSE_TAG_REGEX = /^\[\/([A-Za-z]+)?$/;
		static ANY_OPEN_TAG_REGEX = /\[([A-Za-z]+)(?:=[^\]]*)?]/g;
		static ANY_CLOSE_TAG_REGEX = /\[\/([A-Za-z]+)]/g;
		static TAG_PARAMETER_REGEX = /\[([a-z]+)=([^\]]+)]/i;

		/**
		 * @param {string} text
		 * @returns {boolean}
		 */
		detectPartialTags(text)
		{
			return BBCodeDetector.PARTIAL_OPEN_TAG_REGEX.test(text)
				|| BBCodeDetector.PARTIAL_CLOSE_TAG_REGEX.test(text);
		}

		/**
		 * @param {string} text
		 * @returns {Object}
		 */
		countTags(text)
		{
			const allOpenTags = [...text.matchAll(BBCodeDetector.ANY_OPEN_TAG_REGEX)];
			const allCloseTags = [...text.matchAll(BBCodeDetector.ANY_CLOSE_TAG_REGEX)];

			const tagCounts = {};

			allOpenTags.forEach((match) => {
				const tagName = match[1].toLowerCase();
				tagCounts[tagName] = tagCounts[tagName] || { open: 0, close: 0 };
				tagCounts[tagName].open++;
			});

			allCloseTags.forEach((match) => {
				const tagName = match[1].toLowerCase();
				tagCounts[tagName] = tagCounts[tagName] || { open: 0, close: 0 };
				tagCounts[tagName].close++;
			});

			return tagCounts;
		}

		/**
		 * @param {string} text
		 * @param {string} tagName
		 * @returns {string|null}
		 */
		findOpenTagBefore(text, tagName)
		{
			const escapedTagName = escapeRegex(tagName);
			const otherOpenTags = '(?:\\[[a-zA-Z]+(?:=[^\\]]*)?\\])*';
			const pattern = new RegExp(`\\[${escapedTagName}(?:=[^\\]]*)?\\]${otherOpenTags}$`, 'i');
			const match = text.match(pattern);

			return match ? match[0] : null;
		}

		/**
		 * @param {string} text
		 * @param {string} tagName
		 * @returns {string|null}
		 */
		findCloseTagAfter(text, tagName)
		{
			const escapedTagName = escapeRegex(tagName);
			const otherCloseTags = '(?:\\[\\/[a-zA-Z]+\\])*';
			const pattern = new RegExp(`^${otherCloseTags}\\[\\/${escapedTagName}\\]`, 'i');
			const match = text.match(pattern);

			return match ? match[0] : null;
		}

		/**
		 * @param {string} tag - Opening tag like "[url=https://example.com]" or "[url]"
		 * @returns {string|null} - Parameter value or null if no parameter
		 */
		extractTagParameter(tag)
		{
			const match = tag.match(BBCodeDetector.TAG_PARAMETER_REGEX);

			return match ? match[2] : null;
		}

		/**
		 * @param {string} text
		 * @param {string} escapedBBCode
		 * @returns {Array|null}
		 */
		isWrappedInside(text, escapedBBCode)
		{
			const pattern = createCompleteWrapPattern(escapedBBCode);

			return text.match(pattern);
		}

		/**
		 * @param {BBCodeContext} context
		 * @returns {{openTag: string, closeTag: string}|null}
		 */
		isWrappedOutside(context)
		{
			const openTagPattern = createOpenTagPattern(context.escapedBBCode, { atEnd: true });
			const closeTagPattern = createCloseTagPattern(context.escapedBBCode, { atStart: true });

			const openTagMatch = context.getTextBefore().match(openTagPattern);
			const closeTagMatch = context.getTextAfter().match(closeTagPattern);

			if (openTagMatch && closeTagMatch)
			{
				return {
					openTag: openTagMatch[0],
					closeTag: closeTagMatch[0],
				};
			}

			return null;
		}
	}

	module.exports = { BBCodeDetector };
});
