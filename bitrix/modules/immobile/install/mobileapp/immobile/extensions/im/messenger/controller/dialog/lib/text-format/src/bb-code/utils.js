/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/utils
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/utils', (require, exports, module) => {
	/**
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeRegex(str)
	{
		return str.replaceAll(/[$()*+.?[\]\\^{|}]/g, '\\$&');
	}

	/**
	 * @param {string} escapedTag
	 * @param {Object} options
	 * @param {boolean} options.atStart
	 * @param {boolean} options.atEnd
	 * @param {boolean} options.global
	 * @returns {RegExp}
	 */
	function createOpenTagPattern(escapedTag, options = {})
	{
		const { atStart = false, atEnd = false, global = false } = options;
		const start = atStart ? '^' : '';
		const end = atEnd ? '$' : '';
		const flags = global ? 'gi' : 'i';

		return new RegExp(`${start}\\[${escapedTag}(?:=[^\\]]*)?\\]${end}`, flags);
	}

	/**
	 * @param {string} escapedTag
	 * @param {Object} options
	 * @param {boolean} options.atStart
	 * @param {boolean} options.atEnd
	 * @param {boolean} options.global
	 * @returns {RegExp}
	 */
	function createCloseTagPattern(escapedTag, options = {})
	{
		const { atStart = false, atEnd = false, global = false } = options;
		const start = atStart ? '^' : '';
		const end = atEnd ? '$' : '';
		const flags = global ? 'gi' : 'i';

		return new RegExp(`${start}\\[\\/${escapedTag}\\]${end}`, flags);
	}

	/**
	 * @param {string} escapedTag
	 * @returns {RegExp}
	 */
	function createCompleteWrapPattern(escapedTag)
	{
		return new RegExp(`^\\[${escapedTag}(?:=[^\\]]*)?\\](.*)\\[\\/${escapedTag}\\]$`, 'is');
	}

	/**
	 * @param {string} bbCode
	 * @param {string|null} param
	 * @returns {string}
	 */
	function buildOpenTag(bbCode, param = null)
	{
		return param ? `[${bbCode}=${param}]` : `[${bbCode}]`;
	}

	/**
	 * @param {string} bbCode
	 * @returns {string}
	 */
	function buildCloseTag(bbCode)
	{
		return `[/${bbCode}]`;
	}

	module.exports = {
		escapeRegex,
		createOpenTagPattern,
		createCloseTagPattern,
		createCompleteWrapPattern,
		buildOpenTag,
		buildCloseTag,
	};
});
