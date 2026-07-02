/**
 * @module mail/simple-list/items/message-redux/src/action-menu
 */
jn.define('mail/simple-list/items/message-redux/src/action-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Uuid } = require('utils/uuid');
	const { Icon } = require('assets/icons');
	const { Alert, ButtonType } = require('alert');
	const { showErrorToast } = require('toast');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { changeFolder, openFolderSelector, changeReadStatus } = require('mail/message/actions');
	const {
		markAsSelected,
	} = require('mail/statemanager/redux/slices/messages');
	const { selectCurrentFolder, selectIsVirtualFolderMode } = require('mail/statemanager/redux/slices/folders/selector');
	const {
		remove,
		markAsSpam,
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

		async show({ target, isDetailCard = false })
		{
			this.isDetailCard = isDetailCard;

			this.menu = new PopupMenu(this.#menuItems);
			this.menu.show({ target });
		}

		#menuItem({ handler, ...params })
		{
			const item = this.createMenuItem(
				{
					showIcon: true,
					...params,
				},
			);
			item.onItemSelected = handler;

			return item;
		}

		openMover(objectId)
		{
			openFolderSelector({
				onSelect: this.#onFolderSelected,
				selectorProps: { additionalPropsForSelect: { objectId } },
			});
		}

		#onFolderSelected = (props) => {
			const {
				folderSignature = null,
				folder = null,
				objectId = null,
			} = props;

			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			const { success, isTrash } = changeFolder({
				objectIds: [objectId],
				objectUidIds: [message.uidId],
				folderSignature,
				folder,
			});

			if (success && this.isDetailCard && isTrash)
			{
				layout.back();
			}
		};

		removeObject = (objectId) => {
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(remove({
				objectIds: [objectId],
				objectUidIds: [message.uidId],
			}));

			if (this.isDetailCard)
			{
				layout.back();
			}
		};

		moveToSpam = (objectId) => {
			const message = selectById(store.getState(), objectId);
			if (!message)
			{
				return;
			}

			dispatch(markAsSpam({
				objectIds: [objectId],
				objectUidIds: [message.uidId],
			}));

			if (this.isDetailCard)
			{
				layout.back();
			}
		};

		selectObject(objectId)
		{
			dispatch(markAsSelected({ objectId }));
		}

		changeReadObjectStatus(objectId, isRead)
		{
			const message = selectById(store.getState(), objectId);
			if (!message?.uidId)
			{
				return;
			}

			changeReadStatus({ objectIds: [objectId], objectUidIds: [message.uidId], isRead });
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

		get #subMenuItems()
		{
			const items = [
				this.#menuItem({
					id: 'crm',
					title: Loc.getMessage(this.crmBindId > 0 ? 'MAILMOBILE_ACTIONS_OPEN_CRM' : 'MAILMOBILE_ACTIONS_SUBMENU_DEAL'),
					sectionCode: 'create',
					icon: Icon.CRM,
					handler: this.crmBindId > 0
						? () => this.openCrmEntity()
						: () => this.createCrmEntity(this.objectId),
				}),
				this.#menuItem({
					id: 'task',
					title: Loc.getMessage(this.taskBindId > 0 ? 'MAILMOBILE_ACTIONS_OPEN_TASK' : 'MAILMOBILE_ACTIONS_SUBMENU_TASK'),
					sectionCode: 'create',
					icon: Icon.TASK,
					handler: this.taskBindId > 0
						? () => this.openTaskEntity()
						: () => this.createTaskEntity(this.objectId),
				}),
				this.#menuItem({
					id: 'chat',
					title: Loc.getMessage(this.chatBindId > 0 ? 'MAILMOBILE_ACTIONS_OPEN_CHAT' : 'MAILMOBILE_ACTIONS_SUBMENU_CHAT'),
					sectionCode: 'create',
					icon: Icon.CHATS,
					handler: this.chatBindId > 0
						? () => this.openChatEntity()
						: () => this.createChatEntity(this.objectId),
				}),
				this.#menuItem({
					id: 'event',
					title: Loc.getMessage(this.eventBindId > 0 ? 'MAILMOBILE_ACTIONS_OPEN_EVENT' : 'MAILMOBILE_ACTIONS_SUBMENU_EVENT'),
					sectionCode: 'create',
					icon: Icon.CALENDAR_WITH_SLOTS,
					handler: this.eventBindId > 0
						? () => this.openEventEntity()
						: () => this.createEventEntity(this.objectId),
				}),
			];

			return {
				items,
				sections: [{ id: 'create' }],
				title: Loc.getMessage('MAILMOBILE_ACTIONS_MENU_BACK'),
			};
		}

		get #menuItems()
		{
			const actions = [];
			const currentFolder = selectCurrentFolder(store.getState());

			if (!this.isDetailCard)
			{
				actions.push(this.#menuItem({
					id: 'select',
					testId: 'mail-action-menu-item-select',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_SELECT'),
					sectionCode: 'edit',
					icon: Icon.CIRCLE_CHECK,
					handler: () => this.selectObject(this.objectId),
				}));
			}

			actions.push(
				this.#menuItem(
					this.isRead
						? {
							id: 'unread',
							title: Loc.getMessage('MAILMOBILE_ACTIONS_UNREAD'),
							sectionCode: 'edit',
							icon: Icon.MAIL_COUNTER,
							handler: () => this.changeReadObjectStatus(this.objectId, 0),
						}
						: {
							id: 'read',
							title: Loc.getMessage('MAILMOBILE_ACTIONS_READ'),
							sectionCode: 'edit',
							icon: Icon.DOUBLE_CHECK,
							handler: () => this.changeReadObjectStatus(this.objectId, 1),
						},
				),
			);

			if (!selectIsVirtualFolderMode(store.getState()))
			{
				actions.push(this.#menuItem({
					id: 'in_folder',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_FOLDER'),
					sectionCode: 'edit',
					icon: Icon.FOLDER,
					handler: () => this.openMover(this.objectId),
				}));
			}

			if (currentFolder?.type !== DefaultFolderType.SPAM.value)
			{
				actions.push(this.#menuItem({
					id: 'in_spam',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_SPAM'),
					sectionCode: 'edit',
					icon: Icon.ALERT_ACCENT,
					handler: () => this.moveToSpam(this.objectId),
				}));
			}

			actions.push(
				this.#menuItem({
					id: 'create_from_message',
					testId: 'mail-action-menu-item-create-from-message',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_CREATE_FROM_MESSAGE'),
					sectionCode: 'create',
					icon: Icon.PLUS,
					handler: () => {},
					nextMenu: this.#subMenuItems,
				}),
				this.#menuItem({
					id: 'discuss_in_chat',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_DISCUSS_IN_CHAT'),
					sectionCode: 'create',
					icon: Icon.THREAD_SINGLE,
					handler: () => this.discussInChat(this.objectId),
				}),
			);

			if (this.object)
			{
				actions.push(this.#menuItem({
					id: 'remove',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_TRASH'),
					sectionCode: 'remove',
					icon: Icon.TRASHCAN,
					isDestructive: true,
					handler: () => this.removeObject(this.objectId),
				}));
			}

			return actions;
		}

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
