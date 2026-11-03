/**
 * @module im/messenger/lib/element/dialog/message/audio/transcript-text-normalizer
 */
jn.define('im/messenger/lib/element/dialog/message/audio/transcript-text-normalizer', (require, exports, module) => {
	const { Type } = require('type');

	const LEADING_BYTE_ORDER_MARK = /^\uFEFF/;
	const LINE_LEADING_INDENTATION = /(^|[\n\r])[\u0009\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

	/**
	 * @param {*} text
	 * @return {*}
	 */
	function normalizeTranscriptTextForDisplay(text)
	{
		if (!Type.isString(text))
		{
			return text;
		}

		return text
			.replace(LEADING_BYTE_ORDER_MARK, '')
			.replace(LINE_LEADING_INDENTATION, '$1')
		;
	}

	module.exports = {
		normalizeTranscriptTextForDisplay,
	};
});
