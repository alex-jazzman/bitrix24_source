/**
 * @module mail/simple-list/items/message-redux/src/action-menu
 */
jn.define('mail/simple-list/items/message-redux/src/action-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { Feature } = require('feature');
	const { qrauth } = require('qrauth/utils');
	const { UIMenu } = require('layout/ui/menu');
	const { showRemoveToast } = require('toast/remove');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const {
		markAsRemoved,
		unmarkAsRemoved,
		markAsSelected,
	} = require('mail/statemanager/redux/slices/messages');
	const { selectFoldersByType, selectById: selectFolderById, selectCurrentFolder } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const {
		remove,
		moveToFolder,
		changeReadStatus,
		addToCrm,
		addToChat,
		addToTask,
		sendBindingEvent,
	} = require('mail/statemanager/redux/slices/messages/thunk');
	const { selectById } = require('mail/statemanager/redux/slices/messages/selector');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { openDetail } = require('mail/message/elements/contact/card');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const Sections = {
		CREATE: 'create',
		REMOVE: 'remove',
		EDIT: 'edit',
	};

	const Actions = {
		SELECT: 'select',
		READ: 'read',
		UNREAD: 'unread',
		IN_FOLDER: 'in_folder',
		CREATE: 'create',
		REMOVE: 'remove',
		CREATE_TASK: ' create_task',
		OPEN_TASK: ' open_task',
		IN_SPAM: 'in_spam',
		CREATE_CHAT: 'create_chat',
		OPEN_CHAT: 'open_chat',
		CREATE_POST: 'create_post',
		CREATE_EVENT: 'create_event',
		CREATE_CRM: 'create_crm',
		OPEN_CRM: 'open_crm',
	};

	/**
	 * @class ActionMenu
	 * @param {number} objectId
	 */
	class ActionMenu extends BaseListMoreMenu
	{
		constructor(objectId)
		{
			super({});

			this.objectId = objectId;
			this.object = selectById(store.getState(), objectId);

			const {
				isRead,
				crmBindId,
				chatBindId,
				crmBindTypeId,
				taskBindId,
			} = this.object || {};

			this.isRead = isRead;
			this.crmBindId = crmBindId;
			this.chatBindId = chatBindId;
			this.crmBindTypeId = crmBindTypeId;
			this.taskBindId = taskBindId;
		}

		getSubCreateMenuItems()
		{
			const menuItems = [];

			if (this.taskBindId > 0)
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.OPEN_TASK,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_OPEN_TASK'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_TASK,
					},
				));
			}
			else
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.CREATE_TASK,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_TASK'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_TASK,
					},
				));
			}

			if (this.chatBindId > 0)
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.OPEN_CHAT,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_OPEN_CHAT'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_CHAT,
					},
				));
			}
			else
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.CREATE_CHAT,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_CHAT'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_CHAT,
					},
				));
			}

			/* menuItems.push(
				this.createMenuItem(
					{
						id: Actions.CREATE_POST,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_POST'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_POST,
					},
				),
			); */

			/* menuItems.push(this.createMenuItem(
				{
					id: Actions.CREATE_EVENT,
					showIcon: true,
					title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_EVENT'),
					sectionCode: Sections.CREATE,
					icon: Icon.MAIL_CREATION_EVENT,
				},
			)); */

			if (this.crmBindId > 0)
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.OPEN_CRM,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_OPEN_CRM'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_CRM,
					},
				));
			}
			else
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.CREATE_CRM,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_CRM'),
						sectionCode: Sections.CREATE,
						icon: Icon.MAIL_CREATION_CRM,
					},
				));
			}

			return menuItems;
		}

		getMenuItems()
		{
			const actions = [];
			const currentFolder = selectCurrentFolder(store.getState());

			actions.push(this.createMenuItem({
				id: Actions.SELECT,
				showIcon: true,
				testId: 'mail-action-menu-item-select',
				title: Loc.getMessage('MAILMOBILE_ACTIONS_SELECT'),
				sectionCode: Sections.EDIT,
				icon: Icon.CIRCLE_CHECK,
			}));

			if (this.isRead)
			{
				actions.push(this.createMenuItem(
					{
						id: Actions.UNREAD,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_UNREAD'),
						sectionCode: Sections.EDIT,
						icon: Icon.MAIL_COUNTER,
					},
				));
			}
			else
			{
				actions.push(this.createMenuItem(
					{
						id: Actions.READ,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_READ'),
						sectionCode: Sections.EDIT,
						icon: Icon.DOUBLE_CHECK,
					},
				));
			}

			actions.push(
				this.createMenuItem({
					id: Actions.IN_FOLDER,
					showIcon: true,
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_FOLDER'),
					sectionCode: Sections.EDIT,
					icon: Icon.FOLDER,
				}),
			);

			if (currentFolder?.type !== DefaultFolderType.SPAM.value)
			{
				actions.push(
					this.createMenuItem({
						id: Actions.IN_SPAM,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_SPAM'),
						sectionCode: Sections.EDIT,
						icon: Icon.ALERT_ACCENT,
					}),
				);
			}

			actions.push(...this.getSubCreateMenuItems());

			actions.push(
				this.createMenuItem({
					id: Actions.REMOVE,
					showIcon: true,
					title: Loc.getMessage('MAILMOBILE_ACTIONS_REMOVE'),
					sectionCode: Sections.REMOVE,
					icon: Icon.TRASHCAN,
					isDestructive: true,
				}),
			);

			return actions;
		}

		openMover(objectId)
		{
			PageManager.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES_MOVE,
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							layoutWidget,
							mode: FolderSelector.MOVE_MODE,
							onSelect: this.changeObjectFolder.bind(this),
							additionalPropsForSelect: { objectId },
						}));
					},
				},
			);
		}

		changeObjectFolder(props)
		{
			const {
				folderSignature = null,
				folder: folderToMove = null,
				objectId = null,
			} = props;

			if (folderToMove === null && DefaultFolderType.isDefined(folderSignature))
			{
				const defaultFolderToMove = selectFoldersByType(store.getState(), folderSignature, true);
				if (defaultFolderToMove.length === 0)
				{
					const mailboxId = selectCurrentMailboxId(store.getState());
					const title = (DefaultFolderType.TRASH.getValue() === folderSignature)
						? Loc.getMessage('MAILMOBILE_ACTIONS_FOLDERS_TRASH_BANNER_TITLE')
						: Loc.getMessage('MAILMOBILE_ACTIONS_FOLDERS_SPAM_BANNER_TITLE')
					;
					qrauth.open({
						title,
						hintText: Loc.getMessage('MAILMOBILE_ACTIONS_FOLDERS_SETTINGS_BANNER_DESCRIPTION'),
						redirectUrl: `/mail/config/dirs?mailboxId=${mailboxId}`,
						showHint: true,
					});

					return;
				}
			}

			const message = selectById(store.getState(), objectId);

			let resolvedFolderToMove = folderToMove;

			if (resolvedFolderToMove === null)
			{
				resolvedFolderToMove = Object.values(DefaultFolderType).some((type) => type.value === folderSignature)
					? selectFoldersByType(store.getState(), folderSignature)?.find(() => true)
					: selectFolderById(store.getState(), folderSignature);
			}

			if (!resolvedFolderToMove || !message)
			{
				return;
			}

			dispatch(moveToFolder({ objectIds: [objectId], objectUidIds: [message.uidId], folderPath: folderToMove.path }));
		}

		selectObject(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(markAsSelected({ objectId }));
		}

		changeReadObjectStatus(objectId, isRead)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			const messageUidId = message.uidId;

			if (!messageUidId)
			{
				return;
			}

			dispatch(changeReadStatus({ objectIds: [objectId], objectUidIds: [messageUidId], isRead }));
		}

		createCrmEntity(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(addToCrm({ objectIds: [objectId] }));
		}

		createChatEntity(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(addToChat({ objectId }));
		}

		createTaskEntity(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(addToTask({
				objectId,
				description: '',
				title: message.subject,
			}));
		}

		removeObject(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			const messageUidId = message.uidId;

			if (!messageUidId)
			{
				return;
			}

			if (!Feature.isToastSupported())
			{
				dispatch(remove({ objectIds: [objectId], objectUidIds: [messageUidId] }));

				return;
			}

			dispatch(markAsRemoved({ objectIds: [objectId] }));

			showRemoveToast(
				{
					message: Loc.getMessage('MAILMOBILE_ACTIONS_REMOVE_TOAST_MESSAGE'),
					offset: 86,
					onButtonTap: () => {
						dispatch(unmarkAsRemoved({ objectIds: [objectId] }));
					},
					onTimerOver: () => {
						dispatch(remove({ objectIds: [objectId], objectUidIds: [messageUidId] }));
					},
				},
			);
		}

		openCrmEntity()
		{
			openDetail(this.crmBindId, this.crmBindTypeId, false);
		}

		openChatEntity()
		{
			void requireLazy('im:messenger/api/dialog-opener').then(({ DialogOpener }) => {
				DialogOpener.open({ dialogId: `chat${this.chatBindId}` });
			});
		}

		openTaskEntity()
		{
			void requireLazy('tasks:entry').then(({ Entry }) => {
				Entry.openTask({ taskId: this.taskBindId });
			});
		}

		onMenuItemSelected = (event, item) => {
			// eslint-disable-next-line default-case
			switch (item.id)
			{
				case Actions.SELECT:
					this.selectObject(this.objectId);
					break;
				case Actions.UNREAD:
					this.changeReadObjectStatus(this.objectId, 0);
					break;
				case Actions.READ:
					this.changeReadObjectStatus(this.objectId, 1);
					break;
				case Actions.IN_FOLDER:
					this.openMover(this.objectId);
					break;
				case Actions.REMOVE:
					this.removeObject(this.objectId);
					break;
				case Actions.IN_SPAM:
					this.changeObjectFolder({
						objectId: this.objectId,
						folderSignature: DefaultFolderType.SPAM.value,
					});
					break;
				case Actions.OPEN_CRM:
					this.openCrmEntity();
					break;
				case Actions.CREATE_CRM:
					this.createCrmEntity(this.objectId);
					break;
				case Actions.CREATE_CHAT:
					this.createChatEntity(this.objectId);
					break;
				case Actions.OPEN_CHAT:
					this.openChatEntity();
					break;
				case Actions.OPEN_TASK:
					this.openTaskEntity();
					break;
				case Actions.CREATE_TASK:
					this.createTaskEntity(this.objectId);
					break;
			}
		};

		openMoreMenu = (target) => {
			const menuItems = this.getMenuItems();

			this.menu = new UIMenu(menuItems);
			this.menu.show({ target });
		};

		async show(target)
		{
			this.openMoreMenu(target);
		}
	}

	module.exports = { ActionMenu, sendBindingEvent };
});
