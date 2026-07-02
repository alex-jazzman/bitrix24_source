/**
 * @module mail/mailbox/folders-settings
 */
jn.define('mail/mailbox/folders-settings', (require, exports, module) => {
	const { FoldersSettingsLayout } = require('mail/mailbox/folders-settings/src/folders-settings-layout');

	const MailboxFoldersSettingsDialog = {
		open({
			mailboxId,
			titleText = '',
			titleType = 'dialog',
			onClose = null,
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
				if (typeof onClose === 'function')
				{
					let closeNotified = false;
					const notifyClose = () => {
						if (closeNotified)
						{
							return;
						}
						closeNotified = true;
						onClose();
					};

					widget.on('onViewRemoved', notifyClose);
				}

				const layout = new FoldersSettingsLayout({
					mailboxId,
					layoutWidget: widget,
					onSave: () => {
						widget.close();
					},
				});

				widget.showComponent(layout);
			});
		},
	};

	module.exports = {
		FoldersSettingsLayout,
		MailboxFoldersSettingsDialog,
	};
});
