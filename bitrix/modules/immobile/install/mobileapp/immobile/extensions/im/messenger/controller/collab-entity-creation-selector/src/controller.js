/**
 * @module im/messenger/controller/collab-entity-creation-selector/src/controller
 */
jn.define('im/messenger/controller/collab-entity-creation-selector/src/controller', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { IconType } = require('im/messenger/assets/icon');
	const { CreateGroupChat } = require('im/messenger/controller/chat-composer');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { Feature } = require('im/messenger/lib/feature');
	const { runAttachFromProject } = require('im/messenger/controller/attach-chat/flow');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { DialogType, CopilotRoleType, OpenDialogContextType } = require('im/messenger/const');
	const { MenuVisibility } = require('im/messenger/controller/dialog-creator/menu-visibility');

	const { CollabEntityCreationSelector } = require('im/messenger/controller/collab-entity-creation-selector/src/selector');
	const { calculateBackdropHeight } = require('im/messenger/controller/collab-entity-creation-selector/src/backdrop-height');

	const logger = getLoggerWithContext('collab-entity-creation-selector', 'CollabEntityCreationController');

	/**
	 * @class CollabEntityCreationController
	 */
	class CollabEntityCreationController
	{
		constructor(parentChatId)
		{
			this.parentChatId = parentChatId;
		}

		async open()
		{
			const items = this.#getItems();

			const widget = await PageManager.openWidget('layout', {
				titleParams: this.#getTitleParams(),
				backgroundColor: Color.bgSecondary.toHex(),
				backdrop: {
					mediumPositionHeight: calculateBackdropHeight(items.length),
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
				},
			});

			widget.showComponent(new CollabEntityCreationSelector({
				widget,
				items,
			}));
		}

		/**
		 * @return {CollabEntityCreationSelectorItem}
		 */
		get #taskCreationItem()
		{
			return {
				iconType: IconType.task,
				text: Loc.getMessage('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_TASK_ITEM_TITLE'),
				onClick: () => {
					const projectData = this.#getProjectData();
					if (Type.isNull(projectData))
					{
						Notification.showErrorToast();

						return;
					}

					this.#openTaskCreationWidget(projectData)
						.catch((error) => {
							Notification.showErrorToast();
							logger.error('openTaskCreationWidget error', error);
						});
				},
			};
		}

		/**
		 * @return {CollabEntityCreationSelectorItem}
		 */
		get #calendarCreationItem()
		{
			return {
				iconType: IconType.calendar,
				text: Loc.getMessage('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_CALENDAR_ITEM_TITLE'),
				onClick: () => {
					const projectData = this.#getProjectData();
					if (Type.isNull(projectData))
					{
						Notification.showErrorToast();

						return;
					}

					this.#openCalendarCreationWidget(projectData)
						.catch((error) => {
							Notification.showErrorToast();
							logger.error('openCalendarCreationWidget error', error);
						});
				},
			};
		}

		/**
		 * @return {CollabEntityCreationSelectorItem}
		 */
		get #groupChatCreationItem()
		{
			return {
				iconType: IconType.groupChat,
				text: Loc.getMessage('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_GROUP_CHAT_ITEM_TITLE'),
				onClick: () => {
					const createGroupChat = new CreateGroupChat(this.parentChatId);
					createGroupChat.open({
						selectorShowWidgetParams: {
							backdrop: {
								mediumPositionPercent: 85,
								horizontalSwipeAllowed: false,
							},
							modal: true,
						},
						showLeftButtons: false,
					});
				},
			};
		}

		/**
		 * @return {?CollabEntityCreationSelectorItem}
		 */
		get #attachChatItem()
		{
			if (!Feature.isAttachChatToProjectAvailable)
			{
				return null;
			}

			const parentDialog = serviceLocator.get('core').getStore()
				.getters['dialoguesModel/getByChatId'](this.parentChatId);

			if (!parentDialog || !ChatPermission.canAddParticipants(parentDialog))
			{
				return null;
			}

			return {
				iconType: IconType.chatAttach,
				text: Loc.getMessage('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_ATTACH_CHAT_ITEM_TITLE'),
				onClick: () => {
					runAttachFromProject({ parentDialog, parentWidget: PageManager })
						.catch((error) => {
							Notification.showErrorToast();
							logger.error('runAttachFromProject error', error);
						});
				},
			};
		}

		/**
		 * @return {CollabEntityCreationSelectorItem}
		 */
		get #copilotCreationItem()
		{
			return {
				iconType: IconType.copilot,
				text: Loc.getMessageWithCopilotBotName('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_COPILOT_ITEM_TITLE'),
				onClick: () => {
					const chatService = new ChatService();
					chatService.createCopilot({
						type: DialogType.copilot.toUpperCase(),
						copilotMainRole: CopilotRoleType.copilotUniversalRole,
						parentChatId: this.parentChatId,
					})
						.then(({ chatId }) => {
							return serviceLocator.get('dialog-manager').openDialog({
								dialogId: `chat${chatId}`,
								context: OpenDialogContextType.chatCreation,
							});
						})
						.catch((error) => {
							Notification.showErrorToast();
							logger.error('copilotCreationItem.onClick error', error);
						});
				},
			};
		}

		/**
		 * @return {Array<CollabEntityCreationSelectorItem>}
		 */
		#getItems()
		{
			const items = [
				this.#taskCreationItem,
				this.#groupChatCreationItem,
				this.#attachChatItem,
			].filter(Boolean);

			if (MenuVisibility.canCreateCopilot())
			{
				items.push(this.#copilotCreationItem);
			}

			items.push(this.#calendarCreationItem);

			return items;
		}

		#getTitleParams()
		{
			return {
				text: Loc.getMessage('IMMOBILE_COLLAB_ENTITY_CREATION_WIDGET_TITLE'),
				type: 'section',
			};
		}

		/**
		 * @return {{id: string, name: string, avatar: string} | null}
		 */
		#getProjectData()
		{
			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getByChatId'](this.parentChatId);

			if (Type.isNil(dialog) || !Type.isStringFilled(dialog?.entityId))
			{
				return null;
			}

			return {
				id: dialog.entityId,
				name: dialog.name,
				avatar: dialog.avatar
			};
		}

		/**
		 * @param {{id: string, name: string, avatar: string}} projectData
		 * @return {Promise<void>}
		 */
		async #openTaskCreationWidget(projectData)
		{
			const { Entry } = await requireLazy('tasks:entry');
			await Entry.openTaskCreation({
				layoutWidget: PageManager,
				initialTaskData: {
					groupId: projectData.id,
					group: {
						id: projectData.id,
						name: projectData.name,
						image: projectData.avatar,
					},
				},
			});
		}

		/**
		 * @param {{id: string, name: string, avatar: string}} projectData
		 * @return {Promise<void>}
		 */
		async #openCalendarCreationWidget(projectData)
		{
			const { Entry } = await requireLazy('calendar:entry');

			await Entry.openEventEditForm({
				parentLayout: PageManager,
				calType: 'group',
				ownerId: Number(projectData.id),
			});
		}

		/**
		 * @desc Test-only helper. Exposes #getItems for unit tests.
		 * @return {Array<CollabEntityCreationSelectorItem>}
		 */
		getItemsForTest()
		{
			return this.#getItems();
		}
	}

	module.exports = { CollabEntityCreationController };
});
