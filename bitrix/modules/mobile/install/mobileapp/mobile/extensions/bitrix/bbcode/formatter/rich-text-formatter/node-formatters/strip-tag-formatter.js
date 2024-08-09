/** @module bbcode/formatter/rich-text-formatter/node-formatters/strip-tag-formatter */

jn.define('bbcode/formatter/rich-text-formatter/node-formatters/strip-tag-formatter', (require, exports, module) => {
	const { NodeFormatter } = require('bbcode/formatter');

	class StripTagFormatter extends NodeFormatter
	{
		constructor(options = {})
		{
			super({
				name: options.name,
				convert({ node }) {
					return node.getScheme().createFragment({
						children: [
							...node.getChildren(),
						],
					});
				},
			});
		}
	}

	module.exports = {
		StripTagFormatter,
	};
});
