/* eslint-disable */
this.BX = this.BX || {};
this.BX.IM = this.BX.IM || {};
this.BX.IM.V2 = this.BX.IM.V2 || {};
this.BX.IM.V2.Component = this.BX.IM.V2.Component || {};
this.BX.IM.V2.Component.List = this.BX.IM.V2.Component.List || {};
(function (exports, main_core, main_core_events, ui_vue3, im_v2_component_list_container_elements_filterRow, im_v2_component_list_items_vibecodeApp, im_v2_component_search, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_logger) {
	'use strict';

	// The layout resolver only carries the folder code, while the list works with the folder id,
	// so the container is the place where the code is turned into the identifier.
	//
	// The surrounding chrome — own root element, header with the search input, positioned element
	// box — is not decoration: the list column is laid out by these three elements, and a bare list
	// leaves a gap beside the column and an empty strip where the header belongs.
	// @vue/component
	const VibecodeAppListContainer = {
		name: 'VibecodeAppListContainer',
		components: {
			VibecodeAppList: im_v2_component_list_items_vibecodeApp.VibecodeAppList,
			VibecodeAppUnreadList: im_v2_component_list_items_vibecodeApp.VibecodeAppUnreadList,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			FilterRow: im_v2_component_list_container_elements_filterRow.FilterRow,
			RecentSearch: im_v2_component_search.RecentSearch
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
			folder() {
				return this.$store.getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.vibecodeApp);
			},
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			},
			isShellNavigationAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable);
			},
			filterMode() {
				return this.unreadMode ? im_v2_component_list_container_elements_filterRow.FilterMode.unread : im_v2_component_list_container_elements_filterRow.FilterMode.all;
			},
			unreadCounter() {
				return this.$store.getters['counters/getCounterByRecentType'](im_v2_const.RecentType.vibecodeApp);
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Vibecode app container created');
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
					layoutName: im_v2_const.Layout.vibecodeApp,
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
			onSearchLoading(value) {
				this.isSearchLoading = value;
			},
			onOpenSearchItem(event) {
				this.onSelectChat(event.dialogId);
			},
			onChangeFilterMode(mode) {
				this.unreadMode = mode === im_v2_component_list_container_elements_filterRow.FilterMode.unread;
				if (this.unreadMode) {
					im_v2_lib_analytics.Analytics.getInstance().recentHeaderMenu.onOpenVibecodeAppUnreadMode(im_v2_lib_analytics.AnalyticsSection.filterRow);
				}
			},
			onDocumentClick(event) {
				const clickOnContainer = event.composedPath().includes(this.$refs['vibecode-app-container']);
				if (this.searchMode && !clickOnContainer) {
					this.onCloseSearch();
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				}
			}
		},
		// No folder means the gate is off or the code did not pass validation: nothing to render.
		// There is no chat creation control on purpose: the composition of the system folder is not
		// filled by hand, it follows the application chats the user has access to (AC-025).
		template: `
		<div v-if="folder" class="bx-im-list-container-vibecode-app__container" data-testid="im-list-vibecode-app" ref="vibecode-app-container">
			<div
				class="bx-im-list-container-vibecode-app__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
			>
				<div class="bx-im-list-container-vibecode-app__search-input_container">
					<ChatSearchInput
						data-testid="im-list-vibecode-app-search-input"
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.vibecodeApp"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-vibecode-app__elements_container">
				<div class="bx-im-list-container-vibecode-app__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.vibecodeApp"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<VibecodeAppList
						v-show="!searchMode && !unreadMode"
						:folderId="folder.id"
						:key="folder.id"
						@selectChat="onSelectChat"
					/>
					<VibecodeAppUnreadList
						v-if="unreadMode"
						v-show="!searchMode"
						@selectChat="onSelectChat"
					/>
				</div>
			</div>
		</div>
	`
	};

	exports.VibecodeAppListContainer = VibecodeAppListContainer;

})(this.BX.IM.V2.Component.List.Container = this.BX.IM.V2.Component.List.Container || {}, BX, BX.Event, BX.Vue3, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=vibecode-app.bundle.js.map
