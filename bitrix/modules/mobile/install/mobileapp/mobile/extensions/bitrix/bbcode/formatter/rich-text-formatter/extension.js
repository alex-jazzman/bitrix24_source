/** @module bbcode/formatter/rich-text-formatter */
jn.define('bbcode/formatter/rich-text-formatter', (require, exports, module) => {
	const { Formatter, NodeFormatter } = require('bbcode/formatter');
	const { DiskNodeFormatter } = require('bbcode/formatter/rich-text-formatter/node-formatters/disk-formatter');
	const { StripTagFormatter } = require('bbcode/formatter/rich-text-formatter/node-formatters/strip-tag-formatter');
	const { MentionFormatter } = require('bbcode/formatter/rich-text-formatter/node-formatters/mention-formatter');
	const { TextFormatter } = require('bbcode/formatter/rich-text-formatter/node-formatters/text-formatter');
	const { inAppUrl } = require('in-app-url');
	const { Type } = require('type');

	class RichTextFormatter extends Formatter
	{
		constructor(options = {})
		{
			const formatters = [
				...(options?.formatters || []),
				new DiskNodeFormatter(),
				new StripTagFormatter({ name: 'p' }),
				new StripTagFormatter({ name: 'span' }),
				new MentionFormatter({ name: 'user' }),
				new MentionFormatter({ name: 'project' }),
				new MentionFormatter({ name: 'department' }),
				new TextFormatter({ name: '#text' }),
			];

			super({
				...options,
				formatters,
			});

			formatters.forEach((formatter) => {
				formatter.setFormatter(this);
			});

			this.formatters = formatters;
		}

		getDefaultUnknownNodeCallback(options)
		{
			return () => {
				return new NodeFormatter({
					name: 'unknown',
					convert({ node }) {
						return node.clone();
					},
				});
			};
		}

		getNodeFormatters()
		{
			return this.formatters;
		}

		getOnClickHandler()
		{
			return ({ url }) => {
				const isClickHandled = this.getNodeFormatters().some((formatter) => {
					if (Type.isFunction(formatter.onClick))
					{
						return formatter.onClick({ url });
					}

					return false;
				});

				if (!isClickHandled)
				{
					inAppUrl.open(
						url,
						{
							parentWidget: (this.parentWidget || PageManager),
						},
					);
				}
			};
		}
	}

	module.exports = {
		RichTextFormatter,
	};
});
