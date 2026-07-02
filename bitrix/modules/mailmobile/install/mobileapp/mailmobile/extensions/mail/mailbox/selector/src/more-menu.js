/**
 * @module mail/mailbox/selector/src/more-menu
 */
jn.define('mail/mailbox/selector/src/more-menu', (require, exports, module) => {
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { Loc } = require('loc');
	const { UIMenu } = require('layout/ui/menu');
	const { Icon } = require('assets/icons');
	const { Icon: UiIcon } = require('ui-system/blocks/icon');
	const { Haptics } = require('haptics');
	const { ConfirmNavigator, ButtonType } = require('alert/confirm');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const {
		deleteMailbox,
	} = require('mail/statemanager/redux/slices/mailboxes/thunk');

	let MailboxSettingsDialog = null;
	let MailboxFoldersSettingsDialog = null;

	class MoreMenu extends BaseListMoreMenu
	{
		constructor(props = {})
		{
			super([], null);

			const {
				mailboxId = 0,
				canEditSettings = false,
				parentWidget,
			} = props;

			this.parentWidget = parentWidget;
			this.mailboxId = mailboxId;
			this.canEditSettings = canEditSettings;
		}

		showConfirmRemoveEntity()
		{
			const confirm = new ConfirmNavigator({
				title: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_REMOVE_MAILBOX_DIALOG_TITLE'),
				description: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_REMOVE_MAILBOX_DIALOG_TEXT'),
				buttons: [
					{
						text: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_REMOVE_MAILBOX_DIALOG_AGREE'),
						type: ButtonType.DESTRUCTIVE,
						onPress: () => {
							dispatch(deleteMailbox({ mailboxId: this.mailboxId }));
							this.parentWidget.close();
						},
					},
					{
						text: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_REMOVE_MAILBOX_DIALOG_REFUSE'),
						type: ButtonType.CANCEL,
					},
				].filter(Boolean),
			});

			Haptics.impactLight();

			confirm.open();
		}

		getMenuItems()
		{
			const menuItems = [];

			if (this.canEditSettings)
			{
				menuItems.push(this.createMenuItem({
					id: 'mailboxSettings',
					showIcon: true,
					icon: UiIcon.SETTINGS,
					title: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_SETTINGS_BUTTON_TEXT'),
					checked: false,
					showCheckedIcon: false,
				}));

				menuItems.push(this.createMenuItem({
					id: 'mailboxFoldersSettings',
					showIcon: true,
					icon: Icon.FOLDER,
					title: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_FOLDERS_SETTINGS_BUTTON_TEXT'),
					checked: false,
					showCheckedIcon: false,
				}));
			}

			menuItems.push(this.createMenuItem({
					id: 'removeMailbox',
					showIcon: true,
					icon: Icon.DELETE_PERSON,
					isDestructive: true,
					title: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_REMOVE_MAILBOX_BUTTON_TEXT'),
					checked: false,
					showCheckedIcon: false,
				}));

			return menuItems;
		}

		/**
		 * @private
		 * @param event
		 * @param item
		 */
		onMenuItemSelected(event, item)
		{
			const {
				id = '',
			} = item;

			if (id === 'mailboxSettings' && this.mailboxId > 0)
			{
				this.openMailboxSettings();
			}

			if (id === 'mailboxFoldersSettings' && this.mailboxId > 0)
			{
				this.openMailboxFoldersSettings();
			}

			if (id === 'removeMailbox' && this.mailboxId > 0)
			{
				this.showConfirmRemoveEntity();
			}
		}

		openMailboxSettings()
		{
			if (!MailboxSettingsDialog)
			{
				({ MailboxSettingsDialog } = require('mail/mailbox/settings'));
			}

			const mailboxId = this.mailboxId;

			this.parentWidget.close(() => {
				MailboxSettingsDialog.open({
					mailboxId,
					titleText: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_SETTINGS_BUTTON_TEXT'),
				});
			});
		}

		openMailboxFoldersSettings()
		{
			if (!MailboxFoldersSettingsDialog)
			{
				({ MailboxFoldersSettingsDialog } = require('mail/mailbox/folders-settings'));
			}

			const mailboxId = this.mailboxId;

			this.parentWidget.close(() => {
				MailboxFoldersSettingsDialog.open({
					mailboxId,
					titleText: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_FOLDERS_SETTINGS_BUTTON_TEXT'),
				});
			});
		}

		openMoreMenu = (target) => {
			const menuItems = this.getMenuItems();

			this.menu = new UIMenu(menuItems);
			this.menu.show({ target });
		};
	}

	module.exports = {
		MoreMenu,
	};
});
