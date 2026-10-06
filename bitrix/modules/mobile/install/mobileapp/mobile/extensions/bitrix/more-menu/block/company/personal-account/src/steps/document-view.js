/**
 * @module more-menu/block/company/personal-account/src/steps/document-view
 */
jn.define('more-menu/block/company/personal-account/src/steps/document-view', (require, exports, module) => {
	const { Color, Component } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');

	/**
	 * Full-screen document view. Renders the salary/vacation `documentHtml` in an
	 * isolated native WebView (no JS bridge, no session/token access) - safety is
	 * provided by the WebView isolation, not by server-side sanitisation. Both
	 * result types (payslip and vacation) are shown the same way.
	 *
	 * @class DocumentView
	 */
	class DocumentView extends LayoutComponent
	{
		/**
		 * @param {{ testId: string, documentHtml: string }} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });
		}

		render()
		{
			const { documentHtml } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				WebView({
					testId: this.getTestId('webview'),
					style: {
						flex: 1,
						marginHorizontal: Component.paddingLrMore.toNumber(),
						borderRadius: 10,
					},
					scrollDisabled: false,
					data: {
						content: DocumentView.wrapHtml(documentHtml),
						mimeType: 'text/html',
						charset: 'UTF-8',
					},
				}),
			);
		}

		/**
		 * @param {string} documentHtml - server-provided document, whole or fragment
		 * @return {string}
		 */
		static wrapHtml(documentHtml)
		{
			const content = typeof documentHtml === 'string' ? documentHtml : '';

			// Wrap a bare fragment; leave an already complete document untouched.
			if (/<html[\s>]/i.test(content))
			{
				return content;
			}

			return `<html><body>${content}</body></html>`;
		}
	}

	module.exports = { DocumentView };
});
