import { Core } from 'im.v2.application.core';
import { Layout, SystemFolderCode } from 'im.v2.const';

import { AnalyticsFolderType } from '../const';

// The layout the user stands in named as the folder it shows: every system folder of the rail owns a
// layout of its own, and the report reads all of them in the folder values. What is not a folder keeps
// the historical `<layout>_tab` below - the plain chat list among them, since the "Chats" folder has no
// value of the label table to move to.
const SectionByLayout = {
	[Layout.folderAll]: AnalyticsFolderType.all,
	[Layout.folderAllSettings]: AnalyticsFolderType.all,
	[Layout.folder]: AnalyticsFolderType.userFolder,
	[Layout.taskComments]: AnalyticsFolderType.tasks,
	[Layout.copilot]: AnalyticsFolderType.copilot,
	[Layout.channel]: AnalyticsFolderType.channels,
	[Layout.collab]: AnalyticsFolderType.projects,
	// Two layouts of one folder: the user sees "Lines" either way, and the report must not split them.
	[Layout.openlines]: AnalyticsFolderType.lines,
	[Layout.openlinesV2]: AnalyticsFolderType.lines,
	[Layout.vibecodeApp]: AnalyticsFolderType.vibecodeApp,
};

// Forms with no place of their own in the navigation (LayoutsWithRegularChatsList): on the left they
// are handed the list of the section where plain chats live, so they name the folder that list belongs
// to. Which list it is depends on the portal, and the answer must not name a folder the user has not
// got. Notifications and a conference borrow the same list yet keep `<layout>_tab`: the decision was
// taken about the forms alone and these two were never brought under it.
const FormsWithRegularChatsList = new Set([
	Layout.createChat,
	Layout.updateChat,
	Layout.createFolder,
	Layout.updateFolder,
	Layout.copyCollab,
]);

// The rule belongs to `FolderManager.getRegularChatsLayout`, which resolves the very same folder before
// handing the list to a form. It is asked of the store here instead of the manager because
// `im.v2.lib.folder` imports this extension, and importing it back would close a cycle.
function isAllFolderShown(): boolean
{
	return Boolean(Core.getStore().getters['recent/folders/getByCode'](SystemFolderCode.all));
}

export function getFolderSection(layoutName: string): string
{
	if (FormsWithRegularChatsList.has(layoutName))
	{
		return isAllFolderShown() ? AnalyticsFolderType.all : `${layoutName}_tab`;
	}

	return SectionByLayout[layoutName] ?? `${layoutName}_tab`;
}
