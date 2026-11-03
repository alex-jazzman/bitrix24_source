import { Loc } from 'main.core';

import { ErrorCode } from 'im.v2.const';
import { type RunActionError } from 'im.v2.lib.rest';

import { showNotification } from '../utils/notification.js';

export const FolderNotifier = {
	handleCompositionError(error: RunActionError): void
	{
		const NotificationTextByErrorCode = {
			[ErrorCode.folder.chatNotEligible]: Loc.getMessage('IM_NOTIFIER_FOLDER_CHAT_NOT_ELIGIBLE_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_DEFAULT_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	// Every refusal of the composition save reads the same for the user: the server tells apart a
	// missing, a foreign and a non-composite folder, but none of that is his to fix.
	onSourcesSaveError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_FOLDER_SOURCES_SAVE_ERROR'));
	},

	// A refused read leaves the screen with an empty card, which reads as a folder without sources -
	// the notification is the only thing telling the two apart.
	onSourcesLoadError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_FOLDER_SOURCES_LOAD_ERROR'));
	},

	onFolderLimitError(maxFolders: number): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_FOLDER_LIMIT_ERROR', {
			'#LIMIT#': maxFolders,
		}));
	},

	onChatLimitError(maxChats: number): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_FOLDER_CHAT_LIMIT_ERROR', {
			'#LIMIT#': maxChats,
		}));
	},

	onAddChatComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_FOLDER_CHAT_ADD_COMPLETE'));
	},
};
