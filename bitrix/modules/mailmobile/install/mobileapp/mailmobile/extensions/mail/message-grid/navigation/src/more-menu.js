/**
 * @module mail/message-grid/navigation/src/more-menu
 */

jn.define('mail/message-grid/navigation/src/more-menu', (require, exports, module) => {
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { Icon: AssetIcon } = require('assets/icons');
	const { Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');

	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { setMultiSelectMode } = require('mail/statemanager/redux/slices/messages');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	let MailboxSettingsDialog = null;
	let MailboxFoldersSettingsDialog = null;

	/**
	 * @class MessageGridMoreMenu
	 */
	class MessageGridMoreMenu extends BaseListMoreMenu
	{
		/**
		 * @param props
		 * @param {String} props.selectedSorting
		 * @param {Boolean} props.isASC
		 * @param {Object} props.callbacks
		 */
		constructor(props = {})
		{
			super([], null, props.selectedSorting, props.callbacks);
		}

		/**
		 * @public
		 * @returns {{type: string, id: string, testId: string, callback: ((function(): void)|*)}}
		 */
		getMenuButton()
		{
			return {
				type: 'more',
				id: 'message-grid-more-menu-button',
				testId: 'message-grid-more-menu-button',
				callback: this.openMoreMenu,
			};
		}

		/**
		 * @private
		 * @returns {Array}
		 */
		getMenuItems()
		{
			const menuItems = [
				this.createMenuItem({
					id: 'checkItems',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_CHECK'),
					checked: false,
					icon: Icon.CIRCLE_CHECK,
					showCheckedIcon: false,
				}),
			];
			const currentMailbox = selectCurrentMailbox(store.getState());

			if (currentMailbox?.canEditSettings)
			{
				menuItems.push(this.createMenuItem({
					id: 'mailboxSettings',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_SETTINGS'),
					checked: false,
					icon: Icon.SETTINGS,
					showCheckedIcon: false,
				}));

				menuItems.push(this.createMenuItem({
					id: 'mailboxFoldersSettings',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_FOLDERS_SETTINGS'),
					checked: false,
					icon: AssetIcon.FOLDER,
					showCheckedIcon: false,
				}));
			}

			return menuItems;
		}

		/**
		 * @private
		 * @param event
		 * @param item
		 */
		onMenuItemSelected(event, item)
		{
			const realItemId = String(item.id).split('::')[0];

			if (realItemId === 'checkItems')
			{
				this.checkItems();
			}

			if (realItemId === 'mailboxSettings')
			{
				this.openMailboxSettings();
			}

			if (realItemId === 'mailboxFoldersSettings')
			{
				this.openMailboxFoldersSettings();
			}
		}

		checkItems()
		{
			const currentState = store.getState();
			const isMultiSelectMode = selectIsMultiSelectMode(currentState);

			dispatch(setMultiSelectMode({ isMultiSelectMode: !isMultiSelectMode }));
		}

		openMailboxSettings()
		{
			if (!MailboxSettingsDialog)
			{
				({ MailboxSettingsDialog } = require('mail/mailbox/settings'));
			}

			const currentMailbox = selectCurrentMailbox(store.getState());
			if (!currentMailbox?.id || !currentMailbox.canEditSettings)
			{
				return;
			}

			MailboxSettingsDialog.open({
				mailboxId: currentMailbox.id,
				titleText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_SETTINGS'),
			});
		}

		openMailboxFoldersSettings()
		{
			if (!MailboxFoldersSettingsDialog)
			{
				({ MailboxFoldersSettingsDialog } = require('mail/mailbox/folders-settings'));
			}

			const currentMailbox = selectCurrentMailbox(store.getState());
			if (!currentMailbox?.id || !currentMailbox.canEditSettings)
			{
				return;
			}

			MailboxFoldersSettingsDialog.open({
				mailboxId: currentMailbox.id,
				titleText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_FOLDERS_SETTINGS'),
			});
		}
	}

	module.exports = { MessageGridMoreMenu };
});
