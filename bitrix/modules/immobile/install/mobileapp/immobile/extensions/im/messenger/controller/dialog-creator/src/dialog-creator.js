/**
 * @module im/messenger/controller/dialog-creator/dialog-creator
 */
jn.define('im/messenger/controller/dialog-creator/dialog-creator', (require, exports, module) => {
	const { Type } = require('type');
	const { clone } = require('utils/object');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { NavigationSelector } = require('im/messenger/controller/dialog-creator/navigation-selector');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const {
		DialogType,
		BotCode,
		Analytics,
		OpenDialogContextType,
		CopilotRoleType,
	} = require('im/messenger/const');
	const { Logger } = require('im/messenger/lib/logger');
	const { CopilotRoleSelector } = require('layout/ui/copilot-role-selector');
	const { ChatService } = require('im/messenger/provider/services/chat');

	/**
	 * @class DialogCreator
	 */
	class DialogCreator
	{
		constructor(options = {})
		{
			this.store = serviceLocator.get('core').getStore();
			this.messengerInitService = serviceLocator.get('messenger-init-service');
			this.selector = () => {};
			this.bindMethods();
			this.subscribeInitMessengerEvent();
		}

		subscribeInitMessengerEvent()
		{
			this.messengerInitService.onInit(this.handleUserGet);
		}

		bindMethods()
		{
			this.handleUserGet = this.handleUserGet.bind(this);
		}

		open()
		{
			const userList = this.prepareItems(this.getUserList());

			NavigationSelector.open(
				{
					userList,
				},
			);
		}

		async createCollab()
		{
			try
			{
				const { openCollabCreate } = await requireLazy('collab/create');
				await openCollabCreate();
			}
			catch (error)
			{
				console.error(error);
			}
		}

		createCopilotDialog()
		{
			this.sendAnalyticsStartCreateCopilotDialog();

			CopilotRoleSelector.open({
				showOpenFeedbackItem: true,
				openWidgetConfig: {
					backdrop: {
						mediumPositionPercent: 85,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: false,
					},
				},
			})
				.then((result) => {
					Logger.log(`${this.constructor.name}.CopilotRoleSelector.result:`, result);
					const fields = {
						type: DialogType.copilot.toUpperCase(),
						copilotMainRole: CopilotRoleType.copilotUniversalRole,
					};

					if (result?.role?.code)
					{
						fields.copilotMainRole = result?.role?.code;
					}

					return this.createCopilot(fields);
				})
				.catch((error) => Logger.error(error));
		}

		createCopilotDialogWithoutSelector()
		{
			this.sendAnalyticsStartCreateCopilotDialog();

			const fields = {
				type: DialogType.copilot.toUpperCase(),
				copilotMainRole: CopilotRoleType.copilotUniversalRole,
			};

			Logger.log(`${this.constructor.name}.createCopilotDialogWithoutSelector.fields:`, fields);

			return this.createCopilot(fields);
		}

		sendAnalyticsStartCreateCopilotDialog()
		{
			AnalyticsService.getInstance()
				.sendStartCreation({
					category: Analytics.Category.copilot,
					type: Analytics.Type.copilot,
					section: Analytics.Section.copilotTab,
				})
			;
		}

		/**
		 * @param {CreateCopilotParams} fields
		 * @returns {Promise<void>}
		 */
		async createCopilot(fields)
		{
			Logger.log(`${this.constructor.name}.createCopilot.fields:`, fields);

			try
			{
				const chatService = new ChatService();
				const newChatWithCopilot = await chatService.createCopilot(fields);
				const chatId = newChatWithCopilot.chatId;
				if (chatId > 0)
				{
					const openDialogParams = {
						dialogId: `chat${chatId}`,
						context: OpenDialogContextType.chatCreation,
					};

					await serviceLocator.get('dialog-manager').openDialog(openDialogParams);
					AnalyticsService.getInstance().sendCreateCopilotDialog({ chatId });
				}
				else
				{
					Logger.error(`${this.constructor.name}.createCopilot: chatId is invalid`, chatId);
				}
			}
			catch (error)
			{
				Logger.error(`${this.constructor.name}.createCopilot.catch:`, error);
			}
		}

		getUserList()
		{
			/**
			 * @type {Array<UsersModelState>}
			 */
			const userItems = [];

			const recentUserList = clone(this.store.getters['recentModel/getUserList']());
			const recentUserListIndex = {};
			if (Type.isArrayFilled(recentUserList))
			{
				recentUserList.forEach((recentUserChat) => {
					const userStateModel = this.store.getters['usersModel/getById'](recentUserChat.id);
					if (userStateModel)
					{
						recentUserListIndex[recentUserChat.id] = true;

						userItems.push(userStateModel);
					}
				});
			}

			const colleaguesList = clone(this.store.getters['usersModel/getList']());
			if (Type.isArrayFilled(colleaguesList))
			{
				colleaguesList.forEach((user) => {
					if (recentUserListIndex[user.id])
					{
						return;
					}

					userItems.push(user);
				});
			}

			return userItems.filter((userItem) => {
				if (userItem.id === MessengerParams.getUserId())
				{
					return false;
				}

				if (userItem.connector)
				{
					return false;
				}

				if (userItem?.botData?.code)
				{
					return userItem?.botData?.code !== BotCode.copilot;
				}

				if (userItem.network)
				{
					return false;
				}

				return true;
			});
		}

		prepareItems(itemList)
		{
			return itemList.map((item) => {
				const chatTitle = ChatTitle.createFromDialogId(item.id);
				const chatAvatar = ChatAvatar.createFromDialogId(item.id);

				return {
					data: {
						id: item.id,
						title: chatTitle.getTitle(),
						subtitle: chatTitle.getDescription(),
						avatarUri: chatAvatar.getAvatarUrl(),
						avatarColor: item.color,
						avatar: chatAvatar.getListItemAvatarProps(),
					},
					type: 'chats',
					selected: false,
					disable: false,
					isWithPressed: true,
				};
			});
		}

		/**
		 * @param {immobileTabChatLoadResult} data
		 */
		handleUserGet(data)
		{
			if (data?.userData)
			{
				this.store.dispatch('usersModel/set', [data.userData]);
			}
		}
	}

	module.exports = { DialogCreator };
});
