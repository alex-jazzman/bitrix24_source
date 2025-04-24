/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core,im_v2_lib_logger,im_v2_provider_service,im_v2_component_content_elements,im_v2_component_textarea) {
	'use strict';

	// @vue/component
	const TaskChatOpener = {
	  name: 'TaskChatOpener',
	  components: {
	    BaseChatContent: im_v2_component_content_elements.BaseChatContent,
	    ChatTextarea: im_v2_component_textarea.ChatTextarea
	  },
	  props: {
	    chatId: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    dialog() {
	      return this.$store.getters['chats/getByChatId'](this.chatId, true);
	    },
	    dialogId() {
	      return this.dialog.dialogId;
	    }
	  },
	  created() {
	    void this.onChatOpen();
	  },
	  methods: {
	    async onChatOpen() {
	      if (this.dialog.inited) {
	        im_v2_lib_logger.Logger.warn(`TaskChatOpener: chat ${this.chatId} is already loaded`);
	        // Analytics.getInstance().onOpenChat(this.dialog);

	        return;
	      }
	      await this.loadChat();
	      // Analytics.getInstance().onOpenChat(this.dialog);
	    },

	    async loadChat() {
	      im_v2_lib_logger.Logger.warn(`TaskChatOpener: loading chat ${this.chatId}`);
	      await this.getChatService().loadChatByChatId(this.chatId);
	      im_v2_lib_logger.Logger.warn(`TaskChatOpener: chat ${this.chatId} is loaded`);
	    },
	    getChatService() {
	      if (!this.chatService) {
	        this.chatService = new im_v2_provider_service.ChatService();
	      }
	      return this.chatService;
	    }
	  },
	  template: `
		<div class="bx-im-messenger__scope bx-im-task-chat-opener__container">
			<div v-if="!dialog.inited">...</div>
			<BaseChatContent v-else :dialogId="dialogId" :withHeader="false" :withSidebar="false">
				<template #textarea="{ onTextareaMount }">
					<ChatTextarea
						:dialogId="dialogId"
						:key="dialogId"
						:withMarket="false"
						:withAudioInput="false"
						@mounted="onTextareaMount"
					/>
				</template>
			</BaseChatContent>
		</div>
	`
	};

	const APPLICATION_NAME = 'TaskChatApplication';
	var _initPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initPromise");
	var _config = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("config");
	var _init = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("init");
	class TaskApplication {
	  constructor(config = {}) {
	    Object.defineProperty(this, _init, {
	      value: _init2
	    });
	    Object.defineProperty(this, _initPromise, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _config, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _config)[_config] = config;
	    babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise] = babelHelpers.classPrivateFieldLooseBase(this, _init)[_init]();
	  }
	  ready() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _initPromise)[_initPromise];
	  }
	  async render(node) {
	    await this.ready();
	    const outerConfig = babelHelpers.classPrivateFieldLooseBase(this, _config)[_config];
	    return im_v2_application_core.Core.createVue(this, {
	      name: APPLICATION_NAME,
	      el: node,
	      components: {
	        TaskChatOpener
	      },
	      data() {
	        return {
	          config: outerConfig
	        };
	      },
	      template: `<TaskChatOpener :chatId="${babelHelpers.classPrivateFieldLooseBase(this, _config)[_config].chatId}" :config="config" />`
	    });
	  }
	}
	async function _init2() {
	  await im_v2_application_core.Core.ready();
	  return this;
	}

	exports.TaskApplication = TaskApplication;

}((this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}),BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Messenger.v2.Component.Content,BX.Messenger.v2.Component));
//# sourceMappingURL=task.bundle.js.map
