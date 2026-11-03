/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_css_tokens, im_v2_application_core, im_v2_lib_utils, main_core_events, im_v2_const, im_v2_component_textarea, im_v2_lib_analytics, im_v2_lib_copilot, im_v2_lib_draft, im_v2_lib_logger, im_v2_lib_messageNotifier, im_v2_lib_notifier, im_v2_provider_service_chat, im_v2_provider_service_copilot, im_v2_provider_service_sending, im_v2_lib_feature, im_v2_css_classes, im_v2_lib_init, im_v2_component_animation, im_v2_component_content_chat, im_v2_component_dialog_chat, im_v2_lib_theme, ui_iconSet_api_vue, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_component_list_container_aiAssistant, im_v2_component_content_elements, im_v2_component_list_items_copilot) {
	'use strict';

	class WidgetChatManager extends main_core_events.EventEmitter {
		static #instance;
		static events = {
			onDialogIdChange: 'onDialogIdChange'
		};
		#store;
		#chatService;
		#copilotChatService;
		#copilotRecentService;
		#copilotManager;
		#currentDialogId = null;
		#draftDialogId = null;
		#draftRealDialogId = null;
		#draftOperationId = null;
		#isPromotingDraft = false;
		#isRecoveringDraft = false;
		#isDraftFailureNotified = false;
		#isInterceptingFirstMessage = false;
		#isBitrixGptMode;
		#navigationGeneration = 0;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		get isBitrixGptMode() {
			return this.#isBitrixGptMode;
		}
		constructor() {
			super();
			this.setEventNamespace('BX.Im.AiAssistantWidget.WidgetChatManager');
			this.#store = im_v2_application_core.Core.getStore();
			this.#chatService = new im_v2_provider_service_chat.ChatService();
			this.#copilotChatService = new im_v2_provider_service_copilot.CopilotChatService();
			this.#copilotRecentService = new im_v2_provider_service_copilot.CopilotRecentService();
			this.#copilotManager = new im_v2_lib_copilot.CopilotManager();
			this.#isBitrixGptMode = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive);
		}
		async changeDialog(dialogId) {
			if (!this.#isBitrixGptMode) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: changeDialog(${dialogId}) ignored: not in bitrixGpt mode`);
				return false;
			}
			const operationId = this.#startNavigationOperation();
			let isLoaded = false;
			try {
				if (!(await this.#isCandidateBitrixGptChat(dialogId, operationId))) {
					im_v2_lib_logger.Logger.warn(`WidgetChatManager: ${dialogId} is not a bitrixGpt chat, changeDialog aborted`);
					return false;
				}
				if (!this.#isCurrentNavigationOperation(operationId)) {
					return false;
				}
				isLoaded = await this.#loadChat(dialogId, operationId);
				return isLoaded;
			} finally {
				if (!isLoaded) {
					this.#restoreDraftOperation(operationId);
				}
			}
		}
		#startNavigationOperation() {
			this.#navigationGeneration += 1;
			return this.#navigationGeneration;
		}
		#isCurrentNavigationOperation(operationId) {
			return operationId === this.#navigationGeneration;
		}
		#setCurrentDialogId(dialogId) {
			if (this.#currentDialogId === dialogId) {
				return;
			}
			this.#currentDialogId = dialogId;
			this.emit(WidgetChatManager.events.onDialogIdChange, {
				dialogId
			});
		}
		async resolveInitialChat(candidateDialogId = null) {
			if (this.#currentDialogId) {
				return this.#currentDialogId;
			}
			const operationId = this.#startNavigationOperation();
			if (candidateDialogId && (await this.#isCandidateBitrixGptChat(candidateDialogId, operationId)) && (await this.#loadChat(candidateDialogId, operationId))) {
				return candidateDialogId;
			}
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return null;
			}
			const savedDialogId = this.#getSavedDialogId();
			if (savedDialogId && (await this.#loadChat(savedDialogId, operationId))) {
				return savedDialogId;
			}
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return null;
			}
			if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable)) {
				return this.#startDraftChat(operationId);
			}
			return this.#openFallbackChat(operationId);
		}
		startDraftChat() {
			return this.#startDraftChat(this.#startNavigationOperation());
		}
		#startDraftChat(operationId) {
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return '';
			}
			this.#disposeDraftChat();
			const tempDialogId = this.#copilotManager.draftChatCreate();
			if (!tempDialogId) {
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
		async #captureDraftRealDialogId(tempDialogId, operationId) {
			let realDialogId = null;
			try {
				realDialogId = await this.getDraftRealPromise();
			} catch {
				realDialogId = null;
			}
			if (realDialogId && this.#isOwnedDraft(tempDialogId)) {
				this.#draftRealDialogId = realDialogId;
			}
			if (!this.#isCurrentDraft(tempDialogId, operationId)) {
				return;
			}
			if (!realDialogId) {
				await this.#recoverDraftChat(tempDialogId, operationId);
				return;
			}
		}
		async #recoverDraftChat(tempDialogId, operationId) {
			if (!this.#isCurrentDraft(tempDialogId, operationId) || this.#isRecoveringDraft) {
				return;
			}
			this.#isRecoveringDraft = true;
			if (!this.#isDraftFailureNotified) {
				this.#isDraftFailureNotified = true;
				im_v2_lib_notifier.Notifier.onDefaultError();
			}
			try {
				await this.#openFallbackChat(operationId, false);
			} catch (error) {
				im_v2_lib_logger.Logger.warn('WidgetChatManager: failed to recover the draft chat', error);
			} finally {
				if (this.#isCurrentDraft(tempDialogId, operationId)) {
					this.#isRecoveringDraft = false;
				}
			}
		}
		#isCurrentDraft(tempDialogId, operationId = this.#draftOperationId) {
			return this.#isOwnedDraft(tempDialogId) && operationId === this.#draftOperationId && this.#isCurrentNavigationOperation(operationId);
		}
		#isOwnedDraft(tempDialogId) {
			return Boolean(tempDialogId) && this.#draftDialogId === tempDialogId && this.#currentDialogId === tempDialogId;
		}
		#restoreDraftOperation(operationId) {
			if (!this.#isCurrentNavigationOperation(operationId) || !this.#draftDialogId || this.#currentDialogId !== this.#draftDialogId) {
				return;
			}
			this.#draftOperationId = operationId;
			this.#isPromotingDraft = false;
			this.#isRecoveringDraft = false;
			if (!this.#draftRealDialogId) {
				void this.#captureDraftRealDialogId(this.#draftDialogId, operationId);
			}
		}
		#claimDraftOperation() {
			if (!this.#draftDialogId || this.#currentDialogId !== this.#draftDialogId) {
				return null;
			}
			if (!this.#isCurrentNavigationOperation(this.#draftOperationId) || this.#isRecoveringDraft) {
				this.#draftOperationId = this.#startNavigationOperation();
				this.#isPromotingDraft = false;
				this.#isRecoveringDraft = false;
			}
			return this.#draftOperationId;
		}
		getDraftRealPromise() {
			return this.#copilotManager.draftChatGetRealPromise();
		}
		hasActiveDraft() {
			return Boolean(this.#draftDialogId);
		}

		// stable draft key for the start-screen textarea, not the temp dialog id
		getEmptyStateDraftDialogId() {
			return `bgpt-widget-empty-state-${im_v2_application_core.Core.getSiteId()}-${im_v2_application_core.Core.getUserId()}`;
		}
		disposeDraftChat() {
			this.#startNavigationOperation();
			this.#disposeDraftChat();
		}
		#disposeDraftChat(clearCurrentDialog = true) {
			const tempDialogId = this.#draftDialogId;
			if (!tempDialogId) {
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
			if (clearCurrentDialog && this.#currentDialogId === tempDialogId) {
				this.#setCurrentDialogId(null);
				void this.#store.dispatch('copilot/setWidgetDialogId', '');
			}
		}
		async sendFirstMessage(text) {
			const tempDialogId = this.#draftDialogId;
			const operationId = this.#claimDraftOperation();
			if (!this.#isCurrentDraft(tempDialogId, operationId) || this.#isPromotingDraft || this.#isRecoveringDraft) {
				return false;
			}
			this.#isPromotingDraft = true;
			let promoted = false;
			try {
				const draftRealPromise = this.#isDraftFailureNotified ? this.#copilotManager.draftChatRetryGetReal() : this.getDraftRealPromise();
				const realDialogId = await draftRealPromise?.catch(() => null);
				if (!this.#isCurrentDraft(tempDialogId, operationId)) {
					return false;
				}
				if (!realDialogId) {
					await this.#recoverDraftChat(tempDialogId, operationId);
					return false;
				}
				void im_v2_provider_service_sending.SendingService.getInstance().sendMessage({
					text,
					dialogId: realDialogId
				});
				// let CopilotWidgetChatContent animate the start-screen → chat reveal for this send only
				void this.#store.dispatch('copilot/setSentChatDialogId', realDialogId);
				this.#finishDraftPromotion(realDialogId);
				this.#clearEmptyStateDraft();
				promoted = true;
				this.#sendCreateAnalytics(realDialogId);
				return true;
			} finally {
				// A late send must not release the promotion guard of a newer draft.
				if (!promoted && this.#isCurrentDraft(tempDialogId, operationId)) {
					this.#isPromotingDraft = false;
				}
			}
		}
		promoteDraftChat(dialogId) {
			if (!dialogId || dialogId !== this.#draftRealDialogId) {
				return;
			}
			const operationId = this.#draftOperationId;
			if (!this.#isCurrentDraft(this.#draftDialogId, operationId) || this.#isPromotingDraft) {
				return;
			}
			this.#isPromotingDraft = true;
			void this.#store.dispatch('copilot/setSentChatDialogId', dialogId);
			this.#finishDraftPromotion(dialogId);
			this.#sendCreateAnalytics(dialogId);
		}
		#finishDraftPromotion(dialogId) {
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
		#clearEmptyStateDraft() {
			const draftKey = this.getEmptyStateDraftDialogId();
			const draftManager = im_v2_lib_draft.DraftManager.getInstance();
			// empty write schedules the storage removal; clearDraft drops the in-memory copy
			draftManager.setDraftText(draftKey, '');
			draftManager.clearDraft(draftKey);
		}
		#sendCreateAnalytics(dialogId) {
			im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChatFromWidget(dialogId);
			im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(dialogId);
		}
		#subscribeFirstMessageInterceptor() {
			if (this.#isInterceptingFirstMessage) {
				return;
			}
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.#onBeforeSendFirstMessage);
			this.#isInterceptingFirstMessage = true;
		}
		#unsubscribeFirstMessageInterceptor() {
			if (!this.#isInterceptingFirstMessage) {
				return;
			}
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.#onBeforeSendFirstMessage);
			this.#isInterceptingFirstMessage = false;
		}
		#onBeforeSendFirstMessage = async event => {
			const {
				dialogId,
				text
			} = event.getData();
			if (dialogId !== this.#draftDialogId && dialogId !== this.#draftRealDialogId) {
				return im_v2_component_textarea.BeforeSendMessageAction.proceed;
			}
			const isPromoted = await this.sendFirstMessage(text);
			return isPromoted ? im_v2_component_textarea.BeforeSendMessageAction.cancel : im_v2_component_textarea.BeforeSendMessageAction.cancelKeepText;
		};
		async #isCandidateBitrixGptChat(dialogId, operationId) {
			let chat = this.#store.getters['chats/get'](dialogId);
			if (!chat) {
				try {
					await this.#chatService.loadChat(dialogId);
				} catch {
					return false;
				}
				if (!this.#isCurrentNavigationOperation(operationId)) {
					return false;
				}
				chat = this.#store.getters['chats/get'](dialogId);
			}
			return this.#isCurrentNavigationOperation(operationId) && this.#isBitrixGptChat(chat);
		}
		#isBitrixGptChat(chat) {
			return chat?.type === im_v2_const.ChatType.copilot;
		}
		async loadChat(dialogId) {
			const operationId = this.#startNavigationOperation();
			let isLoaded = false;
			try {
				isLoaded = await this.#loadChat(dialogId, operationId);
				return isLoaded;
			} finally {
				if (!isLoaded) {
					this.#restoreDraftOperation(operationId);
				}
			}
		}
		async #loadChat(dialogId, operationId) {
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return false;
			}
			const existingDialog = this.#store.getters['chats/get'](dialogId);
			if (existingDialog?.inited) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: chat ${existingDialog.chatId} is already loaded`);
			} else {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: loading chat ${dialogId}`);
				try {
					await this.#chatService.loadChatWithMessages(dialogId);
					im_v2_lib_logger.Logger.warn(`WidgetChatManager: chat ${dialogId} is loaded`);
				} catch (error) {
					im_v2_lib_logger.Logger.warn(`WidgetChatManager: error loading chat ${dialogId}`, error);
					return false;
				}
				if (!this.#isCurrentNavigationOperation(operationId)) {
					return false;
				}
			}
			if (!this.#activateDialog(dialogId, operationId)) {
				return false;
			}
			if (!existingDialog?.inited) {
				this.#sendOpenChatAnalytics(dialogId);
			}
			return true;
		}
		#activateDialog(dialogId, operationId) {
			if (!this.#isCurrentNavigationOperation(operationId)) {
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
		async selectAndOpenChat(dialogId, previousDialogId) {
			const operationId = this.#startNavigationOperation();
			let openedDialogId = null;
			try {
				openedDialogId = await this.#selectAndOpenChat(dialogId, operationId);
				return openedDialogId;
			} finally {
				if (!openedDialogId) {
					this.#restoreDraftOperation(operationId);
				}
			}
		}
		async #selectAndOpenChat(dialogId, operationId) {
			if (await this.#loadChat(dialogId, operationId)) {
				return dialogId;
			}
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return null;
			}
			im_v2_lib_logger.Logger.warn(`WidgetChatManager: failed to open chat ${dialogId}`);
			return this.#openFallbackChat(operationId);
		}
		async createNewChat() {
			const operationId = this.#startNavigationOperation();
			let newDialogId = '';
			try {
				newDialogId = await this.#createNewChat(operationId);
				return newDialogId;
			} finally {
				if (!newDialogId) {
					this.#restoreDraftOperation(operationId);
				}
			}
		}
		async #createNewChat(operationId) {
			const newDialogId = await this.#copilotChatService.createDefaultChat();
			if (!newDialogId || !this.#isCurrentNavigationOperation(operationId)) {
				return '';
			}
			this.#sendCreateAnalytics(newDialogId);
			this.#activateDialog(newDialogId, operationId);
			return newDialogId;
		}
		async #openFallbackChat(operationId, createIfMissing = true) {
			const firstRecentDialogId = await this.#getFirstRecentDialogId(operationId);
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return null;
			}
			if (firstRecentDialogId && (await this.#loadChat(firstRecentDialogId, operationId))) {
				return firstRecentDialogId;
			}
			if (!this.#isCurrentNavigationOperation(operationId) || !createIfMissing) {
				return null;
			}
			return this.#createNewChat(operationId);
		}
		#getSavedDialogId() {
			try {
				return JSON.parse(sessionStorage.getItem(this.#buildStorageKey()));
			} catch {
				return null;
			}
		}
		#saveDialogId(dialogId) {
			sessionStorage.setItem(this.#buildStorageKey(), JSON.stringify(dialogId));
		}
		#removeSavedDialogId() {
			sessionStorage.removeItem(this.#buildStorageKey());
		}
		#buildStorageKey() {
			const storageKeyPrefix = this.#isBitrixGptMode ? 'im-ai-assistant' : 'im-ai-marta';
			return `${storageKeyPrefix}-widget-${im_v2_const.LocalStorageKey.copilotWidgetLastDialogId}`;
		}
		async #getFirstRecentDialogId(operationId) {
			await this.#copilotRecentService.loadFirstPage();
			if (!this.#isCurrentNavigationOperation(operationId)) {
				return null;
			}
			const recentItems = this.#store.getters['recent/getSortedCollection']({
				type: im_v2_const.RecentType.copilot
			});
			if (recentItems.length === 0) {
				return null;
			}
			return recentItems[0].dialogId;
		}
		subscribeNotifier() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.notifier.onBeforeShowMessage, this.#onBeforeNotificationShow);
		}
		unsubscribeNotifier() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.notifier.onBeforeShowMessage, this.#onBeforeNotificationShow);
		}
		clearWidgetState() {
			this.#startNavigationOperation();
			this.#disposeDraftChat();
			this.#setCurrentDialogId(null);
			void this.#store.dispatch('copilot/setWidgetDialogId', '');
		}
		sendSuggestion(text) {
			if (!text || !this.#currentDialogId) {
				return;
			}
			void im_v2_provider_service_sending.SendingService.getInstance().sendMessage({
				text,
				dialogId: this.#currentDialogId
			});
		}
		setRecentDraftText(dialogId) {
			if (!dialogId) {
				return;
			}
			im_v2_lib_draft.DraftManager.getInstance().setRecentDraftText(dialogId);
		}
		#onBeforeNotificationShow = event => {
			const eventData = event.getData();
			const currentDialogId = this.#currentDialogId;
			if (eventData.dialogId !== currentDialogId) {
				return im_v2_lib_messageNotifier.NotifierShowMessageAction.show;
			}
			return im_v2_lib_messageNotifier.NotifierShowMessageAction.skip;
		};
		#sendOpenChatAnalytics(dialogId) {
			const dialog = this.#store.getters['chats/get'](dialogId);
			if (!dialog) {
				return;
			}
			im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onOpenWidget(dialog);
			im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onOpenChatAI(dialog, true);
		}
	}

	const MINIMIZE_EVENT_NAME$1 = 'IM.AiAssistantWidget:minimize';

	// @vue/component
	const AiAssistantWidgetChatHeader = {
		name: 'AiAssistantWidgetChatHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle,
			AiAssistantCreateChatButton: im_v2_component_list_container_aiAssistant.AiAssistantCreateChatButton
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withListToggle: {
				type: Boolean,
				default: false
			},
			isCreating: {
				type: Boolean,
				default: false
			},
			isStartScreen: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleList', 'createChat'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isInited() {
				return this.dialog.inited;
			},
			isCopilot2026Styles() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			},
			closeIcon() {
				return this.isCopilot2026Styles ? ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_L : ui_iconSet_api_vue.Outline.CROSS_L;
			},
			newChatTitle() {
				return this.loc('IM_AI_ASSISTANT_WIDGET_HEADER_NEW_CHAT');
			},
			subtitle() {
				const isBitrixGptV2Available = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
				const agentName = this.$store.getters['copilot/getAgentName'];
				if (isBitrixGptV2Available && agentName) {
					return agentName;
				}
				return this.loc('IM_CONTENT_AI_ASSISTANT_CHAT_HEADER_TITLE');
			}
		},
		methods: {
			onNewTitleSubmit(newTitle) {
				if (!this.chatService) {
					this.chatService = new im_v2_provider_service_chat.ChatService();
				}
				void this.chatService.renameChat(this.dialogId, newTitle);
			},
			onMinimize() {
				main_core_events.EventEmitter.emit(MINIMIZE_EVENT_NAME$1);
			},
			createChat() {
				im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onChatCreateClick();
				this.$emit('createChat');
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div :class="['bx-im-ai-assistant-chat-header__container', {'--legacy': !isCopilot2026Styles}]">
			<BIcon
				v-if="withListToggle"
				:name="OutlineIcons.RECENT_ITEMS"
				:hoverable="true"
				class="bx-im-ai-assistant-chat-header__back"
				@click="$emit('toggleList')"
			/> 
			<div class="bx-im-ai-assistant-chat-header__avatar">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:contextDialogId="dialogId"
					:size="AvatarSize.L"
				/>
			</div>
			<div class="bx-im-ai-assistant-chat-header__info">
				<ChatTitle v-if="isStartScreen" :dialogId="dialogId" :text="newChatTitle" :withLeftIcon="false"/>
				<EditableChatTitle v-else :dialogId="dialogId" @newTitleSubmit="onNewTitleSubmit"/>
				<div class="bx-im-ai-assistant-chat-header__subtitle">
					{{ subtitle }}
				</div>
			</div>
			<div v-if="isInited && isCopilot2026Styles" class="bx-im-ai-assistant-chat-header__create-chat">
				<AiAssistantCreateChatButton
					:isCreating="isCreating"
					@newChat="createChat"
				/>
			</div>
			<BIcon
				v-if="isInited || isStartScreen"
				:name="closeIcon"
				:hoverable="true"
				:title="loc('IM_AI_ASSISTANT_WIDGET_MINIMIZE')"
				data-testid="ai-assistant-widget-minimize-button"
				class="bx-im-ai-assistant-chat-header__icon"
				@click="onMinimize"
			/>
		</div>
	`
	};

	// @vue/component
	const AiAssistantWidgetEmptyState = {
		name: 'AiAssistantWidgetEmptyState',
		components: {
			AiAssistantEmptyStateView: im_v2_component_content_chat.AiAssistantEmptyStateView,
			ChatContentDisclaimer: im_v2_component_content_elements.ChatContentDisclaimer,
			DropArea: im_v2_component_content_elements.DropArea
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		emits: ['selectSuggestion'],
		data() {
			return {
				// The textarea targets the hydrated real chat on success. If hydration fails,
				// it stays on the local temp and enables only the guarded before-send retry.
				currentDialogId: this.dialogId,
				deferredDialogPromise: null,
				allowBeforeSendOnUninitedTemp: false,
				dropAreaContainer: null
			};
		},
		computed: {
			AiAssistantSuggestionDesign: () => im_v2_component_content_chat.AiAssistantSuggestionDesign,
			isFileUploadEnabled() {
				return !this.allowBeforeSendOnUninitedTemp && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotFileUploadAvailable);
			},
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.currentDialogId);
			},
			withDropArea() {
				return this.isFileUploadEnabled && !this.isTempChat && Boolean(this.dropAreaContainer);
			},
			suggestions() {
				return this.$store.getters['copilot/getSuggests'];
			},
			withDraft() {
				return {
					draftDialogId: WidgetChatManager.getInstance().getEmptyStateDraftDialogId()
				};
			},
			textareaHeightConfig() {
				return {
					storageKey: im_v2_const.LocalStorageKey.textareaHeightAiAssistantWidget
				};
			},
			isCurrentChatActivated() {
				if (!this.currentDialogId) {
					return false;
				}
				if (this.$store.getters['recent/get'](this.currentDialogId)) {
					return true;
				}
				const chatId = this.$store.getters['chats/get'](this.currentDialogId)?.chatId ?? 0;
				if (chatId <= 0) {
					return false;
				}
				return Boolean(this.$store.state.messages.chatCollection[chatId]?.size);
			}
		},
		watch: {
			dialogId() {
				void this.syncRealDialogId();
			},
			isCurrentChatActivated(isActivated) {
				if (isActivated) {
					WidgetChatManager.getInstance().promoteDraftChat(this.currentDialogId);
				}
			}
		},
		created() {
			this.isUnmounted = false;
			void this.syncRealDialogId();
		},
		mounted() {
			this.dropAreaContainer = this.$refs.container;
		},
		beforeUnmount() {
			this.isUnmounted = true;
			this.allowBeforeSendOnUninitedTemp = false;
			if (this.currentDialogId === this.activeTempDialogId) {
				this.currentDialogId = '';
			}
			this.activeTempDialogId = null;
		},
		methods: {
			async syncRealDialogId() {
				const tempDialogId = this.dialogId;
				const manager = WidgetChatManager.getInstance();
				const isTempChat = this.$store.getters['copilot/chats/isTempChat'](tempDialogId);
				this.allowBeforeSendOnUninitedTemp = false;
				this.currentDialogId = tempDialogId;
				this.activeTempDialogId = isTempChat ? tempDialogId : null;
				this.deferredDialogPromise = isTempChat ? manager.getDraftRealPromise() : null;
				if (!this.activeTempDialogId) {
					return;
				}
				const realPromise = this.deferredDialogPromise;
				let realDialogId = null;
				try {
					realDialogId = await realPromise;
				} catch {
					realDialogId = null;
				}
				if (this.isUnmounted || this.activeTempDialogId !== tempDialogId || this.dialogId !== tempDialogId) {
					return;
				}
				if (this.currentDialogId !== tempDialogId) {
					this.activeTempDialogId = null;
					return;
				}
				if (manager.getDraftRealPromise() !== realPromise) {
					this.activeTempDialogId = null;
					this.currentDialogId = '';
					return;
				}
				if (!realDialogId) {
					if (!manager.hasActiveDraft()) {
						this.activeTempDialogId = null;
						this.currentDialogId = '';
					} else {
						this.allowBeforeSendOnUninitedTemp = true;
					}
					return;
				}
				this.activeTempDialogId = null;
				this.currentDialogId = realDialogId;
			},
			onSuggestionSelect({
				text
			}) {
				this.$emit('selectSuggestion', text);
			}
		},
		template: `
		<div class="bx-im-ai-assistant-widget-empty-state --ui-context-content-light" data-testid="ai-assistant-widget-start-screen" ref="container">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="currentDialogId"
				:withTextArea="true"
				:withDraft="withDraft"
				:suggestionDesign="AiAssistantSuggestionDesign.gradient"
				:deferredDialogPromise="deferredDialogPromise"
				:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
				:isFileUploadEnabled="isFileUploadEnabled"
				:heightConfig="textareaHeightConfig"
				@selectSuggestion="onSuggestionSelect"
			/>
			<ChatContentDisclaimer :dialogId="currentDialogId" :forceVisible="true"/>
			<DropArea v-if="withDropArea" :key="currentDialogId" :dialogId="currentDialogId" :container="dropAreaContainer" data-testid="ai-assistant-widget-start-screen-drop-area"/>
		</div>
	`
	};

	// @vue/component
	const CopilotWidgetChatContent = {
		name: 'CopilotWidgetChatContent',
		components: {
			CopilotContent: im_v2_component_content_chat.CopilotContent,
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			AiAssistantWidgetChatHeader,
			AiAssistantWidgetEmptyState
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withSidebar: {
				type: Boolean,
				default: true
			},
			isCreatingChat: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleList', 'createChat', 'selectSuggestion'],
		data() {
			return {
				animateSwapOnSend: false
			};
		},
		watch: {
			showStartScreen(isStartScreen, wasStartScreen) {
				// animate the start screen → chat swap only when it is caused by a send; plain
				// navigation to an existing chat carries no mark, so it stays instant
				this.animateSwapOnSend = wasStartScreen && !isStartScreen && this.$store.getters['copilot/isWidgetChatOpenedBySend'](this.dialogId);
			}
		},
		computed: {
			SpecialBackground: () => im_v2_lib_theme.SpecialBackground,
			heightConfig: () => ({
				storageKey: im_v2_const.LocalStorageKey.textareaHeightAiAssistantWidget
			}),
			isTempChat() {
				return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
			},
			showStartScreen() {
				if (this.isTempChat) {
					return true;
				}

				// no dialog resolved yet: show the start screen instead of a DialogLoader,
				// but only on a clean open (a draft is active). while a saved chat is being
				// restored no draft exists, so the loader stays.
				return !this.dialogId && WidgetChatManager.getInstance().hasActiveDraft();
			}
		},
		template: `
		<Transition name="im-widget-start-reveal" :css="animateSwapOnSend" :duration="400">
		<div v-if="showStartScreen" class="bx-im-ai-assistant-widget-start-screen-content --ui-context-content-light" data-testid="ai-assistant-widget-start-screen-content">
			<div class="--ui-context-content-dark">
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					:isCreating="isCreatingChat"
					:isStartScreen="true"
					@toggleList="$emit('toggleList')"
					@createChat="$emit('createChat')"
				/>
			</div>
			<AiAssistantWidgetEmptyState
				:key="dialogId"
				:dialogId="dialogId"
				@selectSuggestion="$emit('selectSuggestion', $event)"
			/>
		</div>
		<CopilotContent
			v-else
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:backgroundId="SpecialBackground.transparent"
			:heightConfig="heightConfig"
		>
			<template #header>
				<div class="--ui-context-content-dark">
					<AiAssistantWidgetChatHeader
						:dialogId="dialogId"
						:withListToggle="true"
						:isCreating="isCreatingChat"
						@toggleList="$emit('toggleList')"
						@createChat="$emit('createChat')"
					/>
				</div>
			</template>
			<template #dialog>
				<div class="bx-im-ai-assistant-widget-dialog-context --ui-context-content-light">
					<ChatDialog :dialogId="dialogId" :key="dialogId"/>
				</div>
			</template>
		</CopilotContent>
		</Transition>
	`
	};

	// @vue/component
	const CopilotWidgetListHeader = {
		name: 'CopilotWidgetListHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			AiAssistantCreateChatButton: im_v2_component_list_container_aiAssistant.AiAssistantCreateChatButton
		},
		props: {
			isCreating: {
				type: Boolean,
				default: false
			}
		},
		emits: ['createChat', 'close'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			copilotName() {
				return this.$store.getters['copilot/getName'];
			}
		},
		methods: {
			createChat() {
				im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onChatCreateClick();
				this.$emit('createChat');
			},
			loc(phrase) {
				return this.$Bitrix.Loc.getMessage(phrase);
			}
		},
		template: `
		<div class="bx-im-copilot-widget-header__container">
			<div class="bx-im-copilot-widget-header__title">
				{{ copilotName }}
			</div>
			<div class="bx-im-copilot-widget-header__actions">
				<AiAssistantCreateChatButton
					:isCreating="isCreating"
					@newChat="createChat"
				/>
				<div
					class="bx-im-copilot-widget-header__close"
					:title="loc('IM_AI_ASSISTANT_WIDGET_HEADER_CLOSE')"
					@click="$emit('close')"
				>
					<BIcon
						class="bx-im-copilot-widget-header__close-icon"
						:name="OutlineIcons.CROSS_L"
						:hoverable="true"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CopilotWidgetRecentList = {
		name: 'CopilotWidgetRecentList',
		components: {
			CopilotList: im_v2_component_list_items_copilot.CopilotList,
			CopilotWidgetListHeader
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withSidebar: {
				type: Boolean,
				default: true
			}
		},
		emits: ['close', 'chatSelect', 'createChat'],
		template: `
		<div class="bx-im-ai-assistant-chat-recent-list">
			<CopilotWidgetListHeader
				@close="$emit('close')"
				@createChat="$emit('createChat')"
			/>
			<CopilotList @selectChat="$emit('chatSelect', $event)"/>
		</div>
	`
	};

	const MINIMIZE_EVENT_NAME = 'IM.AiAssistantWidget:minimize';

	// @vue/component
	const CopilotWidgetLayout = {
		name: 'CopilotWidgetLayout',
		components: {
			SlideAnimation: im_v2_component_animation.SlideAnimation,
			CopilotWidgetRecentList,
			CopilotWidgetChatContent
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			isCreatingChat: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select', 'createChat', 'recentVisibilityChanged', 'selectSuggestion'],
		data() {
			return {
				isPanelOpen: false
			};
		},
		mounted() {
			im_v2_lib_analytics.Analytics.getInstance().aiAssistant.onOpenMiniChat();
		},
		methods: {
			togglePanel() {
				this.isPanelOpen = !this.isPanelOpen;
				this.$emit('recentVisibilityChanged', this.isPanelOpen);
			},
			closePanel() {
				this.isPanelOpen = false;
			},
			selectDialog(dialogId) {
				this.closePanel();
				this.$emit('select', dialogId);
			},
			onCreateChat() {
				this.closePanel();
				this.$emit('createChat');
			},
			onHeaderClose() {
				if (this.dialogId) {
					this.isPanelOpen = false;
				} else {
					main_core_events.EventEmitter.emit(MINIMIZE_EVENT_NAME);
				}
			}
		},
		template: `
		<div class="bx-im-ai-assistant-widget-layout__container">
			<main class="bx-im-ai-assistant-widget-layout__content">
				<CopilotWidgetChatContent
					:dialogId="dialogId"
					:withSidebar="false"
					:isCreatingChat="isCreatingChat"
					@toggleList="togglePanel"
					@createChat="onCreateChat"
					@selectSuggestion="$emit('selectSuggestion', $event)"
				/>
			</main>

			<SlideAnimation>
				<aside class="bx-im-ai-assistant-widget-layout__panel-container --ui-context-content-light" v-if="isPanelOpen">
					<CopilotWidgetRecentList
						@chatSelect="selectDialog"
						@createChat="onCreateChat"
						@close="onHeaderClose"
					/>
				</aside>
			</SlideAnimation>
		</div>
	`
	};

	// @vue/component
	const MartaWidgetChatContent = {
		name: 'MartaWidgetChatContent',
		components: {
			AiAssistantWidgetChatHeader,
			AiAssistantBotContent: im_v2_component_content_chat.AiAssistantBotContent
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withSidebar: {
				type: Boolean,
				default: true
			}
		},
		template: `
		<AiAssistantBotContent :dialogId="dialogId" :withSidebar="withSidebar">
			<template #header>
				<AiAssistantWidgetChatHeader :dialogId="dialogId" />
			</template>
		</AiAssistantBotContent>
	`
	};

	// @vue/component
	const AiAssistantWidgetChatOpener = {
		name: 'AiAssistantWidgetChatOpener',
		components: {
			CopilotWidgetLayout,
			MartaWidgetChatContent
		},
		props: {
			initialDialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				selectedDialogId: '',
				isCreatingChat: false
			};
		},
		computed: {
			isBitrixGptMode() {
				return WidgetChatManager.getInstance().isBitrixGptMode;
			}
		},
		created() {
			im_v2_lib_init.InitManager.init();
			this.manager = WidgetChatManager.getInstance();
			this.manager.subscribeNotifier();
			this.manager.subscribe(WidgetChatManager.events.onDialogIdChange, this.onManagerDialogIdChange);
			if (this.isBitrixGptMode) {
				void this.resolveInitialChat();
			} else {
				void this.manager.loadChat(this.initialDialogId);
			}
		},
		beforeUnmount() {
			this.manager.unsubscribeNotifier();
			this.manager.unsubscribe(WidgetChatManager.events.onDialogIdChange, this.onManagerDialogIdChange);
			this.manager.clearWidgetState();
		},
		methods: {
			onManagerDialogIdChange(event) {
				const {
					dialogId
				} = event.getData();
				this.selectedDialogId = dialogId ?? '';
			},
			async resolveInitialChat() {
				const dialogId = await WidgetChatManager.getInstance().resolveInitialChat(this.initialDialogId);
				if (dialogId) {
					this.selectedDialogId = dialogId;
				}
			},
			async onChangeDialogId(dialogId) {
				const openedDialogId = await WidgetChatManager.getInstance().selectAndOpenChat(dialogId, this.selectedDialogId);
				if (openedDialogId) {
					this.selectedDialogId = openedDialogId;
				}
			},
			onRecentVisibilityChange(isOpened) {
				if (!isOpened) {
					return;
				}
				WidgetChatManager.getInstance().setRecentDraftText(this.selectedDialogId);
			},
			async onCreateChat() {
				if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCopilotDraftChatAvailable)) {
					const tempDialogId = WidgetChatManager.getInstance().startDraftChat();
					if (tempDialogId) {
						this.selectedDialogId = tempDialogId;
					}
					return;
				}
				this.isCreatingChat = true;
				try {
					const newDialogId = await WidgetChatManager.getInstance().createNewChat();
					if (newDialogId) {
						this.selectedDialogId = newDialogId;
					}
				} finally {
					this.isCreatingChat = false;
				}
			},
			selectSuggestion(text) {
				const manager = WidgetChatManager.getInstance();
				if (manager.hasActiveDraft()) {
					void manager.sendFirstMessage(text);
					return;
				}
				manager.sendSuggestion(text);
			}
		},
		template: `
		<div class="bx-im-messenger__scope bx-im-ai-assistant-chat-opener__container">
			<CopilotWidgetLayout
				v-if="isBitrixGptMode"
				:dialogId="selectedDialogId"
				:isCreatingChat="isCreatingChat"
				@select="onChangeDialogId"
				@createChat="onCreateChat"
				@recentVisibilityChanged="onRecentVisibilityChange"
				@selectSuggestion="selectSuggestion"
			/>
			<MartaWidgetChatContent
				v-else
				:dialogId="initialDialogId"
				:withSidebar="false"
			/>
		</div>
	`
	};

	const APP_NAME = 'AiAssistantWidgetApplication';
	class AiAssistantWidgetApplication {
		#initPromise;
		#params;
		constructor(params = {}) {
			this.#params = params;
			this.#initPromise = this.#init();
		}
		ready() {
			return this.#initPromise;
		}
		async mount(payload) {
			await this.ready();
			const {
				rootContainer,
				aiAssistantBotId,
				onError
			} = payload;
			if (!rootContainer) {
				return Promise.reject(new Error('Provide node or selector for root container'));
			}
			const dialogId = WidgetChatManager.getInstance().isBitrixGptMode ? this.#resolveDialogId(payload) ?? '' : aiAssistantBotId?.toString() ?? '';
			return im_v2_application_core.Core.createVue(this, {
				name: APP_NAME,
				el: rootContainer,
				onError,
				components: {
					AiAssistantWidgetChatOpener
				},
				template: `<AiAssistantWidgetChatOpener initialDialogId="${dialogId}" />`
			});
		}
		async changeDialog(targetChat) {
			await this.ready();
			if (!WidgetChatManager.getInstance().isBitrixGptMode) {
				return false;
			}
			const dialogId = this.#resolveDialogId(targetChat);
			if (!dialogId) {
				return false;
			}
			return WidgetChatManager.getInstance().changeDialog(dialogId);
		}
		#resolveDialogId(targetChat) {
			if (main_core.Type.isStringFilled(targetChat?.dialogId)) {
				return targetChat.dialogId;
			}
			if (main_core.Type.isNumber(targetChat?.chatId)) {
				return im_v2_lib_utils.Utils.dialog.buildChatDialogId(targetChat.chatId);
			}
			return null;
		}
		async #init() {
			im_v2_application_core.Core.setApplicationData(this.#params);
			await im_v2_application_core.Core.ready();
			return this;
		}
	}

	exports.AiAssistantWidgetApplication = AiAssistantWidgetApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX, BX.Messenger.v2.Css, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Dialog, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.List);
//# sourceMappingURL=ai-assistant-widget.bundle.js.map
