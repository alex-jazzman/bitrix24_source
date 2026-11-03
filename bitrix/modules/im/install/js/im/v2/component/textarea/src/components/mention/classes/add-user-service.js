import { type EventEmitter } from 'main.core.events';

import { ChatType, EventType, type ChatTypeItem } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { ChatAccessManager } from 'im.v2.lib.access';
import { ChatService } from 'im.v2.provider.service.chat';
import { CollabInvitationService } from 'im.v2.provider.service.collab-invitation';
import { Messenger } from 'im.public';

type AddUserParams = { dialogId: string, chatId: number, userId: string };

export class MentionAddUserService
{
	#emitter: EventEmitter;
	#chatService: ChatService;

	constructor(context: { emitter: EventEmitter })
	{
		this.#emitter = context.emitter;
		this.#chatService = new ChatService();
	}

	async addUser(params: AddUserParams): Promise<boolean>
	{
		const { dialogId, userId } = params;

		const canAdd = await ChatAccessManager.canAddUsers(dialogId, [userId]);
		if (!canAdd)
		{
			return false;
		}

		await this.#addToChat(params);

		this.#emitter.emit(EventType.mention.onAddUserToChat, { userId });

		return true;
	}

	async createChatFromUser(params: { dialogId: string, userId: string }): Promise<void>
	{
		const { dialogId, userId } = params;

		const { newDialogId } = await this.#chatService.extendToGroupChat({
			users: [dialogId, userId, Core.getUserId()],
			ownerId: Core.getUserId(),
		});

		void Messenger.openChat(newDialogId);
	}

	async #addToChat(params: AddUserParams): Promise<void>
	{
		const addMethodByChatType = {
			[ChatType.collab]: () => this.#addToCollab(params),
			default: () => this.#addToDefaultChat(params),
		};

		const addMethod = addMethodByChatType[this.#getChatType(params.dialogId)] ?? addMethodByChatType.default;

		await addMethod();
	}

	async #addToCollab(params: AddUserParams): Promise<void>
	{
		const { dialogId, userId } = params;

		await (new CollabInvitationService()).addEmployees({ dialogId, members: [userId] });
	}

	async #addToDefaultChat(params: AddUserParams): Promise<void>
	{
		const { chatId, userId } = params;

		await this.#chatService.addToChat({
			chatId,
			members: [userId],
			showHistory: true,
		});
	}

	#getChatType(dialogId: string): ChatTypeItem
	{
		return Core.getStore().getters['chats/get'](dialogId, true).type;
	}
}
