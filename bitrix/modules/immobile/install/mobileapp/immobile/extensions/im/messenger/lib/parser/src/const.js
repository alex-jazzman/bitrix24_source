/**
 * @module im/messenger/lib/parser/const
 */
jn.define('im/messenger/lib/parser/const', (require, exports, module) => {
	const NEW_LINE = '\n';

	const MARKDOWN_PLACEHOLDER_SUFFIX = '####';
	const MARKDOWN_CODE_PREFIX = '####MD_CODE_';
	const MARKDOWN_ESCAPE_PREFIX = '####MD_ESC_';
	const MARKDOWN_INLINE_CODE_PREFIX = '####MD_INLINE_';
	const MARKDOWN_MENTION_PREFIX = '####MD_MENTION_';
	const MARKDOWN_CODE_PATTERN = /(####MD_CODE_\d+####)/;
	const MARKDOWN_TABLE_URL_PREFIX = '/immobile/in-app/message/markdown-table/';

	module.exports = {
		NEW_LINE,
		MARKDOWN_PLACEHOLDER_SUFFIX,
		MARKDOWN_CODE_PREFIX,
		MARKDOWN_ESCAPE_PREFIX,
		MARKDOWN_INLINE_CODE_PREFIX,
		MARKDOWN_MENTION_PREFIX,
		MARKDOWN_CODE_PATTERN,
		MARKDOWN_TABLE_URL_PREFIX,
	};
});
