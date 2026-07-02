/**
 * @module mail/message-grid/src/navigator
 */
jn.define('mail/message-grid/src/navigator', (require, exports, module) => {
	const { selectStartEmailSender } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectCurrentFolder } = require('mail/statemanager/redux/slices/folders/selector');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const store = require('statemanager/redux/store');
	const { MailOpener } = require('mail/opener');
	const { Loc } = require('loc');

	class MessageGridNavigator
	{
		constructor({ parentWidget } = {})
		{
			this.parentWidget = parentWidget;
		}

		openMessageChain = (threadId, startEmailSender) => {
			ComponentHelper.openLayout({
				name: 'mail:mail.message.view',
				object: 'layout',
				widgetParams: {
					title: Loc.getMessage('MAILMOBILE_MESSAGE_MESSAGE_CHAIN_TITLE'),
				},
				componentParams: {
					threadId,
					isCrmMessage: 0,
					folder: selectCurrentFolder(store.getState()).type,
					element: 'compose_button',
					startEmailSender,
				},
			});
		};

		openFolderMenu = () => {
			this.parentWidget.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES,
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							parentWidget: this.parentWidget,
							layoutWidget,
						}));
					},
				},
				this.parentWidget,
			);
		};

		openWriteEmail = () => {
			MailOpener.openSend({
				isCrmMessage: false,
				startEmailSender: selectStartEmailSender(store.getState()),
			});
		};
	}

	module.exports = { MessageGridNavigator };
});
