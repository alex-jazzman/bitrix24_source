/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, ui_vue3, im_v2_component_list_items_base, im_v2_component_list_items_elements_activeCallList, im_v2_component_list_items_elements_createChatStatus, im_v2_const, im_v2_lib_createChat, im_v2_lib_draft, im_v2_lib_menu, im_v2_provider_service_recent, im_v2_application_core, ui_vue3_components_button, ui_iconSet_api_core, im_v2_lib_feature, im_v2_lib_invite, im_v2_component_list_items_elements_emptyState, im_v2_lib_unreadMode) {
	'use strict';

	class LikeManager {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		init() {
			this.onDialogInitedHandler = this.onDialogInited.bind(this);
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInitedHandler);
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.dialog.onDialogInited, this.onDialogInitedHandler);
		}
		onDialogInited(event) {
			const {
				dialogId
			} = event.getData();
			const recentItem = this.store.getters['recent/get'](dialogId);
			if (!recentItem || !recentItem.liked) {
				return;
			}
			this.store.dispatch('recent/like', {
				dialogId,
				liked: false
			});
		}
	}

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState,
			UiButton: ui_vue3_components_button.Button
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			OutlineIcons: () => ui_iconSet_api_core.Outline,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			canInviteUsers() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.intranetInviteAvailable);
			}
		},
		methods: {
			onInviteUsersClick() {
				im_v2_lib_invite.InviteManager.openInviteSlider();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<RecentEmptyState
			:title="loc('IM_LIST_RECENT_EMPTY_STATE_TITLE_MSGVER_1')"
			:subtitle="loc('IM_LIST_RECENT_EMPTY_STATE_SUBTITLE_MSGVER_1')"
			:recentSection="RecentType.default"
		>
			<UiButton
				v-if="canInviteUsers"
				:style="AirButtonStyle.FILLED"
				:leftIcon="OutlineIcons.PLUS_L"
				:text="loc('IM_LIST_RECENT_EMPTY_STATE_INVITE_USERS')"
				@click="onInviteUsersClick"
			/>
		</RecentEmptyState>
	`
	};

	// @vue/component
	const RecentUnreadList = {
		name: 'RecentUnreadList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			BaseRecentItem: im_v2_component_list_items_base.BaseRecentItem,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				listIsScrolled: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedUnreadCollection']({
					type: im_v2_const.RecentType.default
				});
			},
			activeCalls() {
				return this.$store.getters['recent/calls/get'];
			}
		},
		async created() {
			this.contextMenuManager = ui_vue3.markRaw(new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			}));
			this.clearCollection();
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		methods: {
			clearCollection() {
				this.$store.dispatch('recent/clearUnreadCollection', {
					type: im_v2_const.RecentType.default
				});
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: [im_v2_const.RecentType.default],
					dialogId
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentUnreadService().loadFirstPage({
					ignorePreloadedItems: true
				});
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getRecentUnreadService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getRecentUnreadService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			getRecentUnreadService() {
				if (!this.service) {
					this.service = im_v2_provider_service_recent.UnreadRecentService.getInstance();
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			:contextMenuManager="contextMenuManager"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
			data-test-id="im_container-recent__unread-list"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<RecentEmptyState 
					:title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE_MSGVER_1')"
					:subtitle="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const RecentList = {
		name: 'RecentList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			CreateChatStatus: im_v2_component_list_items_elements_createChatStatus.CreateChatStatus,
			EmptyState,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false,
				listIsScrolled: false,
				isCreatingChat: false
			};
		},
		computed: {
			collection() {
				return this.$store.getters['recent/getSortedCollection']({
					type: im_v2_const.RecentType.default
				});
			},
			activeCalls() {
				return this.$store.getters['recent/calls/get'];
			}
		},
		async created() {
			this.contextMenuManager = ui_vue3.markRaw(new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			}));
			this.initLikeManager();
			this.initCreateChatManager();
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.dayChanged, this.onDayChanged);
			// Lists live under KeepAlive, so a hidden one stays subscribed; only the visible one reacts.
			this.isOnScreen = true;
			this.missedDayChange = false;
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		activated() {
			this.isOnScreen = true;
			if (this.missedDayChange) {
				this.missedDayChange = false;
				void this.getRecentService().loadFirstPage();
			}
		},
		deactivated() {
			this.isOnScreen = false;
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.dayChanged, this.onDayChanged);
			this.contextMenuManager.destroy();
			this.destroyLikeManager();
			this.destroyCreateChatManager();
		},
		methods: {
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentService().loadFirstPage({
					ignorePreloadedItems: true
				});
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getRecentService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getRecentService().loadNextPage();
				this.isLoadingNextPage = false;
			},
			onSelectChat(dialogId) {
				this.$emit('selectChat', dialogId);
			},
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item
				};

				// Mouse: anchor the menu at the cursor coordinates.
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			initLikeManager() {
				this.likeManager = new LikeManager();
				this.likeManager.init();
			},
			destroyLikeManager() {
				this.likeManager.destroy();
			},
			initCreateChatManager() {
				if (im_v2_lib_createChat.CreateChatManager.getInstance().isCreating()) {
					this.isCreatingChat = true;
				}
				this.onCreationStatusChange = event => {
					this.isCreatingChat = event.getData();
				};
				im_v2_lib_createChat.CreateChatManager.getInstance().subscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
			},
			destroyCreateChatManager() {
				im_v2_lib_createChat.CreateChatManager.getInstance().unsubscribe(im_v2_lib_createChat.CreateChatManager.events.creationStatusChange, this.onCreationStatusChange);
			},
			// Birthday marks are computed for the current day and go stale once it turns over. A hidden
			// list defers the reload to the moment it comes back: reloading it now costs a page request
			// for a list nobody is looking at.
			onDayChanged() {
				if (!this.isOnScreen) {
					this.missedDayChange = true;
					return;
				}
				void this.getRecentService().loadFirstPage();
			},
			getRecentService() {
				if (!this.service) {
					this.service = im_v2_provider_service_recent.LegacyRecentService.getInstance();
				}
				return this.service;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			:contextMenuManager="contextMenuManager"
			@listScroll="onListScroll"
			@loadNextPage="onLoadNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #before-list>
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<EmptyState />
			</template>
		</BaseRecentList>
	`
	};

	exports.ChatsEmptyState = EmptyState;
	exports.LikeManager = LikeManager;
	exports.RecentList = RecentList;
	exports.RecentUnreadList = RecentUnreadList;
})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX?.Event??{}, BX?.Vue3??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Messenger?.v2?.Application??{}, BX?.Vue3?.Components??{}, BX?.UI?.IconSet??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Lib??{});;
//# sourceMappingURL=recent-list.bundle.js.map
