import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isLines = (chatContext: ImModelChat) => chatContext.type === ChatType.lines;

const linesConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.chat,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
	],
	headerMenuEnabled: false,
});

export { isLines, linesConfig };
