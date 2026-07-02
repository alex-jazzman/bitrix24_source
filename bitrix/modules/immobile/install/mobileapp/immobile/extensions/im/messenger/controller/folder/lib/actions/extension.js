/**
 * @module im/messenger/controller/folder/lib/actions
 */
jn.define('im/messenger/controller/folder/lib/actions', (require, exports, module) => {
	const { Type } = require('type');
	const { confirmDestructiveAction } = require('alert');
	const { Loc } = require('im/messenger/loc');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { FolderService } = require('im/messenger/provider/services/folder');

	const logger = getLogger('folder--actions');

	const FolderErrorCode = Object.freeze({
		limitExceeded: 'FOLDER_LIMIT_EXCEEDED',
		chatsLimitExceeded: 'FOLDER_CHATS_LIMIT_EXCEEDED',
	});

	const ErrorMessageMap = Object.freeze({
		[FolderErrorCode.limitExceeded]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_LIMIT',
		[FolderErrorCode.chatsLimitExceeded]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_CHATS_LIMIT',
	});

	const getErrors = (error) => {
		if (Type.isArray(error))
		{
			return error;
		}

		if (Type.isArray(error?.errors))
		{
			return error.errors;
		}

		return [error].filter(Boolean);
	};

	const getErrorCode = (error) => {
		const errors = getErrors(error);
		const firstError = errors.find((item) => Type.isStringFilled(item?.code));

		return firstError?.code ?? null;
	};

	// updateFolder throws Array<{ method, error }>; unwrap inner error before mapping.
	const normalizeError = (error) => {
		if (Type.isArray(error) && error[0]?.error && !Type.isStringFilled(error[0]?.code))
		{
			return error[0].error;
		}

		return error;
	};

	const showFolderActionErrorToast = (error, layoutWidget) => {
		const errorCode = getErrorCode(normalizeError(error));
		const messageId = ErrorMessageMap[errorCode] ?? 'IMMOBILE_MESSENGER_FOLDER_ERROR_GENERIC';
		Notification.showErrorToast({ message: Loc.getMessage(messageId) }, layoutWidget);
	};

	/**
	 * @param {{ folderId: number, title: string, addChatIds?: number[], removeChatIds?: number[], layoutWidget?: object }} options
	 */
	const updateFolder = async ({ folderId, title, addChatIds, removeChatIds, layoutWidget }) => {
		try
		{
			return await FolderService.updateFolder({ folderId, title, addChatIds, removeChatIds });
		}
		catch (error)
		{
			logger.error('updateFolder.error', error);
			showFolderActionErrorToast(error, layoutWidget);
			throw error;
		}
	};

	/**
	 * @param {{ title: string, chatIds?: number[], layoutWidget?: object }} options
	 */
	const createFolder = async ({ title, chatIds, layoutWidget }) => {
		try
		{
			return await FolderService.createFolder({ title, chatIds });
		}
		catch (error)
		{
			logger.error('createFolder.error', error);
			showFolderActionErrorToast(error, layoutWidget);
			throw error;
		}
	};

	/**
	 * Shows confirm-dialog. Resolves true on successful deletion, false on user cancel,
	 * rejects on REST error (toast already shown).
	 * @param {{ folderId: number, layoutWidget?: object }} options
	 * @return {Promise<boolean>}
	 */
	const deleteFolder = ({ folderId, layoutWidget }) => new Promise((resolve, reject) => {
		confirmDestructiveAction({
			title: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_DELETE_CONFIRM_TITLE'),
			description: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_DELETE_CONFIRM_DESCRIPTION'),
			destructionText: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_DELETE_CONFIRM_DESTRUCTION'),
			cancelText: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_DELETE_CONFIRM_CANCEL'),
			onDestruct: async () => {
				try
				{
					await FolderService.deleteFolder({ folderId });
					resolve(true);
				}
				catch (error)
				{
					logger.error('deleteFolder.error', error);
					showFolderActionErrorToast(error, layoutWidget);
					reject(error);
				}
			},
			onCancel: () => resolve(false),
		});
	});

	/**
	 * @param {{ folderIds: number[], layoutWidget?: object }} options
	 */
	const sortFolders = async ({ folderIds, layoutWidget }) => {
		try
		{
			return await FolderService.sortFolders({ folderIds });
		}
		catch (error)
		{
			logger.error('sortFolders.error', error);
			showFolderActionErrorToast(error, layoutWidget);
			throw error;
		}
	};

	/**
	 * @param {{ chatId: number, folderIds: number[], layoutWidget?: object }} options
	 */
	const setChatFolders = async ({ chatId, folderIds, layoutWidget }) => {
		try
		{
			return await FolderService.setChatFolders({ chatId, folderIds });
		}
		catch (error)
		{
			logger.error('setChatFolders.error', error);
			showFolderActionErrorToast(error, layoutWidget);
			throw error;
		}
	};

	const showUpdateSuccessToast = (layoutWidget) => Notification.showToast(ToastType.folderUpdated, layoutWidget);
	const showCreateSuccessToast = (layoutWidget) => Notification.showToast(ToastType.folderCreated, layoutWidget);
	const showDeleteSuccessToast = (layoutWidget) => Notification.showToast(ToastType.folderDeleted, layoutWidget);
	const showSortSuccessToast = (layoutWidget) => Notification.showToast(ToastType.folderSorted, layoutWidget);
	const showSetChatFoldersSuccessToast = (layoutWidget) => Notification.showToast(ToastType.folderSetChat, layoutWidget);

	module.exports = {
		updateFolder,
		createFolder,
		deleteFolder,
		sortFolders,
		setChatFolders,
		showUpdateSuccessToast,
		showCreateSuccessToast,
		showDeleteSuccessToast,
		showSortSuccessToast,
		showSetChatFoldersSuccessToast,
		FolderErrorCode,
	};
});
