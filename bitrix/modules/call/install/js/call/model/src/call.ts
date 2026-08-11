/**
 * Bitrix Messenger
 * Call Application model (Vuex Builder model)
 *
 * @package bitrix
 * @subpackage im
 * @copyright 2001-2020 Bitrix
 */

import { BitrixVue as Vue } from 'ui.vue';
import { VuexBuilderModel } from 'ui.vue.vuex';
import { Type } from 'main.core';
import { ConferenceUserState } from 'call.const';

interface CallUserState {
	id: number;
	state: string;
	talking: boolean;
	pinned: boolean;
	cameraState: boolean;
	microphoneState: boolean;
	screenState: boolean;
	floorRequestState: boolean;
}

interface CallState {
	users: Record<number, CallUserState>;
}

export class CallModel extends VuexBuilderModel
{
	getName()
	{
		return 'call';
	}

	getState()
	{
		return {
			users: {},
		};
	}

	getElementState(params: { id?: number } = {})
	{
		return {
			id: params.id ?? 0,
			state: ConferenceUserState.Idle,
			talking: false,
			pinned: false,
			cameraState: false,
			microphoneState: false,
			screenState: false,
			floorRequestState: false,
		};
	}

	getGetters()
	{
		return {
			getUser: (state: CallState) => (userId: number) => {
				if (!state.users[userId])
				{
					return this.getElementState({ id: userId });
				}

				return state.users[userId];
			},
			getBlankUser: () => (userId: number) => {
				return this.getElementState({ id: userId });
			},
		};
	}

	getActions()
	{
		return {
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			updateUser: (store, payload) => {
				const newPayload = {
					...payload,
					id: parseInt(payload.id, 10),
					fields: {
						...this.validate(payload.fields),
					},
				};

				store.commit('updateUser', newPayload);
			},
			// @ts-expect-error [call-ts] VuexBuilderModel actions are untyped
			unpinUser: (store) => {
				store.commit('unpinUser');
			},
		};
	}

	getMutations()
	{
		return {
			// @ts-expect-error [call-ts] VuexBuilderModel mutations are untyped
			updateUser: (state, payload) => {
				if (state.users[payload.id])
				{
					// eslint-disable-next-line no-param-reassign
					state.users[payload.id] = Object.assign(state.users[payload.id], payload.fields);
				}
				else
				{
					const newValue = Object.assign(this.getElementState(), payload.fields, { id: payload.id });
					// @ts-ignore [call-ts] VuexBuilderModel are untyped
					Vue.set(state.users, payload.id, newValue);
				}
			},
			unpinUser: (state: CallState) => {
				const pinnedUser = Object.values(state.users).find((user) => user.pinned);

				if (pinnedUser)
				{
					// eslint-disable-next-line no-param-reassign
					state.users[pinnedUser.id].pinned = false;
				}
			},
		};
	}

	validate(payload: Record<string, unknown>)
	{
		const result: Partial<CallUserState> = {};

		if (Type.isNumber(payload.id) || Type.isString(payload.id))
		{
			result.id = parseInt(payload.id as string, 10);
		}

		// @ts-expect-error ConferenceUserState wait to ts
		if (ConferenceUserState[payload.state as string])
		{
			result.state = payload.state as string;
		}

		if (Type.isBoolean(payload.talking))
		{
			result.talking = payload.talking;
		}

		if (Type.isBoolean(payload.pinned))
		{
			result.pinned = payload.pinned;
		}

		if (Type.isBoolean(payload.cameraState))
		{
			result.cameraState = payload.cameraState;
		}

		if (Type.isBoolean(payload.microphoneState))
		{
			result.microphoneState = payload.microphoneState;
		}

		if (Type.isBoolean(payload.screenState))
		{
			result.screenState = payload.screenState;
		}

		if (Type.isBoolean(payload.floorRequestState))
		{
			result.floorRequestState = payload.floorRequestState;
		}

		return result;
	}

	getStateSaveException()
	{
		return {
			users: false,
		};
	}
}
