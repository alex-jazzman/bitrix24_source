/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_public,im_v2_component_list_items_copilot,im_v2_const,im_v2_lib_analytics,im_v2_lib_logger,im_v2_provider_service_copilot,im_v2_lib_permission) {
	'use strict';

	// @vue/component
	const CopilotListContainer = {
	  name: 'CopilotListContainer',
	  components: {
	    CopilotList: im_v2_component_list_items_copilot.CopilotList
	  },
	  emits: ['selectEntity'],
	  data() {
	    return {
	      isCreatingChat: false
	    };
	  },
	  computed: {
	    canCreate() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createCopilot);
	    }
	  },
	  created() {
	    im_v2_lib_logger.Logger.warn('List: Copilot container created');
	  },
	  methods: {
	    async onCreateChatClick() {
	      im_v2_lib_analytics.Analytics.getInstance().chatCreate.onStartClick(im_v2_const.ChatType.copilot);
	      await this.createChat();
	    },
	    onChatClick(dialogId) {
	      this.$emit('selectEntity', {
	        layoutName: im_v2_const.Layout.copilot,
	        entityId: dialogId
	      });
	    },
	    getCopilotService() {
	      if (!this.copilotService) {
	        this.copilotService = new im_v2_provider_service_copilot.CopilotService();
	      }
	      return this.copilotService;
	    },
	    async createChat(roleCode) {
	      this.isCreatingChat = true;
	      const newDialogId = await this.getCopilotService().createChat({
	        roleCode
	      }).catch(() => {
	        this.isCreatingChat = false;
	      });
	      this.isCreatingChat = false;
	      void im_public.Messenger.openCopilot(newDialogId);
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">{{ loc('IM_LIST_CONTAINER_COPILOT_HEADER') }}</div>
				<div
					v-if="canCreate"
					class="bx-im-list-container-copilot__create-chat"
					:class="{'--loading': isCreatingChat}"
					ref="createChatButton"
					@click="onCreateChatClick"
				>
					<div class="bx-im-list-container-copilot__create-chat_icon"></div>
				</div>
			</div>
			<div class="bx-im-list-container-copilot__elements_container">
				<div class="bx-im-list-container-copilot__elements">
					<CopilotList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`
	};

	exports.CopilotListContainer = CopilotListContainer;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Component.List,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib));
//# sourceMappingURL=copilot-container.bundle.js.map
