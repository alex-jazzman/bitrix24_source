/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/saver/save-toast
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/saver/save-toast', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Icon } = require('assets/icons');
	const { FileDownloadType } = require('im/messenger/const');
	const { Notification } = require('im/messenger/lib/ui/notification');

	/**
	 * What the saved set of files is. The phrase of the toast follows the files the action really
	 * saves, block files included, and not the attachments of the message.
	 */
	const SavedFilesKind = Object.freeze({
		mediaGallery: 'mediaGallery',
		fileGallery: 'fileGallery',
		image: 'image',
		video: 'video',
		default: 'default',
	});

	const phrasesSuccess = {
		mediaGallery: {
			[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILES_TO_DISK_SUCCESS',
			[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILES_TO_DEVICE_GALLERY_SUCCESS',
		},
		fileGallery: {
			[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILES_TO_DISK_SUCCESS',
			[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILES_TO_DEVICE_SUCCESS',
		},
		image: {
			[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_PHOTO_TO_DISK_SUCCESS',
			[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_PHOTO_TO_DEVICE_SUCCESS',
		},
		video: {
			[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_VIDEO_TO_DISK_SUCCESS',
			[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_VIDEO_TO_DEVICE_SUCCESS',
		},
		default: {
			[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILE_TO_DISK_SUCCESS',
			[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_FILE_TO_DEVICE_SUCCESS',
		},
	};

	const iconsSuccess = {
		mediaGallery: Icon.IMAGE,
		image: Icon.IMAGE,
		video: Icon.IMAGE,
	};

	const phrasesFailure = {
		[FileDownloadType.disk]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_DISK_FAILURE',
		[FileDownloadType.device]: 'IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_DEVICE_FAILURE',
	};

	/**
	 * @param {string} [kind] one of SavedFilesKind
	 * @param parentWidget
	 * @param {'DEVICE' | 'DISK'} to
	 */
	function showSuccessSaveToast({ kind = SavedFilesKind.default, parentWidget, to = FileDownloadType.device })
	{
		const defaultIcon = to === FileDownloadType.disk ? Icon.FOLDER_SUCCESS : Icon.DOWNLOAD;
		const phrases = phrasesSuccess[kind] ?? phrasesSuccess.default;

		Notification.showToastWithParams(
			{
				icon: iconsSuccess[kind] ?? defaultIcon,
				message: Loc.getMessage(phrases[to]),
			},
			parentWidget,
		);
	}

	/**
	 * @param view
	 * @param {'DEVICE' | 'DISK'} to
	 */
	function showSaveFailureToast({ parentWidget, to })
	{
		Notification.showErrorToast(
			{
				message: Loc.getMessage(phrasesFailure[to]),
			},
			parentWidget,
		);
	}

	module.exports = {
		SavedFilesKind,
		showSaveFailureToast,
		showSuccessSaveToast,
	};
});
