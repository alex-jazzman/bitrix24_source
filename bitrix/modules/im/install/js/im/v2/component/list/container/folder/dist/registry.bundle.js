/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_lib_analytics, im_v2_component_list_items_folder, im_v2_component_list_container_recent, im_v2_component_search, im_v2_const, im_v2_lib_logger, im_v2_component_list_container_elements_filterRow, im_v2_component_list_container_elements_headerMenu, im_v2_component_list_container_elements_vibeCodeCatalogButton, im_v2_lib_feature) {
	'use strict';

	// @vue/component
	const PersonalFolderListContainer = {
		name: 'PersonalFolderListContainer',
		components: {
			PersonalFolderList: im_v2_component_list_items_folder.PersonalFolderList,
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
				searchAreaId: main_core.Text.getRandom(),
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
			},
			// Every personal folder allows the same chats, so the scope of the mode needs no folder id
			// The eligibility mode replaces the section, so it is cleared instead of defaulting to plain chats.
			searchParams() {
				return {
					searchFolderEligible: true
				};
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
		<div
			class="bx-im-list-container-folder__container"
			data-testid="im-list-folder"
			ref="folder-container"
		>
			<div v-if="isFolderLayout" class="bx-im-list-container-folder__header_container" :inert="avatarsOnly || null">
				<div class="bx-im-list-container-folder__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
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
						v-if="isFolderLayout"
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:recentSectionType="null"
						:additionalSearchParams="searchParams"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<KeepAlive>
						<PersonalFolderList
							v-if="isFolderLayout"
							v-show="!searchMode"
							:folderId="folderId"
							@selectChat="onSelectChat"
						/>
					</KeepAlive>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AllFolderListContainer = {
		name: 'AllFolderListContainer',
		components: {
			AllFolderList: im_v2_component_list_items_folder.AllFolderList,
			AllFolderUnreadList: im_v2_component_list_items_folder.AllFolderUnreadList,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: im_v2_component_search.RecentSearch,
			CreateChatMenu: im_v2_component_list_container_recent.CreateChatMenu,
			FilterRow: im_v2_component_list_container_elements_filterRow.FilterRow,
			HeaderMenu: im_v2_component_list_container_elements_headerMenu.HeaderMenu,
			VibeCodeCatalogButton: im_v2_component_list_container_elements_vibeCodeCatalogButton.VibeCodeCatalogButton
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
				searchAreaId: main_core.Text.getRandom(),
				searchMode: false,
				unreadMode: false,
				searchQuery: '',
				isSearchLoading: false
			};
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			SystemFolderCode: () => im_v2_const.SystemFolderCode,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			folder() {
				// This container serves exactly one system folder, so its identity comes from the
				// folder registry and not from the layout the user happens to be on.
				return this.$store.getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.all);
			},
			folderId() {
				return this.folder.id;
			},
			// The folder scope replaces the section, so the section is cleared instead of defaulting to plain chats.
			searchParams() {
				return {
					searchFolderId: this.folderId
				};
			},
			compositionKey() {
				// The union of the list is built from the sections, so the key follows them and not the source
				// codes: a source the user cannot see gives no section and leaves the list as it was. Sorting is
				// required because the same set may arrive from the server in another order.
				const sections = this.$store.getters['recent/folders/getSourceSections'](this.folderId);
				return [...sections].sort().join(',');
			},
			listKey() {
				return `${this.compositionKey}:all`;
			},
			unreadListKey() {
				return `${this.compositionKey}:unread`;
			},
			isShellNavigationAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable);
			},
			filterMode() {
				return this.unreadMode ? im_v2_component_list_container_elements_filterRow.FilterMode.unread : im_v2_component_list_container_elements_filterRow.FilterMode.all;
			},
			// The same counter the funnel of this folder and its badge in the panel show: the folder unites
			// several sections, so the number comes from their set and not from a single recent section.
			unreadCounter() {
				const definitions = this.$store.getters['recent/folders/getSourceDefinitions'](this.folderId);
				return this.$store.getters['counters/getCounterByRecentSections'](definitions);
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: All folder container created');
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.openSearch, this.onOpenSearch);
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onSelectChat(dialogId) {
				// Opening a chat keeps the user in the folder, so the folder layout travels with the event.
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.folderAll,
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
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['all-folder-container']);
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
			},
			onToggleUnreadMode() {
				this.unreadMode = !this.unreadMode;
			},
			onChangeFilterMode(mode) {
				this.unreadMode = mode === im_v2_component_list_container_elements_filterRow.FilterMode.unread;
				if (this.unreadMode) {
					im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode(im_v2_lib_analytics.AnalyticsSection.filterRow);
				}
			}
		},
		// No folder in the registry means the gate went off: there is nothing to build the column from.
		template: `
		<div v-if="folder" class="bx-im-list-container-folder-all__container" data-testid="im-list-folder-all" ref="all-folder-container">
			<!-- In the compact collab peek the header is occluded by the drawer; keep it out of the tab order (mouse there is moot). -->
			<div
				class="bx-im-list-container-folder-all__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
				:inert="avatarsOnly || null"
			>
				<VibeCodeCatalogButton />
				<HeaderMenu
					v-if="!isShellNavigationAvailable"
					data-testid="im-list-folder-all-header-menu-trigger"
					:unreadMode="unreadMode"
					:menuKey="SystemFolderCode.all"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-folder-all__search-input_container">
					<ChatSearchInput
						data-testid="im-list-folder-all-search-input"
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu />
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.default"
				:inert="avatarsOnly || null"
				:aria-hidden="avatarsOnly ? 'true' : null"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-folder-all__elements_container">
				<div class="bx-im-list-container-folder-all__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:recentSectionType="null"
						:additionalSearchParams="searchParams"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<AllFolderList
						v-show="!searchMode && !unreadMode"
						:key="listKey"
						:folderId="folderId"
						@selectChat="onSelectChat"
					/>
					<AllFolderUnreadList
						v-if="unreadMode"
						v-show="!searchMode"
						:key="unreadListKey"
						:folderId="folderId"
						@selectChat="onSelectChat"
					/>
				</div>
			</div>
		</div>
	`
	};

	exports.AllFolderListContainer = AllFolderListContainer;
	exports.PersonalFolderListContainer = PersonalFolderListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
