/**
 * @module mail/dialog/banners/lostmessage
 */
jn.define('mail/dialog/banners/lostmessage', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');

	class LostMessage extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				successCallback = () => {},
				needsToCloseLayout,
			} = props;

			this.needsToCloseLayout = needsToCloseLayout;
			this.parentWidget = parentWidget;
			this.layoutWidget = layoutWidget;
			this.successCallback = successCallback;
		}

		closeLayout(callback)
		{
			this.layoutWidget.close(callback);
		}

		renderCloseButton()
		{
			return View(
				{},
				Button({
					testId: 'mailbox-connection-button-confirm',
					text: Loc.getMessage('MAIL_BANNER_LOST_MESSAGE_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					disabled: false,
					stretched: true,
					onClick: () => {
						if (this.needsToCloseLayout)
						{
							this.closeLayout(() => {});
						}
						else
						{
							this.layoutWidget.back();
						}
					},
				}),
			);
		}

		render()
		{
			return BannerTemplate({
				iconPathName: 'empty-folder-grid-full.png',
				iconWidth: '146',
				iconHeight: '137',
				title: Loc.getMessage('MAIL_BANNER_LOST_MESSAGE_TITLE'),
				buttonsView: this.renderCloseButton(),
			});
		}
	}

	module.exports = { LostMessage };
});