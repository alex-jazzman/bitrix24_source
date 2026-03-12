/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_lib_draft,im_v2_lib_utils,im_v2_component_elements_listLoadingState,im_v2_component_list_items_recent,im_v2_const,im_v2_provider_service_recent,im_v2_lib_menu) {
	'use strict';

	class AiAssistantRecentService extends im_v2_provider_service_recent.BaseRecentService {
	  getRestMethodName() {
	    return im_v2_const.RestMethod.imV2RecentAiAssistantTail;
	  }
	  getRecentSaveActionName() {
	    return 'recent/setAiAssistant';
	  }
	}

	class AiAssistantRecentMenu extends im_v2_lib_menu.RecentMenu {
	  getMenuItems() {
	    return [this.getUnreadMessageItem(), this.getPinMessageItem(), this.getMuteItem(), this.getHideItem(), this.getLeaveItem()];
	  }
	}

	// @vue/component
	const AiAssistantList = {
	  name: 'AiAssistantList',
	  components: {
	    RecentItem: im_v2_component_list_items_recent.RecentItem,
	    LoadingState: im_v2_component_elements_listLoadingState.ListLoadingState
	  },
	  emits: ['chatClick'],
	  data() {
	    return {
	      isLoading: false,
	      isLoadingNextPage: false
	    };
	  },
	  computed: {
	    collection() {
	      return this.$store.getters['recent/getAiAssistantCollection'];
	    },
	    sortedItems() {
	      return [...this.collection].sort((a, b) => {
	        const firstDate = this.$store.getters['recent/getSortDate'](a.dialogId);
	        const secondDate = this.$store.getters['recent/getSortDate'](b.dialogId);
	        return secondDate - firstDate;
	      });
	    },
	    pinnedItems() {
	      return this.sortedItems.filter(item => {
	        return item.pinned === true;
	      });
	    },
	    generalItems() {
	      return this.sortedItems.filter(item => {
	        return item.pinned === false;
	      });
	    },
	    isEmptyCollection() {
	      return this.collection.length === 0;
	    }
	  },
	  async created() {
	    this.contextMenuManager = new AiAssistantRecentMenu();
	    this.isLoading = true;
	    await this.getRecentService().loadFirstPage();
	    this.isLoading = false;
	    void im_v2_lib_draft.DraftManager.getInstance().initDraftHistory();
	  },
	  beforeUnmount() {
	    this.contextMenuManager.destroy();
	  },
	  methods: {
	    async onScroll(event) {
	      this.contextMenuManager.close();
	      if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.getRecentService().hasMoreItemsToLoad()) {
	        return;
	      }
	      this.isLoadingNextPage = true;
	      await this.getRecentService().loadNextPage();
	      this.isLoadingNextPage = false;
	    },
	    onClick(item) {
	      this.$emit('chatClick', item.dialogId);
	    },
	    onRightClick(item, event) {
	      event.preventDefault();
	      const context = {
	        dialogId: item.dialogId,
	        recentItem: item
	      };
	      this.contextMenuManager.openMenu(context, event.currentTarget);
	    },
	    getRecentService() {
	      if (!this.service) {
	        this.service = new AiAssistantRecentService();
	      }
	      return this.service;
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-ai-assistant__container">
			<LoadingState v-if="isLoading && isEmptyCollection" />
			<div v-else @scroll="onScroll" class="bx-im-list-ai-assistant__scroll-container">
				<div v-if="isEmptyCollection" class="bx-im-list-ai-assistant__empty">
					<div class="bx-im-list-ai-assistant__empty_icon"></div>
					<div class="bx-im-list-ai-assistant__empty_text">
						{{ loc('IM_LIST_COPILOT_EMPTY') }}
					</div>
				</div>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-ai-assistant__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-ai-assistant__general_container">
					<RecentItem
						v-for="item in generalItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<LoadingState v-if="isLoadingNextPage" />
			</div>
		</div>
	`
	};

	exports.AiAssistantList = AiAssistantList;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.List,BX.Messenger.v2.Const,BX.Messenger.v2.Service,BX.Messenger.v2.Lib));
//# sourceMappingURL=ai-assistant-list.bundle.js.map
