/**
 * @module more-menu/block/company/personal-account/src/slides/document-slide
 */
jn.define('more-menu/block/company/personal-account/src/slides/document-slide', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Text4 } = require('ui-system/typography/text');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { DocumentView } = require('more-menu/block/company/personal-account/src/steps/document-view');

	const DocStage = {
		LOADING: 'loading',
		READY: 'ready',
	};

	/**
	 * Second slide of the personal account sheet: the result surface. It starts in
	 * the loading stage (a "generating document" placeholder) and switches to the
	 * isolated WebView once the document arrives. The "Close" button in the footer is
	 * always visible and dismisses the whole sheet.
	 *
	 * @class DocumentSlide
	 */
	class DocumentSlide extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {?string} props.stage - one of DocStage; falsy is treated as loading
		 * @param {?string} props.documentHtml
		 * @param {function(): void} props.onClose
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('document-slide'),
					backgroundColor: Color.bgContentPrimary,
					safeArea: { bottom: true },
					footer: BoxFooter(
						{ testId: this.getTestId('document-footer') },
						Button({
							testId: this.getTestId('document-close'),
							text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_CLOSE'),
							size: ButtonSize.L,
							stretched: true,
							onClick: this.props.onClose,
						}),
					),
				},
				this.#renderContent(),
			);
		}

		#renderContent()
		{
			switch (this.props.stage)
			{
				case DocStage.READY:
					return this.#renderDocument();

				default:
					return this.#renderLoading();
			}
		}

		#renderLoading()
		{
			return View(
				{
					testId: this.getTestId('doc-wait'),
					style: {
						flex: 1,
						alignItems: 'center',
						justifyContent: 'center',
						paddingHorizontal: Indent.XL.toNumber(),
					},
				},
				SpinnerLoader({ size: 32 }),
				Text4({
					testId: this.getTestId('doc-wait-text'),
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_DOC_WAIT'),
					color: Color.base2,
					style: {
						marginTop: Indent.M.toNumber(),
						textAlign: 'center',
					},
				}),
			);
		}

		#renderDocument()
		{
			return new DocumentView({
				testId: this.getTestId('document'),
				documentHtml: this.props.documentHtml,
			});
		}
	}

	module.exports = { DocumentSlide, DocStage };
});
