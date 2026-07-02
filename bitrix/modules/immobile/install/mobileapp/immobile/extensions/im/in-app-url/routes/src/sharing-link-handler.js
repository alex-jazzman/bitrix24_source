/**
 * @module im/in-app-url/routes/src/sharing-link-handler
 */
jn.define('im/in-app-url/routes/src/sharing-link-handler', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { isOnline } = require('device/connection');

	const {
		EventType,
		OpenDialogContextType,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');

	const SharingLinkErrorCode = Object.freeze({
		notFound: 'SHARING_LINK_NOT_FOUND',
		revoked: 'SHARING_LINK_REVOKED',
		alreadyRevoked: 'SHARING_LINK_ALREADY_REVOKED',
		entityNotFound: 'SHARING_LINK_ENTITY_NOT_FOUND',
	});

	const ErrorCodeToToastType = Object.freeze({
		[SharingLinkErrorCode.entityNotFound]: ToastType.sharingLinkChatNotFound,
		[SharingLinkErrorCode.notFound]: ToastType.sharingLinkInvalid,
		[SharingLinkErrorCode.revoked]: ToastType.sharingLinkInvalid,
		[SharingLinkErrorCode.alreadyRevoked]: ToastType.sharingLinkInvalid,
	});

	const joinBySharingLink = async (code) => {
		if (!isOnline())
		{
			Notification.showOfflineToast({ offset: 50 });

			return;
		}

		await NotifyManager.showLoadingIndicator();

		try
		{
			const { SharingLinkService } = await requireLazy('im:messenger/provider/services/sharing-link');
			const service = new SharingLinkService();
			const result = await service.joinByCode(code);

			if (result && result.dialogId)
			{
				MessengerEmitter.emit(EventType.messenger.openDialog, {
					dialogId: result.dialogId,
					context: OpenDialogContextType.link,
				});
			}
			else
			{
				Notification.showToast(ToastType.sharingLinkInvalid);
			}
		}
		catch (error)
		{
			const errorCode = error?.[0]?.code || '';
			const toastType = ErrorCodeToToastType[errorCode] || ToastType.sharingLinkInvalid;

			Notification.showToast(toastType);
		}
		finally
		{
			NotifyManager.hideLoadingIndicatorWithoutFallback();
		}
	};

	module.exports = { joinBySharingLink };
});
