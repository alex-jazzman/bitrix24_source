/**
 * @module mail/dialog/banners/createbitrixmailbox/src/create-bitrix-mailbox
 */
jn.define('mail/dialog/banners/createbitrixmailbox/src/create-bitrix-mailbox', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { H4 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const { Connector } = require('mail/mailbox/connector');

	class CreateBitrixMailbox extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				successCallback = () => {},
				needsToCloseLayout,
				createBitrixEnabled = false,
			} = props;

			this.needsToCloseLayout = needsToCloseLayout;
			this.parentWidget = parentWidget;
			this.layoutWidget = layoutWidget;
			this.successCallback = successCallback;
			this.createBitrixEnabled = createBitrixEnabled;
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

		openConnector(startStepId)
		{
			this.closeLayout(() => {
				(new Connector({
					connectFrom: 'mail',
					parentWidget: this.parentWidget,
					successCallback: this.successCallback,
					startStepId,
					createBitrixEnabled: this.createBitrixEnabled,
				})).show();
			});
		}

		onCreateBitrixMailbox()
		{
			this.openConnector('createMailbox');
		}

		onChooseService()
		{
			this.openConnector('servicesList');
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
						alignItems: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						backgroundColor: Color.bgPrimary.toHex(),
					},
					safeArea: { bottom: true },
				},
				View(
					{
						style: {
							flex: 1,
							alignSelf: 'stretch',
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Image({
						uri: makeLibraryImagePath('mailbox-connection-full.png', 'empty-states', 'mail'),
						style: {
							width: 142,
							height: 127,
						},
					}),
					H4({
						text: Loc.getMessage('MAIL_CREATE_BITRIX_MAILBOX_BANNER_TITLE'),
						color: Color.base1,
						style: {
							marginTop: Indent.XL2.toNumber(),
							textAlign: 'center',
						},
					}),
					Text4({
						text: Loc.getMessage('MAIL_CREATE_BITRIX_MAILBOX_BANNER_DESCRIPTION'),
						color: Color.base3,
						style: {
							marginTop: Indent.M.toNumber(),
							textAlign: 'center',
						},
					}),
				),
				View(
					{
						style: {
							alignSelf: 'stretch',
						},
					},
					Button({
						testId: 'connecting-mailboxes-create-banner-create',
						text: Loc.getMessage('MAIL_CREATE_BITRIX_MAILBOX_BANNER_BUTTON_CREATE'),
						size: ButtonSize.XL,
						design: ButtonDesign.FILLED,
						stretched: true,
						onClick: this.onCreateBitrixMailbox.bind(this),
					}),
				),
				View(
					{
						style: {
							alignSelf: 'stretch',
							marginTop: Indent.L.toNumber(),
						},
					},
					Button({
						testId: 'connecting-mailboxes-create-banner-choose',
						text: Loc.getMessage('MAIL_CREATE_BITRIX_MAILBOX_BANNER_BUTTON_CHOOSE'),
						size: ButtonSize.XL,
						design: ButtonDesign.OUTLINE,
						stretched: true,
						onClick: this.onChooseService.bind(this),
					}),
				),
			);
		}
	}

	module.exports = { CreateBitrixMailbox };
});
