import { Core } from 'im.v2.application.core';
import { ActionByRole, AiAssistantSearchBlockName, ChatType, CopilotGenerationStatus, CopilotRole, MessageComponent, RestMethod, UserRole } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { InputAction, InputActionListener } from 'im.v2.lib.input-action';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';
import { runAction } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';

import { type JsonObject } from 'main.core';
import { type Store } from 'ui.vue3.vuex';
import {
	type ImModelChat,
	type ImModelCopilotRole,
	type ImModelInputActions,
	type ImModelMessage,
} from 'im.v2.model';
import { CopilotChatService, McpSelection } from 'im.v2.provider.service.copilot';

export function isCopilotGenerationActive(message: ImModelMessage, store: Store): boolean
{
	if (message.componentParams?.copilotGenerationActive === true)
	{
		return true;
	}

	// transitional fallback: older pending messages come without the flag
	const blocks = store.getters['messages/builder/getBlocks'](message.id);

	return blocks.some((block: { type: string }) => block.type === AiAssistantSearchBlockName);
}

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

	draftChatRetryGetReal(): ?Promise<?string>
	{
		if (!this.#draftChatId)
		{
			return null;
		}

		this.#draftFetchPromise = this.#fetchDraftInBackground();

		return this.#draftFetchPromise;
	}

	getEmptyStateDraftKey(): string
	{
		return `bgpt-empty-state-${Core.getSiteId()}-${Core.getUserId()}`;
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
		const draftDialogId = this.#draftChatId;
		try
		{
			// Response goes through the shared LoadService pipeline (chats, messages, copilot/*, etc.)
			// and marks the chat as inited, so ChatOpener skips the redundant Chat.load on setLayout.
			const result = await new CopilotChatService().fetchDraftChat();
			const realDialogId = result?.dialogId ?? null;
			if (realDialogId)
			{
				this.#draftRealDialogId = realDialogId;
				// not awaited: the real dialog id must not wait for the save round-trip
				void this.#transferDraftMcpSelection(draftDialogId, realDialogId);
			}

			return realDialogId;
		}
		catch
		{
			return null;
		}
	}

	async #transferDraftMcpSelection(fromDialogId: ?string, toDialogId: string): Promise<void>
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isAiAssistantMcpSelectionRestoreAvailable) || !fromDialogId)
		{
			return;
		}

		const mcpAuth = this.store.getters['copilot/chats/getMcpAuth'](fromDialogId);
		await this.store.dispatch('copilot/chats/migrate', { fromDialogId, toDialogId });
		if (!mcpAuth?.id)
		{
			return;
		}

		// saving a chat missing from the store would fail and drop the confirmation just migrated
		if (!this.store.getters['chats/get'](toDialogId)?.chatId)
		{
			Logger.warn('CopilotManager: created chat is not in the store, mcp selection is kept locally');

			return;
		}

		void new McpSelection().save({ dialogId: toDialogId, mcpAuth });
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
			// the chat payload carries the saved mcp selection, so chats are stored even without roles
			return this.store.dispatch('copilot/chats/set', chats);
		}

		return Promise.all([
			this.store.dispatch('copilot/setProvider', aiProvider),
			this.store.dispatch('copilot/roles/add', roles),
			this.store.dispatch('copilot/chats/set', chats),
			this.store.dispatch('copilot/messages/add', messages),
			this.store.dispatch('copilot/votes/add', this.#extractVotesFromMessages(messages)),
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
			this.store.dispatch('copilot/votes/add', this.#extractVotesFromMessages(messages)),
		]);
	}

	#extractVotesFromMessages(messages: ?Array<JsonObject>): Array<{ messageId: number, value: 'like' | 'dislike' }>
	{
		if (!Array.isArray(messages))
		{
			return [];
		}

		const votes = [];
		for (const message of messages)
		{
			const vote = message?.vote;
			let value = null;
			if (vote?.like === true)
			{
				value = 'like';
			}
			else if (vote?.dislike === true)
			{
				value = 'dislike';
			}

			if (value === null)
			{
				continue;
			}

			votes.push({ messageId: message.id, value });
		}

		return votes;
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

	isCopilotUniversalRole(dialogId: string): boolean
	{
		const role: ?ImModelCopilotRole = this.store.getters['copilot/chats/getRole'](dialogId);

		return role?.code === CopilotRole.universalCode;
	}

	isMentionByClickAvailable(dialogId: string, authorId: string | number): boolean
	{
		if (!this.isCopilotBot(authorId))
		{
			return false;
		}

		const dialog: ImModelChat = this.store.getters['chats/get'](dialogId, true);

		const allowedChatTypes = [ChatType.chat, ChatType.open, ChatType.collab];
		if (!allowedChatTypes.includes(dialog.type))
		{
			return false;
		}

		if (!FeatureManager.isFeatureAvailable(Feature.isCopilotMentionAvailable))
		{
			return false;
		}

		if (!dialog.isTextareaEnabled)
		{
			return false;
		}

		// in bulk actions mode the panel of the mode replaces the textarea, so the insert event
		// has no consumer: a clickable name would answer the click with nothing
		if (this.store.getters['messages/select/isBulkActionsModeActive'](dialogId))
		{
			return false;
		}

		return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.send, dialogId);
	}

	isStopGenerationAvailable(dialogId: string): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isBitrixGptStopGenerationAvailable))
		{
			return false;
		}

		if (!this.isCopilotChat(dialogId) || this.isGroupCopilotChat(dialogId))
		{
			return false;
		}

		const generationState = this.store.getters['copilot/chats/getGenerationState'](dialogId);

		return generationState?.status === CopilotGenerationStatus.generating;
	}

	async stopGeneration(dialogId: string): Promise<void>
	{
		// optimistic reset before the request: the button leaves the stop state,
		// so a rapid second click cannot fire another request
		void this.store.dispatch('copilot/chats/clearGenerationState', dialogId);

		try
		{
			const { status, initiatorId } = await runAction(RestMethod.imV2CopilotGenerationStop, {
				data: { dialogId },
			});

			void this.store.dispatch('copilot/chats/setGenerationState', {
				dialogId,
				generationState: { status, initiatorId },
			});

			if (status !== CopilotGenerationStatus.generating)
			{
				this.stopCopilotTyping(dialogId);
			}
		}
		catch (error)
		{
			// the server rejected the stop request: the optimistic state is already
			// cleared, chat-load and pull will restore the truth
			Logger.error('CopilotManager: stopGeneration failed', error);
		}
	}

	stopCopilotTyping(dialogId: string, expectedInputActions: ?ImModelInputActions = null): void
	{
		const inputActions = this.store.getters['chats/inputActions/getByDialogId'](dialogId);
		if (!inputActions)
		{
			return;
		}

		inputActions.forEach((inputAction) => {
			if (expectedInputActions !== null && !expectedInputActions.includes(inputAction))
			{
				return;
			}

			const { type, userId } = inputAction;
			if (type !== InputAction.writing || !this.isCopilotBot(userId))
			{
				return;
			}

			InputActionListener.getInstance().stopAction({ dialogId, userId });
		});
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

	isProcessingMessage(messageId: number): boolean
	{
		const message = this.store.getters['messages/getById'](messageId);

		return message?.componentParams?.copilotProcess === true;
	}

	isErrorMessage(messageId: number): boolean
	{
		const message: ?ImModelMessage = this.store.getters['messages/getById'](messageId);

		return message?.componentParams?.copilotError === true;
	}

	isMessageFooterAvailable(messageId: number): boolean
	{
		return !this.isProcessingMessage(messageId) && !this.isErrorMessage(messageId);
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
