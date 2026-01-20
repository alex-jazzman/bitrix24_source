/**
 * @module mail/dialog/banners/connectingmail
 */
jn.define('mail/dialog/banners/connectingmail', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');
	const { Connector } = require('mail/mailbox/connector');

	class ConnectingMail extends LayoutComponent
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
			if (this.needsToCloseLayout)
			{
				this.layoutWidget.close(callback);
			}
			else
			{
				callback();
			}
		}

		render()
		{
			return BannerTemplate({
				iconPathName: 'mailbox-connection-full.png',
				iconWidth: '171',
				iconHeight: '154',
				title: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_TITLE_1'),
				description: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_DESCRIPTION'),
				buttonsView: View(
					{},
					Button({
						testId: 'mailbox-connection-button-confirm',
						text: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_BUTTON_1'),
						size: ButtonSize.XL,
						design: ButtonDesign.FILLED,
						disabled: false,
						stretched: true,
						onClick: () => {
							this.closeLayout(() => {
								(new Connector({
									parentWidget: this.parentWidget,
									successCallback: this.successCallback,
								})).show();
							});
						},
					}),
				),
			});
		}
	}

	module.exports = { ConnectingMail };
});