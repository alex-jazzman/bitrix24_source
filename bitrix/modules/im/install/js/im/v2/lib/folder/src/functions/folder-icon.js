import { Solid } from 'ui.icon-set.api.core';

import { SystemFolderCode, type SystemFolderCodeItem } from 'im.v2.const';

// The single place where a folder code is bound to a glyph. Every glyph is taken from the Solid set,
// which is loaded by the surfaces that draw it: most consumers of this library never ask for an icon.
const IconBySystemFolderCode: Record<SystemFolderCodeItem, string> = {
	// `all` and `default` share a glyph and never stand side by side: the server shows exactly one of
	// the pair, `default` only while the composite folder of all the chats is off.
	[SystemFolderCode.all]: Solid.HOME,
	[SystemFolderCode.default]: Solid.HOME,
	[SystemFolderCode.tasksTask]: Solid.TASK,
	[SystemFolderCode.tasksTaskRoot]: Solid.TASK,
	[SystemFolderCode.copilot]: Solid.BITRIX_GPT,
	[SystemFolderCode.channel]: Solid.SPEAKER,
	[SystemFolderCode.openChannel]: Solid.SPEAKER,
	[SystemFolderCode.collab]: Solid.COLLAB,
	[SystemFolderCode.openlines]: Solid.OPEN_CHANNELS,
	[SystemFolderCode.vibecodeApp]: Solid.VIBECODE,
};

// An unknown code is not an error: the showcase registry of the server may grow earlier than the client.
const DefaultIcon: string = Solid.FOLDER;

export const getIconByFolderCode = (folderCode: SystemFolderCodeItem): string => {
	// The code arrives with the answer of the server and no allowlist of the model stands on the way, so
	// the map is asked only about the keys it owns: a name every object inherits - `constructor`,
	// `toString` - would otherwise answer with a member of the prototype, and `??` would let it through.
	if (!Object.hasOwn(IconBySystemFolderCode, folderCode))
	{
		return DefaultIcon;
	}

	return IconBySystemFolderCode[folderCode];
};
