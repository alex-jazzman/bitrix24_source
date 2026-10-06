import { Core } from 'im.v2.application.core';
import { FolderManager } from 'im.v2.lib.folder';
import { Logger } from 'im.v2.lib.logger';

import {
	type FolderCreateParams,
	type FolderUpdateParams,
	type FolderDeleteParams,
	type FolderSortParams,
	type FolderChatAddParams,
	type FolderChatDeleteParams,
} from './types/folder';

export class FolderPullHandler
{
	getModuleId(): string
	{
		return 'im';
	}

	handleFolderCreate(params: FolderCreateParams)
	{
		Logger.warn('FolderPullHandler: handleFolderCreate', params);

		void Core.getStore().dispatch('recent/folders/add', params.folder);
	}

	handleFolderUpdate(params: FolderUpdateParams)
	{
		Logger.warn('FolderPullHandler: handleFolderUpdate', params);

		void Core.getStore().dispatch('recent/folders/update', params.folder);
	}

	handleFolderDelete(params: FolderDeleteParams)
	{
		Logger.warn('FolderPullHandler: handleFolderDelete', params);

		FolderManager.handleOpenedFolder(params.folderId);

		void Core.getStore().dispatch('recent/folders/delete', { id: params.folderId });
	}

	handleFolderSort(params: FolderSortParams)
	{
		Logger.warn('FolderPullHandler: handleFolderSort', params);

		void Core.getStore().dispatch('recent/folders/sort', params.folderIds);
	}

	handleFolderChatAdd(params: FolderChatAddParams)
	{
		Logger.warn('FolderPullHandler: handleFolderChatAdd', params);

		void Core.getStore().dispatch('recent/folders/update', params.folder);
	}

	handleFolderChatDelete(params: FolderChatDeleteParams)
	{
		Logger.warn('FolderPullHandler: handleFolderChatDelete', params);

		void Core.getStore().dispatch('recent/folders/update', params.folder);
	}
}
