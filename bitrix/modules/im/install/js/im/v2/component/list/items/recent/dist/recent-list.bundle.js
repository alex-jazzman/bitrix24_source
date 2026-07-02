/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_items_base, im_v2_component_list_items_elements_createChatStatus, im_v2_const, im_v2_lib_createChat, im_v2_lib_draft, im_v2_lib_menu, im_v2_provider_service_recent, main_core_events, im_v2_application_core, call_component_activeCallList, im_v2_component_elements_button, im_v2_lib_feature, im_v2_lib_invite, im_v2_component_list_items_elements_emptyState, im_v2_lib_unreadMode) {
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
	const ActiveCallList = {
		name: 'ActiveCallList',
		props: {
			listIsScrolled: {
				type: Boolean,
				required: true
			}
		},
		emits: ['onCallClick'],
		computed: {
			componentToRender() {
				return call_component_activeCallList.ActiveCallList;
			}
		},
		template: `
		<component v-if="componentToRender" :is="componentToRender" :listIsScrolled="listIsScrolled" @onCallClick="$emit('onCallClick', $event)" />
	`
	};

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			ChatButton: im_v2_component_elements_button.ChatButton,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		computed: {
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
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
			:title="loc('IM_LIST_RECENT_EMPTY_STATE_TITLE')"
			:subtitle="loc('IM_LIST_RECENT_EMPTY_STATE_SUBTITLE')"
		>
			<ChatButton
				v-if="canInviteUsers"
				:size="ButtonSize.L"
				:isRounded="true"
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
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			BaseRecentItem: im_v2_component_list_items_base.BaseRecentItem,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		emits: ['selectChat'],
		data() {
			return {
				isLoading: false,
				isLoadingNextPage: false,
				firstPageLoaded: false
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
			this.contextMenuManager = new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			});
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
			this.getEmitter().subscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
			this.getEmitter().unsubscribe(im_v2_const.EventType.dialog.onCloseChat, this.onCloseChat);
		},
		methods: {
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList(im_v2_const.RecentType.default, dialogId);
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
			onItemRightClick(payload) {
				const {
					item,
					event
				} = payload;
				event.preventDefault();
				const context = {
					dialogId: item.dialogId,
					recentItem: item,
					compactMode: false,
					recentSection: im_v2_const.RecentType.default
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
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #empty-state>
				<RecentEmptyState :title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE')" />
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const RecentList = {
		name: 'RecentList',
		components: {
			ActiveCallList,
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
			this.contextMenuManager = new im_v2_lib_menu.RecentMenu({
				emitter: this.getEmitter()
			});
			this.initLikeManager();
			this.initCreateChatManager();
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		beforeUnmount() {
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
					recentItem: item,
					compactMode: false
				};
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
				this.onClick(item);
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
			@listScroll="onListScroll"
			@loadNextPage="onLoadNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #before-list>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<EmptyState />
			</template>
		</BaseRecentList>
	`
	};

	exports.RecentList = RecentList;
	exports.RecentUnreadList = RecentUnreadList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Service??{}, BX?.Event??{}, BX?.Messenger?.v2?.Application??{}, BX?.Call?.Component??{}, BX?.Messenger?.v2?.Component?.Elements??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Component?.List??{}, BX?.Messenger?.v2?.Lib??{});
//# sourceMappingURL=recent-list.bundle.js.map
