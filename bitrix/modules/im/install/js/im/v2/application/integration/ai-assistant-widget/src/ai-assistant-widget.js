import { Type, type JsonObject } from 'main.core';

import 'im.v2.css.tokens';
import { Core } from 'im.v2.application.core';
import { type RunActionError } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';

import { WidgetChatManager } from './classes/widget-chat-manager';
import { AiAssistantWidgetChatOpener } from './components/ai-assistant-widget-chat-opener';

type TargetChat = {
	dialogId?: string,
	chatId?: number,
};

const APP_NAME = 'AiAssistantWidgetApplication';

type MountPayload = {
	rootContainer: string | HTMLElement,
	aiAssistantBotId: number,
	onError: (RunActionError[]) => void,
} & TargetChat;

export class AiAssistantWidgetApplication
{
	#initPromise: Promise<AiAssistantWidgetApplication>;
	#params: JsonObject;

	constructor(params: JsonObject = {})
	{
		this.#params = params;
		this.#initPromise = this.#init();
	}

	ready(): Promise
	{
		return this.#initPromise;
	}

	async mount(payload: MountPayload): Promise
	{
		await this.ready();

		const { rootContainer, aiAssistantBotId, onError } = payload;
		if (!rootContainer)
		{
			return Promise.reject(new Error('Provide node or selector for root container'));
		}

		const dialogId = WidgetChatManager.getInstance().isBitrixGptMode
			? (this.#resolveDialogId(payload) ?? '')
			: (aiAssistantBotId?.toString() ?? '');

		return Core.createVue(this, {
			name: APP_NAME,
			el: rootContainer,
			onError,
			components: { AiAssistantWidgetChatOpener },
			template: `<AiAssistantWidgetChatOpener initialDialogId="${dialogId}" />`,
		});
	}

	async changeDialog(targetChat: TargetChat): Promise<boolean>
	{
		await this.ready();

		if (!WidgetChatManager.getInstance().isBitrixGptMode)
		{
			return false;
		}

		const dialogId = this.#resolveDialogId(targetChat);
		if (!dialogId)
		{
			return false;
		}

		return WidgetChatManager.getInstance().changeDialog(dialogId);
	}

	#resolveDialogId(targetChat: TargetChat): ?string
	{
		if (Type.isStringFilled(targetChat?.dialogId))
		{
			return targetChat.dialogId;
		}

		if (Type.isNumber(targetChat?.chatId))
		{
			return Utils.dialog.buildChatDialogId(targetChat.chatId);
		}

		return null;
	}

	async #init(): Promise<AiAssistantWidgetApplication>
	{
		Core.setApplicationData(this.#params);
		await Core.ready();

		return this;
	}
}
