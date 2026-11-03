/**
 * @module mail/templates/src/template-preview
 */
jn.define('mail/templates/src/template-preview', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { canonicalHtmlToPlainText } = require('mail/draft/compose-state');
	const { Color, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { Text2, Text4 } = require('ui-system/typography/text');

	class TemplatePreview extends PureComponent
	{
		render()
		{
			return Box(
				{
					testId: 'mail-template-preview',
					withScroll: true,
					safeArea: { bottom: true },
				},
				View(
					{
						testId: 'mail-template-preview-content',
						style: { padding: Indent.XL3.toNumber() },
					},
					Text2({
						testId: 'mail-template-preview-subject',
						text: String(this.props.template?.subject ?? ''),
						color: Color.base1,
					}),
					Text4({
						testId: 'mail-template-preview-body',
						text: canonicalHtmlToPlainText(this.props.template?.bodyHtml),
						color: Color.base2,
						style: { marginTop: Indent.XL.toNumber() },
					}),
				),
			);
		}
	}

	module.exports = { TemplatePreview };
});
