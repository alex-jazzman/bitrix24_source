/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_utils, main_core_events, im_v2_const, im_v2_lib_analytics, im_v2_lib_draft, im_v2_lib_logger, im_v2_lib_messageNotifier, im_v2_provider_service_chat, im_v2_provider_service_copilot, im_v2_lib_feature, im_v2_css_classes, im_v2_component_animation, im_v2_component_content_chat, im_v2_component_dialog_chat, im_v2_lib_theme, ui_iconSet_api_vue, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_component_list_container_aiAssistant, im_v2_component_list_items_copilot) {
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
		#currentDialogId = null;
		#isBitrixGptMode;
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
			this.#isBitrixGptMode = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotAvailable) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.copilotActive);
		}
		async changeDialog(dialogId) {
			if (!this.#isBitrixGptMode) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: changeDialog(${dialogId}) ignored: not in bitrixGpt mode`);
				return false;
			}
			if (!(await this.#isCandidateBitrixGptChat(dialogId))) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: ${dialogId} is not a bitrixGpt chat, changeDialog aborted`);
				return false;
			}
			return this.loadChat(dialogId);
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
			if (candidateDialogId && (await this.#isCandidateBitrixGptChat(candidateDialogId)) && (await this.loadChat(candidateDialogId))) {
				return candidateDialogId;
			}
			const savedDialogId = this.#getSavedDialogId();
			if (savedDialogId && (await this.loadChat(savedDialogId))) {
				return savedDialogId;
			}
			return this.#openFallbackChat();
		}
		async #isCandidateBitrixGptChat(dialogId) {
			let chat = this.#store.getters['chats/get'](dialogId);
			if (!chat) {
				try {
					await this.#chatService.loadChat(dialogId);
				} catch {
					return false;
				}
				chat = this.#store.getters['chats/get'](dialogId);
			}
			return this.#isBitrixGptChat(chat);
		}
		#isBitrixGptChat(chat) {
			return chat?.type === im_v2_const.ChatType.copilot;
		}
		async loadChat(dialogId) {
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
				this.#sendOpenChatAnalytics(dialogId);
			}
			this.#setCurrentDialogId(dialogId);
			this.#saveDialogId(dialogId);
			void this.#store.dispatch('copilot/setWidgetDialogId', dialogId);
			return true;
		}
		async selectAndOpenChat(dialogId, previousDialogId) {
			if (await this.loadChat(dialogId)) {
				return dialogId;
			}
			im_v2_lib_logger.Logger.warn(`WidgetChatManager: failed to open chat ${dialogId}`);
			return this.#openFallbackChat();
		}
		async createNewChat() {
			const newDialogId = await this.#copilotChatService.createDefaultChat();
			this.#setCurrentDialogId(newDialogId);
			this.#saveDialogId(newDialogId);
			void this.#store.dispatch('copilot/setWidgetDialogId', newDialogId);
			return newDialogId;
		}
		async #openFallbackChat() {
			const firstRecentDialogId = await this.#getFirstRecentDialogId();
			if (firstRecentDialogId && (await this.loadChat(firstRecentDialogId))) {
				return firstRecentDialogId;
			}
			return this.createNewChat();
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
		async #getFirstRecentDialogId() {
			await this.#copilotRecentService.loadFirstPage();
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
			this.#setCurrentDialogId(null);
			void this.#store.dispatch('copilot/setWidgetDialogId', '');
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
				<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="onNewTitleSubmit"/>
				<div class="bx-im-ai-assistant-chat-header__subtitle">
					{{ subtitle }}
				</div>
			</div>
			<div v-if="isInited && isCopilot2026Styles" class="bx-im-ai-assistant-chat-header__create-chat">
				<AiAssistantCreateChatButton
					:isCreating="isCreating"
					@newChat="$emit('createChat')"
				/>
			</div>
			<BIcon
				v-if="isInited"
				:name="closeIcon"
				:hoverable="true"
				:title="loc('IM_AI_ASSISTANT_WIDGET_MINIMIZE')"
				class="bx-im-ai-assistant-chat-header__icon"
				@click="onMinimize"
			/>
		</div>
	`
	};

	// @vue/component
	const CopilotWidgetChatContent = {
		name: 'CopilotWidgetChatContent',
		components: {
			CopilotContent: im_v2_component_content_chat.CopilotContent,
			ChatDialog: im_v2_component_dialog_chat.ChatDialog,
			AiAssistantWidgetChatHeader
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
		emits: ['toggleList', 'createChat'],
		computed: {
			SpecialBackground: () => im_v2_lib_theme.SpecialBackground
		},
		template: `
		<CopilotContent
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:backgroundId="SpecialBackground.transparent"
		>
			<template #header>
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					:isCreating="isCreatingChat"
					@toggleList="$emit('toggleList')"
					@createChat="$emit('createChat')"
				/>
			</template>
			<template #dialog>
				<div class="bx-im-ai-assistant-widget-dialog-context --ui-context-content-light">
					<ChatDialog :dialogId="dialogId" :key="dialogId"/>
				</div>
			</template>
		</CopilotContent>
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
					@newChat="$emit('createChat')"
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
		emits: ['select', 'createChat', 'recentVisibilityChanged'],
		data() {
			return {
				isPanelOpen: false
			};
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
					v-if="dialogId"
					:dialogId="dialogId"
					:withSidebar="false"
					:isCreatingChat="isCreatingChat"
					@toggleList="togglePanel"
					@createChat="onCreateChat"
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
				this.isCreatingChat = true;
				try {
					const newDialogId = await WidgetChatManager.getInstance().createNewChat();
					if (newDialogId) {
						this.selectedDialogId = newDialogId;
					}
				} finally {
					this.isCreatingChat = false;
				}
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
		constructor() {
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
			await im_v2_application_core.Core.ready();
			return this;
		}
	}

	exports.AiAssistantWidgetApplication = AiAssistantWidgetApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Css, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Component.Dialog, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List);
//# sourceMappingURL=ai-assistant-widget.bundle.js.map
