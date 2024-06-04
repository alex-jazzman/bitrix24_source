/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_provider_service,im_v2_component_message_base) {
	'use strict';

	// @vue/component
	const ChatCopilotCreationMessage = {
	  name: 'ChatCopilotCreationMessage',
	  components: {
	    BaseMessage: im_v2_component_message_base.BaseMessage
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    message() {
	      return this.item;
	    },
	    preparedTitle() {
	      var _this$message$compone;
	      const phrase = (_this$message$compone = this.message.componentParams) != null && _this$message$compone.copilotRoleUpdated ? 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE_AFTER_CHANGE' : 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE';
	      return this.loc(phrase, {
	        '#COPILOT_ROLE_NAME#': this.role.name
	      });
	    },
	    promptList() {
	      return this.$store.getters['copilot/messages/getPrompts'](this.message.id);
	    },
	    role() {
	      return this.$store.getters['copilot/messages/getRole'](this.message.id);
	    },
	    roleAvatar() {
	      return this.role.avatar.medium;
	    },
	    roleName() {
	      return this.role.name;
	    }
	  },
	  methods: {
	    onMessageClick(prompt) {
	      void this.getSendingService().sendCopilotPrompt({
	        text: prompt.text,
	        copilot: {
	          promptCode: prompt.code
	        },
	        dialogId: this.dialogId
	      });
	    },
	    getSendingService() {
	      if (!this.sendingService) {
	        this.sendingService = im_v2_provider_service.SendingService.getInstance();
	      }
	      return this.sendingService;
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withReactions="false"
			:withBackground="false"
		>
			<div class="bx-im-message-copilot-creation__container">
				<div class="bx-im-message-copilot-creation__header">
					<div class="bx-im-message-copilot-creation__avatar">
						<img :src="roleAvatar" :alt="roleName"/>
					</div>
					<div class="bx-im-message-copilot-creation__info">
						<div class="bx-im-message-copilot-creation__title" :title="preparedTitle">
							{{ preparedTitle }}
						</div>
						<div 
							class="bx-im-message-copilot-creation__text" 
							:title="loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC')"
						>
							{{ loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC') }}
						</div>
					</div>
				</div>
				<div class="bx-im-message-copilot-creation__separator"><div></div></div>
				<div class="bx-im-message-copilot-creation__actions">
					<div
						v-for="prompt in promptList"
						:key="prompt.code"
						@click="onMessageClick(prompt)"
						class="bx-im-message-copilot-creation__action"
					>
						<span class="bx-im-message-copilot-creation__action-text">
							{{ prompt.title }}
						</span>
					</div>
				</div>
			</div>
		</BaseMessage>
	`
	};

	exports.ChatCopilotCreationMessage = ChatCopilotCreationMessage;

}((this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}),BX.Messenger.v2.Provider.Service,BX.Messenger.v2.Component.Message));
//# sourceMappingURL=copilot-creation.bundle.js.map
