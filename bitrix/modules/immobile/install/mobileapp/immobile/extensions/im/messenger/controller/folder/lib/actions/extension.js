/**
 * @module im/messenger/controller/folder/lib/actions
 */
jn.define('im/messenger/controller/folder/lib/actions', (require, exports, module) => {
	const { Type } = require('type');
	const { confirmDestructiveAction } = require('alert');
	const { Loc } = require('im/messenger/loc');
	const { getMaxPersonalFolders, getMaxChatsPerFolder } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { FolderService } = require('im/messenger/provider/services/folder');

	const logger = getLogger('folder--actions');

	const FolderErrorCode = Object.freeze({
		limitExceeded: 'FOLDER_LIMIT_EXCEEDED',
		chatsLimitExceeded: 'FOLDER_CHATS_LIMIT_EXCEEDED',
		chatNotEligible: 'FOLDER_CHAT_NOT_ELIGIBLE',
		operationNotSupported: 'FOLDER_OPERATION_NOT_SUPPORTED',
	});

	const ErrorMessageMap = Object.freeze({
		[FolderErrorCode.limitExceeded]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_LIMIT',
		[FolderErrorCode.chatsLimitExceeded]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_CHATS_LIMIT',
		[FolderErrorCode.chatNotEligible]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_CHAT_NOT_ELIGIBLE',
		[FolderErrorCode.operationNotSupported]: 'IMMOBILE_MESSENGER_FOLDER_ERROR_OPERATION_NOT_SUPPORTED',
	});

	// The server error carries its code alone, so the number of the phrase comes from the same limits
	// snapshot the input cutoff reads.
	const ErrorReplacementsMap = Object.freeze({
		[FolderErrorCode.limitExceeded]: () => ({ '#LIMIT#': getMaxPersonalFolders() }),
		[FolderErrorCode.chatsLimitExceeded]: () => ({ '#LIMIT#': getMaxChatsPerFolder() }),
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
		const replacements = ErrorReplacementsMap[errorCode]?.() ?? {};
		Notification.showErrorToast({ message: Loc.getMessage(messageId, replacements) }, layoutWidget);
	};

	// For a refusal raised before the request: no REST error to map, so the generic message is used.
	const showFolderGenericErrorToast = (layoutWidget) => showFolderActionErrorToast(null, layoutWidget);

	// The composition routes name the operation instead of the code: FOLDER_OPERATION_NOT_SUPPORTED is
	// shared by the whole folder domain and says nothing of which of the two failed. Same split as on the web.
	const showSourcesLoadErrorToast = (layoutWidget) => Notification.showErrorToast(
		{ message: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_ERROR_SOURCES_LOAD') },
		layoutWidget,
	);

	const showSourcesUpdateErrorToast = (layoutWidget) => Notification.showErrorToast(
		{ message: Loc.getMessage('IMMOBILE_MESSENGER_FOLDER_ERROR_SOURCES_UPDATE') },
		layoutWidget,
	);

	/**
	 * @param {{ folderId: number, title: string, chatIds?: number[], layoutWidget?: object }} options
	 */
	const updateFolder = async ({ folderId, title, chatIds, layoutWidget }) => {
		try
		{
			return await FolderService.updateFolder({ folderId, title, chatIds });
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

	/**
	 * @param {{ folderId: number, layoutWidget?: object }} options
	 * @return {Promise<{sources: Array, folders: Array}>}
	 */
	const getFolderSources = async ({ folderId, layoutWidget }) => {
		try
		{
			return await FolderService.getSources({ folderId });
		}
		catch (error)
		{
			logger.error('getFolderSources.error', error);
			showSourcesLoadErrorToast(layoutWidget);
			throw error;
		}
	};

	/**
	 * @param {{ folderId: number, sourceCodes: string[], layoutWidget?: object }} options
	 * @return {Promise<string[]>} the composition the server saved
	 */
	const updateFolderSources = async ({ folderId, sourceCodes, layoutWidget }) => {
		try
		{
			return await FolderService.updateSources({ folderId, sourceCodes });
		}
		catch (error)
		{
			logger.error('updateFolderSources.error', error);
			showSourcesUpdateErrorToast(layoutWidget);
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
		getFolderSources,
		updateFolderSources,
		showFolderGenericErrorToast,
		showUpdateSuccessToast,
		showCreateSuccessToast,
		showDeleteSuccessToast,
		showSortSuccessToast,
		showSetChatFoldersSuccessToast,
		FolderErrorCode,
	};
});
