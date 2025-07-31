/**
 * @module im/messenger/controller/sidebar-v2/user-actions/chat
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/chat', (require, exports, module) => {
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatDataProvider, RecentDataProvider } = require('im/messenger/provider/data');
	const { backToRecentChats } = require('im/messenger/controller/sidebar-v2/user-actions/navigation');
	const { resolveDeleteDialogConfirmFn, resolveDeleteDialogToastType } = require('im/messenger/controller/sidebar-v2/user-actions/alerts');
	const { SIDEBAR_DEFAULT_TOAST_OFFSET } = require('im/messenger/controller/sidebar-v2/const');

	const analyticsService = AnalyticsService.getInstance();
	const logger = getLogger('SidebarV2.UserActions.Chat');

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
		const store = serviceLocator.get('core').getStore();
		const { type } = store.getters['dialoguesModel/getById'](dialogId);
		const toastType = resolveDeleteDialogToastType(dialogId);

		try
		{
			await (new ChatService()).deleteChat(dialogId);
			await (new RecentDataProvider()).delete({ dialogId });
			await (new ChatDataProvider()).delete({ dialogId });

			await backToRecentChats();

			Notification.showToast(toastType);

			// delete chat from other messenger contexts
			MessengerEmitter.broadcast(EventType.dialog.external.delete, {
				dialogId,
				chatType: type,
				shouldShowAlert: false,
				deleteByCurrentUserFromMobile: true,
			});
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

	module.exports = { onDeleteChat };
});
