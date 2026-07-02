/**
 * @module mail/dialog/banners/connectingmail/src/status-drawer
 */
jn.define('mail/dialog/banners/connectingmail/src/status-drawer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const {
		Button,
		ButtonSize,
		ButtonDesign,
	} = require('ui-system/form/buttons/button');
	const { getMediumHeight } = require('utils/page-manager');

	const STATUS_HEIGHT = 380;

	class StatusDrawer extends LayoutComponent
	{
		static open({ parentWidget })
		{
			parentWidget.openWidget('layout', {
				titleParams: { text: '' },
				backdrop: {
					mediumPositionHeight: getMediumHeight({ height: STATUS_HEIGHT }),
					onlyMediumPosition: true,
					hideNavigationBar: true,
					forceDismissOnSwipeDown: true,
					swipeAllowed: true,
				},
			})
				.then((widget) => {
					widget.showComponent(new StatusDrawer({ widget }));
				})
				.catch(console.error);
		}

		constructor(props)
		{
			super(props);

			this.onClose = this.onClose.bind(this);
		}

		onClose()
		{
			this.props.widget.close();
		}

		render()
		{
			const closeButton = Button({
				testId: 'mail-connection-request-status-close',
				text: Loc.getMessage('MAIL_CONNECTION_REQUEST_STATUS_CLOSE'),
				size: ButtonSize.XL,
				design: ButtonDesign.FILLED,
				stretched: true,
				onClick: this.onClose,
			});

			const successImage = Image({
				testId: 'mail-connection-request-status-icon',
				uri: makeLibraryImagePath('connection-request-success.png', 'empty-states', 'mail'),
				style: {
					width: 96,
					height: 96,
				},
			});

			return Box(
				{
					testId: 'mail-connection-request-status',
					backgroundColor: Color.bgPrimary,
					safeArea: { bottom: true },
					footer: BoxFooter(
						{ testId: 'mail-connection-request-status-footer' },
						closeButton,
					),
				},
				View(
					{
						style: {
							paddingTop: Indent.XL4.toNumber(),
							paddingBottom: Indent.XL4.toNumber(),
						},
					},
					StatusBlock({
						testId: 'mail-connection-request-status-block',
						image: successImage,
						title: Loc.getMessage('MAIL_CONNECTION_REQUEST_STATUS_TITLE'),
						description: Loc.getMessage('MAIL_CONNECTION_REQUEST_STATUS_DESC'),
					}),
				),
			);
		}
	}

	module.exports = { StatusDrawer };
});
