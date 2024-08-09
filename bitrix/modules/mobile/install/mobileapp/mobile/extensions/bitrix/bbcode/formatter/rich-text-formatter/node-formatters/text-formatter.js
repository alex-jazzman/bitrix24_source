/** @module bbcode/formatter/rich-text-formatter/node-formatters/text-formatter */
jn.define('bbcode/formatter/rich-text-formatter/node-formatters/text-formatter', (require, exports, module) => {
	const { NodeFormatter } = require('bbcode/formatter');

	class TextFormatter extends NodeFormatter
	{
		constructor(options = {})
		{
			super({
				name: options.name,
				convert({ node }) {
					return node;
				},
			});
		}
	}

	module.exports = {
		TextFormatter,
	};
});
