import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isUser = (chatContext: ImModelChat) => chatContext.type === ChatType.user;

const userConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.user,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
		SidebarMainPanelBlock.taskList,
		SidebarMainPanelBlock.meetingList,
		SidebarMainPanelBlock.marketAppList,
	],
});

export { isUser, userConfig };
