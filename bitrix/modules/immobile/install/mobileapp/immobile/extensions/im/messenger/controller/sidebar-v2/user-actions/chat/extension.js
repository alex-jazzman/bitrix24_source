/**
 * @module im/messenger/controller/sidebar-v2/user-actions/chat
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/chat', (require, exports, module) => {
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ClearChatHistory } = require('im/messenger/lib/clear-history');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { ChatDeletionOrigin, ChatDeletionReason } = require('im/messenger/application/lib/chat-deletion-manager');
	const { resolveDeleteDialogConfirmFn, resolveDeleteDialogToastType, resolveClearHistoryDialogConfirmFn } = require('im/messenger/controller/sidebar-v2/user-actions/alerts');
	const { SIDEBAR_DEFAULT_TOAST_OFFSET } = require('im/messenger/controller/sidebar-v2/const');

	const analyticsService = AnalyticsService.getInstance();
	const logger = getLogger('SidebarV2.UserActions.Chat');

	/**
	 *
	 * @param {DialogId} dialogId
	 * @param {boolean} forAll
	 */
	function onClearHistoryChat({ dialogId, forAll })
	{
		const confirm = resolveClearHistoryDialogConfirmFn(dialogId);

		confirm({
			forAll,
			deleteCallback: () => onClearHistoryChatConfirmed(dialogId),
		});
	}

	async function onClearHistoryChatConfirmed(dialogId)
	{
		try
		{
			await ClearChatHistory.clear(dialogId);
			Notification.showToast(ToastType.clearMessagesHistory);
		}
		catch (error)
		{
			logger.error('onClearHistoryChat.error', error);
			Notification.showErrorToast();
		}
	}

	function onDeleteChat(dialogId, { onError } = {})
	{
		analyticsService.sendChatDeletePopupShown({ dialogId });

		const confirm = resolveDeleteDialogConfirmFn(dialogId);

		confirm({
			deleteCallback: () => onDeleteChatConfirmed(dialogId, onError),
			cancelCallback: () => {
				analyticsService.sendChatDeleteCanceled({ dialogId });
			},
		});
	}

	async function onDeleteChatConfirmed(dialogId, onError)
	{
		analyticsService.sendChatDeleteConfirmed({ dialogId });

		const { serviceLocator } = require('im/messenger/lib/di/service-locator');
		const toastType = resolveDeleteDialogToastType(dialogId);

		try
		{
			await (new ChatService()).deleteChat(dialogId);

			await serviceLocator.get('chat-deletion-manager').delete({
				dialogId,
				origin: ChatDeletionOrigin.local,
				reason: ChatDeletionReason.delete,
			});

			Notification.showToast(toastType);
		}
		catch (error)
		{
			logger.error(error);
			if (typeof onError === 'function')
			{
				onError(error);
			}
			else
			{
				Notification.showErrorToast({ offset: SIDEBAR_DEFAULT_TOAST_OFFSET });
			}
		}
	}

	module.exports = { onDeleteChat, onClearHistoryChat };
});
