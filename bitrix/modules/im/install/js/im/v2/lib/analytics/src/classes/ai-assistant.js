import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import {
	AI_ASSISTANT_CHAT_TYPE,
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsTool,
	AnalyticsSection,
	AnalyticsType,
} from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getUserType } from '../helpers/get-user-type';
import { isAiAssistant } from '../helpers/is-ai-assistant';

export class AiAssistant
{
	onOpenWidget(dialog: ImModelChat): void
	{
		const chatType = getChatType(dialog);

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.openExisting,
			type: chatType,
			c_section: AnalyticsSection.miniChat,
			p2: getUserType(),
			p5: `chatId_${dialog.chatId}`,
		});
	}

	onOpenMiniChat()
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.copilot,
			event: AnalyticsEvent.openMiniChat,
		});
	}

	onChatCreateClick()
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.copilot,
			event: AnalyticsEvent.clickCreateNew,
			type: AnalyticsType.copilot,
			c_section: AnalyticsSection.miniChat,
			p2: getUserType(),
		});
	}

	onOpenChatAI(dialog: ImModelChat, fromWidget: boolean = false): void
	{
		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		sendData({
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			event: AnalyticsEvent.openChat,
			type: AI_ASSISTANT_CHAT_TYPE,
			c_section: fromWidget ? AnalyticsSection.miniChat : `${currentLayout}_tab`,
			p2: getUserType(),
			p3: `chatType_${getChatType(dialog)}`,
			p5: `chatId_${dialog.chatId}`,
		});
	}

	onUseAudioInput(dialogId: string): void
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);
		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		if (!isAiAssistant(dialog.dialogId))
		{
			return;
		}

		sendData({
			event: AnalyticsEvent.audioUse,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: `${currentLayout}_tab`,
			p3: AI_ASSISTANT_CHAT_TYPE,
			p5: `chatId_${dialog.chatId}`,
		});
	}

	onMcpIntegrationClick(): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chat,
			event: AnalyticsEvent.clickMcpIntegrations,
			c_section: AnalyticsSection.chatTextarea,
			p1: AI_ASSISTANT_CHAT_TYPE,
		});
	}
}
