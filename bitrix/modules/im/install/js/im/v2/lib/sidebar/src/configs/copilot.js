import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isCopilot = (chatContext: ImModelChat) => chatContext.type === ChatType.copilot;

const copilotConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.copilot,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.copilotInfo,
		SidebarMainPanelBlock.taskList,
		SidebarMainPanelBlock.meetingList,
	],
});

export { isCopilot, copilotConfig };
