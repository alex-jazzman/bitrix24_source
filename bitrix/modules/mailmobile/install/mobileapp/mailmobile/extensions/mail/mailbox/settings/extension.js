/**
 * @module mail/mailbox/settings
 */
jn.define('mail/mailbox/settings', (require, exports, module) => {
	const { SettingsLayout } = require('mail/mailbox/settings/src/settings-layout');

	const MailboxSettingsDialog = {
		open({
			mailboxId,
			titleText,
			titleType = 'dialog',
		} = {})
		{
			if (!mailboxId)
			{
				return;
			}

			PageManager.openWidget('layout', {
				modal: true,
				backdrop: {
					horizontalSwipeAllowed: false,
					mediumPositionPercent: 90,
				},
				titleParams: {
					text: titleText,
					type: titleType,
				},
			}).then((widget) => {
				const layout = new SettingsLayout({
					mailboxId,
					layoutWidget: widget,
					titleText,
					titleType,
					onSave: () => {
						widget.close();
					},
					onLoadError: () => {
						widget.close();
					},
				});

				widget.showComponent(layout);
			});
		},
	};

	module.exports = {
		SettingsLayout,
		MailboxSettingsDialog,
	};
});
