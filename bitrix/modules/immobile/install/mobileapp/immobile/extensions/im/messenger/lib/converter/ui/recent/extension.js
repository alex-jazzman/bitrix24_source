/**
 * @module im/messenger/lib/converter/ui/recent
 */
jn.define('im/messenger/lib/converter/ui/recent', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const {
		RecentItem,
		ChatItem,
		CollabItem,
		CopilotItem,
		UserItem,
		CallItem,
		OpenlineItem,
		AnnouncementItem,
		ExtranetItem,
		Support24NotifierItem,
		Support24QuestionItem,
		TaskCommentItem,
		CurrentUserItem,
		BotItem,
		SupportBotItem,
		ConnectorUserItem,
		ExtranetUserItem,
		CollaberUserItem,
		InvitedUserItem,
		NetworkUserItem,
		ChannelItem,
	} = require('im/messenger/lib/element/recent');
	const {
		BotType,
		UserType,
	} = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('converter--ui-recent');

	const USER_ITEM_CONSTRUCTOR_SET = new Set([UserItem, ExtranetUserItem, InvitedUserItem]);

	/**
	 * @param {string} recentItemId
	 * @return {?Function} class of the personal dialog item, null when the element is not a personal
	 * dialog or its user is missing in the model
	 */
	function getUserItemClass(recentItemId)
	{
		if (!DialogHelper.isChatId(recentItemId))
		{
			return null;
		}

		const store = serviceLocator.get('core').getStore();
		const user = store.getters['usersModel/getById'](recentItemId);
		if (!user)
		{
			return null;
		}

		if (user.id === serviceLocator.get('core').getUserId())
		{
			return CurrentUserItem;
		}

		const modelItem = store.getters['recentModel/getById'](recentItemId);
		// eslint-disable-next-line es/no-optional-chaining
		if (modelItem?.invitation?.isActive === true && user.lastActivityDate === false)
		{
			return InvitedUserItem;
		}

		if (user.botData.type === BotType.support24)
		{
			return SupportBotItem;
		}

		if (user.network === true)
		{
			return NetworkUserItem;
		}

		if (user.bot === true)
		{
			return BotItem;
		}

		if (user.type === UserType.collaber)
		{
			return CollaberUserItem;
		}

		if (user.extranet === true)
		{
			return ExtranetUserItem;
		}

		if (user.connector === true)
		{
			return ConnectorUserItem;
		}

		return UserItem;
	}

	/**
	 * @param {string} recentItemId
	 * @return {boolean} true for a personal dialog of a regular, extranet or invited user
	 */
	function isRecentUserItem(recentItemId)
	{
		return USER_ITEM_CONSTRUCTOR_SET.has(getUserItemClass(recentItemId));
	}

	/**
	 * @class RecentUiConverter
	 */
	class RecentUiConverter
	{
		/**
		 * @param {Array<RecentModelState>} recentItems
		 * @param {object} options
		 * @return {Array<RecentItem>}
		 */
		toList(recentItems, options = {})
		{
			const listItems = [];

			recentItems.forEach((item) => {
				listItems.push(this.toItem(item, options));
			});

			return listItems;
		}

		/**
		 * @param {RecentModelState} item
		 * @param {object} options
		 * @return {RecentItem}
		 */
		toItem(item, options = {})
		{
			const modelItem = serviceLocator.get('core').getStore().getters['recentModel/getById'](item.id);
			const { getRecentItemButton, ...nativeItemOptions } = options;
			const preparedOptions = typeof getRecentItemButton === 'function'
				? {
					...nativeItemOptions,
					button: getRecentItemButton(modelItem.id),
				}
				: nativeItemOptions
			;

			if (DialogHelper.isChatId(modelItem.id))
			{
				return this.#toUserItem(modelItem, preparedOptions);
			}

			return this.#toChatItem(modelItem, preparedOptions);
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return {RecentItem}
		 */
		#toChatItem(modelItem, options = {})
		{
			const dialogHelper = DialogHelper.createByDialogId(modelItem.id);

			if (!dialogHelper)
			{
				logger.error(`${this.constructor.name}.toChatItem: there is no dialog "${modelItem.id}" in model`);

				return new RecentItem(modelItem, options);
			}

			if (dialogHelper.isTaskComment)
			{
				return new TaskCommentItem(modelItem, options);
			}

			if (dialogHelper.isCollab)
			{
				return new CollabItem(modelItem, options);
			}

			if (dialogHelper.isChannel)
			{
				return new ChannelItem(modelItem, options);
			}

			if (dialogHelper.isCopilot)
			{
				return new CopilotItem(modelItem, options);
			}

			if (dialogHelper.isAnnouncement)
			{
				return new AnnouncementItem(modelItem, options);
			}

			if (dialogHelper.isSupport24Notifier)
			{
				return new Support24NotifierItem(modelItem, options);
			}

			if (dialogHelper.isSupport24Question)
			{
				return new Support24QuestionItem(modelItem, options);
			}

			if (dialogHelper.isExtranet)
			{
				return new ExtranetItem(modelItem, options);
			}

			return new ChatItem(modelItem, options);
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return {RecentItem}
		 */
		#toUserItem(modelItem, options = {})
		{
			const UserItemClass = getUserItemClass(modelItem.id);
			if (!UserItemClass)
			{
				logger.error(`${this.constructor.name}.toUserItem: there is no user "${modelItem.id}" in model`);

				return new RecentItem(modelItem, options);
			}

			return new UserItemClass(modelItem, options);
		}

		/**
		 * @param {RecentCallData} call
		 * @param {RecentCallStatus} callStatus
		 * @return {CallItem}
		 */
		toCallItem(callStatus, call)
		{
			return new CallItem(callStatus, call);
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return {OpenlineItem}
		 */
		toOpenlineItem(modelItem, options)
		{
			return new OpenlineItem(modelItem, options);
		}
	}

	module.exports = {
		RecentUiConverter: new RecentUiConverter(),
		isRecentUserItem,
	};
});
