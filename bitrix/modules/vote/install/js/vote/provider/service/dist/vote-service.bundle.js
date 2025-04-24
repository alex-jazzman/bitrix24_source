/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vote = this.BX.Vote || {};
(function (exports,vote_application) {
	'use strict';

	const BackendModuleId = 'im';
	const BackendEntityType = 'Bitrix\\Vote\\Attachment\\ImMessageConnector';
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _app = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("app");
	var _getAttachedVote = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAttachedVote");
	var _sendVoteStopRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendVoteStopRequest");
	var _sendVoteRevokeRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendVoteRevokeRequest");
	var _sendBackendVote = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendBackendVote");
	var _getEntityParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEntityParams");
	var _updateStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStore");
	class ImVoteService {
	  constructor(entityType, entityId) {
	    Object.defineProperty(this, _updateStore, {
	      value: _updateStore2
	    });
	    Object.defineProperty(this, _getEntityParams, {
	      value: _getEntityParams2
	    });
	    Object.defineProperty(this, _sendBackendVote, {
	      value: _sendBackendVote2
	    });
	    Object.defineProperty(this, _sendVoteRevokeRequest, {
	      value: _sendVoteRevokeRequest2
	    });
	    Object.defineProperty(this, _sendVoteStopRequest, {
	      value: _sendVoteStopRequest2
	    });
	    Object.defineProperty(this, _getAttachedVote, {
	      value: _getAttachedVote2
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _app, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId] = entityId;
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = vote_application.VoteApplication.init();
	  }
	  load() {
	    return new Promise((resolve, reject) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getAttachedVote)[_getAttachedVote]().then(response => {
	        var _response$data;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateStore)[_updateStore](response == null ? void 0 : (_response$data = response.data) == null ? void 0 : _response$data.attach);
	        resolve(true);
	      }).catch(response => reject(response));
	    });
	  }
	  sendVote(ballot) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _sendBackendVote)[_sendBackendVote](ballot).then(response => {
	      var _response$data2, _response$data3;
	      babelHelpers.classPrivateFieldLooseBase(this, _updateStore)[_updateStore](response == null ? void 0 : (_response$data2 = response.data) == null ? void 0 : _response$data2.attach);
	      return response == null ? void 0 : (_response$data3 = response.data) == null ? void 0 : _response$data3.attach;
	    });
	  }
	  revokeVote() {
	    return new Promise((resolve, reject) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _sendVoteRevokeRequest)[_sendVoteRevokeRequest]().then(response => {
	        var _response$data4;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateStore)[_updateStore](response == null ? void 0 : (_response$data4 = response.data) == null ? void 0 : _response$data4.attach);
	        resolve(true);
	      }).catch(response => {
	        console.error(response.errors[0].code);
	        reject(response);
	      });
	    });
	  }
	  completeVote() {
	    return new Promise((resolve, reject) => {
	      babelHelpers.classPrivateFieldLooseBase(this, _sendVoteStopRequest)[_sendVoteStopRequest]().then(() => {
	        resolve(true);
	      }).catch(response => {
	        console.error(response.errors[0].code);
	        reject(response);
	      });
	    });
	  }
	}
	function _getAttachedVote2() {
	  return BX.ajax.runAction('vote.AttachedVote.get', {
	    data: babelHelpers.classPrivateFieldLooseBase(this, _getEntityParams)[_getEntityParams]()
	  });
	}
	function _sendVoteStopRequest2() {
	  return BX.ajax.runAction('vote.AttachedVote.stop', {
	    data: babelHelpers.classPrivateFieldLooseBase(this, _getEntityParams)[_getEntityParams]()
	  });
	}
	function _sendVoteRevokeRequest2() {
	  return BX.ajax.runAction('vote.AttachedVote.recall', {
	    data: babelHelpers.classPrivateFieldLooseBase(this, _getEntityParams)[_getEntityParams]()
	  });
	}
	function _sendBackendVote2(ballot) {
	  return BX.ajax.runAction('vote.AttachedVote.vote', {
	    data: {
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getEntityParams)[_getEntityParams](),
	      ballot
	    }
	  });
	}
	function _getEntityParams2() {
	  return {
	    moduleId: BackendModuleId,
	    entityType: BackendEntityType,
	    entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]
	  };
	}
	function _updateStore2(payload) {
	  if (!payload) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].getStore().dispatch('vote/setCurrentUserVotes', payload.userAnswerMap);
	  babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].getStore().dispatch('vote/addVote', payload);
	  babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].getStore().dispatch('vote/addQuestion', payload.QUESTIONS);
	  babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].getStore().dispatch('vote/addAnswer', payload.QUESTIONS);
	}

	exports.BackendModuleId = BackendModuleId;
	exports.BackendEntityType = BackendEntityType;
	exports.ImVoteService = ImVoteService;

}((this.BX.Vote.Service = this.BX.Vote.Service || {}),BX.Vote));
//# sourceMappingURL=vote-service.bundle.js.map
