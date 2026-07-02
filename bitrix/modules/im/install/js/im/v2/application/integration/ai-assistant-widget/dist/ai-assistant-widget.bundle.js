/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_css_classes, im_v2_lib_feature, im_v2_const, im_v2_lib_analytics, im_v2_lib_draft, im_v2_lib_logger, im_v2_provider_service_chat, im_v2_provider_service_copilot, main_core_events, im_v2_component_animation, im_v2_component_content_chat, im_v2_lib_theme, ui_iconSet_api_vue, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle, im_v2_component_list_items_copilot, im_v2_component_elements_loader, im_v2_lib_messageNotifier) {
	'use strict';

	class WidgetChatManager {
		static #instance;
		#store;
		#chatService;
		#copilotChatService;
		#copilotRecentService;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#chatService = new im_v2_provider_service_chat.ChatService();
			this.#copilotChatService = new im_v2_provider_service_copilot.CopilotChatService();
			this.#copilotRecentService = new im_v2_provider_service_copilot.CopilotRecentService();
		}
		async resolveInitialChat() {
			const savedDialogId = this.#getSavedDialogId();
			if (savedDialogId && (await this.loadChat(savedDialogId))) {
				return savedDialogId;
			}
			return this.#openFallbackChat();
		}
		async loadChat(dialogId) {
			this.#saveDialogId(dialogId);
			const existingDialog = this.#store.getters['chats/get'](dialogId);
			if (existingDialog?.inited) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: chat ${existingDialog.chatId} is already loaded`);
				return true;
			}
			im_v2_lib_logger.Logger.warn(`WidgetChatManager: loading chat ${dialogId}`);
			try {
				await this.#chatService.loadChatWithMessages(dialogId);
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: chat ${dialogId} is loaded`);
			} catch (error) {
				im_v2_lib_logger.Logger.warn(`WidgetChatManager: error loading chat ${dialogId}`, error);
				this.#removeSavedDialogId();
				return false;
			}
			this.#sendOpenChatAnalytics(dialogId);
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
			this.#saveDialogId(newDialogId);
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
			return `im-v2-copilot-widget-${im_v2_const.LocalStorageKey.copilotWidgetLastDialogId}`;
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
		setRecentDraftText(dialogId) {
			if (!dialogId) {
				return;
			}
			im_v2_lib_draft.DraftManager.getInstance().setRecentDraftText(dialogId);
		}
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
			EditableChatTitle: im_v2_component_elements_chatTitle.EditableChatTitle
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			},
			withListToggle: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleList'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isInited() {
				return this.dialog.inited;
			},
			subtitle() {
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
			loc(phrase) {
				return this.$Bitrix.Loc.getMessage(phrase);
			}
		},
		template: `
		<div class="bx-im-ai-assistant-chat-header__container">
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
			<BIcon
				v-if="isInited"
				:name="OutlineIcons.CROSS_L"
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
			}
		},
		emits: ['toggleList'],
		computed: {
			SpecialBackground: () => im_v2_lib_theme.SpecialBackground
		},
		template: `
		<CopilotContent
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:themeId="SpecialBackground.transparent"
		>
			<template #header>
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					@toggleList="$emit('toggleList')"
				/>
			</template>
		</CopilotContent>
	`
	};

	// @vue/component
	const CopilotWidgetListHeader = {
		name: 'CopilotWidgetListHeader',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Spinner: im_v2_component_elements_loader.Spinner
		},
		props: {
			isCreating: {
				type: Boolean,
				default: false
			}
		},
		emits: ['newChat', 'close'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			SpinnerColor: () => im_v2_component_elements_loader.SpinnerColor,
			SpinnerSize: () => im_v2_component_elements_loader.SpinnerSize,
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
				<div
					class="bx-im-copilot-widget-header__create-chat"
					:title="loc('IM_AI_ASSISTANT_WIDGET_HEADER_NEW_CHAT')"
				>
					<div class="bx-im-copilot-widget-header__create-chat">
						<Spinner 
							v-if="isCreating" 
							:size="SpinnerSize.XS"
							:color="SpinnerColor.copilot"
						/>
						<BIcon
							v-else
							class="bx-im-copilot-widget-header__create-chat_icon"
							:name="OutlineIcons.PLUS_L"
							:hoverable="true"
							@click="$emit('newChat')"
						/>
					</div>
				</div>
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
			},
			isCreating: {
				type: Boolean,
				default: false
			}
		},
		emits: ['newChat', 'close', 'chatSelect'],
		template: `
		<div class="bx-im-ai-assistant-chat-recent-list">
			<CopilotWidgetListHeader
				:isCreating="isCreating"
				@newChat="$emit('newChat')"
				@close="$emit('close')"
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
		emits: ['select', 'createChat', 'recentVisibilityChanged'],
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
					@toggleList="togglePanel"
				/>
			</main>

			<SlideAnimation>
				<aside class="bx-im-ai-assistant-widget-layout__panel-container" v-if="isPanelOpen">
					<CopilotWidgetRecentList
						:isCreating="isCreatingChat"
						@chatSelect="selectDialog"
						@close="onHeaderClose"
						@newChat="onCreateChat"
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
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.notifier.onBeforeShowMessage, this.onBeforeNotificationShow);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.notifier.onBeforeShowMessage, this.onBeforeNotificationShow);
		},
		methods: {
			onBeforeNotificationShow(event) {
				const eventData = event.getData();
				if (eventData.dialogId !== this.dialogId) {
					return im_v2_lib_messageNotifier.NotifierShowMessageAction.show;
				}
				return im_v2_lib_messageNotifier.NotifierShowMessageAction.skip;
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
			botDialogId: {
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
			isCopilotMode() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available);
			}
		},
		created() {
			if (this.isCopilotMode) {
				void this.resolveInitialChat();
			} else {
				void WidgetChatManager.getInstance().loadChat(this.botDialogId);
			}
		},
		methods: {
			async resolveInitialChat() {
				const dialogId = await WidgetChatManager.getInstance().resolveInitialChat();
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
		<div class="bx-im-messenger__scope bx-im-ai-assistant-chat-opener__container --ui-context-content-light">
			<CopilotWidgetLayout
				v-if="isCopilotMode"
				:dialogId="selectedDialogId"
				:isCreatingChat="isCreatingChat"
				@select="onChangeDialogId"
				@createChat="onCreateChat"
				@recentVisibilityChanged="onRecentVisibilityChange"
			/>
			<MartaWidgetChatContent
				v-else
				:dialogId="botDialogId"
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
			const dialogId = aiAssistantBotId.toString();
			return im_v2_application_core.Core.createVue(this, {
				name: APP_NAME,
				el: rootContainer,
				onError,
				components: {
					AiAssistantWidgetChatOpener
				},
				template: `<AiAssistantWidgetChatOpener botDialogId="${dialogId}" />`
			});
		}
		async #init() {
			await im_v2_application_core.Core.ready();
			return this;
		}
	}

	exports.AiAssistantWidgetApplication = AiAssistantWidgetApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Css, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Event, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Component.Content, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib);
//# sourceMappingURL=ai-assistant-widget.bundle.js.map
