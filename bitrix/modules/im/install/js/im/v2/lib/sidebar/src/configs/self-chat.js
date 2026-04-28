import { Core } from 'im.v2.application.core';
import { SidebarMainPanelBlock } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { SidebarPreset } from '../classes/preset';

const isSelfChat = (chatContext: ImModelChat): boolean => {
	return Core.getStore().getters['chats/isSelfChat'](chatContext.dialogId);
};

const selfChatPreset = new SidebarPreset({
	blocks: [
		SidebarMainPanelBlock.selfChat,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
	],
});

export { isSelfChat, selfChatPreset };
