/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Component = this.BX.OpenLines.v2.Component || {};
(function (exports, main_core, im_v2_component_search, im_v2_const, imopenlines_v2_component_list_items_recent, imopenlines_v2_component_search) {
	'use strict';

	// @vue/component
	const RecentListContainer = {
		name: 'RecentListContainer',
		components: {
			RecentList: imopenlines_v2_component_list_items_recent.RecentList,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: imopenlines_v2_component_search.RecentSearch
		},
		emits: ['selectChat'],
		data() {
			return {
				searchMode: false,
				searchQuery: '',
				isSearchLoading: false
			};
		},
		created() {
			const messengerAppSettings = main_core.Extension.getSettings('im.v2.application.messenger');
			const messengerComponentSettings = main_core.Extension.getSettings('im.v2.component.messenger');
			this.$store.dispatch('openLines/queue/set', messengerAppSettings.get('queueConfig'));
			this.$store.dispatch('openLines/queue/setIsLinesOperator', messengerComponentSettings.get('isLinesOperator', false));
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onSearchLoading(value) {
				this.isSearchLoading = value;
			},
			onChatClick(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.openlinesV2,
					dialogId
				});
			},
			onOpenSearch() {
				this.searchMode = true;
			},
			onCloseSearch() {
				this.searchMode = false;
				this.searchQuery = '';
			},
			onDocumentClick(event) {
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['recent-container']);
				if (this.searchMode && !clickOnRecentContainer) {
					this.onCloseSearch();
				}
			},
			onUpdateSearch(query) {
				this.searchMode = true;
				this.searchQuery = query;
			},
			onOpenSearchItem(event) {
				const {
					dialogId
				} = event;
				const chat = this.$store.getters['chats/get'](dialogId);
				const isOpenLinesChat = chat && chat.type === im_v2_const.ChatType.lines;
				const layoutName = isOpenLinesChat ? im_v2_const.Layout.openlinesV2 : im_v2_const.Layout.chat;
				this.$emit('selectChat', {
					layoutName,
					dialogId
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			ref="recent-container"
			class="bx-imol-list-container-recent__container bx-imol-messenger__scope"
		>
			<div class="bx-imol-list-container-recent__header_container">
				<div class="bx-imol-list-container-recent__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="loc('IMOL_LIST_RECENT_CONTAINER_SEARCH_PLACEHOLDER')"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
			</div>
			<div class="bx-imol-list-container-recent__elements_container">
				<div class="bx-imol-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-show="!searchMode" @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`
	};

	exports.RecentListContainer = RecentListContainer;

})(this.BX.OpenLines.v2.Component.List = this.BX.OpenLines.v2.Component.List || {}, BX, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.OpenLines.v2.Component.List, BX.Messenger.v2.Openlines.Component);
//# sourceMappingURL=recent.bundle.js.map
