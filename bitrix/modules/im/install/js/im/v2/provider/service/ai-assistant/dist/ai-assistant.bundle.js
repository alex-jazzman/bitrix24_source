/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_const,im_v2_provider_service_chat) {
	'use strict';

	class AiAssistantService {
	  async createChat() {
	    const chatService = new im_v2_provider_service_chat.ChatService();
	    const {
	      newDialogId
	    } = await chatService.createChat({
	      type: im_v2_const.ChatType.aiAssistant
	    });
	    await chatService.loadChatWithMessages(newDialogId);
	    return newDialogId;
	  }
	}

	exports.AiAssistantService = AiAssistantService;

}((this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}),BX.Messenger.v2.Const,BX.Messenger.v2.Service));
//# sourceMappingURL=ai-assistant.bundle.js.map
