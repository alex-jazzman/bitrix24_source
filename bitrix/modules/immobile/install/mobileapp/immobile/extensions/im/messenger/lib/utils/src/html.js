/**
 * @module im/messenger/lib/utils/html
 */
jn.define('im/messenger/lib/utils/html', (require, exports, module) => {
	const { Type } = require('type');

	const reEscape = /["&'<>]/g;
	const reUnescape = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;
	const escapeEntities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;',
	};
	const unescapeEntities = {
		'&amp;': '&',
		'&#38;': '&',
		'&lt;': '<',
		'&#60;': '<',
		'&gt;': '>',
		'&#62;': '>',
		'&apos;': "'",
		'&#39;': "'",
		'&quot;': '"',
		'&#34;': '"',
	};

	/**
	 * Encodes HTML special characters in a string.
	 * @param {any} value
	 * @returns {string|any}
	 */
	function encodeHtml(value)
	{
		if (Type.isString(value))
		{
			return value.replaceAll(reEscape, (item) => escapeEntities[item]);
		}

		return value;
	}

	/**
	 * Decodes HTML entities back to their character form.
	 * @param {any} value
	 * @returns {string|any}
	 */
	function decodeHtml(value)
	{
		if (Type.isString(value))
		{
			return value.replaceAll(reUnescape, (item) => unescapeEntities[item]);
		}

		return value;
	}

	module.exports = {
		encodeHtml,
		decodeHtml,
	};
});
