/**
 * Bitrix Messenger
 * Call Application model (Vuex Builder model)
 *
 * @package bitrix
 * @subpackage im
 * @copyright 2001-2020 Bitrix
 */

import { Type } from 'main.core';
import { VuexBuilderModel } from 'ui.vue.vuex';

import { ConferenceStateType, ConferenceRightPanelMode as RightPanelMode } from 'call.const';

interface ConferenceCommonState {
	inited: boolean;
	passChecked: boolean;
	showChat: boolean;
	userCount: number;
	messageCount: number;
	userInCallCount: number;
	state: string;
	callEnded: boolean;
	showSmiles: boolean;
	error: string;
	conferenceTitle: string;
	alias: string;
	permissionsRequested: boolean;
	conferenceStarted: boolean | null;
	conferenceStartDate: Date | null;
	joinWithVideo: boolean | null;
	userReadyToJoin: boolean;
	isBroadcast: boolean;
	users: number[];
	usersInCall: number[];
	presenters: number[];
	rightPanelMode: string;
	hasErrorInCall: boolean;
}

interface ConferenceUserData {
	id: number;
	hash: string;
}

interface ConferenceState {
	common: ConferenceCommonState;
	user: ConferenceUserData;
}

export class ConferenceModel extends VuexBuilderModel
{
	getName()
	{
		return 'conference';
	}

	getState()
	{
		return {
			common: {
				inited: false,
				passChecked: true,
				showChat: false,
				userCount: 0,
				messageCount: 0,
				userInCallCount: 0,
				state: ConferenceStateType.preparation,
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
				rightPanelMode: RightPanelMode.hidden,
				hasErrorInCall: false,
			},
			user: {
				id: -1,
				hash: '',
			},
		};
	}

	getActions()
	{
		return {
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			showChat: (store, payload) => {
				if (!Type.isBoolean(payload.newState))
				{
					return;
				}

				store.commit('showChat', payload);
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			changeRightPanelMode: (store, payload) => {
				// @ts-expect-error [call-ts] wait call.const to ts
				if (!RightPanelMode[payload.mode])
				{
					return;
				}

				store.commit('changeRightPanelMode', payload);
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setPermissionsRequested: (store, payload) => {
				if (!Type.isBoolean(payload.status))
				{
					return;
				}
				store.commit('setPermissionsRequested', payload);
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setPresenters: (store, payload) => {
				const presenters = Array.isArray(payload.presenters) ? payload.presenters : [payload.presenters];
				store.commit('setPresenters', { ...payload, presenters });
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setUsers: (store, payload) => {
				const users = Array.isArray(payload.users) ? payload.users : [payload.users];
				store.commit('setUsers', { ...payload, users });
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			removeUsers: (store, payload) => {
				const users = Array.isArray(payload.users) ? payload.users : [payload.users];
				store.commit('removeUsers', { ...payload, users });
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setUsersInCall: (store, payload) => {
				const users = Array.isArray(payload.users) ? payload.users : [payload.users];
				store.commit('setUsersInCall', { ...payload, users });
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			removeUsersInCall: (store, payload) => {
				const users = Array.isArray(payload.users) ? payload.users : [payload.users];
				store.commit('removeUsersInCall', { ...payload, users });
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setConferenceTitle: (store, payload) => {
				if (!Type.isString(payload.conferenceTitle))
				{
					return;
				}

				store.commit('setConferenceTitle', payload);
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			setBroadcastMode: (store, payload) => {
				if (!Type.isBoolean(payload.broadcastMode))
				{
					return;
				}

				store.commit('setBroadcastMode', payload);
			},
		};
	}

	// eslint-disable-next-line max-lines-per-function
	getMutations()
	{
		/* eslint-disable no-param-reassign */
		return {
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			common: (state, payload) => {
				if (Type.isBoolean(payload.inited))
				{
					state.common.inited = payload.inited;
				}

				if (Type.isBoolean(payload.passChecked))
				{
					state.common.passChecked = payload.passChecked;
				}

				if (Type.isNumber(payload.userCount) || Type.isString(payload.userCount))
				{
					state.common.userCount = parseInt(payload.userCount, 10);
				}

				if (Type.isNumber(payload.messageCount) || Type.isString(payload.messageCount))
				{
					state.common.messageCount = parseInt(payload.messageCount, 10);
				}

				if (Type.isNumber(payload.userInCallCount) || Type.isString(payload.userInCallCount))
				{
					state.common.userInCallCount = parseInt(payload.userInCallCount, 10);
				}

				if (Type.isString(payload.componentError))
				{
					state.common.componentError = payload.componentError;
				}

				if (Type.isBoolean(payload.isBroadcast))
				{
					state.common.isBroadcast = payload.isBroadcast;
				}

				if (Array.isArray(payload.presenters))
				{
					state.common.presenters = payload.presenters;
				}

				if (Type.isBoolean(payload.hasErrorInCall))
				{
					state.common.hasErrorInCall = payload.hasErrorInCall;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			user: (state, payload) => {
				if (Type.isNumber(payload.id))
				{
					state.user.id = payload.id;
				}

				if (Type.isString(payload.hash) && payload.hash !== state.user.hash)
				{
					state.user.hash = payload.hash;
				}

				if (this.isSaveNeeded({ user: payload }))
				{
					this.saveState(state);
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			showChat: (state, { newState }) => {
				state.common.showChat = newState;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			changeRightPanelMode: (state, { mode }) => {
				state.common.rightPanelMode = mode;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setPermissionsRequested: (state, payload) => {
				state.common.permissionsRequested = payload.status;
			},
			startCall: (state: ConferenceState) => {
				state.common.state = ConferenceStateType.call;
				state.common.callEnded = false;
			},
			endCall: (state: ConferenceState) => {
				state.common.state = ConferenceStateType.preparation;
				state.common.callEnded = true;
			},
			returnToPreparation: (state: ConferenceState) => {
				state.common.state = ConferenceStateType.preparation;
			},
			toggleSmiles: (state: ConferenceState) => {
				state.common.showSmiles = !state.common.showSmiles;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setError: (state, payload) => {
				if (Type.isString(payload.errorCode))
				{
					state.common.error = payload.errorCode;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setConferenceTitle: (state, payload) => {
				state.common.conferenceTitle = payload.conferenceTitle;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setBroadcastMode: (state, payload) => {
				state.common.isBroadcast = payload.broadcastMode;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setAlias: (state, payload) => {
				if (Type.isString(payload.alias))
				{
					state.common.alias = payload.alias;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setJoinType: (state, payload) => {
				if (Type.isBoolean(payload.joinWithVideo))
				{
					state.common.joinWithVideo = payload.joinWithVideo;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setConferenceStatus: (state, payload) => {
				if (Type.isBoolean(payload.conferenceStarted))
				{
					state.common.conferenceStarted = payload.conferenceStarted;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setConferenceHasErrorInCall: (state, payload) => {
				if (Type.isBoolean(payload.hasErrorInCall))
				{
					state.common.hasErrorInCall = payload.hasErrorInCall;
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setConferenceStartDate: (state, payload) => {
				if (payload.conferenceStartDate instanceof Date)
				{
					state.common.conferenceStartDate = payload.conferenceStartDate;
				}
			},
			setUserReadyToJoin: (state: ConferenceState) => {
				state.common.userReadyToJoin = true;
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setPresenters: (state, payload) => {
				if (payload.replace)
				{
					state.common.presenters = payload.presenters;
				}
				else
				{
					payload.presenters.forEach((presenter: number | string) => {
						const parsed = Number(presenter);
						if (!state.common.presenters.includes(parsed))
						{
							state.common.presenters.push(parsed);
						}
					});
				}
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setUsers: (state, payload) => {
				payload.users.forEach((user: number | string) => {
					const parsed = Number(user);
					if (!state.common.users.includes(parsed))
					{
						state.common.users.push(parsed);
					}
				});
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			removeUsers: (state, payload) => {
				state.common.users = state.common.users.filter((user: number) => {
					return !payload.users.includes(user);
				});
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			setUsersInCall: (state, payload) => {
				payload.users.forEach((user: number | string) => {
					const parsed = Number(user);
					if (!state.common.usersInCall.includes(parsed))
					{
						state.common.usersInCall.push(parsed);
					}
				});
			},
			//  @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			removeUsersInCall: (state, payload) => {
				state.common.usersInCall = state.common.usersInCall.filter((user: number) => {
					return !payload.users.includes(user);
				});
			},
		};
		/* eslint-enable no-param-reassign */
	}

	getStateSaveException()
	{
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
				hasErrorInCall: null,
			},
		};
	}
}
