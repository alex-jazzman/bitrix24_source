/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_component_list_container_copilot,im_v2_lib_feature,im_public,im_v2_component_list_items_aiAssistant,im_v2_const,im_v2_lib_logger,im_v2_provider_service_aiAssistant,im_v2_lib_permission) {
	'use strict';

	// @vue/component
	const AiAssistantListContainer = {
	  name: 'AiAssistantListContainer',
	  components: {
	    AiAssistantList: im_v2_component_list_items_aiAssistant.AiAssistantList
	  },
	  emits: ['selectEntity'],
	  data() {
	    return {
	      isCreatingChat: false
	    };
	  },
	  computed: {
	    canCreate() {
	      return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.createAiAssistant);
	    }
	  },
	  created() {
	    im_v2_lib_logger.Logger.warn('List: AiAssistant container created');
	  },
	  methods: {
	    onChatClick(dialogId) {
	      this.$emit('selectEntity', {
	        layoutName: im_v2_const.Layout.aiAssistant,
	        entityId: dialogId
	      });
	    },
	    getAiAssistantService() {
	      if (!this.aiAssistantService) {
	        this.aiAssistantService = new im_v2_provider_service_aiAssistant.AiAssistantService();
	      }
	      return this.aiAssistantService;
	    },
	    async onCreateChatClick() {
	      this.isCreatingChat = true;
	      const newDialogId = await this.getAiAssistantService().createChat().catch(() => {
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
		<div class="bx-im-list-container-ai-assistant__container">
			<div class="bx-im-list-container-ai-assistant__header_container">
				<div class="bx-im-list-container-ai-assistant__header_title">Marta AI</div>
				<div
					v-if="canCreate"
					class="bx-im-list-container-ai-assistant__create-chat"
					:class="{ '--loading': isCreatingChat }"
					@click="onCreateChatClick"
				>
					<div class="bx-im-list-container-ai-assistant__create-chat_icon"></div>
				</div>
			</div>
			<div class="bx-im-list-container-ai-assistant__elements_container">
				<div class="bx-im-list-container-ai-assistant__elements">
					<AiAssistantList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const AiAssistantListRouter = {
	  name: 'AiAssistantListRouter',
	  components: {
	    CopilotListContainer: im_v2_component_list_container_copilot.CopilotListContainer,
	    AiAssistantListContainer
	  },
	  computed: {
	    isAvailable() {
	      return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.aiAssistantChatAvailable);
	    }
	  },
	  template: `
		<AiAssistantListContainer v-if="isAvailable" />
		<CopilotListContainer v-else />
	`
	};

	exports.AiAssistantListRouter = AiAssistantListRouter;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Component.List,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.List,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Lib));
//# sourceMappingURL=ai-assistant-router.bundle.js.map
