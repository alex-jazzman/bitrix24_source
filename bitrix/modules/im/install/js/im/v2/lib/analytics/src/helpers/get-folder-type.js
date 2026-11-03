import { FolderType, SystemFolderCode } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';

import { AnalyticsFolderType } from '../const';

// The table of labels has no value for "All" and "Chats", so they are simply left out of the map: a
// system folder with no row of its own gets no type, and the sender drops the event.
const FolderTypeByCode = {
	[SystemFolderCode.tasksTask]: AnalyticsFolderType.tasks,
	[SystemFolderCode.openChannel]: AnalyticsFolderType.channels,
	[SystemFolderCode.collab]: AnalyticsFolderType.projects,
	[SystemFolderCode.copilot]: AnalyticsFolderType.copilot,
	[SystemFolderCode.openlines]: AnalyticsFolderType.lines,
};

export function getFolderType(folder: ImModelFolder): ?$Values<typeof AnalyticsFolderType>
{
	if (folder.type === FolderType.personal)
	{
		return AnalyticsFolderType.userFolder;
	}

	return FolderTypeByCode[folder.code] ?? null;
}
