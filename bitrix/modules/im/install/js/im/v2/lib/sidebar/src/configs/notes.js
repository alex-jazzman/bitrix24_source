import { Core } from 'im.v2.application.core';
import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isNotes = (chatContext: ImModelChat) => {
	return chatContext.type === ChatType.user && Number(chatContext.dialogId) === Core.getUserId();
};

const notesConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.notes,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
	],
});

export { isNotes, notesConfig };
