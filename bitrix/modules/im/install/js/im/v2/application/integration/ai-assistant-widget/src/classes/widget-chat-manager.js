import { type Store } from 'ui.vue3.vuex';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { ChatType, EventType, LocalStorageKey, RecentType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { Analytics } from 'im.v2.lib.analytics';
import { DraftManager } from 'im.v2.lib.draft';
import { Logger } from 'im.v2.lib.logger';
import { NotifierShowMessageAction } from 'im.v2.lib.message-notifier';
import { ChatService } from 'im.v2.provider.service.chat';
import { CopilotChatService, CopilotRecentService } from 'im.v2.provider.service.copilot';
import { SendingService } from 'im.v2.provider.service.sending';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

export class WidgetChatManager extends EventEmitter
{
	static #instance: WidgetChatManager;

	static events = {
		onDialogIdChange: 'onDialogIdChange',
	};

	#store: Store;
	#chatService: ChatService;
	#copilotChatService: CopilotChatService;
	#copilotRecentService: CopilotRecentService;
	#currentDialogId: ?string = null;
	#isBitrixGptMode: boolean;

	static getInstance(): WidgetChatManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	get isBitrixGptMode(): boolean
	{
		return this.#isBitrixGptMode;
	}

	constructor()
	{
		super();
		this.setEventNamespace('BX.Im.AiAssistantWidget.WidgetChatManager');

		this.#store = Core.getStore();
		this.#chatService = new ChatService();
		this.#copilotChatService = new CopilotChatService();
		this.#copilotRecentService = new CopilotRecentService();
		this.#isBitrixGptMode = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
			&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable)
			&& FeatureManager.isFeatureAvailable(Feature.copilotActive);
	}

	async changeDialog(dialogId: string): Promise<boolean>
	{
		if (!this.#isBitrixGptMode)
		{
			Logger.warn(`WidgetChatManager: changeDialog(${dialogId}) ignored: not in bitrixGpt mode`);

			return false;
		}

		if (!await this.#isCandidateBitrixGptChat(dialogId))
		{
			Logger.warn(`WidgetChatManager: ${dialogId} is not a bitrixGpt chat, changeDialog aborted`);

			return false;
		}

		return this.loadChat(dialogId);
	}

	#setCurrentDialogId(dialogId: ?string): void
	{
		if (this.#currentDialogId === dialogId)
		{
			return;
		}

		this.#currentDialogId = dialogId;
		this.emit(WidgetChatManager.events.onDialogIdChange, { dialogId });
	}

	async resolveInitialChat(candidateDialogId: ?string = null): Promise<?string>
	{
		if (this.#currentDialogId)
		{
			return this.#currentDialogId;
		}

		if (candidateDialogId
			&& await this.#isCandidateBitrixGptChat(candidateDialogId)
			&& await this.loadChat(candidateDialogId))
		{
			return candidateDialogId;
		}

		const savedDialogId = this.#getSavedDialogId();
		if (savedDialogId && await this.loadChat(savedDialogId))
		{
			return savedDialogId;
		}

		return this.#openFallbackChat();
	}

	async #isCandidateBitrixGptChat(dialogId: string): Promise<boolean>
	{
		let chat = this.#store.getters['chats/get'](dialogId);
		if (!chat)
		{
			try
			{
				await this.#chatService.loadChat(dialogId);
			}
			catch
			{
				return false;
			}
			chat = this.#store.getters['chats/get'](dialogId);
		}

		return this.#isBitrixGptChat(chat);
	}

	#isBitrixGptChat(chat: ?ImModelChat): boolean
	{
		return chat?.type === ChatType.copilot;
	}

	async loadChat(dialogId: string): Promise<boolean>
	{
		const existingDialog = this.#store.getters['chats/get'](dialogId);
		if (existingDialog?.inited)
		{
			Logger.warn(`WidgetChatManager: chat ${existingDialog.chatId} is already loaded`);
		}
		else
		{
			Logger.warn(`WidgetChatManager: loading chat ${dialogId}`);
			try
			{
				await this.#chatService.loadChatWithMessages(dialogId);
				Logger.warn(`WidgetChatManager: chat ${dialogId} is loaded`);
			}
			catch (error)
			{
				Logger.warn(`WidgetChatManager: error loading chat ${dialogId}`, error);

				return false;
			}

			this.#sendOpenChatAnalytics(dialogId);
		}

		this.#setCurrentDialogId(dialogId);
		this.#saveDialogId(dialogId);
		void this.#store.dispatch('copilot/setWidgetDialogId', dialogId);

		return true;
	}

	async selectAndOpenChat(dialogId: string, previousDialogId?: string): Promise<?string>
	{
		if (await this.loadChat(dialogId))
		{
			return dialogId;
		}

		Logger.warn(`WidgetChatManager: failed to open chat ${dialogId}`);

		return this.#openFallbackChat();
	}

	async createNewChat(): Promise<string>
	{
		const newDialogId = await this.#copilotChatService.createDefaultChat();

		Analytics.getInstance().copilot.onCreateChatFromWidget(newDialogId);
		Analytics.getInstance().ignoreNextChatOpen(newDialogId);

		this.#setCurrentDialogId(newDialogId);
		this.#saveDialogId(newDialogId);
		void this.#store.dispatch('copilot/setWidgetDialogId', newDialogId);

		return newDialogId;
	}

	async #openFallbackChat(): Promise<?string>
	{
		const firstRecentDialogId = await this.#getFirstRecentDialogId();
		if (firstRecentDialogId && await this.loadChat(firstRecentDialogId))
		{
			return firstRecentDialogId;
		}

		return this.createNewChat();
	}

	#getSavedDialogId(): ?string
	{
		try
		{
			return JSON.parse(sessionStorage.getItem(this.#buildStorageKey()));
		}
		catch
		{
			return null;
		}
	}

	#saveDialogId(dialogId: string): void
	{
		sessionStorage.setItem(this.#buildStorageKey(), JSON.stringify(dialogId));
	}

	#removeSavedDialogId(): void
	{
		sessionStorage.removeItem(this.#buildStorageKey());
	}

	#buildStorageKey(): string
	{
		const storageKeyPrefix = this.#isBitrixGptMode ? 'im-ai-assistant' : 'im-ai-marta';

		return `${storageKeyPrefix}-widget-${LocalStorageKey.copilotWidgetLastDialogId}`;
	}

	async #getFirstRecentDialogId(): Promise<?string>
	{
		await this.#copilotRecentService.loadFirstPage();

		const recentItems = this.#store.getters['recent/getSortedCollection']({ type: RecentType.copilot });
		if (recentItems.length === 0)
		{
			return null;
		}

		return recentItems[0].dialogId;
	}

	subscribeNotifier(): void
	{
		EventEmitter.subscribe(EventType.notifier.onBeforeShowMessage, this.#onBeforeNotificationShow);
	}

	unsubscribeNotifier(): void
	{
		EventEmitter.unsubscribe(EventType.notifier.onBeforeShowMessage, this.#onBeforeNotificationShow);
	}

	clearWidgetState(): void
	{
		this.#setCurrentDialogId(null);
		void this.#store.dispatch('copilot/setWidgetDialogId', '');
	}

	sendSuggestion(text: string): void
	{
		if (!text || !this.#currentDialogId)
		{
			return;
		}

		void SendingService.getInstance().sendMessage({ text, dialogId: this.#currentDialogId });
	}

	setRecentDraftText(dialogId?: string): void
	{
		if (!dialogId)
		{
			return;
		}

		DraftManager.getInstance().setRecentDraftText(dialogId);
	}

	#onBeforeNotificationShow = (event: BaseEvent<{ dialogId: string }>): $Values<typeof NotifierShowMessageAction> => {
		const eventData = event.getData();
		const currentDialogId = this.#currentDialogId;
		if (eventData.dialogId !== currentDialogId)
		{
			return NotifierShowMessageAction.show;
		}

		return NotifierShowMessageAction.skip;
	};

	#sendOpenChatAnalytics(dialogId: string): void
	{
		const dialog = this.#store.getters['chats/get'](dialogId);
		if (!dialog)
		{
			return;
		}

		Analytics.getInstance().aiAssistant.onOpenWidget(dialog);
		Analytics.getInstance().aiAssistant.onOpenChatAI(dialog, true);
	}
}
