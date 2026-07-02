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

	const { CollabEntityCreationSelector } = require('im/messenger/controller/collab-entity-creation-selector/src/selector');

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
			const widget = await PageManager.openWidget('layout', {
				titleParams: this.#getTitleParams(),
				backgroundColor: Color.bgSecondary.toHex(),
				backdrop: {
					mediumPositionHeight: 330,
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
				},
			});

			widget.showComponent(new CollabEntityCreationSelector({
				widget,
				items: this.#getItems(),
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
					Notification.showComingSoon();
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
		 * @return {Array<CollabEntityCreationSelectorItem>}
		 */
		#getItems()
		{
			return [
				this.#taskCreationItem,
				this.#calendarCreationItem,
				this.#groupChatCreationItem,
			];
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
	}

	module.exports = { CollabEntityCreationController };
});
