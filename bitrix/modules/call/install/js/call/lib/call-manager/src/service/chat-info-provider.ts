import type { ImStore } from '../adapter/im-store';
import type { ChatInfo } from '../type/im';

type PrepareCallData = {
	dialogId: string,
	userData: Record<string, Object>,
	user?: number,
};

type ChatServiceLike = { loadChat: (dialogId: string) => Promise<unknown> };

type ChatTypes = { conference: string, user: string };

export class ChatInfoProvider
{
	#store: ImStore;
	#createChatService: () => ChatServiceLike;
	#chatTypes: ChatTypes;
	#chatService: ChatServiceLike | null = null;
	#onError?: (error: unknown) => void;

	constructor(
		store: ImStore,
		createChatService: () => ChatServiceLike,
		chatTypes: ChatTypes,
		onError?: (error: unknown) => void,
	)
	{
		this.#store = store;
		this.#createChatService = createChatService;
		this.#chatTypes = chatTypes;
		this.#onError = onError;
	}

	isConference(dialogId: string): boolean
	{
		return this.#store.getChat(dialogId).type === this.#chatTypes.conference;
	}

	isUser(dialogId: string): boolean
	{
		return this.#store.getChat(dialogId)?.type === this.#chatTypes.user;
	}

	buildPrepareData(dialogId: string): PrepareCallData
	{
		const currentUserId = this.#store.getCurrentUserId();
		const currentUser = this.#store.getUser(currentUserId);

		const data: PrepareCallData = {
			dialogId,
			userData: { [currentUserId]: currentUser },
		};

		if (this.isUser(dialogId))
		{
			const companion = this.#store.getUser(dialogId);
			data.user = companion.id;
			data.userData[companion.id] = companion;
		}

		return data;
	}

	async getChatInfo(dialogId: string): Promise<Object>
	{
		const chatInfo = this.#store.getChat(dialogId, true);

		if (chatInfo.chatId === 0)
		{
			try
			{
				await this.#getChatService().loadChat(dialogId);

				return this.#prepareChatInfo(this.#store.getChat(dialogId, true));
			}
			catch (error)
			{
				// Preserve the original error-logging behaviour via an injected dep,
				// to avoid pulling `im.v2.lib.logger` into this service.
				this.#onError?.(error);

				return this.#prepareChatInfo(chatInfo);
			}
		}

		return this.#prepareChatInfo(chatInfo);
	}

	#getChatService(): ChatServiceLike
	{
		if (!this.#chatService)
		{
			this.#chatService = this.#createChatService();
		}

		return this.#chatService;
	}

	#prepareChatInfo(chatInfo: ChatInfo): Object
	{
		return {
			advanced: {
				chatType: chatInfo.type,
				entityType: chatInfo.entityType,
				entityId: chatInfo.entityId,
				entityData1: chatInfo.entityData1,
				entityData2: chatInfo.entityData2,
				entityData3: chatInfo.entityData3,
			},
			id: chatInfo.dialogId,
			chatId: chatInfo.chatId,
			name: chatInfo.name,
			avatar: chatInfo.avatar || '/bitrix/js/im/images/blank.gif',
			avatarColor: chatInfo.color,
			type: 'chat',
			userCounter: chatInfo.userCounter,
		};
	}
}
