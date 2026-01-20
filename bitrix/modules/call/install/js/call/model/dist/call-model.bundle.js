/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,ui_vue,main_core,ui_vue_vuex,call_const) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * Call Application model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	var CallModel = /*#__PURE__*/function (_VuexBuilderModel) {
	  babelHelpers.inherits(CallModel, _VuexBuilderModel);
	  function CallModel() {
	    babelHelpers.classCallCheck(this, CallModel);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(CallModel).apply(this, arguments));
	  }
	  babelHelpers.createClass(CallModel, [{
	    key: "getName",
	    value: function getName() {
	      return 'call';
	    }
	  }, {
	    key: "getState",
	    value: function getState() {
	      return {
	        users: {}
	      };
	    }
	  }, {
	    key: "getElementState",
	    value: function getElementState() {
	      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	      return {
	        id: params.id ? params.id : 0,
	        state: call_const.ConferenceUserState.Idle,
	        talking: false,
	        pinned: false,
	        cameraState: false,
	        microphoneState: false,
	        screenState: false,
	        floorRequestState: false
	      };
	    }
	  }, {
	    key: "getGetters",
	    value: function getGetters() {
	      var _this = this;
	      return {
	        getUser: function getUser(state) {
	          return function (userId) {
	            userId = parseInt(userId, 10);
	            if (!state.users[userId]) {
	              return _this.getElementState({
	                id: userId
	              });
	            }
	            return state.users[userId];
	          };
	        },
	        getBlankUser: function getBlankUser(state) {
	          return function (userId) {
	            userId = parseInt(userId, 10);
	            return _this.getElementState({
	              id: userId
	            });
	          };
	        }
	      };
	    }
	  }, {
	    key: "getActions",
	    value: function getActions() {
	      var _this2 = this;
	      return {
	        updateUser: function updateUser(store, payload) {
	          payload.id = parseInt(payload.id, 10);
	          payload.fields = Object.assign({}, _this2.validate(payload.fields));
	          store.commit('updateUser', payload);
	        },
	        unpinUser: function unpinUser(store, payload) {
	          store.commit('unpinUser');
	        }
	      };
	    }
	  }, {
	    key: "getMutations",
	    value: function getMutations() {
	      var _this3 = this;
	      return {
	        updateUser: function updateUser(state, payload) {
	          if (!state.users[payload.id]) {
	            ui_vue.Vue.set(state.users, payload.id, Object.assign(_this3.getElementState(), payload.fields, {
	              id: payload.id
	            }));
	          } else {
	            state.users[payload.id] = Object.assign(state.users[payload.id], payload.fields);
	          }
	        },
	        unpinUser: function unpinUser(state, payload) {
	          var pinnedUser = Object.values(state.users).find(function (user) {
	            return user.pinned === true;
	          });
	          if (pinnedUser) {
	            state.users[pinnedUser.id].pinned = false;
	          }
	        }
	      };
	    }
	  }, {
	    key: "validate",
	    value: function validate(payload) {
	      var result = {};
	      if (main_core.Type.isNumber(payload.id) || main_core.Type.isString(payload.id)) {
	        result.id = parseInt(payload.id, 10);
	      }
	      if (call_const.ConferenceUserState[payload.state]) {
	        result.state = payload.state;
	      }
	      if (main_core.Type.isBoolean(payload.talking)) {
	        result.talking = payload.talking;
	      }
	      if (main_core.Type.isBoolean(payload.pinned)) {
	        result.pinned = payload.pinned;
	      }
	      if (main_core.Type.isBoolean(payload.cameraState)) {
	        result.cameraState = payload.cameraState;
	      }
	      if (main_core.Type.isBoolean(payload.microphoneState)) {
	        result.microphoneState = payload.microphoneState;
	      }
	      if (main_core.Type.isBoolean(payload.screenState)) {
	        result.screenState = payload.screenState;
	      }
	      if (main_core.Type.isBoolean(payload.floorRequestState)) {
	        result.floorRequestState = payload.floorRequestState;
	      }
	      return result;
	    }
	  }, {
	    key: "getStateSaveException",
	    value: function getStateSaveException() {
	      return {
	        users: false
	      };
	    }
	  }]);
	  return CallModel;
	}(ui_vue_vuex.VuexBuilderModel);

	/**
	 * Bitrix Messenger
	 * Call Application model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	var ConferenceModel = /*#__PURE__*/function (_VuexBuilderModel) {
	  babelHelpers.inherits(ConferenceModel, _VuexBuilderModel);
	  function ConferenceModel() {
	    babelHelpers.classCallCheck(this, ConferenceModel);
	    return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(ConferenceModel).apply(this, arguments));
	  }
	  babelHelpers.createClass(ConferenceModel, [{
	    key: "getName",
	    value: function getName() {
	      return 'conference';
	    }
	  }, {
	    key: "getState",
	    value: function getState() {
	      return {
	        common: {
	          inited: false,
	          passChecked: true,
	          showChat: false,
	          userCount: 0,
	          messageCount: 0,
	          userInCallCount: 0,
	          state: call_const.ConferenceStateType.preparation,
	          callEnded: false,
	          showSmiles: false,
	          error: '',
	          conferenceTitle: '',
	          alias: '',
	          permissionsRequested: false,
	          conferenceStarted: null,
	          conferenceStartDate: null,
	          joinWithVideo: null,
	          userReadyToJoin: false,
	          isBroadcast: false,
	          users: [],
	          usersInCall: [],
	          presenters: [],
	          rightPanelMode: call_const.ConferenceRightPanelMode.hidden,
	          hasErrorInCall: false
	        },
	        user: {
	          id: -1,
	          hash: ''
	        }
	      };
	    }
	  }, {
	    key: "getActions",
	    value: function getActions() {
	      return {
	        showChat: function showChat(store, payload) {
	          if (typeof payload.newState !== 'boolean') {
	            return false;
	          }
	          store.commit('showChat', payload);
	        },
	        changeRightPanelMode: function changeRightPanelMode(store, payload) {
	          if (!call_const.ConferenceRightPanelMode[payload.mode]) {
	            return false;
	          }
	          store.commit('changeRightPanelMode', payload);
	        },
	        setPermissionsRequested: function setPermissionsRequested(store, payload) {
	          if (typeof payload.status !== 'boolean') {
	            return false;
	          }
	          store.commit('setPermissionsRequested', payload);
	        },
	        setPresenters: function setPresenters(store, payload) {
	          if (!Array.isArray(payload.presenters)) {
	            payload.presenters = [payload.presenters];
	          }
	          store.commit('setPresenters', payload);
	        },
	        setUsers: function setUsers(store, payload) {
	          if (!Array.isArray(payload.users)) {
	            payload.users = [payload.users];
	          }
	          store.commit('setUsers', payload);
	        },
	        removeUsers: function removeUsers(store, payload) {
	          if (!Array.isArray(payload.users)) {
	            payload.users = [payload.users];
	          }
	          store.commit('removeUsers', payload);
	        },
	        setUsersInCall: function setUsersInCall(store, payload) {
	          if (!Array.isArray(payload.users)) {
	            payload.users = [payload.users];
	          }
	          store.commit('setUsersInCall', payload);
	        },
	        removeUsersInCall: function removeUsersInCall(store, payload) {
	          if (!Array.isArray(payload.users)) {
	            payload.users = [payload.users];
	          }
	          store.commit('removeUsersInCall', payload);
	        },
	        setConferenceTitle: function setConferenceTitle(store, payload) {
	          if (typeof payload.conferenceTitle !== 'string') {
	            return false;
	          }
	          store.commit('setConferenceTitle', payload);
	        },
	        setBroadcastMode: function setBroadcastMode(store, payload) {
	          if (typeof payload.broadcastMode !== 'boolean') {
	            return false;
	          }
	          store.commit('setBroadcastMode', payload);
	        }
	      };
	    }
	  }, {
	    key: "getMutations",
	    value: function getMutations() {
	      var _this = this;
	      return {
	        common: function common(state, payload) {
	          if (typeof payload.inited === 'boolean') {
	            state.common.inited = payload.inited;
	          }
	          if (typeof payload.passChecked === 'boolean') {
	            state.common.passChecked = payload.passChecked;
	          }
	          if (typeof payload.userCount === 'number' || typeof payload.userCount === 'string') {
	            state.common.userCount = parseInt(payload.userCount);
	          }
	          if (typeof payload.messageCount === 'number' || typeof payload.messageCount === 'string') {
	            state.common.messageCount = parseInt(payload.messageCount);
	          }
	          if (typeof payload.userInCallCount === 'number' || typeof payload.userInCallCount === 'string') {
	            state.common.userInCallCount = parseInt(payload.userInCallCount);
	          }
	          if (typeof payload.componentError === 'string') {
	            state.common.componentError = payload.componentError;
	          }
	          if (typeof payload.isBroadcast === 'boolean') {
	            state.common.isBroadcast = payload.isBroadcast;
	          }
	          if (Array.isArray(payload.presenters)) {
	            state.common.presenters = payload.presenters;
	          }
	          if (typeof payload.hasErrorInCall === 'boolean') {
	            state.common.hasErrorInCall = payload.hasErrorInCall;
	          }
	        },
	        user: function user(state, payload) {
	          if (typeof payload.id === 'number') {
	            state.user.id = payload.id;
	          }
	          if (typeof payload.hash === 'string' && payload.hash !== state.user.hash) {
	            state.user.hash = payload.hash;
	          }
	          if (_this.isSaveNeeded({
	            user: payload
	          })) {
	            _this.saveState(state);
	          }
	        },
	        showChat: function showChat(state, _ref) {
	          var newState = _ref.newState;
	          state.common.showChat = newState;
	        },
	        changeRightPanelMode: function changeRightPanelMode(state, _ref2) {
	          var mode = _ref2.mode;
	          state.common.rightPanelMode = mode;
	        },
	        setPermissionsRequested: function setPermissionsRequested(state, payload) {
	          state.common.permissionsRequested = payload.status;
	        },
	        startCall: function startCall(state, payload) {
	          state.common.state = call_const.ConferenceStateType.call;
	          state.common.callEnded = false;
	        },
	        endCall: function endCall(state, payload) {
	          state.common.state = call_const.ConferenceStateType.preparation;
	          state.common.callEnded = true;
	        },
	        returnToPreparation: function returnToPreparation(state, payload) {
	          state.common.state = call_const.ConferenceStateType.preparation;
	        },
	        toggleSmiles: function toggleSmiles(state, payload) {
	          state.common.showSmiles = !state.common.showSmiles;
	        },
	        setError: function setError(state, payload) {
	          if (typeof payload.errorCode === 'string') {
	            state.common.error = payload.errorCode;
	          }
	        },
	        setConferenceTitle: function setConferenceTitle(state, payload) {
	          state.common.conferenceTitle = payload.conferenceTitle;
	        },
	        setBroadcastMode: function setBroadcastMode(state, payload) {
	          state.common.isBroadcast = payload.broadcastMode;
	        },
	        setAlias: function setAlias(state, payload) {
	          if (typeof payload.alias === 'string') {
	            state.common.alias = payload.alias;
	          }
	        },
	        setJoinType: function setJoinType(state, payload) {
	          if (typeof payload.joinWithVideo === 'boolean') {
	            state.common.joinWithVideo = payload.joinWithVideo;
	          }
	        },
	        setConferenceStatus: function setConferenceStatus(state, payload) {
	          if (typeof payload.conferenceStarted === 'boolean') {
	            state.common.conferenceStarted = payload.conferenceStarted;
	          }
	        },
	        setConferenceHasErrorInCall: function setConferenceHasErrorInCall(state, payload) {
	          if (typeof payload.hasErrorInCall === 'boolean') {
	            state.common.hasErrorInCall = payload.hasErrorInCall;
	          }
	        },
	        setConferenceStartDate: function setConferenceStartDate(state, payload) {
	          if (payload.conferenceStartDate instanceof Date) {
	            state.common.conferenceStartDate = payload.conferenceStartDate;
	          }
	        },
	        setUserReadyToJoin: function setUserReadyToJoin(state, payload) {
	          state.common.userReadyToJoin = true;
	        },
	        setPresenters: function setPresenters(state, payload) {
	          if (payload.replace) {
	            state.common.presenters = payload.presenters;
	          } else {
	            payload.presenters.forEach(function (presenter) {
	              presenter = parseInt(presenter);
	              if (!state.common.presenters.includes(presenter)) {
	                state.common.presenters.push(presenter);
	              }
	            });
	          }
	        },
	        setUsers: function setUsers(state, payload) {
	          payload.users.forEach(function (user) {
	            user = parseInt(user);
	            if (!state.common.users.includes(user)) {
	              state.common.users.push(user);
	            }
	          });
	        },
	        removeUsers: function removeUsers(state, payload) {
	          state.common.users = state.common.users.filter(function (user) {
	            return !payload.users.includes(parseInt(user));
	          });
	        },
	        setUsersInCall: function setUsersInCall(state, payload) {
	          payload.users.forEach(function (user) {
	            user = parseInt(user);
	            if (!state.common.usersInCall.includes(user)) {
	              state.common.usersInCall.push(user);
	            }
	          });
	        },
	        removeUsersInCall: function removeUsersInCall(state, payload) {
	          state.common.usersInCall = state.common.usersInCall.filter(function (user) {
	            return !payload.users.includes(parseInt(user));
	          });
	        }
	      };
	    }
	  }, {
	    key: "getStateSaveException",
	    value: function getStateSaveException() {
	      return {
	        common: {
	          inited: null,
	          state: null,
	          showSmiles: null,
	          userCount: null,
	          messageCount: null,
	          userInCallCount: null,
	          error: null,
	          conferenceTitle: null,
	          alias: null,
	          conferenceStarted: null,
	          conferenceStartDate: null,
	          joinWithVideo: null,
	          userReadyToJoin: null,
	          rightPanelMode: null,
	          presenters: null,
	          users: null,
	          hasErrorInCall: null
	        }
	      };
	    }
	  }]);
	  return ConferenceModel;
	}(ui_vue_vuex.VuexBuilderModel);

	exports.CallModel = CallModel;
	exports.ConferenceModel = ConferenceModel;

}((this.BX.Call.Model = this.BX.Call.Model || {}),BX,BX,BX,BX.Call.Const));
//# sourceMappingURL=call-model.bundle.js.map
