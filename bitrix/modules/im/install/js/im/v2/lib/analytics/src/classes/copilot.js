import { Text, Type } from 'main.core';
import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsStatus,
	AnalyticsTool,
	CopilotChatType,
	AnalyticsType,
} from '../const';
import { getChatType } from '../helpers/get-chat-type';

const CopilotEntryPoint = Object.freeze({
	create_menu: 'create_menu',
	role_picker: 'role_picker',
});

export class Copilot
{
	#isBitrixGptV2Available = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

	onCreateChat(dialogId: string): void
	{
		if (!Type.isStringFilled(dialogId))
		{
			return;
		}

		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		this.#sendCreateChatData({
			dialogId,
			context: `${currentLayout}_tab`,
		});
	}

	onCreateChatFromWidget(dialogId: string): void
	{
		if (!Type.isStringFilled(dialogId))
		{
			return;
		}

		this.#sendCreateChatData({
			dialogId,
			context: AnalyticsSection.miniChat,
		});
	}

	onCreateDefaultChatInRecent(): void
	{
		this.#sendDataForCopilotCreation({ c_sub_section: CopilotEntryPoint.create_menu });
	}

	onSelectRoleInRecent(): void
	{
		this.#sendDataForCopilotCreation({ c_sub_section: CopilotEntryPoint.role_picker });
	}

	onOpenChat(dialogId: string): void
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);
		const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;
		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		sendData({
			event: AnalyticsEvent.openChat,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: `${currentLayout}_tab`,
			type: AnalyticsType.ai,
			p3: copilotChatType,
			p5: `chatId_${dialog.chatId}`,
		});
	}

	onOpenTab({ isAvailable = true } = {}): void
	{
		const payload = {
			event: AnalyticsEvent.openTab,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: AnalyticsSection.copilotTab,
			status: isAvailable ? AnalyticsStatus.success : AnalyticsStatus.errorTurnedOff,
		};

		sendData(payload);
	}

	onUseAudioInput(dialogId: string): void
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);
		const isCopilot = dialog.type === ChatType.copilot;
		if (!isCopilot)
		{
			return;
		}

		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		const role = Core.getStore().getters['copilot/chats/getRole'](dialogId);
		const aiModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
		const aiModelName = aiModel.name ?? aiModel;
		const copilotChatType = dialog.userCounter <= 2 ? CopilotChatType.private : CopilotChatType.multiuser;

		const params = {
			event: AnalyticsEvent.audioUse,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: `${currentLayout}_tab`,
			p3: copilotChatType,
			p4: `role_${Text.toCamelCase(role.code)}`,
			p5: `chatId_${dialog.chatId}`,
		};

		if (!this.#isBitrixGptV2Available)
		{
			params.p2 = `provider_${aiModelName}`;
		}

		sendData(params);
	}

	onToggleReasoning(dialogId: string): void
	{
		const isReasoningEnabled = Core.getStore().getters['copilot/chats/isReasoningEnabled'](dialogId);
		const event = isReasoningEnabled ? AnalyticsEvent.modeOn : AnalyticsEvent.modeOff;

		const chat = Core.getStore().getters['chats/get'](dialogId);
		const currentLayout = Core.getStore().getters['application/getLayout'].name;
		const role = Core.getStore().getters['copilot/chats/getRole'](dialogId);
		const aiModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);
		const aiModelName = aiModel.name ?? aiModel;

		const params = {
			event,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.copilot,
			type: AnalyticsType.think,
			c_section: `${currentLayout}_tab`,
			p1: getChatType(chat),
			p4: `role_${Text.toCamelCase(role.code)}`,
			p5: `chatId_${chat.chatId}`,
		};

		if (!this.#isBitrixGptV2Available)
		{
			params.p2 = `provider_${aiModelName}`;
		}

		sendData(params);
	}

	onMcpIntegrationClick(dialogId: string): void
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);
		if (!dialog)
		{
			return;
		}

		const chatType = getChatType(dialog);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.copilot,
			event: AnalyticsEvent.clickMcpIntegrations,
			c_section: AnalyticsSection.chatTextarea,
			p1: `chatType_${chatType}`,
		});
	}

	#sendCreateChatData({ dialogId, context }: { dialogId: string, context: string }): void
	{
		const dialog = Core.getStore().getters['chats/get'](dialogId);

		sendData({
			event: AnalyticsEvent.createNewChat,
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.chatOperations,
			c_section: context,
			type: AnalyticsType.ai,
			p3: CopilotChatType.private,
			p5: `chatId_${dialog.chatId}`,
		});
	}

	#sendDataForCopilotCreation(params: { c_sub_section: string }): void
	{
		const currentLayout = Core.getStore().getters['application/getLayout'].name;

		sendData({
			event: AnalyticsEvent.clickCreateNew,
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.copilot,
			c_section: `${currentLayout}_tab`,
			type: AnalyticsType.copilot,
			...params,
		});
	}
}
