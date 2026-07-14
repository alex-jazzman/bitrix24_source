import { Core } from 'im.v2.application.core';
import { ChatType, Layout, type LayoutType, type ChatTypeItem } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelLayout } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

const SUPPORTED_CHAT_TYPES = new Set([ChatType.collab]);
const EXCLUDED_LAYOUTS = new Set([Layout.taskComments]);
const COMPACT_MODE_LAYOUTS = new Set([Layout.chat]);

export class NestedListManager
{
	#initedChat: ImModelChat;

	constructor(payload: { initedChat: ImModelChat })
	{
		const { initedChat } = payload;
		this.#initedChat = initedChat;
	}

	static isFeatureAvailable(): boolean
	{
		return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
	}

	static isSupportedChatType(chatType: ChatTypeItem): boolean
	{
		return SUPPORTED_CHAT_TYPES.has(chatType);
	}

	static isCompactModeLayout(): boolean
	{
		return COMPACT_MODE_LAYOUTS.has(NestedListManager.#getCurrentLayoutName());
	}

	static async prepareParentChatId(parentDialogId: string): Promise<number>
	{
		let realDialogId = parentDialogId;
		if (Utils.dialog.isGroupExternalId(parentDialogId))
		{
			realDialogId = await (new ChatService()).prepareDialogId(parentDialogId);
		}

		return Utils.dialog.getChatIdFromDialogId(realDialogId);
	}

	shouldOpen(): boolean
	{
		const { type } = this.#getTargetChat();

		return NestedListManager.isSupportedChatType(type) && !this.#isExcludedLayout();
	}

	getDialogIdToOpen(): string
	{
		const { dialogId } = this.#getTargetChat();

		return dialogId;
	}

	static #getCurrentLayoutName(): LayoutType
	{
		const { name: currentLayoutName }: ImModelLayout = Core.getStore().getters['application/getLayout'];

		return currentLayoutName;
	}

	#getTargetChat(): ImModelChat
	{
		const parentChat = this.#getParentChat();
		if (parentChat)
		{
			return parentChat;
		}

		return this.#initedChat;
	}

	#getParentChat(): ?ImModelChat
	{
		if (!this.#initedChat.parentChatId)
		{
			return null;
		}

		return Core.getStore().getters['chats/getByChatId'](this.#initedChat.parentChatId);
	}

	#isExcludedLayout(): boolean
	{
		return EXCLUDED_LAYOUTS.has(NestedListManager.#getCurrentLayoutName());
	}
}
