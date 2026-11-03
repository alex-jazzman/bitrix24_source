import { Core } from 'im.v2.application.core';
import { Layout, type LayoutType } from 'im.v2.const';
import { FolderManager } from 'im.v2.lib.folder';
import { type FolderLayoutParams, type ImModelFolder, type ImModelLayout } from 'im.v2.model';

export const isSelectedFolder = (folder: ImModelFolder): boolean => {
	const folderLayout = FolderManager.getFolderLayout(folder);
	if (!folderLayout)
	{
		return false;
	}

	const currentLayout = getCurrentLayout();
	if (getSelectionLayoutName(currentLayout.name) !== folderLayout.name)
	{
		return false;
	}

	// Personal folders all live under one layout name, so only there the folder id tells them apart.
	// Every other folder owns its layout name alone: the name match is the whole answer, and a folder
	// id left in the layout by the previous section says nothing about it.
	if (folderLayout.name !== Layout.folder)
	{
		return true;
	}

	const { folderId }: FolderLayoutParams = currentLayout.params;

	return folderId === folder.id;
};

// The setup screen of the composite folder stands on the list of that very folder, so its tile keeps the
// selection while the composition is being edited. The pairing belongs here alone: `FolderManager` tells
// a folder layout from the rest to decide what a click on a tile opens, and a form has nothing to open.
const getSelectionLayoutName = (layoutName: LayoutType): LayoutType => {
	return layoutName === Layout.folderAllSettings ? Layout.folderAll : layoutName;
};

const getCurrentLayout = (): ImModelLayout => {
	return Core.getStore().getters['application/getLayout'];
};
