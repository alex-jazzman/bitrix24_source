/**
 * @module im/messenger/lib/parser
 */
jn.define('im/messenger/lib/parser', (require, exports, module) => {

	const { parser } = require('im/messenger/lib/parser/parser');
	const {
		getMarkdownTableData,
		clearTableData,
	} = require('im/messenger/lib/parser/markdown/converter');
	const { MARKDOWN_TABLE_URL_PREFIX } = require('im/messenger/lib/parser/const');

	module.exports = {
		parser,
		getMarkdownTableData,
		clearTableData,
		MARKDOWN_TABLE_URL_PREFIX,
	};
});
