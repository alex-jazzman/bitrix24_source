import { sendData } from 'ui.analytics';

import { ChatType, Layout, UserRole } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

import {
	AnalyticsEvent,
	AnalyticsTool,
	AnalyticsCategory,
	AnalyticsType,
	AnalyticsSection,
	CopilotChatType,
} from './const';

import type { ImModelChat } from 'im.v2.model';

type DialogId = string;

const CUSTOM_CHAT_TYPE = 'custom';

export class Analytics
{
	#createdChats: Set<DialogId> = new Set();
	#currentTab: string = '';

	static #instance: Analytics;

	static getInstance(): Analytics
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	onOpenMessenger()
	{
		sendData({
			event: AnalyticsEvent.openMessenger,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
		});
	}

	onCreateCopilotChat({ chatId, dialogId })
	{
		this.#createdChats.add(dialogId);

		sendData({
			event: AnalyticsEvent.createNewChat,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: AnalyticsSection.copilotTab,
			type: AnalyticsType.ai,
			p3: CopilotChatType.private,
			p5: `chatId_${chatId}`,
		});
	}

	onOpenCopilotChat(dialogId: string)
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);
		const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;

		sendData({
			event: AnalyticsEvent.openChat,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: AnalyticsSection.copilotTab,
			type: AnalyticsType.ai,
			p3: copilotChatType,
			p5: `chatId_${dialog.chatId}`,
		});
	}

	onOpenCopilotTab()
	{
		sendData({
			event: AnalyticsEvent.openTab,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: AnalyticsSection.copilotTab,
		});
	}

	onOpenTab(tabName: string)
	{
		const existingTabs = [
			Layout.chat.name,
			Layout.copilot.name,
			Layout.channel.name,
			Layout.notification.name,
			Layout.settings.name,
			Layout.openlines.name,
		];

		if (!existingTabs.includes(tabName))
		{
			return;
		}

		if (this.#currentTab === tabName)
		{
			return;
		}

		this.#currentTab = tabName;

		sendData({
			event: AnalyticsEvent.openTab,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			type: tabName,
		});
	}

	onUseCopilotAudioInput()
	{
		sendData({
			event: AnalyticsEvent.audioUse,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: AnalyticsSection.copilotTab,
		});
	}

	onOpenCheckInPopup()
	{
		sendData({
			event: AnalyticsEvent.popupOpen,
			tool: AnalyticsTool.checkin,
			category: AnalyticsCategory.shift,
			c_section: AnalyticsSection.chat,
		});
	}

	onOpenPriceTable(featureId: string)
	{
		sendData({
			tool: AnalyticsTool.infoHelper,
			category: AnalyticsCategory.limit,
			event: AnalyticsEvent.openPrices,
			type: featureId,
			c_section: AnalyticsSection.chat,
		});
	}

	onOpenToolsSettings(toolId: string)
	{
		sendData({
			tool: AnalyticsTool.infoHelper,
			category: AnalyticsCategory.toolOff,
			event: AnalyticsEvent.openSettings,
			type: toolId,
			c_section: AnalyticsSection.chat,
		});
	}

	onStartCreateNewChat(type: $Values<typeof ChatType>)
	{
		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		sendData({
			tool: AnalyticsTool.im,
			category: this.#getCategoryByChatType(type),
			event: AnalyticsEvent.clickCreateNew,
			type,
			c_section: `${currentLayout}_tab`,
		});
	}

	onCreateChat(dialogId: string)
	{
		this.#createdChats.add(dialogId);
	}

	onOpenChat(dialog: ImModelChat)
	{
		if (this.#createdChats.has(dialog.dialogId))
		{
			this.#createdChats.delete(dialog.dialogId);

			return;
		}

		const chatType = this.#getChatType(dialog);

		if (chatType === ChatType.copilot)
		{
			this.onOpenCopilotChat(dialog.dialogId);
		}

		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		const isMember = dialog.role === UserRole.guest ? 'N' : 'Y';

		const params = {
			tool: AnalyticsTool.im,
			category: this.#getCategoryByChatType(chatType),
			event: AnalyticsEvent.openExisting,
			type: chatType,
			c_section: `${currentLayout}_tab`,
			p3: `isMember_${isMember}`,
			p5: `chatId_${dialog.chatId}`,
		};

		if (chatType === ChatType.comment)
		{
			const parentChat = Core.getStore().getters['chats/getByChatId'](dialog.parentChatId);
			params.p1 = `chatType_${parentChat.type}`;
			params.p4 = `parentChatId_${dialog.parentChatId}`;
		}

		sendData(params);
	}

	#getCategoryByChatType(type: $Values<typeof ChatType>): string
	{
		switch (type)
		{
			case ChatType.channel:
			case ChatType.openChannel:
			case ChatType.comment:
			case ChatType.generalChannel:
				return AnalyticsCategory.channel;
			case ChatType.copilot:
				return AnalyticsCategory.copilot;
			case ChatType.videoconf:
				return AnalyticsCategory.videoconf;
			default:
				return AnalyticsCategory.chat;
		}
	}

	#getChatType(chat: ImModelChat): $Values<typeof ChatType>
	{
		return ChatType[chat.type] ?? CUSTOM_CHAT_TYPE;
	}
}
