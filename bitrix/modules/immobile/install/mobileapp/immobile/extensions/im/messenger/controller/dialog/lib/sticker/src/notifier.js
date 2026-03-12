/**
 * @module im/messenger/controller/dialog/lib/sticker/src/notifier
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/notifier', (require, exports, module) => {
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { Notification } = require('im/messenger/lib/ui/notification');

	/**
	 * @class StickerNotifier
	 */
	class StickerNotifier
	{
		static showUnknownError()
		{
			Notification.showErrorToast();
		}

		static showPackLinkedSuccess()
		{
			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_LINKED_SUCCESS_TOAST'),
				icon: Icon.CIRCLE_CHECK,
			});
		}

		static showPackUnlinkedSuccess()
		{
			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_UNLINKED_SUCCESS_TOAST'),
				icon: Icon.CIRCLE_CHECK,
			});
		}

		static showRenamePackError()
		{
			Notification.showErrorToast({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_RENAME_ERROR'),
			});
		}

		static showAddStickersError()
		{
			Notification.showErrorToast({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_ADD_STICKERS_ERROR'),
			});
		}

		static showDeleteStickersError()
		{
			Notification.showErrorToast({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_DELETE_STICKERS_ERROR'),
			});
		}

		static showMaxPackSizeToast()
		{
			Notification.showErrorToast({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_MAX_PACK_SIZE_TOAST'),
			});
		}

		static showUploaderError(message)
		{
			Notification.showErrorToast({
				message,
			});
		}

		static showNetworkError()
		{
			Notification.showOfflineToast();
		}
	}

	module.exports = { StickerNotifier };
});
