/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_application_core,im_v2_const) {
	'use strict';

	class AiAssistantManager {
	  constructor() {
	    this.store = im_v2_application_core.Core.getStore();
	  }
	  isAiAssistantBot(userId) {
	    return this.store.getters['users/bots/isAiAssistant'](userId);
	  }
	  isAiAssistantChat(dialogId) {
	    var _this$store$getters$c;
	    const type = (_this$store$getters$c = this.store.getters['chats/get'](dialogId)) == null ? void 0 : _this$store$getters$c.type;
	    return [im_v2_const.ChatType.aiAssistant, im_v2_const.ChatType.aiAssistantEntity].includes(type);
	  }
	}

	exports.AiAssistantManager = AiAssistantManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=ai-assistant.bundle.js.map
