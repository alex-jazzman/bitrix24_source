import { type Store } from 'ui.vue3.vuex';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { ChatType, EventType, LocalStorageKey, RecentType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { BeforeSendMessageAction } from 'im.v2.component.textarea';
import { Analytics } from 'im.v2.lib.analytics';
import { CopilotManager } from 'im.v2.lib.copilot';
import { DraftManager } from 'im.v2.lib.draft';
import { Logger } from 'im.v2.lib.logger';
import { NotifierShowMessageAction } from 'im.v2.lib.message-notifier';
import { Notifier } from 'im.v2.lib.notifier';
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
	#copilotManager: CopilotManager;
	#currentDialogId: ?string = null;
	#draftDialogId: ?string = null;
	#draftRealDialogId: ?string = null;
	#draftOperationId: ?number = null;
	#isPromotingDraft: boolean = false;
	#isRecoveringDraft: boolean = false;
	#isDraftFailureNotified: boolean = false;
	#isInterceptingFirstMessage: boolean = false;
	#isBitrixGptMode: boolean;
	#navigationGeneration: number = 0;

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
		this.#copilotManager = new CopilotManager();
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
		const operationId = this.#startNavigationOperation();
		let isLoaded = false;
		try
		{
			if (!await this.#isCandidateBitrixGptChat(dialogId, operationId))
			{
				Logger.warn(`WidgetChatManager: ${dialogId} is not a bitrixGpt chat, changeDialog aborted`);

				return false;
			}

			if (!this.#isCurrentNavigationOperation(operationId))
			{
				return false;
			}

			isLoaded = await this.#loadChat(dialogId, operationId);

			return isLoaded;
		}
		finally
		{
			if (!isLoaded)
			{
				this.#restoreDraftOperation(operationId);
			}
		}
	}

	#startNavigationOperation(): number
	{
		this.#navigationGeneration += 1;

		return this.#navigationGeneration;
	}

	#isCurrentNavigationOperation(operationId: ?number): boolean
	{
		return operationId === this.#navigationGeneration;
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

		const operationId = this.#startNavigationOperation();

		if (candidateDialogId
			&& await this.#isCandidateBitrixGptChat(candidateDialogId, operationId)
			&& await this.#loadChat(candidateDialogId, operationId))
		{
			return candidateDialogId;
		}

		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return null;
		}

		const savedDialogId = this.#getSavedDialogId();
		if (savedDialogId && await this.#loadChat(savedDialogId, operationId))
		{
			return savedDialogId;
		}

		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return null;
		}

		if (FeatureManager.isFeatureAvailable(Feature.isCopilotDraftChatAvailable))
		{
			return this.#startDraftChat(operationId);
		}

		return this.#openFallbackChat(operationId);
	}

	startDraftChat(): string
	{
		return this.#startDraftChat(this.#startNavigationOperation());
	}

	#startDraftChat(operationId: number): string
	{
		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return '';
		}

		this.#disposeDraftChat();

		const tempDialogId = this.#copilotManager.draftChatCreate();
		if (!tempDialogId)
		{
			return '';
		}

		this.#isPromotingDraft = false;
		this.#isRecoveringDraft = false;
		this.#isDraftFailureNotified = false;
		this.#draftRealDialogId = null;
		this.#draftDialogId = tempDialogId;
		this.#draftOperationId = operationId;
		void this.#captureDraftRealDialogId(tempDialogId, operationId);
		this.#subscribeFirstMessageInterceptor();
		this.#setCurrentDialogId(tempDialogId);
		void this.#store.dispatch('copilot/setWidgetDialogId', tempDialogId);

		return tempDialogId;
	}

	async #captureDraftRealDialogId(tempDialogId: string, operationId: number): Promise<void>
	{
		let realDialogId: ?string = null;
		try
		{
			realDialogId = await this.getDraftRealPromise();
		}
		catch
		{
			realDialogId = null;
		}

		if (realDialogId && this.#isOwnedDraft(tempDialogId))
		{
			this.#draftRealDialogId = realDialogId;
		}

		if (!this.#isCurrentDraft(tempDialogId, operationId))
		{
			return;
		}

		if (!realDialogId)
		{
			await this.#recoverDraftChat(tempDialogId, operationId);

			return;
		}

	}

	async #recoverDraftChat(tempDialogId: string, operationId: number): Promise<void>
	{
		if (!this.#isCurrentDraft(tempDialogId, operationId) || this.#isRecoveringDraft)
		{
			return;
		}

		this.#isRecoveringDraft = true;
		if (!this.#isDraftFailureNotified)
		{
			this.#isDraftFailureNotified = true;
			Notifier.onDefaultError();
		}

		try
		{
			await this.#openFallbackChat(operationId, false);
		}
		catch (error)
		{
			Logger.warn('WidgetChatManager: failed to recover the draft chat', error);
		}
		finally
		{
			if (this.#isCurrentDraft(tempDialogId, operationId))
			{
				this.#isRecoveringDraft = false;
			}
		}
	}

	#isCurrentDraft(tempDialogId: ?string, operationId: ?number = this.#draftOperationId): boolean
	{
		return this.#isOwnedDraft(tempDialogId)
			&& operationId === this.#draftOperationId
			&& this.#isCurrentNavigationOperation(operationId);
	}

	#isOwnedDraft(tempDialogId: ?string): boolean
	{
		return Boolean(tempDialogId)
			&& this.#draftDialogId === tempDialogId
			&& this.#currentDialogId === tempDialogId;
	}

	#restoreDraftOperation(operationId: number): void
	{
		if (!this.#isCurrentNavigationOperation(operationId)
			|| !this.#draftDialogId
			|| this.#currentDialogId !== this.#draftDialogId)
		{
			return;
		}

		this.#draftOperationId = operationId;
		this.#isPromotingDraft = false;
		this.#isRecoveringDraft = false;
		if (!this.#draftRealDialogId)
		{
			void this.#captureDraftRealDialogId(this.#draftDialogId, operationId);
		}
	}

	#claimDraftOperation(): ?number
	{
		if (!this.#draftDialogId || this.#currentDialogId !== this.#draftDialogId)
		{
			return null;
		}

		if (!this.#isCurrentNavigationOperation(this.#draftOperationId) || this.#isRecoveringDraft)
		{
			this.#draftOperationId = this.#startNavigationOperation();
			this.#isPromotingDraft = false;
			this.#isRecoveringDraft = false;
		}

		return this.#draftOperationId;
	}

	getDraftRealPromise(): ?Promise<?string>
	{
		return this.#copilotManager.draftChatGetRealPromise();
	}

	hasActiveDraft(): boolean
	{
		return Boolean(this.#draftDialogId);
	}

	// stable draft key for the start-screen textarea, not the temp dialog id
	getEmptyStateDraftDialogId(): string
	{
		return `bgpt-widget-empty-state-${Core.getSiteId()}-${Core.getUserId()}`;
	}

	disposeDraftChat(): void
	{
		this.#startNavigationOperation();
		this.#disposeDraftChat();
	}

	#disposeDraftChat(clearCurrentDialog: boolean = true): void
	{
		const tempDialogId = this.#draftDialogId;
		if (!tempDialogId)
		{
			return;
		}

		this.#draftDialogId = null;
		this.#draftRealDialogId = null;
		this.#draftOperationId = null;
		this.#isPromotingDraft = false;
		this.#isRecoveringDraft = false;
		this.#isDraftFailureNotified = false;
		this.#unsubscribeFirstMessageInterceptor();
		this.#copilotManager.draftChatDispose();
		if (clearCurrentDialog && this.#currentDialogId === tempDialogId)
		{
			this.#setCurrentDialogId(null);
			void this.#store.dispatch('copilot/setWidgetDialogId', '');
		}
	}

	async sendFirstMessage(text: string): Promise<boolean>
	{
		const tempDialogId = this.#draftDialogId;
		const operationId = this.#claimDraftOperation();
		if (!this.#isCurrentDraft(tempDialogId, operationId)
			|| this.#isPromotingDraft
			|| this.#isRecoveringDraft)
		{
			return false;
		}

		this.#isPromotingDraft = true;
		let promoted = false;
		try
		{
			const draftRealPromise = this.#isDraftFailureNotified
				? this.#copilotManager.draftChatRetryGetReal()
				: this.getDraftRealPromise();
			const realDialogId = await draftRealPromise?.catch(() => null);
			if (!this.#isCurrentDraft(tempDialogId, operationId))
			{
				return false;
			}

			if (!realDialogId)
			{
				await this.#recoverDraftChat(tempDialogId, operationId);

				return false;
			}

			void SendingService.getInstance().sendMessage({ text, dialogId: realDialogId });
			// let CopilotWidgetChatContent animate the start-screen → chat reveal for this send only
			void this.#store.dispatch('copilot/setSentChatDialogId', realDialogId);
			this.#finishDraftPromotion(realDialogId);
			this.#clearEmptyStateDraft();
			promoted = true;
			this.#sendCreateAnalytics(realDialogId);

			return true;
		}
		finally
		{
			// A late send must not release the promotion guard of a newer draft.
			if (!promoted && this.#isCurrentDraft(tempDialogId, operationId))
			{
				this.#isPromotingDraft = false;
			}
		}
	}

	promoteDraftChat(dialogId: string): void
	{
		if (!dialogId || dialogId !== this.#draftRealDialogId)
		{
			return;
		}

		const operationId = this.#draftOperationId;
		if (!this.#isCurrentDraft(this.#draftDialogId, operationId)
			|| this.#isPromotingDraft)
		{
			return;
		}

		this.#isPromotingDraft = true;
		void this.#store.dispatch('copilot/setSentChatDialogId', dialogId);
		this.#finishDraftPromotion(dialogId);
		this.#sendCreateAnalytics(dialogId);
	}

	#finishDraftPromotion(dialogId: string): void
	{
		this.#draftDialogId = null;
		this.#draftRealDialogId = null;
		this.#draftOperationId = null;
		this.#isRecoveringDraft = false;
		this.#isDraftFailureNotified = false;
		this.#unsubscribeFirstMessageInterceptor();
		this.#setCurrentDialogId(dialogId);
		this.#saveDialogId(dialogId);
		void this.#store.dispatch('copilot/setWidgetDialogId', dialogId);

		// release the promoted draft's CopilotManager state (its background fetch already
		// resolved) so the next startDraftChat mints a fresh temp id and real-chat promise
		this.#copilotManager.draftChatDispose();
	}

	#clearEmptyStateDraft(): void
	{
		const draftKey = this.getEmptyStateDraftDialogId();
		const draftManager = DraftManager.getInstance();
		// empty write schedules the storage removal; clearDraft drops the in-memory copy
		draftManager.setDraftText(draftKey, '');
		draftManager.clearDraft(draftKey);
	}

	#sendCreateAnalytics(dialogId: string): void
	{
		Analytics.getInstance().copilot.onCreateChatFromWidget(dialogId);
		Analytics.getInstance().ignoreNextChatOpen(dialogId);
	}

	#subscribeFirstMessageInterceptor(): void
	{
		if (this.#isInterceptingFirstMessage)
		{
			return;
		}

		EventEmitter.subscribe(EventType.textarea.onBeforeSendMessage, this.#onBeforeSendFirstMessage);
		this.#isInterceptingFirstMessage = true;
	}

	#unsubscribeFirstMessageInterceptor(): void
	{
		if (!this.#isInterceptingFirstMessage)
		{
			return;
		}

		EventEmitter.unsubscribe(EventType.textarea.onBeforeSendMessage, this.#onBeforeSendFirstMessage);
		this.#isInterceptingFirstMessage = false;
	}

	#onBeforeSendFirstMessage = async (event: BaseEvent<{ dialogId: string, text: string }>): Promise<string> => {
		const { dialogId, text } = event.getData();
		if (dialogId !== this.#draftDialogId && dialogId !== this.#draftRealDialogId)
		{
			return BeforeSendMessageAction.proceed;
		}

		const isPromoted = await this.sendFirstMessage(text);

		return isPromoted ? BeforeSendMessageAction.cancel : BeforeSendMessageAction.cancelKeepText;
	};

	async #isCandidateBitrixGptChat(dialogId: string, operationId: number): Promise<boolean>
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

			if (!this.#isCurrentNavigationOperation(operationId))
			{
				return false;
			}
			chat = this.#store.getters['chats/get'](dialogId);
		}

		return this.#isCurrentNavigationOperation(operationId) && this.#isBitrixGptChat(chat);
	}

	#isBitrixGptChat(chat: ?ImModelChat): boolean
	{
		return chat?.type === ChatType.copilot;
	}

	async loadChat(dialogId: string): Promise<boolean>
	{
		const operationId = this.#startNavigationOperation();
		let isLoaded = false;
		try
		{
			isLoaded = await this.#loadChat(dialogId, operationId);

			return isLoaded;
		}
		finally
		{
			if (!isLoaded)
			{
				this.#restoreDraftOperation(operationId);
			}
		}
	}

	async #loadChat(dialogId: string, operationId: number): Promise<boolean>
	{
		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return false;
		}

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

			if (!this.#isCurrentNavigationOperation(operationId))
			{
				return false;
			}
		}

		if (!this.#activateDialog(dialogId, operationId))
		{
			return false;
		}

		if (!existingDialog?.inited)
		{
			this.#sendOpenChatAnalytics(dialogId);
		}

		return true;
	}

	#activateDialog(dialogId: string, operationId: number): boolean
	{
		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return false;
		}

		this.#disposeDraftChat(false);
		// navigation, not a send: drop the sent-chat mark so a plain open never animates
		void this.#store.dispatch('copilot/setSentChatDialogId', '');
		this.#setCurrentDialogId(dialogId);
		this.#saveDialogId(dialogId);
		void this.#store.dispatch('copilot/setWidgetDialogId', dialogId);

		return true;
	}

	async selectAndOpenChat(dialogId: string, previousDialogId?: string): Promise<?string>
	{
		const operationId = this.#startNavigationOperation();
		let openedDialogId: ?string = null;
		try
		{
			openedDialogId = await this.#selectAndOpenChat(dialogId, operationId);

			return openedDialogId;
		}
		finally
		{
			if (!openedDialogId)
			{
				this.#restoreDraftOperation(operationId);
			}
		}
	}

	async #selectAndOpenChat(dialogId: string, operationId: number): Promise<?string>
	{
		if (await this.#loadChat(dialogId, operationId))
		{
			return dialogId;
		}

		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return null;
		}

		Logger.warn(`WidgetChatManager: failed to open chat ${dialogId}`);

		return this.#openFallbackChat(operationId);
	}

	async createNewChat(): Promise<string>
	{
		const operationId = this.#startNavigationOperation();
		let newDialogId = '';
		try
		{
			newDialogId = await this.#createNewChat(operationId);

			return newDialogId;
		}
		finally
		{
			if (!newDialogId)
			{
				this.#restoreDraftOperation(operationId);
			}
		}
	}

	async #createNewChat(operationId: number): Promise<string>
	{
		const newDialogId = await this.#copilotChatService.createDefaultChat();
		if (!newDialogId || !this.#isCurrentNavigationOperation(operationId))
		{
			return '';
		}

		this.#sendCreateAnalytics(newDialogId);
		this.#activateDialog(newDialogId, operationId);

		return newDialogId;
	}

	async #openFallbackChat(operationId: number, createIfMissing: boolean = true): Promise<?string>
	{
		const firstRecentDialogId = await this.#getFirstRecentDialogId(operationId);
		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return null;
		}

		if (firstRecentDialogId && await this.#loadChat(firstRecentDialogId, operationId))
		{
			return firstRecentDialogId;
		}

		if (!this.#isCurrentNavigationOperation(operationId) || !createIfMissing)
		{
			return null;
		}

		return this.#createNewChat(operationId);
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

	async #getFirstRecentDialogId(operationId: number): Promise<?string>
	{
		await this.#copilotRecentService.loadFirstPage();
		if (!this.#isCurrentNavigationOperation(operationId))
		{
			return null;
		}

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
		this.#startNavigationOperation();
		this.#disposeDraftChat();
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
