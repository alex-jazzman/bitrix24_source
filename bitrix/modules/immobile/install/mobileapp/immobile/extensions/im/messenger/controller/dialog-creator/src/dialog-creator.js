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
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { Feature } = require('im/messenger/lib/feature');

	const {
		RestMethod,
		DialogType,
		EventType,
		ComponentCode,
		BotCode,
		Analytics,
		OpenDialogContextType,
		CopilotRoleType,
	} = require('im/messenger/const');
	const { Logger } = require('im/messenger/lib/logger');
	const { AnalyticsEvent } = require('analytics');
	const { CopilotRoleSelector } = require('layout/ui/copilot-role-selector');

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
					};

					if (result?.role?.code)
					{
						fields.copilotMainRole = result?.role?.code;
					}

					this.callRestCreateCopilotDialog(fields);
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

			this.callRestCreateCopilotDialog(fields);
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
		 * @param {object} fields
		 * @param {string} fields.type
		 * @param {string?} fields.copilotMainRole
		 */
		callRestCreateCopilotDialog(fields)
		{
			BX.rest.callMethod(
				RestMethod.imV2ChatAdd,
				{ fields },
			).then((result) => {
				const chatId = parseInt(result.data().chatId, 10);
				if (chatId > 0)
				{
					setTimeout(
						() => {
							const openDialogParams = {
								dialogId: `chat${chatId}`,
								context: OpenDialogContextType.chatCreation,
							};

							void serviceLocator.get('dialog-manager').openDialog(openDialogParams);

							const analytics = new AnalyticsEvent()
								.setTool(Analytics.Tool.ai)
								.setCategory(Analytics.Category.chatOperations)
								.setEvent(Analytics.Event.createNewChat)
								.setType(Analytics.Type.ai)
								.setSection(Analytics.Section.copilotTab)
								.setP3(Analytics.CopilotChatType.private)
								.setP5(`chatId_${chatId}`);

							analytics.send();
						},
						200,
					);

					if (result.answer.error || result.error())
					{
						Logger.error(`${this.constructor.name}.callRestCreateCopilotDialog.result.error`, result.error());
					}
				}
			})
				.catch(
					(err) => {
						Logger.error(`${this.constructor.name}.callRestCreateCopilotDialog.catch:`, err);
					},
				);
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
