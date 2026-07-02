import { SidebarMainPanelBlock, ChatType } from 'im.v2.const';
import { Loc } from 'main.core';

import { SidebarPreset } from '../classes/preset';

import type { ImModelChat } from 'im.v2.model';

const isTaskComments = (chatContext: ImModelChat) => chatContext.type === ChatType.taskComments;

const taskCommentsPreset = new SidebarPreset({
	blocks: [
		SidebarMainPanelBlock.task,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.meetingList,
		SidebarMainPanelBlock.taskCommentsHistory,
	],
	isHeaderMenuEnabled: () => false,
	getHeaderTitle: () => Loc.getMessage('IM_SIDEBAR_TASK_COMMENTS_HEADER_TITLE'),
});

export { isTaskComments, taskCommentsPreset };
