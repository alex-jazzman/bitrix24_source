/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,main_core,im_v2_component_list_items_task,im_v2_lib_analytics,im_v2_lib_logger,im_v2_lib_entityCreator,im_v2_component_search,im_v2_component_list_container_elements_baseHeaderMenu,im_v2_component_elements_menu,im_v2_const,im_v2_provider_service_chat) {
	'use strict';

	// @vue/component
	const HeaderMenu = {
	  name: 'HeaderMenu',
	  components: {
	    BaseHeaderMenu: im_v2_component_list_container_elements_baseHeaderMenu.BaseHeaderMenu,
	    MenuItem: im_v2_component_elements_menu.MenuItem
	  },
	  methods: {
	    async onReadAllClick(closeCallback) {
	      new im_v2_provider_service_chat.ChatService().readAllByType(im_v2_const.ChatType.taskComments);
	      closeCallback();
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<BaseHeaderMenu>
			<template #menu-items="{ closeCallback }">
				<MenuItem
					:title="loc('IM_LIST_CONTAINER_TASK_HEADER_MENU_READ_ALL')"
					@click="onReadAllClick(closeCallback)"
				/>
			</template>
		</BaseHeaderMenu>
	`
	};

	// @vue/component
	const TaskListContainer = {
	  name: 'TaskListContainer',
	  components: {
	    TaskList: im_v2_component_list_items_task.TaskList,
	    HeaderMenu,
	    ChatSearchInput: im_v2_component_search.ChatSearchInput,
	    RecentSectionSearch: im_v2_component_search.RecentSectionSearch
	  },
	  emits: ['selectEntity'],
	  data() {
	    return {
	      searchMode: false,
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
	    onChatClick(dialogId) {
	      this.$emit('selectEntity', {
	        layoutName: im_v2_const.Layout.taskComments,
	        entityId: dialogId
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
	      this.onChatClick(dialogId);
	    },
	    onDocumentClick(event) {
	      const clickOnRecentContainer = event.composedPath().includes(this.$refs['task-container']);
	      if (this.searchMode && !clickOnRecentContainer) {
	        this.onCloseSearch();
	        im_v2_lib_analytics.Analytics.getInstance().recentSearch.onClose(this.layoutName);
	      }
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-container-task__container" ref="task-container">
			<div class="bx-im-list-container-task__header_container">
				<HeaderMenu />
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
				<div @click="onCreateClick" class="bx-im-list-container-task__header_create-task"></div>
			</div>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<RecentSectionSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSection="RecentType.taskComments"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<TaskList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`
	};

	exports.TaskListContainer = TaskListContainer;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX,BX.Messenger.v2.Component.List,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Const,BX.Messenger.v2.Service));
//# sourceMappingURL=task-container.bundle.js.map
