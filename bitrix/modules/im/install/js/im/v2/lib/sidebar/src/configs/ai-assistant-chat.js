import { Loc } from 'main.core';

import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

import { SidebarPreset } from '../classes/preset';

import type { ImModelChat } from 'im.v2.model';

const isAiAssistantChat = (chatContext: ImModelChat) => {
	return [ChatType.aiAssistant, ChatType.aiAssistantEntity].includes(chatContext.type);
};

const aiAssistantChatPreset = new SidebarPreset({
	blocks: [
		SidebarMainPanelBlock.chat,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.taskList,
		SidebarMainPanelBlock.meetingList,
	],
	getCustomDescription: (dialogId: string) => {
		if (isAiAssistantMultiUserChat(dialogId))
		{
			return '';
		}

		return Loc.getMessage('IM_SIDEBAR_AI_ASSISTANT_DESCRIPTION');
	},
	areChatMembersEnabled: (dialogId: string) => {
		return isAiAssistantMultiUserChat(dialogId);
	},
	areSharedChatsEnabled: () => false,
	isAutoDeleteEnabled: () => false,
});

const isAiAssistantMultiUserChat = (dialogId: string): boolean => {
	const chat = Core.getStore().getters['chats/get'](dialogId, true);

	return chat.type === ChatType.aiAssistant && chat.userCounter > 2;
};

export { isAiAssistantChat, aiAssistantChatPreset };
