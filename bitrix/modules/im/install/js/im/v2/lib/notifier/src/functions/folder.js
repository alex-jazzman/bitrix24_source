import { Loc } from 'main.core';

import { showNotification } from '../utils/notification.js';

export const FolderNotifier = {
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
