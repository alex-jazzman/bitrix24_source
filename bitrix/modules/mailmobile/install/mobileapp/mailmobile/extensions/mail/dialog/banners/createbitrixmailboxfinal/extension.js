/**
 * @module mail/dialog/banners/createbitrixmailboxfinal
 */
jn.define('mail/dialog/banners/createbitrixmailboxfinal', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');

	class CreateBitrixMailboxFinal extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				successCallback = () => {},
				mailboxId = 0,
			} = props;

			this.parentWidget = parentWidget;
			this.layoutWidget = layoutWidget;
			this.successCallback = successCallback;
			this.mailboxId = Number(mailboxId);
		}

		closeLayout(callback)
		{
			this.layoutWidget.close(callback);
		}

		render()
		{
			return BannerTemplate({
				iconPathName: 'mailbox-connection-final-full-2.png',
				iconWidth: '125',
				iconHeight: '163',
				title: Loc.getMessage('MAIL_CREATE_MAILBOX_FINAL_MAIL_BANNER_TITLE'),
				description: Loc.getMessage('MAIL_CREATE_MAILBOX_FINAL_MAIL_BANNER_DESCRIPTION'),
				buttonsView: View(
					{
						style: {
							width: '100%',
						},
					},
					Button({
						testId: 'mailbox-create-final-button-confirm',
						text: Loc.getMessage('MAIL_CREATE_MAILBOX_FINAL_MAIL_BANNER_BUTTON'),
						size: ButtonSize.XL,
						design: ButtonDesign.FILLED,
						disabled: false,
						badge: false,
						stretched: true,
						onClick: () => {
							this.closeLayout(this.successCallback);
						},
					}),
				),
			});
		}
	}

	module.exports = { CreateBitrixMailboxFinal };
});
