/**
 * @module im/messenger/lib/converter/ui/recent
 */
jn.define('im/messenger/lib/converter/ui/recent', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		RecentItem,
		ChatItem,
		CollabItem,
		CopilotItem,
		UserItem,
		CallItem,
		AnnouncementItem,
		ExtranetItem,
		Support24NotifierItem,
		Support24QuestionItem,
		CurrentUserItem,
		BotItem,
		SupportBotItem,
		ConnectorUserItem,
		ExtranetUserItem,
		CollaberUserItem,
		InvitedUserItem,
		NetworkUserItem,
		ChannelItem,
	} = require('im/messenger/lib/element');
	const {
		BotType,
		ComponentCode,
		UserType,
	} = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('converter--ui-recent');
	/**
	 * @class RecentUiConverter
	 */
	class RecentUiConverter
	{
		/**
		 * @param {Array<RecentModelState>} recentItems
		 * @return {Array<RecentItem>}
		 */
		toList(recentItems)
		{
			const listItems = [];

			recentItems.forEach((item) => {
				listItems.push(this.#prepareItemToNative(this.toItem(item)));
			});

			return listItems;
		}

		/**
		 * @param {RecentModelState} item
		 * @return {RecentItem}
		 */
		toItem(item)
		{
			const modelItem = serviceLocator.get('core').getStore().getters['recentModel/getById'](item.id);

			if (DialogHelper.isChatId(modelItem.id))
			{
				return this.#toUserItem(modelItem);
			}

			return this.#toChatItem(modelItem);
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @return {RecentItem}
		 */
		#toChatItem(modelItem)
		{
			const dialogHelper = DialogHelper.createByDialogId(modelItem.id);

			if (!dialogHelper)
			{
				logger.error(`${this.constructor.name}.toChatItem: there is no dialog "${modelItem.id}" in model`);

				return new RecentItem(modelItem);
			}

			if (dialogHelper.isCollab)
			{
				return new CollabItem(modelItem);
			}

			if (dialogHelper.isChannel)
			{
				return new ChannelItem(modelItem, {
					isNeedShowActions: MessengerParams.getComponentCode() !== ComponentCode.imChannelMessenger,
				});
			}

			if (dialogHelper.isCopilot)
			{
				return new CopilotItem(modelItem);
			}

			if (dialogHelper.isAnnouncement)
			{
				return new AnnouncementItem(modelItem);
			}

			if (dialogHelper.isSupport24Notifier)
			{
				return new Support24NotifierItem(modelItem);
			}

			if (dialogHelper.isSupport24Question)
			{
				return new Support24QuestionItem(modelItem);
			}

			if (dialogHelper.isExtranet)
			{
				return new ExtranetItem(modelItem);
			}

			return new ChatItem(modelItem);
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @return {RecentItem}
		 */
		#toUserItem(modelItem)
		{
			const user = serviceLocator.get('core').getStore().getters['usersModel/getById'](modelItem.id);
			if (!user)
			{
				logger.error(`${this.constructor.name}.toUserItem: there is no user "${modelItem.id}" in model`);

				return new RecentItem(modelItem);
			}

			if (user.id === serviceLocator.get('core').getUserId())
			{
				return new CurrentUserItem(modelItem);
			}

			// eslint-disable-next-line es/no-optional-chaining
			if (modelItem?.invitation?.isActive === true && user.lastActivityDate === false)
			{
				return new InvitedUserItem(modelItem);
			}

			if (user.botData.type === BotType.support24)
			{
				return new SupportBotItem(modelItem);
			}

			if (user.network === true)
			{
				return new NetworkUserItem(modelItem);
			}

			if (user.bot === true)
			{
				return new BotItem(modelItem);
			}

			if (user.type === UserType.collaber)
			{
				return new CollaberUserItem(modelItem);
			}

			if (user.extranet === true)
			{
				return new ExtranetUserItem(modelItem);
			}

			if (user.connector === true)
			{
				return new ConnectorUserItem(modelItem);
			}

			return new UserItem(modelItem);
		}

		toCallItem(callStatus, call)
		{
			return new CallItem(callStatus, call);
		}

		/**
		 * @param {RecentItem} recentItem
		 * @return NativeRecentItem
		 */
		#prepareItemToNative(recentItem)
		{
			const removeProperty = (item, propToRemove) => {
				if (Array.isArray(item))
				{
					return item.map((elem) => removeProperty(elem, propToRemove));
				}

				if (item !== null && typeof item === 'object')
				{
					return Object.keys(item).reduce((acc, key) => {
						if (key !== propToRemove)
						{
							// eslint-disable-next-line no-param-reassign
							acc[key] = removeProperty(item[key], propToRemove);
						}

						return acc;
					}, {});
				}

				return item;
			};

			return removeProperty(recentItem, 'model');
		}
	}

	module.exports = { RecentUiConverter: new RecentUiConverter() };
});
