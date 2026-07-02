/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, im_v2_component_list_items_task, im_v2_component_list_container_elements_createChatButton, im_v2_component_search, im_v2_const, im_v2_lib_analytics, im_v2_lib_entityCreator, im_v2_lib_logger, im_v2_component_list_container_elements_headerMenu) {
	'use strict';

	// @vue/component
	const TaskListContainer = {
		name: 'TaskListContainer',
		components: {
			TaskList: im_v2_component_list_items_task.TaskList,
			HeaderMenu: im_v2_component_list_container_elements_headerMenu.HeaderMenu,
			ChatSearchInput: im_v2_component_search.ChatSearchInput,
			RecentSearch: im_v2_component_search.RecentSearch,
			TaskUnreadList: im_v2_component_list_items_task.TaskUnreadList,
			CreateChatButton: im_v2_component_list_container_elements_createChatButton.CreateChatButton
		},
		emits: ['selectChat'],
		data() {
			return {
				searchMode: false,
				unreadMode: false,
				searchQuery: '',
				isSearchLoading: false
			};
		},
		computed: {
			RecentType: () => im_v2_const.RecentType,
			layout() {
				return this.$store.getters['application/getLayout'];
			},
			layoutName() {
				return this.layout.name;
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn('List: Task container created');
			main_core.Event.bind(document, 'mousedown', this.onDocumentClick);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'mousedown', this.onDocumentClick);
		},
		methods: {
			onSelectChat(dialogId) {
				this.$emit('selectChat', {
					layoutName: im_v2_const.Layout.taskComments,
					dialogId
				});
			},
			onCreateClick() {
				new im_v2_lib_entityCreator.EntityCreator().openTaskCreationForm();
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
			onLoading(value) {
				this.isSearchLoading = value;
			},
			onOpenSearchItem(event) {
				const {
					dialogId
				} = event;
				this.onSelectChat(dialogId);
			},
			onDocumentClick(event) {
				const clickOnRecentContainer = event.composedPath().includes(this.$refs['task-container']);
				if (this.searchMode && !clickOnRecentContainer) {
					this.onCloseSearch();
					im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
				}
			},
			onToggleUnreadMode() {
				this.$store.dispatch('recent/clearUnreadCollection', {
					type: im_v2_const.RecentType.taskComments
				});
				this.unreadMode = !this.unreadMode;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-list-container-task__container" ref="task-container">
			<div class="bx-im-list-container-task__header_container">
				<HeaderMenu
					:unreadMode="unreadMode"
					:recentSection="RecentType.taskComments"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-task__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="loc('IM_LIST_CONTAINER_TASK_SEARCH_INPUT_PLACEHOLDER')"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatButton @click="onCreateClick" />
			</div>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.taskComments"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<TaskList v-if="!unreadMode" @selectChat="onSelectChat" />
					<TaskUnreadList v-else @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`
	};

	exports.TaskListContainer = TaskListContainer;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component.List, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.List);
//# sourceMappingURL=task-container.bundle.js.map
