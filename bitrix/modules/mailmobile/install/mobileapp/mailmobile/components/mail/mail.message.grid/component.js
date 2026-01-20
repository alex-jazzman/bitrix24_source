(() => {
	const require = (ext) => jn.require(ext);
	const { MessageGrid } = require('mail/message-grid');
	const { MailDialog } = require('mail/dialog');
	const { AjaxMethod } = require('mail/const');

	BX.onViewLoaded(() => {
		const mailboxId = BX.componentParameters.get('mailboxId', 0);

		return BX.ajax.runAction(AjaxMethod.mailGetAvailableMailboxes, {
			data: {},
		}).then(({ data }) => {
			if (data.length === 0)
			{
				BX.ajax.runAction(
					AjaxMethod.isMailboxConnectingAvailable,
					{
						data: {},
					},
				).then(({ data }) => {
					if (data === true)
					{
						MailDialog.show({
							type: MailDialog.CONNECTING_MAIL_TYPE,
							needsToCloseLayout: false,
							layoutWidget: layout,
							successCallback: () => {
								layout.showComponent(new MessageGrid({ layout }));
							},
						});
					}
					else
					{
						MailDialog.show({
							type: MailDialog.CONNECTION_MAIL_TYPE_FORBIDDEN,
							needsToCloseLayout: false,
							layoutWidget: layout,
						});
					}
				});
			}
			else
			{
				layout.showComponent(new MessageGrid({
					layout,
					mailboxes: data,
					mailboxId,
				}));
			}
		});
	});
})();

// (() => {
// 	const require = (ext) => jn.require(ext);
// 	const { ActionsPanel } = require('native/panel');
// 	const {
// 		Button,
// 	} = require('ui-system/form/buttons/button');
//
// 	const panel = new ActionsPanel();
//
// 	class PanelComponent extends LayoutComponent
// 	{
// 		render()
// 		{
// 			return View(
// 				{
// 					style: {
// 						height: 120,
// 					},
// 				},
// 			);
// 		}
// 	}
//
// 	class PlaygroundComponent extends LayoutComponent
// 	{
// 		render()
// 		{
// 			let ch = true;
//
// 			return View(
// 				{
// 					style: {
// 						backgroundColor: '#ffffff',
// 					},
// 				},
// 				Button({
// 					testId: '0',
// 					rounded: true,
// 					border: true,
// 					text: 'Install controller',
// 					style: {
// 						top: 10,
// 						left: 10,
// 						position: 'absolute',
// 						height: 50,
// 					},
// 					onClick: () => {
// 						panel.setComponent(new PanelComponent());
// 					},
// 				}),
// 				Button({
// 					testId: '1',
// 					rounded: true,
// 					border: true,
// 					text: 'Show/Hide',
// 					style: {
// 						top: 70,
// 						left: 10,
// 						position: 'absolute',
// 						height: 50,
// 					},
// 					onClick: () => {
// 						if (ch)
// 						{
// 							panel.show();
// 						}
// 						else
// 						{
// 							panel.hide();
// 						}
// 						ch = !ch;
// 					},
// 				}),
// 			);
// 		}
// 	}
//
// 	layout.showComponent(new PlaygroundComponent());
// })();
