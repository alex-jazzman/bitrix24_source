import { Loc } from 'main.core';

import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isComment = (chatContext: ImModelChat) => chatContext.type === ChatType.comment;

const commentConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.post,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.taskList,
		SidebarMainPanelBlock.meetingList,
	],
	headerTitle: Loc.getMessage('IM_SIDEBAR_COMMENTS_HEADER_TITLE'),
	headerMenuEnabled: false,
});

export { isComment, commentConfig };
