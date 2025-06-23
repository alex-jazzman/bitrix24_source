/**
 * @module im/messenger/controller/sidebar-v2/user-actions/user
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/user', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const { EventType, BBCode, ComponentCode } = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { backToRecentChats } = require('im/messenger/controller/sidebar-v2/user-actions/navigation');
	const { resolveLeaveDialogConfirmFn } = require('im/messenger/controller/sidebar-v2/user-actions/alerts');

	const logger = getLogger('SidebarV2.UserActions');

	/**
	 * Handler on click leave chat from participants menu and from chat sidebar context menu
	 * @param {DialogId} dialogId
	 * @return {void}
	 */
	function onLeaveChat(dialogId)
	{
		const confirm = resolveLeaveDialogConfirmFn(dialogId);

		confirm({
			leaveCallback: () => onLeaveChatConfirmed(dialogId),
		});
	}

	function onLeaveChatConfirmed(dialogId)
	{
		(new ChatService()).leaveFromChat(dialogId)
			.then(() => backToRecentChats())
			.catch((error) => logger.error('Failed to leave from chat', error));
	}

	/**
	 * @desc Handler on click mention user from participants menu
	 * @param {number|string} userId
	 * @param {DialogId} dialogId
	 */
	function onMentionUser(dialogId, userId)
	{
		const dialogCode = serviceLocator.get(dialogId)?.dialogCode;

		try
		{
			PageManager.getNavigator().popTo(dialogCode)
				.then(() => {
					BX.onCustomEvent('onDestroySidebar');
					BX.onCustomEvent(EventType.dialog.external.mention, [userId, BBCode.user, dialogId]);
				})
				.catch((err) => {
					logger.error('onMentionUser.popTo.catch error', err);
				});
		}
		catch (error)
		{
			logger.error('onMentionUser.getNavigator()', error);
		}
	}

	function onOpenNotes()
	{
		MessengerEmitter.emit(
			EventType.messenger.openDialog,
			{ dialogId: MessengerParams.getUserId() },
			ComponentCode.imMessenger,
		);
	}

	module.exports = {
		onOpenNotes,
		onMentionUser,
		onLeaveChat,
	};
});
