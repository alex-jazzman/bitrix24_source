import { ChatType, MessageComponent } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import type { JsonObject } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { ImModelMessage, ImModelUser, ImModelChat, ImModelCopilotRole } from 'im.v2.model';

export class CopilotManager
{
	store: Store;

	constructor()
	{
		this.store = Core.getStore();
	}

	async handleRecentListResponse(copilotData: JsonObject): Promise
	{
		if (!copilotData)
		{
			return Promise.resolve();
		}

		const { recommendedRoles, roles, chats, messages } = copilotData;
		if (!roles)
		{
			return Promise.resolve();
		}

		return Promise.all([
			this.store.dispatch('copilot/chats/set', chats),
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/setRecommendedRoles', recommendedRoles),
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

	getName({ dialogId, messageId }): string
	{
		const { name: userName }: ImModelUser = this.store.getters['users/get'](dialogId);
		const { default: isDefaultRole, name: roleName }: ImModelCopilotRole = this.store.getters['copilot/messages/getRole'](messageId);

		if (isDefaultRole)
		{
			return userName;
		}

		return `${userName} (${roleName})`;
	}

	getAIModelName(dialogId: string): string
	{
		const isAIModelChangeAllowed = FeatureManager.isFeatureAvailable(Feature.isAIModelChangeAllowed);

		if (isAIModelChangeAllowed)
		{
			const currentAIModel = Core.getStore().getters['copilot/chats/getAIModel'](dialogId);

			return currentAIModel.name;
		}

		return Core.getStore().getters['copilot/getProvider'];
	}
}
