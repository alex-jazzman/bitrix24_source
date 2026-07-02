import { type Store } from 'ui.vue3.vuex';
import { Core } from 'im.v2.application.core';
import { LocalStorageKey, RecentType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { DraftManager } from 'im.v2.lib.draft';
import { Logger } from 'im.v2.lib.logger';
import { ChatService } from 'im.v2.provider.service.chat';
import { CopilotChatService, CopilotRecentService } from 'im.v2.provider.service.copilot';

export class WidgetChatManager
{
	static #instance: WidgetChatManager;

	#store: Store;
	#chatService: ChatService;
	#copilotChatService: CopilotChatService;
	#copilotRecentService: CopilotRecentService;

	static getInstance(): WidgetChatManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	constructor()
	{
		this.#store = Core.getStore();
		this.#chatService = new ChatService();
		this.#copilotChatService = new CopilotChatService();
		this.#copilotRecentService = new CopilotRecentService();
	}

	async resolveInitialChat(): Promise<string>
	{
		const savedDialogId = this.#getSavedDialogId();
		if (savedDialogId && await this.loadChat(savedDialogId))
		{
			return savedDialogId;
		}

		return this.#openFallbackChat();
	}

	async loadChat(dialogId: string): Promise<boolean>
	{
		this.#saveDialogId(dialogId);

		const existingDialog = this.#store.getters['chats/get'](dialogId);
		if (existingDialog?.inited)
		{
			Logger.warn(`WidgetChatManager: chat ${existingDialog.chatId} is already loaded`);

			return true;
		}

		Logger.warn(`WidgetChatManager: loading chat ${dialogId}`);
		try
		{
			await this.#chatService.loadChatWithMessages(dialogId);
			Logger.warn(`WidgetChatManager: chat ${dialogId} is loaded`);
		}
		catch (error)
		{
			Logger.warn(`WidgetChatManager: error loading chat ${dialogId}`, error);
			this.#removeSavedDialogId();

			return false;
		}

		this.#sendOpenChatAnalytics(dialogId);

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
		this.#saveDialogId(newDialogId);

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
		return `im-v2-copilot-widget-${LocalStorageKey.copilotWidgetLastDialogId}`;
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

	setRecentDraftText(dialogId?: string): void
	{
		if (!dialogId)
		{
			return;
		}

		DraftManager.getInstance().setRecentDraftText(dialogId);
	}

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
