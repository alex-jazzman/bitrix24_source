import { type JsonObject } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { ChatType, CopilotRole, MessageComponent, UserRole } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage, type ImModelChat, type ImModelCopilotRole } from 'im.v2.model';
import { CopilotChatService } from 'im.v2.provider.service.copilot';

export class CopilotManager
{
	store: Store;
	#draftChatId: ?string = null;
	#draftRealDialogId: ?string = null;
	#draftFetchPromise: ?Promise<?string> = null;

	constructor()
	{
		this.store = Core.getStore();
	}

	draftChatCreate(): string
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isCopilotDraftChatAvailable))
		{
			return '';
		}

		if (this.#draftChatId)
		{
			return this.#draftChatId;
		}

		const draftChatId = Utils.dialog.buildTempAiAssistantDialogId();
		this.#draftChatId = draftChatId;

		void this.store.dispatch('chats/add', {
			dialogId: draftChatId,
			type: ChatType.copilot,
			role: UserRole.member,
			isTextareaEnabled: true,
		});

		void this.store.dispatch('copilot/chats/set', {
			dialogId: draftChatId,
			role: CopilotRole.universalCode,
			aiModel: 'none',
			reasoningEnabled: false,
			forceSearchEnabled: false,
			agentModeEnabled: false,
			mcpAuth: null,
		});

		this.#draftFetchPromise = this.#fetchDraftInBackground();

		return draftChatId;
	}

	draftChatGetRealPromise(): ?Promise<?string>
	{
		return this.#draftFetchPromise;
	}

	draftChatDispose(): void
	{
		if (!this.#draftChatId)
		{
			return;
		}

		const draftChatId = this.#draftChatId;
		this.#draftChatId = null;
		this.#draftRealDialogId = null;
		this.#draftFetchPromise = null;

		void this.store.dispatch('copilot/chats/delete', draftChatId);
		void this.store.dispatch('chats/delete', { dialogId: draftChatId });
	}

	async #fetchDraftInBackground(): Promise<?string>
	{
		try
		{
			// Response goes through the shared LoadService pipeline (chats, messages, copilot/*, etc.)
			// and marks the chat as inited, so ChatOpener skips the redundant Chat.load on setLayout.
			const result = await new CopilotChatService().fetchDraftChat();
			const realDialogId = result?.dialogId ?? null;
			if (realDialogId)
			{
				this.#draftRealDialogId = realDialogId;
			}

			return realDialogId;
		}
		catch
		{
			return null;
		}
	}

	async handleRecentListResponse(copilotData: JsonObject): Promise
	{
		if (!copilotData)
		{
			return Promise.resolve();
		}

		const { roles, chats, messages } = copilotData;
		if (!roles)
		{
			return Promise.resolve();
		}

		return Promise.all([
			this.store.dispatch('copilot/chats/set', chats),
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/messages/add', messages),
		]);
	}

	async handleChatLoadResponse(copilotData: JsonObject): Promise
	{
		if (!copilotData)
		{
			return Promise.resolve();
		}

		const { aiProvider, chats, roles, messages } = copilotData;
		if (!roles)
		{
			return Promise.resolve();
		}

		return Promise.all([
			this.store.dispatch('copilot/setProvider', aiProvider),
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/chats/set', chats),
			this.store.dispatch('copilot/messages/add', messages),
		]);
	}

	async handleRoleUpdate(copilotData: JsonObject): Promise
	{
		const { chats, roles } = copilotData;
		if (!roles)
		{
			return Promise.resolve();
		}

		return Promise.all([
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/chats/set', chats),
		]);
	}

	async handleMessageAdd(copilotData): Promise
	{
		const { chats, roles, messages } = copilotData;
		if (!roles)
		{
			return Promise.resolve();
		}

		return Promise.all([
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/chats/set', chats),
			this.store.dispatch('copilot/messages/add', messages),
		]);
	}

	getRoleAvatarUrl(payload: { avatarDialogId: string, contextDialogId: string }): string
	{
		const { avatarDialogId, contextDialogId } = payload;
		if (!this.isCopilotChatOrBot(avatarDialogId))
		{
			return '';
		}

		return this.store.getters['copilot/chats/getRoleAvatar'](contextDialogId);
	}

	getDefaultAvatarUrl(): string
	{
		return this.store.getters['copilot/roles/getDefaultAvatar']();
	}

	isCopilotBot(userId: string | number): boolean
	{
		return this.store.getters['users/bots/isCopilot'](userId);
	}

	isCopilotChat(dialogId: string): boolean
	{
		return this.store.getters['chats/get'](dialogId)?.type === ChatType.copilot;
	}

	isCopilotChatOrBot(dialogId: string): boolean
	{
		return this.isCopilotChat(dialogId) || this.isCopilotBot(dialogId);
	}

	isGroupCopilotChat(dialogId: string): boolean
	{
		const { userCounter }: ImModelChat = this.store.getters['chats/get'](dialogId);

		return this.isCopilotChat(dialogId) && userCounter > 2;
	}

	isCopilotMessage(messageId: number): boolean
	{
		const message: ImModelMessage = this.store.getters['messages/getById'](messageId);
		if (!message)
		{
			return false;
		}

		if (this.isCopilotBot(message.authorId))
		{
			return true;
		}

		return message.componentId === MessageComponent.copilotCreation;
	}

	getMessageRoleAvatar(messageId: number): ?string
	{
		return this.store.getters['copilot/messages/getRole'](messageId)?.avatar?.medium;
	}

	getNameWithRole(messageId: string | number): string
	{
		const copilotName = this.getName();
		const {
			default: isDefaultRole,
			name: roleName,
		}: ImModelCopilotRole = this.store.getters['copilot/messages/getRole'](messageId);

		if (isDefaultRole)
		{
			return copilotName;
		}

		return `${copilotName} (${roleName})`;
	}

	getName(): string
	{
		return this.store.getters['copilot/getName'];
	}

	getAIModelName(dialogId: string): string
	{
		const currentAIModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);

		return currentAIModel.name;
	}
}
