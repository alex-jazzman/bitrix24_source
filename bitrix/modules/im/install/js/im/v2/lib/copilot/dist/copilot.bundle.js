/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,im_v2_const,im_v2_application_core) {
	'use strict';

	class CopilotManager {
	  constructor() {
	    this.store = im_v2_application_core.Core.getStore();
	  }
	  async handleRecentListResponse(copilotData) {
	    if (!copilotData) {
	      return Promise.resolve();
	    }
	    const {
	      recommendedRoles,
	      roles,
	      chats,
	      messages
	    } = copilotData;
	    if (!roles) {
	      return Promise.resolve();
	    }
	    return Promise.all([this.store.dispatch('copilot/chats/add', chats), this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/setRecommendedRoles', recommendedRoles), this.store.dispatch('copilot/messages/add', messages)]);
	  }
	  async handleChatLoadResponse(copilotData) {
	    if (!copilotData) {
	      return Promise.resolve();
	    }
	    const {
	      aiProvider,
	      chats,
	      roles,
	      messages
	    } = copilotData;
	    if (!roles) {
	      return Promise.resolve();
	    }
	    return Promise.all([this.store.dispatch('copilot/setProvider', aiProvider), this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/add', chats), this.store.dispatch('copilot/messages/add', messages)]);
	  }
	  async handleRoleUpdate(copilotData) {
	    const {
	      chats,
	      roles
	    } = copilotData;
	    if (!roles) {
	      return Promise.resolve();
	    }
	    return Promise.all([this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/add', chats)]);
	  }
	  async handleMessageAdd(copilotData) {
	    const {
	      chats,
	      roles,
	      messages
	    } = copilotData;
	    if (!roles) {
	      return Promise.resolve();
	    }
	    return Promise.all([this.store.dispatch('copilot/roles/add', roles), this.store.dispatch('copilot/chats/add', chats), this.store.dispatch('copilot/messages/add', messages)]);
	  }
	  getRoleAvatarUrl({
	    avatarDialogId,
	    contextDialogId
	  }) {
	    if (!this.isCopilotChatOrBot(avatarDialogId)) {
	      return '';
	    }
	    return this.store.getters['copilot/chats/getRoleAvatar'](contextDialogId);
	  }
	  isCopilotBot(userId) {
	    return this.store.getters['users/bots/isCopilot'](userId);
	  }
	  isCopilotChat(dialogId) {
	    var _this$store$getters$c;
	    return ((_this$store$getters$c = this.store.getters['chats/get'](dialogId)) == null ? void 0 : _this$store$getters$c.type) === im_v2_const.ChatType.copilot;
	  }
	  isCopilotChatOrBot(dialogId) {
	    return this.isCopilotChat(dialogId) || this.isCopilotBot(dialogId);
	  }
	  getMessageRoleAvatar(messageId) {
	    var _this$store$getters$c2, _this$store$getters$c3;
	    return (_this$store$getters$c2 = this.store.getters['copilot/messages/getRole'](messageId)) == null ? void 0 : (_this$store$getters$c3 = _this$store$getters$c2.avatar) == null ? void 0 : _this$store$getters$c3.medium;
	  }
	  isCopilotRolesAvailable() {
	    const settings = main_core.Extension.getSettings('im.v2.lib.copilot');
	    return settings.copilotRolesAvailable === 'Y';
	  }
	  getNameWithRole({
	    dialogId,
	    messageId
	  }) {
	    const user = this.store.getters['users/get'](dialogId);
	    const roleName = this.store.getters['copilot/messages/getRole'](messageId).name;
	    if (!this.isCopilotRolesAvailable()) {
	      return user.name;
	    }
	    return `${user.name} (${roleName})`;
	  }
	}

	exports.CopilotManager = CopilotManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Messenger.v2.Const,BX.Messenger.v2.Application));
//# sourceMappingURL=copilot.bundle.js.map
