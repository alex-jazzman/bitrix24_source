/**
 * @module im/messenger/controller/dialog-creator/dialog-creator
 */
jn.define('im/messenger/controller/dialog-creator/dialog-creator', (require, exports, module) => {
	/* global ChatUtils */
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { NavigationSelector } = require('im/messenger/controller/dialog-creator/navigation-selector');
	const { ChatTitle, ChatAvatar } = require('im/messenger/lib/element');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { restManager } = require('im/messenger/lib/rest-manager');
	const { RestMethod, DialogType, EventType, ComponentCode, BotCode, Analytics } = require('im/messenger/const');
	const { Logger } = require('im/messenger/lib/logger');
	const { AnalyticsEvent } = require('analytics');

	class DialogCreator
	{
		constructor(options = {})
		{
			this.store = serviceLocator.get('core').getStore();
			this.selector = () => {};
			this.initRequests();
		}

		initRequests()
		{
			restManager.on(
				RestMethod.imUserGet,
				{ ID: MessengerParams.getUserId() },
				this.handleUserGet.bind(this),
			);
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

		createCopilotDialog()
		{
			BX.rest.callMethod(
				RestMethod.imV2ChatAdd,
				{
					fields: {
						type: DialogType.copilot.toUpperCase(),
					},
				},
			).then((result) => {
				const chatId = parseInt(result.data().chatId, 10);
				if (chatId > 0)
				{
					setTimeout(
						() => {
							MessengerEmitter.emit(
								EventType.messenger.openDialog,
								{ dialogId: `chat${chatId}`, isNew: true },
								ComponentCode.imCopilotMessenger,
							);

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
						Logger.error('DialogCreator.createCopilotDialog.error', result.error());
					}
				}
			})
				.catch(
					(err) => {
						Logger.error(err);
					},
				);
		}

		getUserList()
		{
			/**
			 * @type {Array<UsersModelState>}
			 */
			const userItems = [];

			const recentUserList = ChatUtils.objectClone(this.store.getters['recentModel/getUserList']());
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

			const colleaguesList = ChatUtils.objectClone(this.store.getters['usersModel/getList']());
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
					},
					type: 'chats',
					selected: false,
					disable: false,
					isWithPressed: true,
				};
			});
		}

		handleUserGet(response)
		{
			const error = response.error();
			if (error)
			{
				Logger.error('DialogCreator.handleUserGet', error);

				return;
			}

			const currentUser = response.data();

			Logger.info('DialogCreator.handleUserGet', currentUser);

			this.store.dispatch('usersModel/set', [currentUser]);
		}
	}

	module.exports = { DialogCreator };
});
