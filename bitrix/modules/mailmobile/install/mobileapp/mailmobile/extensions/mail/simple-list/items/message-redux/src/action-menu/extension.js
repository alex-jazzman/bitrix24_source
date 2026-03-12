/**
 * @module mail/simple-list/items/message-redux/src/action-menu
 */
jn.define('mail/simple-list/items/message-redux/src/action-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Uuid } = require('utils/uuid');
	const { Icon } = require('assets/icons');
	const { qrauth } = require('qrauth/utils');
	const { UIMenu } = require('layout/ui/menu');
	const { Alert, ButtonType } = require('alert');
	const { showToast, showErrorToast, showRemoveToast } = require('toast');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const {
		markAsSelected,
	} = require('mail/statemanager/redux/slices/messages');
	const { selectFoldersByType, selectById: selectFolderById, selectCurrentFolder } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const {
		moveToFolder,
		changeReadStatus,
		addToCrm,
		addToChat,
		addToTask,
		addToEvent,
		discussInChat,
		sendBindingEvent,
	} = require('mail/statemanager/redux/slices/messages/thunk');
	const { selectById } = require('mail/statemanager/redux/slices/messages/selector');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { openDetail } = require('mail/message/elements/contact/card');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { Moment } = require('utils/date');

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
		DISCUSS_IN_CHAT: 'discuss_in_chat',
		CREATE_POST: 'create_post',
		CREATE_EVENT: 'create_event',
		OPEN_EVENT: 'open_event',
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
			this.isDetailCard = false;

			const {
				isRead,
				crmBindId,
				chatBindId,
				crmBindTypeId,
				taskBindId,
				eventBindId,
			} = this.object || {};

			this.isRead = isRead;
			this.crmBindId = crmBindId;
			this.chatBindId = chatBindId;
			this.crmBindTypeId = crmBindTypeId;
			this.taskBindId = taskBindId;
			this.eventBindId = eventBindId;
		}

		openMoreMenu = (target) => {
			const menuItems = this.getMenuItems();

			this.menu = new UIMenu(menuItems);
			this.menu.show({ target });
		};

		async show({ target, isDetailCard = false })
		{
			this.isDetailCard = isDetailCard;
			this.openMoreMenu(target);
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
						icon: Icon.TASK,
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
						icon: Icon.TASK,
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
						icon: Icon.CHATS,
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
						icon: Icon.CHATS,
					},
				));
			}

			if (this.eventBindId > 0)
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.OPEN_EVENT,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_OPEN_EVENT'),
						sectionCode: Sections.CREATE,
						icon: Icon.CALENDAR_WITH_SLOTS,
					},
				));
			}
			else
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.CREATE_EVENT,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_EVENT'),
						sectionCode: Sections.CREATE,
						icon: Icon.CALENDAR_WITH_SLOTS,
					},
				));
			}

			menuItems.push(this.createMenuItem(
				{
					id: Actions.DISCUSS_IN_CHAT,
					showIcon: true,
					title: Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT'),
					sectionCode: Sections.CREATE,
				},
			));

			if (this.crmBindId > 0)
			{
				menuItems.push(this.createMenuItem(
					{
						id: Actions.OPEN_CRM,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_OPEN_CRM'),
						sectionCode: Sections.CREATE,
						icon: Icon.CRM,
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
						icon: Icon.CRM,
					},
				));
			}

			return menuItems;
		}

		getMenuItems()
		{
			const actions = [];
			const currentFolder = selectCurrentFolder(store.getState());

			if (!this.isDetailCard)
			{
				actions.push(this.createMenuItem({
					id: Actions.SELECT,
					showIcon: true,
					testId: 'mail-action-menu-item-select',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_SELECT'),
					sectionCode: Sections.EDIT,
					icon: Icon.CIRCLE_CHECK,
				}));
			}

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
			if (this.object)
			{
				actions.push(
					this.createMenuItem({
						id: Actions.REMOVE,
						showIcon: true,
						title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_TRASH'),
						sectionCode: Sections.REMOVE,
						icon: Icon.TRASHCAN,
						isDestructive: true,
					}),
				);
			}

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

		changeObjectFolder = (props) => {
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
					? selectFoldersByType(store.getState(), folderSignature, true)?.find(() => true)
					: selectFolderById(store.getState(), folderSignature)
				;
			}

			if (!resolvedFolderToMove || !message)
			{
				return;
			}

			dispatch(moveToFolder({
				objectIds: [objectId],
				objectUidIds: [message.uidId],
				folderPath: resolvedFolderToMove.path,
			}));

			const toastMessage = DefaultFolderType.isTrashFolder(resolvedFolderToMove.type)
				? Loc.getMessage('MAILMOBILE_ACTIONS_IN_TRASH_TOAST')
				: Loc.getMessage('MAILMOBILE_ACTIONS_IN_FOLDER_TOAST', { '#FOLDER_NAME#': resolvedFolderToMove.name })
			;

			if (this.isDetailCard && DefaultFolderType.isTrashFolder(resolvedFolderToMove.type))
			{
				layout.back();
			}

			showToast({ message: toastMessage });
		};

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

		discussInChat(objectId)
		{
			void requireLazy('im:messenger/api/dialog-selector').then(async ({ DialogSelector }) => {
				const selector = new DialogSelector();
				const { dialogId } = await selector.show({ title: Loc.getMessage('MAILMOBILE_ACTIONS_SELECT_CHAT') });

				console.log(objectId, dialogId);

				Alert.confirm(
					Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT_CONFIRM_TITLE'),
					Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT_CONFIRM_DESCRIPTIONS'),
					[
						{
							text: Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT_CONFIRM_ACCEPT'),
							onPress: this.#onAcceptDiscuss.bind(this, { objectId, dialogId }),
						},
						{
							type: ButtonType.DESTRUCTIVE,
							text: Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT_CONFIRM_CANCEL'),
						},
					],
				);
			});
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

		createEventEntity(objectId)
		{
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			BX.addCustomEvent('Calendar.EventEditForm::onAfterEventSave', this.#onCalendarEntrySaveHandler);
			void requireLazy('calendar:entry').then(({ Entry }) => {
				Entry.openEventEditForm({
					ownerId: env.userId,
					createMailId: objectId,
					uuid: this.uuid = Uuid.getV4(),
					description: this.createDescriptionForCalendarEvent(message),
				});
			});
		}

		createDescriptionForCalendarEvent(message)
		{
			return Loc.getMessage(
				'MAILMOBILE_ACTIONS_CREATE_EVENT_DESCRIPTION',
				{
					'#SUBJECT#': message.subject,
					'#LINK#': `/mail/message/${message.id}?source=event`,
					'#DATE#': Moment.createFromTimestamp(message.date).format('DD MMMM HH:mm'),
					'#FROM#': `${this.fromFullName} ${this.fromEmail}`,
					'#TO#': this.toEmail,
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

		openEventEntity()
		{
			void requireLazy('calendar:entry').then(({ Entry }) => {
				Entry.openEventViewForm({ eventId: this.eventBindId });
			});
		}

		#onAcceptDiscuss = ({ objectId, dialogId }) => {
			dispatch(discussInChat({
				messageId: objectId,
				dialogId,
			})).then(() => {
				void requireLazy('im:messenger/api/dialog-opener').then(({ DialogOpener }) => {
					DialogOpener.open({ dialogId });
				});
			}).catch((error) => {
				showErrorToast(error);
			});
		};

		onMenuItemSelected = (event, item) => {
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
					this.changeObjectFolder({
						objectId: this.objectId,
						folderSignature: DefaultFolderType.TRASH.value,
					});
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
				case Actions.OPEN_EVENT:
					this.openEventEntity();
					break;
				case Actions.CREATE_EVENT:
					this.createEventEntity(this.objectId);
					break;
				case Actions.CREATE_CHAT:
					this.createChatEntity(this.objectId);
					break;
				case Actions.OPEN_CHAT:
					this.openChatEntity();
					break;
				case Actions.DISCUSS_IN_CHAT:
					this.discussInChat(this.objectId);
					break;
				case Actions.OPEN_TASK:
					this.openTaskEntity();
					break;
				case Actions.CREATE_TASK:
					this.createTaskEntity(this.objectId);
					break;
				default:
					break;
			}
		};

		#onCalendarEntrySaveHandler = (event) => {
			const isEqualMessageId = this.objectId === event.createMailId;
			const isEqualUuid = this.uuid === event.uuid;
			BX.removeCustomEvent('Calendar.EventEditForm::onAfterEventSave', this.#onCalendarEntrySaveHandler);

			if (!isEqualMessageId || !isEqualUuid)
			{
				return;
			}

			dispatch(addToEvent({
				messageId: this.objectId,
				calendarEventId: event.eventId,
			}));
		};

		get fromFullName()
		{
			return this.object.from[0]?.customData?.name ?? '';
		}

		get fromEmail()
		{
			return this.object.from[0]?.customData?.email ?? '';
		}

		get toEmail()
		{
			return this.object.to[0]?.customData?.email ?? '';
		}
	}

	module.exports = { ActionMenu, sendBindingEvent };
});
