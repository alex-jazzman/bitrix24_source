/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, ui_vue, ui_vue_vuex, main_core, call_const) {
	'use strict';

	class CallModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'call';
		}
		getState() {
			return {
				users: {}
			};
		}
		getElementState(params = {}) {
			return {
				id: params.id ?? 0,
				state: call_const.ConferenceUserState.Idle,
				talking: false,
				pinned: false,
				cameraState: false,
				microphoneState: false,
				screenState: false,
				floorRequestState: false
			};
		}
		getGetters() {
			return {
				getUser: state => userId => {
					if (!state.users[userId]) {
						return this.getElementState({
							id: userId
						});
					}
					return state.users[userId];
				},
				getBlankUser: () => userId => {
					return this.getElementState({
						id: userId
					});
				}
			};
		}
		getActions() {
			return {
				updateUser: (store, payload) => {
					const newPayload = {
						...payload,
						id: parseInt(payload.id, 10),
						fields: {
							...this.validate(payload.fields)
						}
					};
					store.commit('updateUser', newPayload);
				},
				unpinUser: store => {
					store.commit('unpinUser');
				}
			};
		}
		getMutations() {
			return {
				updateUser: (state, payload) => {
					if (state.users[payload.id]) {
						state.users[payload.id] = Object.assign(state.users[payload.id], payload.fields);
					} else {
						const newValue = Object.assign(this.getElementState(), payload.fields, {
							id: payload.id
						});
						ui_vue.BitrixVue.set(state.users, payload.id, newValue);
					}
				},
				unpinUser: state => {
					const pinnedUser = Object.values(state.users).find(user => user.pinned);
					if (pinnedUser) {
						state.users[pinnedUser.id].pinned = false;
					}
				}
			};
		}
		validate(payload) {
			const result = {};
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
		getStateSaveException() {
			return {
				users: false
			};
		}
	}

	class ConferenceModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'conference';
		}
		getState() {
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
		getActions() {
			return {
				showChat: (store, payload) => {
					if (!main_core.Type.isBoolean(payload.newState)) {
						return;
					}
					store.commit('showChat', payload);
				},
				changeRightPanelMode: (store, payload) => {
					if (!call_const.ConferenceRightPanelMode[payload.mode]) {
						return;
					}
					store.commit('changeRightPanelMode', payload);
				},
				setPermissionsRequested: (store, payload) => {
					if (!main_core.Type.isBoolean(payload.status)) {
						return;
					}
					store.commit('setPermissionsRequested', payload);
				},
				setPresenters: (store, payload) => {
					const presenters = Array.isArray(payload.presenters) ? payload.presenters : [payload.presenters];
					store.commit('setPresenters', {
						...payload,
						presenters
					});
				},
				setUsers: (store, payload) => {
					const users = Array.isArray(payload.users) ? payload.users : [payload.users];
					store.commit('setUsers', {
						...payload,
						users
					});
				},
				removeUsers: (store, payload) => {
					const users = Array.isArray(payload.users) ? payload.users : [payload.users];
					store.commit('removeUsers', {
						...payload,
						users
					});
				},
				setUsersInCall: (store, payload) => {
					const users = Array.isArray(payload.users) ? payload.users : [payload.users];
					store.commit('setUsersInCall', {
						...payload,
						users
					});
				},
				removeUsersInCall: (store, payload) => {
					const users = Array.isArray(payload.users) ? payload.users : [payload.users];
					store.commit('removeUsersInCall', {
						...payload,
						users
					});
				},
				setConferenceTitle: (store, payload) => {
					if (!main_core.Type.isString(payload.conferenceTitle)) {
						return;
					}
					store.commit('setConferenceTitle', payload);
				},
				setBroadcastMode: (store, payload) => {
					if (!main_core.Type.isBoolean(payload.broadcastMode)) {
						return;
					}
					store.commit('setBroadcastMode', payload);
				}
			};
		}
		getMutations() {
			return {
				common: (state, payload) => {
					if (main_core.Type.isBoolean(payload.inited)) {
						state.common.inited = payload.inited;
					}
					if (main_core.Type.isBoolean(payload.passChecked)) {
						state.common.passChecked = payload.passChecked;
					}
					if (main_core.Type.isNumber(payload.userCount) || main_core.Type.isString(payload.userCount)) {
						state.common.userCount = parseInt(payload.userCount, 10);
					}
					if (main_core.Type.isNumber(payload.messageCount) || main_core.Type.isString(payload.messageCount)) {
						state.common.messageCount = parseInt(payload.messageCount, 10);
					}
					if (main_core.Type.isNumber(payload.userInCallCount) || main_core.Type.isString(payload.userInCallCount)) {
						state.common.userInCallCount = parseInt(payload.userInCallCount, 10);
					}
					if (main_core.Type.isString(payload.componentError)) {
						state.common.componentError = payload.componentError;
					}
					if (main_core.Type.isBoolean(payload.isBroadcast)) {
						state.common.isBroadcast = payload.isBroadcast;
					}
					if (Array.isArray(payload.presenters)) {
						state.common.presenters = payload.presenters;
					}
					if (main_core.Type.isBoolean(payload.hasErrorInCall)) {
						state.common.hasErrorInCall = payload.hasErrorInCall;
					}
				},
				user: (state, payload) => {
					if (main_core.Type.isNumber(payload.id)) {
						state.user.id = payload.id;
					}
					if (main_core.Type.isString(payload.hash) && payload.hash !== state.user.hash) {
						state.user.hash = payload.hash;
					}
					if (this.isSaveNeeded({
						user: payload
					})) {
						this.saveState(state);
					}
				},
				showChat: (state, {
					newState
				}) => {
					state.common.showChat = newState;
				},
				changeRightPanelMode: (state, {
					mode
				}) => {
					state.common.rightPanelMode = mode;
				},
				setPermissionsRequested: (state, payload) => {
					state.common.permissionsRequested = payload.status;
				},
				startCall: state => {
					state.common.state = call_const.ConferenceStateType.call;
					state.common.callEnded = false;
				},
				endCall: state => {
					state.common.state = call_const.ConferenceStateType.preparation;
					state.common.callEnded = true;
				},
				returnToPreparation: state => {
					state.common.state = call_const.ConferenceStateType.preparation;
				},
				toggleSmiles: state => {
					state.common.showSmiles = !state.common.showSmiles;
				},
				setError: (state, payload) => {
					if (main_core.Type.isString(payload.errorCode)) {
						state.common.error = payload.errorCode;
					}
				},
				setConferenceTitle: (state, payload) => {
					state.common.conferenceTitle = payload.conferenceTitle;
				},
				setBroadcastMode: (state, payload) => {
					state.common.isBroadcast = payload.broadcastMode;
				},
				setAlias: (state, payload) => {
					if (main_core.Type.isString(payload.alias)) {
						state.common.alias = payload.alias;
					}
				},
				setJoinType: (state, payload) => {
					if (main_core.Type.isBoolean(payload.joinWithVideo)) {
						state.common.joinWithVideo = payload.joinWithVideo;
					}
				},
				setConferenceStatus: (state, payload) => {
					if (main_core.Type.isBoolean(payload.conferenceStarted)) {
						state.common.conferenceStarted = payload.conferenceStarted;
					}
				},
				setConferenceHasErrorInCall: (state, payload) => {
					if (main_core.Type.isBoolean(payload.hasErrorInCall)) {
						state.common.hasErrorInCall = payload.hasErrorInCall;
					}
				},
				setConferenceStartDate: (state, payload) => {
					if (payload.conferenceStartDate instanceof Date) {
						state.common.conferenceStartDate = payload.conferenceStartDate;
					}
				},
				setUserReadyToJoin: state => {
					state.common.userReadyToJoin = true;
				},
				setPresenters: (state, payload) => {
					if (payload.replace) {
						state.common.presenters = payload.presenters;
					} else {
						payload.presenters.forEach(presenter => {
							const parsed = Number(presenter);
							if (!state.common.presenters.includes(parsed)) {
								state.common.presenters.push(parsed);
							}
						});
					}
				},
				setUsers: (state, payload) => {
					payload.users.forEach(user => {
						const parsed = Number(user);
						if (!state.common.users.includes(parsed)) {
							state.common.users.push(parsed);
						}
					});
				},
				removeUsers: (state, payload) => {
					state.common.users = state.common.users.filter(user => {
						return !payload.users.includes(user);
					});
				},
				setUsersInCall: (state, payload) => {
					payload.users.forEach(user => {
						const parsed = Number(user);
						if (!state.common.usersInCall.includes(parsed)) {
							state.common.usersInCall.push(parsed);
						}
					});
				},
				removeUsersInCall: (state, payload) => {
					state.common.usersInCall = state.common.usersInCall.filter(user => {
						return !payload.users.includes(user);
					});
				}
			};
		}
		getStateSaveException() {
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
	}

	exports.CallModel = CallModel;
	exports.ConferenceModel = ConferenceModel;

})(this.BX.Call.Model = this.BX.Call.Model || {}, BX, BX, BX, BX.Call.Const);
//# sourceMappingURL=call-model.bundle.js.map
