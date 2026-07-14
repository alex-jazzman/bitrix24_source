/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, im_v2_const, im_v2_lib_layout, im_v2_component_animation, im_v2_lib_escManager, im_v2_lib_utils, im_v2_component_list_container_collab, im_v2_lib_feature, im_v2_application_core, im_v2_provider_service_chat) {
	'use strict';

	const SUPPORTED_CHAT_TYPES = new Set([im_v2_const.ChatType.collab]);
	const EXCLUDED_LAYOUTS = new Set([im_v2_const.Layout.taskComments]);
	const COMPACT_MODE_LAYOUTS = new Set([im_v2_const.Layout.chat]);
	class NestedListManager {
		#initedChat;
		constructor(payload) {
			const {
				initedChat
			} = payload;
			this.#initedChat = initedChat;
		}
		static isFeatureAvailable() {
			return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
		}
		static isSupportedChatType(chatType) {
			return SUPPORTED_CHAT_TYPES.has(chatType);
		}
		static isCompactModeLayout() {
			return COMPACT_MODE_LAYOUTS.has(NestedListManager.#getCurrentLayoutName());
		}
		static async prepareParentChatId(parentDialogId) {
			let realDialogId = parentDialogId;
			if (im_v2_lib_utils.Utils.dialog.isGroupExternalId(parentDialogId)) {
				realDialogId = await new im_v2_provider_service_chat.ChatService().prepareDialogId(parentDialogId);
			}
			return im_v2_lib_utils.Utils.dialog.getChatIdFromDialogId(realDialogId);
		}
		shouldOpen() {
			const {
				type
			} = this.#getTargetChat();
			return NestedListManager.isSupportedChatType(type) && !this.#isExcludedLayout();
		}
		getDialogIdToOpen() {
			const {
				dialogId
			} = this.#getTargetChat();
			return dialogId;
		}
		static #getCurrentLayoutName() {
			const {
				name: currentLayoutName
			} = im_v2_application_core.Core.getStore().getters['application/getLayout'];
			return currentLayoutName;
		}
		#getTargetChat() {
			const parentChat = this.#getParentChat();
			if (parentChat) {
				return parentChat;
			}
			return this.#initedChat;
		}
		#getParentChat() {
			if (!this.#initedChat.parentChatId) {
				return null;
			}
			return im_v2_application_core.Core.getStore().getters['chats/getByChatId'](this.#initedChat.parentChatId);
		}
		#isExcludedLayout() {
			return EXCLUDED_LAYOUTS.has(NestedListManager.#getCurrentLayoutName());
		}
	}

	const chatMatchesChatId = (chat, targetChatId) => {
		const matchesChat = chat.chatId === targetChatId;
		const matchesParentChat = chat.parentChatId === targetChatId;
		return matchesChat || matchesParentChat;
	};

	// @vue/component
	const ListNavigator = {
		name: 'ListNavigator',
		components: {
			SlideAnimation: im_v2_component_animation.SlideAnimation,
			CollabNestedListContainer: im_v2_component_list_container_collab.CollabNestedListContainer,
			NestedListLoadingState: im_v2_component_list_container_collab.NestedListLoadingState
		},
		props: {
			listComponent: {
				type: Object,
				required: true
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				nestedListParentChatId: 0
			};
		},
		computed: {
			SlideEntrySide: () => im_v2_component_animation.SlideEntrySide,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			isNestedListActive() {
				return this.nestedListParentChatId > 0;
			},
			nestedListCompactMode() {
				return NestedListManager.isCompactModeLayout();
			},
			nestedListClasses() {
				return {
					'--compact-mode': this.nestedListCompactMode
				};
			}
		},
		watch: {
			layout(newLayout, prevLayout) {
				if (newLayout.name !== prevLayout.name) {
					this.onLayoutChange(prevLayout.name, newLayout.name);
				}
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.openNestedList, this.onOpenNestedListEvent);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.closeNestedList, this.onCloseNestedListEvent);
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInited);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.openNestedList, this.onOpenNestedListEvent);
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.closeNestedList, this.onCloseNestedListEvent);
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInited);
		},
		methods: {
			async openNestedList(parentDialogId) {
				this.isLoading = true;
				const parentChatId = await NestedListManager.prepareParentChatId(parentDialogId);
				const listWasClosed = !this.isLoading;
				if (listWasClosed) {
					return;
				}
				this.nestedListParentChatId = parentChatId;
				this.isLoading = false;
			},
			closeNestedList() {
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(this.layout.name)) {
					this.openLayout(im_v2_const.Layout.chat);
				}
				this.nestedListParentChatId = 0;
				this.isLoading = false;
			},
			openLayout(layoutName) {
				this.$emit('selectChat', {
					layoutName,
					dialogId: ''
				});
			},
			openChat(payload) {
				this.$emit('selectChat', payload);
			},
			async onSelectChat(initialEvent) {
				const {
					dialogId,
					layoutName
				} = initialEvent;
				const {
					type
				} = this.$store.getters['chats/get'](dialogId, true);
				const canOpenNestedList = NestedListManager.isSupportedChatType(type) && NestedListManager.isFeatureAvailable();
				if (!canOpenNestedList) {
					if (this.isNestedListActive) {
						this.closeNestedList();
					}
					this.openChat(initialEvent);
					return;
				}
				if (!im_v2_lib_feature.TariffManager.collabV2.isAvailable()) {
					im_v2_lib_feature.TariffManager.collabV2.openFeatureSlider();
					return;
				}
				this.openLayout(layoutName);
				await this.$nextTick();
				void this.openNestedList(dialogId);
			},
			onNestedListSelectChat(dialogId) {
				let layoutName = this.layout.name;
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(this.layout.name)) {
					layoutName = im_v2_const.Layout.chat;
				}
				this.openChat({
					layoutName,
					dialogId
				});
			},
			onDialogInited(event) {
				const {
					chat
				} = event.getData();
				if (!NestedListManager.isFeatureAvailable() || !im_v2_lib_feature.TariffManager.collabV2.isAvailable()) {
					return;
				}
				if (this.isNestedListOpenedForChat(chat)) {
					return;
				}
				const manager = new NestedListManager({
					initedChat: chat
				});
				if (manager.shouldOpen()) {
					void this.openNestedList(manager.getDialogIdToOpen());
					return;
				}
				if (!this.isNestedListActive) {
					return;
				}
				this.closeNestedList();
			},
			onLayoutChange(prevLayoutName, newLayoutName) {
				if (!this.isNestedListActive) {
					return;
				}
				const switchingToForm = im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(newLayoutName);
				const switchingFromForm = im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(prevLayoutName);
				if (switchingToForm || switchingFromForm) {
					return;
				}
				this.closeNestedList();
			},
			onOpenNestedListEvent(event) {
				const {
					parentDialogId
				} = event.getData();
				void this.openNestedList(parentDialogId);
			},
			onCloseNestedListEvent(event) {
				if (!this.closeEventMatchesActiveList(event)) {
					return im_v2_lib_escManager.EscEventAction.ignored;
				}
				this.closeNestedList();
				return im_v2_lib_escManager.EscEventAction.handled;
			},
			onCloseNestedListClick() {
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(this.layout.name)) {
					im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
				}
				this.closeNestedList();
			},
			closeEventMatchesActiveList(event) {
				if (!this.isNestedListActive) {
					return false;
				}
				const {
					dialogId
				} = event.getData() ?? {};
				if (!dialogId) {
					return true;
				}
				const currentParentChatId = this.nestedListParentChatId;
				const currentDialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(currentParentChatId);
				return currentDialogId === dialogId;
			},
			isNestedListOpenedForChat(chat) {
				if (!this.isNestedListActive) {
					return false;
				}
				return chatMatchesChatId(chat, this.nestedListParentChatId);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<KeepAlive>
			<component :is="listComponent" @selectChat="onSelectChat" />
		</KeepAlive>
		<SlideAnimation :entrySide="SlideEntrySide.right">
			<div v-if="isLoading || isNestedListActive" :class="nestedListClasses" class="bx-im-list-navigator-nested-list__container">
				<NestedListLoadingState v-if="isLoading" :compactMode="nestedListCompactMode" @close="onCloseNestedListClick" />
				<CollabNestedListContainer
					v-else-if="isNestedListActive"
					:parentChatId="nestedListParentChatId"
					:compactMode="nestedListCompactMode"
					@close="onCloseNestedListClick"
					@selectChat="onNestedListSelectChat"
				/>
			</div>
		</SlideAnimation>
	`
	};

	exports.ListNavigator = ListNavigator;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Service);
//# sourceMappingURL=navigator.bundle.js.map
