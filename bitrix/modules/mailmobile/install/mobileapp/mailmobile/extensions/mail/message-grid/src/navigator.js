/**
 * @module mail/message-grid/src/navigator
 */
jn.define('mail/message-grid/src/navigator', (require, exports, module) => {
	const { selectStartEmailSender } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectCurrentFolder } = require('mail/statemanager/redux/slices/folders/selector');
	const {
		Selector: FolderSelector,
		getDraftsAvailability,
	} = require('mail/folder/selector');
	const store = require('statemanager/redux/store');
	const { MailOpener } = require('mail/opener');
	const { Loc } = require('loc');

	async function openFolderMenuWithDraftsAvailability({
		selectorProps = {},
		loadDraftsAvailability = getDraftsAvailability,
		openFolderMenu,
	})
	{
		const draftsAvailable = await loadDraftsAvailability();

		return openFolderMenu({
			...selectorProps,
			draftsAvailable,
		});
	}

	class MessageGridNavigator
	{
		constructor({
			parentWidget,
			loadDraftsAvailability = getDraftsAvailability,
		} = {})
		{
			this.parentWidget = parentWidget;
			this.loadDraftsAvailability = loadDraftsAvailability;
			void this.loadDraftsAvailability();
		}

		/**
		 * Opens the message view by a numeric message id: the tap of a single-message row and the tap
		 * of a nested conversation item both land here. A conversation row is addressed by `c:{id}` and
		 * has no message view of its own, so its id never opens the view.
		 */
		openMessageChain = (threadId, startEmailSender) => {
			const messageId = Number(threadId);
			if (!Number.isInteger(messageId) || messageId <= 0)
			{
				return;
			}

			ComponentHelper.openLayout({
				name: 'mail:mail.message.view',
				object: 'layout',
				widgetParams: {
					title: Loc.getMessage('MAILMOBILE_MESSAGE_MESSAGE_CHAIN_TITLE'),
				},
				componentParams: {
					threadId: messageId,
					isCrmMessage: 0,
					folder: selectCurrentFolder(store.getState()).type,
					element: 'compose_button',
					startEmailSender,
				},
			});
		};

		openFolderMenu = (selectorProps = {}) => openFolderMenuWithDraftsAvailability({
			selectorProps,
			loadDraftsAvailability: this.loadDraftsAvailability,
			openFolderMenu: this.showFolderMenu,
		});

		showFolderMenu = (selectorProps) => {
			this.parentWidget.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES,
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							parentWidget: this.parentWidget,
							layoutWidget,
							...selectorProps,
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

	module.exports = {
		MessageGridNavigator,
		openFolderMenuWithDraftsAvailability,
	};
});
