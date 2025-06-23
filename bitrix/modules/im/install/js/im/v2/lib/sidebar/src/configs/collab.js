import { Loc } from 'main.core';

import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isCollab = (chatContext: ImModelChat) => chatContext.type === ChatType.collab;

const collabConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.chat,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
		SidebarMainPanelBlock.collabHelpdesk,
	],
	headerTitle: Loc.getMessage('IM_SIDEBAR_COLLAB_HEADER_TITLE'),
});

export { isCollab, collabConfig };
