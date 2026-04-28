/**
 * @module im/messenger/lib/chat-search/src/helper/get-words-from-text
 */
jn.define('im/messenger/lib/chat-search/src/helper/get-words-from-text', (require, exports, module) => {
	/**
	 * @private
	 * @param {string} text
	 * @return {Array<string>}
	 */
	function getWordsFromText(text)
	{
		const clearedText = text.replaceAll(/["#'()<>[\]{}-]|\s\s+/g, ' ');

		return clearedText.split(' ').filter((word) => word !== '');
	}

	module.exports = { getWordsFromText };
});
