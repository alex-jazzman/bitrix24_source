/**
 * @module mail/dialog/banners/connectionforbidden
 */
jn.define('mail/dialog/banners/connectionforbidden', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');

	class ConnectionForbidden extends LayoutComponent
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
					text: Loc.getMessage('MAIL_BANNER_CONFIG_CONNECT_ACCESS_DENIED_BUTTON'),
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
				iconPathName: 'mailbox-error.png',
				iconWidth: '171',
				iconHeight: '163',
				title: Loc.getMessage('MAIL_BANNER_CONFIG_CONNECT_ACCESS_DENIED_TITLE'),
				description: Loc.getMessage('MAIL_BANNER_CONFIG_CONNECT_ACCESS_DENIED_SUB_TITLE'),
				buttonsView: this.renderCloseButton(),
			});
		}
	}

	module.exports = { ConnectionForbidden };
});