import { Core } from 'im.v2.application.core';
import { Layout, FolderType } from 'im.v2.const';
import { FolderManager } from 'im.v2.lib.folder';
import { type FolderLayoutParams, type ImModelFolder, type ImModelLayout } from 'im.v2.model';

export const isSelectedFolder = (folder: ImModelFolder): boolean => {
	if (folder.type === FolderType.personal)
	{
		return isSelectedPersonalFolder(folder);
	}

	return isSelectedSystemFolder(folder);
};

const isSelectedPersonalFolder = (folder: ImModelFolder): boolean => {
	const layout = getCurrentLayout();

	const isPersonalFolderLayout = layout.name === Layout.folder;
	if (!isPersonalFolderLayout)
	{
		return false;
	}

	const { folderId }: FolderLayoutParams = layout.params;

	return folderId === folder.id;
};

const isSelectedSystemFolder = (folder: ImModelFolder): boolean => {
	const layout = getCurrentLayout();

	return layout.name === FolderManager.getLayoutByFolderCode(folder.code);
};

const getCurrentLayout = (): ImModelLayout => {
	return Core.getStore().getters['application/getLayout'];
};
