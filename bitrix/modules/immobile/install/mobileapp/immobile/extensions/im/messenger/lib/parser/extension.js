/**
 * @module im/messenger/lib/parser
 */
jn.define('im/messenger/lib/parser', (require, exports, module) => {

	const { parser } = require('im/messenger/lib/parser/parser');
	const { MARKDOWN_TABLE_URL_PREFIX } = require('im/messenger/lib/parser/const');

	module.exports = {
		parser,
		MARKDOWN_TABLE_URL_PREFIX,
	};
});
