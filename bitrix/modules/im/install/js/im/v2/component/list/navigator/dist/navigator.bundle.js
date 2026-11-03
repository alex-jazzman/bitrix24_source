/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, im_v2_const, im_v2_lib_folder, im_v2_lib_layout, im_v2_component_animation, im_v2_lib_escManager, im_v2_lib_utils, im_v2_lib_a11y, im_v2_component_list_container_collab, im_v2_lib_feature, im_v2_application_core, im_v2_provider_service_chat, im_v2_lib_collab) {
	'use strict';

	const SUPPORTED_CHAT_TYPES = new Set([im_v2_const.ChatType.collab]);
	const EXCLUDED_LAYOUTS = new Set([im_v2_const.Layout.taskComments]);
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

	const findCollabTransitionTarget = parentDialogId => {
		if (!im_v2_lib_utils.Utils.dialog.isChatDialogId(parentDialogId)) {
			return null;
		}
		const parentChatId = im_v2_lib_utils.Utils.dialog.getChatIdFromDialogId(parentDialogId);
		return im_v2_lib_collab.selectCollabTransitionTarget(im_v2_lib_collab.collectCollabTransitionCandidates(parentChatId));
	};

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
				nestedListParentChatId: 0,
				nestedListCompactMode: true,
				initialRecentSection: null
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
			isNestedListShown() {
				// The nested list drawer overlays the root list (loading state included).
				return this.isLoading || this.isNestedListActive;
			},
			isRootListAvatarsOnly() {
				// Compact peek: only the 68px avatar strip of the root list stays visible beside the
				// drawer, so it must remain mouse-clickable (switch collab without closing the drawer).
				return this.isNestedListActive && this.nestedListCompactMode;
			},
			isRootListInert() {
				// `inert` pulls the root list out of the tab order while the drawer is shown (Tab enters
				// the drawer, not the main header). It also kills mouse + AT - fine when the drawer covers
				// the whole list, wrong for the compact peek. There the strip stays clickable, so `inert`
				// is dropped and keyboard access is removed inside the list instead (header `inert` + row
				// focus zone off). Cleared on close before P3 restores focus to the parent row.
				return this.isNestedListShown && !this.isRootListAvatarsOnly;
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
			async openNestedList(parentDialogId, options = {}) {
				const {
					compactMode = true,
					recentType = im_v2_const.RecentType.collabDefault
				} = options;
				this.nestedListCompactMode = compactMode;
				this.isLoading = true;
				const parentChatId = await NestedListManager.prepareParentChatId(parentDialogId);
				const listWasClosed = !this.isLoading;
				if (listWasClosed) {
					return;
				}
				this.nestedListParentChatId = parentChatId;
				this.initialRecentSection = recentType;
				this.isLoading = false;
			},
			closeNestedList() {
				const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
				if (layoutManager.isChatFormLayout(this.layout.name)) {
					// The layout is set whole and not sent through the selectChat event: the event carries a
					// name alone, and a personal folder is told apart by the folderId of its params.
					void layoutManager.setLayout(im_v2_lib_folder.FolderManager.getDefaultLayout() ?? {
						name: im_v2_const.Layout.chat
					});
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
			async openCollab({
				layoutName,
				dialogId
			}) {
				const target = findCollabTransitionTarget(dialogId);
				if (target) {
					this.openChat({
						layoutName,
						dialogId: target.dialogId
					});
				} else {
					this.openLayout(layoutName);
				}
				await this.$nextTick();
				void this.openNestedList(dialogId);
			},
			async onSelectChat(initialEvent) {
				const {
					dialogId
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
				await this.openCollab(initialEvent);
			},
			onNestedListSelectChat(dialogId) {
				let layoutName = this.layout.name;
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatFormLayout(this.layout.name)) {
					layoutName = im_v2_lib_folder.FolderManager.getRegularChatsLayout().name;
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
				if (this.isLoading || this.isNestedListOpenedForChat(chat)) {
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
					parentDialogId,
					options
				} = event.getData();
				void this.openNestedList(parentDialogId, options);
			},
			onCloseNestedListEvent(event) {
				if (!this.closeEventMatchesActiveList(event)) {
					return im_v2_lib_escManager.EscEventAction.ignored;
				}
				const parentChatId = this.nestedListParentChatId;
				this.closeNestedList();
				this.returnFocusToParentRow(parentChatId);
				return im_v2_lib_escManager.EscEventAction.handled;
			},
			onCloseNestedListClick() {
				const parentChatId = this.nestedListParentChatId;
				if (im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(this.layout.name)) {
					im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
				}
				this.closeNestedList();
				this.returnFocusToParentRow(parentChatId);
			},
			returnFocusToParentRow(parentChatId) {
				// User dismissed the nested list (Escape / close control), so send focus back to the
				// collab row it was opened from. Capture parentChatId before closeNestedList() resets it.
				if (parentChatId <= 0 || !this.canMoveFocus()) {
					return;
				}
				const dialogId = im_v2_lib_utils.Utils.dialog.buildChatDialogId(parentChatId);

				// The collab was entered from a search with the keyboard, and this list was the last surface that
				// walk opened: the collapsed search it started from outranks the row and takes the focus itself.
				if (im_v2_lib_a11y.isKeyboardFocusHandoffHeldByNestedList({
					layoutName: this.layout.name,
					dialogId
				})) {
					return;
				}

				// Root list re-expands from avatars-only on close; wait a tick so the row is laid out.
				void this.$nextTick(() => {
					const row = this.$refs.rootList?.$el?.querySelector?.(`[data-id="${dialogId}"]`);
					if (row?.isConnected) {
						row.focus();
					}
				});
			},
			canMoveFocus() {
				// Do not steal focus from a popup/menu that currently owns it (active focus trap).
				return !im_v2_lib_a11y.isFocusOwnedByPopup();
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
			<component :is="listComponent" ref="rootList" :inert="isRootListInert || null" :avatarsOnly="isRootListAvatarsOnly" @selectChat="onSelectChat" />
		</KeepAlive>
		<SlideAnimation :entrySide="SlideEntrySide.right">
			<div v-if="isLoading || isNestedListActive" :class="nestedListClasses" class="bx-im-list-navigator-nested-list__container" data-testid="im-nested-list-drawer">
				<NestedListLoadingState v-if="isLoading" :compactMode="nestedListCompactMode" @close="onCloseNestedListClick" />
				<CollabNestedListContainer
					v-else-if="isNestedListActive"
					:parentChatId="nestedListParentChatId"
					:compactMode="nestedListCompactMode"
					:initialRecentSection="initialRecentSection"
					@close="onCloseNestedListClick"
					@selectChat="onNestedListSelectChat"
				/>
			</div>
		</SlideAnimation>
	`
	};

	exports.ListNavigator = ListNavigator;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Service, BX.Messenger.v2.Lib);
//# sourceMappingURL=navigator.bundle.js.map
