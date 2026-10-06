/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_lib_analytics, im_v2_component_list_items_folder, im_v2_component_list_container_recent, im_v2_component_search, im_v2_const, im_v2_lib_logger) {
	'use strict';

	// @vue/component
	const FolderListContainer = {
		name: 'FolderListContainer',
		components: {
			FolderChatList: im_v2_component_list_items_folder.FolderChatList,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: im_v2_component_search.RecentSearch,
			CreateChatMenu: im_v2_component_list_container_recent.CreateChatMenu
		},
		provide() {
			return {
				avatarsOnly: ui_vue3.computed(() => this.avatarsOnly)
			};
		},
		props: {
			avatarsOnly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['selectChat'],
		data() {
			return {
				searchMode: false,
				searchQuery: '',
				isSearchLoading: false
			};
		},
		computed: {
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			isFolderLayout() {
				return this.layoutName === im_v2_const.Layout.folder;
			},
			folderId() {
				return this.layout.params.folderId;
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Folder container created');
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.folder,
					dialogId
				});
			},
			onOpenSearch() {
				if (!this.searchMode) {
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onOpen(this.layoutName);
				}
				this.searchMode = true;
			},
			onCloseSearch() {
				this.searchMode = false;
				this.searchQuery = '';
			},
			onCloseRecentSearch() {
				im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				this.onCloseSearch();
			},
			onUpdateSearch(query) {
				this.searchMode = true;
				this.searchQuery = query;
			},
			onDocumentClick(event) {
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['folder-container']);
				if (this.searchMode && !clickOnRecentContainer) {
					this.onCloseSearch();
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				}
			},
			onSearchLoading(value) {
				this.isSearchLoading = value;
			},
			onOpenSearchItem(event) {
				const {
					dialogId
				} = event;
				this.onSelectChat(dialogId);
			}
		},
		template: `
		<div v-if="isFolderLayout" class="bx-im-list-container-folder__container" ref="folder-container">
			<div class="bx-im-list-container-folder__header_container">
				<div class="bx-im-list-container-folder__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu />
			</div>
			<div class="bx-im-list-container-folder__elements_container">
				<div class="bx-im-list-container-folder__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<FolderChatList
						v-show="!searchMode"
						:folderId="folderId"
						:key="folderId"
						@selectChat="onSelectChat"
					/>
				</div>
			</div>
		</div>
	`
	};

	exports.FolderListContainer = FolderListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=folder-container.bundle.js.map
