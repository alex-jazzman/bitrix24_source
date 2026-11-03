/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, im_v2_component_list_items_base, im_v2_component_list_items_elements_activeCallList, im_v2_component_list_items_elements_emptyState, im_v2_lib_draft, im_v2_lib_menu, im_v2_const, im_v2_provider_service_recent, im_v2_lib_unreadMode) {
	'use strict';

	// Same rows a folder offers, minus "add to folder": an application chat cannot be put into a
	// personal folder, so offering the target picker here would only lead to a rejected move.
	class VibecodeAppRecentMenu extends im_v2_lib_menu.RecentMenu {
		getMenuItems() {
			return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem()];
		}
	}

	// Tail loader for the system "Applications" folder.
	// The folder holds exactly one recent section (RecentType.vibecodeApp), so the sectioned path of the
	// base class fits as is: saveRecentItems() and getCollection() are deliberately NOT overridden.
	class VibecodeAppRecentService extends im_v2_provider_service_recent.BaseRecentService {
		#folderId;
		constructor(props) {
			super(props);
			this.#folderId = props.folderId;
		}
		getRestMethodName(firstPage) {
			return im_v2_const.RestMethod.imV2FolderRecentTail;
		}
		getQueryParams(firstPage = false) {
			return {
				folderId: this.#folderId,
				limit: this.getItemsPerPage(),
				filter: this.getRequestFilter(firstPage)
			};
		}
		getRecentType() {
			return im_v2_const.RecentType.vibecodeApp;
		}
	}

	class VibecodeAppUnreadService extends im_v2_provider_service_recent.BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.vibecodeApp;
		}
	}

	// @vue/component
	const VibecodeAppUnreadList = {
		name: 'VibecodeAppUnreadList',
		components: {
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
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
					type: im_v2_const.RecentType.vibecodeApp
				});
			}
		},
		async created() {
			this.contextMenuManager = new VibecodeAppRecentMenu({
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
					type: im_v2_const.RecentType.vibecodeApp
				});
			},
			onCloseChat(event) {
				const {
					dialogId
				} = event.getData();
				im_v2_lib_unreadMode.UnreadModeManager.removeItemFromList({
					recentSections: [im_v2_const.RecentType.vibecodeApp],
					dialogId
				});
			},
			async loadInitialItems() {
				if (this.firstPageLoaded || this.isLoading) {
					return;
				}
				this.isLoading = true;
				try {
					await this.getUnreadService().loadFirstPage();
					this.firstPageLoaded = true;
				} finally {
					this.isLoading = false;
				}
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getUnreadService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				try {
					await this.getUnreadService().loadNextPage();
				} finally {
					this.isLoadingNextPage = false;
				}
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
			getUnreadService() {
				if (!this.service) {
					this.service = new VibecodeAppUnreadService({
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
			:contextMenuManager="contextMenuManager"
			data-testid="vibecode-app-unread-chat-list"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #empty-state>
				<RecentEmptyState
					:title="loc('IM_LIST_VIBECODE_APP_UNREAD_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_VIBECODE_APP_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`
	};

	// Chat list of the system "Applications" folder. Personal folders keep their own list untouched:
	// their composition is stored in the folder definition, ours is a recent section, and the two
	// readings have nothing in common beyond the universal wiring of BaseRecentList.
	// @vue/component
	const VibecodeAppList = {
		name: 'VibecodeAppList',
		components: {
			ActiveCallList: im_v2_component_list_items_elements_activeCallList.ActiveCallList,
			BaseRecentList: im_v2_component_list_items_base.BaseRecentList,
			RecentEmptyState: im_v2_component_list_items_elements_emptyState.RecentEmptyState
		},
		props: {
			folderId: {
				type: Number,
				required: true
			}
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
			folder() {
				return this.$store.getters['recent/folders/getById'](this.folderId);
			},
			collection() {
				// The folder definition of a system folder carries no chat list: membership is the recent
				// section, and that is exactly where the tail service writes the loaded rows.
				const recentSection = this.folder?.definition?.recentSection;
				if (!recentSection) {
					return [];
				}
				return this.$store.getters['recent/getSortedCollection']({
					type: recentSection
				});
			}
		},
		async created() {
			this.contextMenuManager = ui_vue3.markRaw(new VibecodeAppRecentMenu({
				emitter: this.getEmitter()
			}));
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
				try {
					await this.getRecentService().loadFirstPage();
					this.firstPageLoaded = true;
				} finally {
					this.isLoading = false;
				}
			},
			onListScroll(isScrolled) {
				this.listIsScrolled = isScrolled;
			},
			async onLoadNextPage() {
				if (this.isLoadingNextPage || !this.getRecentService().hasMoreItemsToLoad()) {
					return;
				}
				this.isLoadingNextPage = true;
				try {
					await this.getRecentService().loadNextPage();
				} finally {
					this.isLoadingNextPage = false;
				}
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
			onCallClick({
				item
			}) {
				this.onSelectChat(item.dialogId);
			},
			getRecentService() {
				if (!this.service) {
					this.service = new VibecodeAppRecentService({
						folderId: this.folderId
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
		// The empty state carries no "add chats" button on purpose: the composition of the system folder
		// is not filled by hand, it follows the application chats the user has access to (AC-025).
		template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			:contextMenuManager="contextMenuManager"
			data-testid="vibecode-app-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<RecentEmptyState
					:title="loc('IM_LIST_VIBECODE_APP_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_VIBECODE_APP_EMPTY_STATE_SUBTITLE')"
					imageModifier="folder"
				/>
			</template>
		</BaseRecentList>
	`
	};

	exports.VibecodeAppList = VibecodeAppList;
	exports.VibecodeAppUnreadList = VibecodeAppUnreadList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Service, BX.Messenger.v2.Lib);
//# sourceMappingURL=vibecode-app-list.bundle.js.map
