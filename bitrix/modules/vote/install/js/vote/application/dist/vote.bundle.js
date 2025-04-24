/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_vue3_vuex,im_v2_const,vote_store_vote,vote_provider_pull) {
	'use strict';

	class VoteApplication {
	  static init() {
	    return VoteApplication.getInstance();
	  }
	  static getInstance() {
	    if (!VoteApplication.instance) {
	      VoteApplication.instance = new VoteApplication();
	    }
	    return VoteApplication.instance;
	  }
	  constructor() {
	    this.createStore();
	    this.initPull();
	  }
	  createStore() {
	    this.store = ui_vue3_vuex.createStore({
	      modules: {
	        vote: {
	          namespaced: true,
	          ...vote_store_vote.VoteModel
	        }
	      }
	    });
	  }
	  getStore() {
	    return this.store;
	  }
	  initPull() {
	    this.pullClient = BX.PULL;
	    if (!this.pullClient) {
	      return;
	    }
	    this.pullClient.subscribe(new vote_provider_pull.VotePullHandler({
	      store: this.store
	    }));
	  }
	  static canCreateVoteInChat(currentChatType) {
	    const availableChatTypes = [im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.general, im_v2_const.ChatType.call, im_v2_const.ChatType.crm, im_v2_const.ChatType.sonetGroup, im_v2_const.ChatType.calendar, im_v2_const.ChatType.tasks, im_v2_const.ChatType.mail, im_v2_const.ChatType.generalChannel, im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel, im_v2_const.ChatType.collab];
	    return availableChatTypes.includes(currentChatType);
	  }
	}

	exports.VoteApplication = VoteApplication;

}((this.BX.Vote = this.BX.Vote || {}),BX.Vue3.Vuex,BX.Messenger.v2.Const,BX.Vote.Store,BX.Vote.Service));
//# sourceMappingURL=vote.bundle.js.map
