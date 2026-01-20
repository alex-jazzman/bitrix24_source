/**
 * @module im/messenger-v2/application/lib/component-request-handler/src/handler/get-recent-user-list-to-call
 */
jn.define('im/messenger-v2/application/lib/component-request-handler/src/handler/get-recent-user-list-to-call', (require, exports, module) => {
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const {
		DialogHelper,
		UserHelper,
	} = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @return {Promise<Array<UserListToCallItem>>}
	 */
	async function getRecentUserListToCall()
	{
		const store = serviceLocator.get('core').getStore();

		const recentFirstPage = store.getters['recentModel/getChatFirstPage']();
		const recentIdList = recentFirstPage.map((recentItem) => recentItem.id);

		const dialogList = store.getters['dialoguesModel/getByIdList'](recentIdList);
		const userList = [];
		dialogList.forEach((dialog) => {
			const dialogHelper = DialogHelper.createByModel(dialog);
			if (!dialogHelper.isDirect || dialogHelper.isNotes)
			{
				return;
			}

			const userHelper = UserHelper.createByUserId(Number(dialog.dialogId));
			if (!userHelper || userHelper.isBot || userHelper.isExtranetOrCollaber)
			{
				return;
			}

			const avatar = ChatAvatar.createFromDialogId(dialog.dialogId);
			const title = ChatTitle.createFromDialogId(dialog.dialogId);
			const chatId = dialog.chatId > 0 ? dialog.chatId : null;

			userList.push({
				userId: userHelper.id,
				dialogId: dialog.dialogId,
				chatId,
				userName: title.getTitle(),
				description: title.getDescription(),
				avatarUrl: avatar.getAvatarUrl(),
				color: avatar.getColor(),
			});
		});

		return userList;
	}

	module.exports = { getRecentUserListToCall };
});
