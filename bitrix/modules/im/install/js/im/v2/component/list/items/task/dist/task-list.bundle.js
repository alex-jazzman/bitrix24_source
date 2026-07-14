/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_list_items_base, im_v2_const, im_v2_lib_draft, im_v2_provider_service_recent, im_v2_lib_menu, im_v2_component_list_items_elements_emptyState, im_v2_lib_unreadMode) {
	'use strict';

	class TaskRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getHideItem()];
		}
	}

	// @vue/component
	const EmptyState = {
		name: 'EmptyState',
		components: {
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		computed: {
			RecentType: () => im_v2_const.RecentType
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<RecentEmptyState 
			:title="loc('IM_LIST_TASK_EMPTY_STATE_TITLE_MSGVER_1')"
			:subtitle="loc('IM_LIST_TASK_EMPTY_STATE_SUBTITLE')"
			:recentSection="RecentType.taskComments"
		/>
	`
	};

	// @vue/component
	const TaskUnreadList = {
		name: 'TaskUnreadList',
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
					type: im_v2_const.RecentType.taskComments
				});
			}
		},
		async created() {
			this.contextMenuManager = new TaskRecentMenu({
				emitter: this.getEmitter()
			});
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
					type: im_v2_const.RecentType.taskComments
				});
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: [im_v2_const.RecentType.taskComments],
					dialogId
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getTaskUnreadService().loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getTaskUnreadService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				await this.getTaskUnreadService().loadNextPage();
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
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			getTaskUnreadService() {
				if (!this.service) {
					this.service = new im_v2_provider_service_recent.TaskRecentService({
						unreadMode: true,
						parentChatId: im_v2_const.ParentChatScope.all
					});
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
				<RecentEmptyState 
					:title="loc('IM_LIST_TASK_UNREAD_EMPTY_STATE_TITLE_MSGVER_1')"
					:subtitle="loc('IM_LIST_TASK_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	// @vue/component
	const TaskList = {
		name: 'TaskList',
		components: {
			EmptyState,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList
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
				return this.$store.getters['recent/getSortedCollection']({
					type: im_v2_const.RecentType.taskComments
				});
			}
		},
		async created() {
			this.contextMenuManager = new TaskRecentMenu({
				emitter: this.getEmitter()
			});
			await this.loadInitialItems();
			void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
		},
		beforeUnmount() {
			this.contextMenuManager.destroy();
		},
		methods: {
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				await this.getRecentService().loadFirstPage();
				this.firstPageLoaded = true;
				this.isLoading = false;
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
				this.contextMenuManager.openMenu(context, {
					left: event.pageX,
					top: event.pageY
				});
			},
			onCloseMenu() {
				this.contextMenuManager.close();
			},
			getRecentService() {
				if (!this.service) {
					this.service = new im_v2_provider_service_recent.TaskRecentService({
						parentChatId: im_v2_const.ParentChatScope.all
					});
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
				<EmptyState />
			</template>
		</BaseRecentList>
	`
	};

	exports.TaskList = TaskList;
	exports.TaskUnreadList = TaskUnreadList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Messenger.v2.Component.List, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib);
//# sourceMappingURL=task-list.bundle.js.map
