import { Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';

import type { Channel, From } from '../editor';
import { type Logger } from '../service/logger';
import { deepFreeze } from './helpers';

type ChannelsState = {
	collection: Readonly<Channel[]>,
	selected: {
		channelId: ?string,
		fromId: ?string,
		receiverAddressId: ?number,
	},
};

export class ChannelsModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'channels';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): ChannelsState
	{
		const collection: Channel[] = this.getVariable('collection', []);
		deepFreeze(collection);

		return {
			collection,
			selected: {
				channelId: this.getVariable('selected.channelId'),
				fromId: this.getVariable('selected.fromId', collection[0]?.fromList[0]?.id),
				receiverAddressId: this.getVariable('selected.receiverAddressId', collection[0]?.toList[0]?.address.id),
			},
		};
	}

	getGetters(): GetterTree<ChannelsState>
	{
		return {
			/** @function channels/canSendMessage */
			canSendMessage: (state): boolean => {
				return state.collection.some((chan: Channel) => chan.isConnected);
			},
			/** @function channels/current */
			current: (state, getters, rootState, rootGetters): ?Channel => {
				const selected = state.collection.find((channel) => channel.id === state.selected.channelId);
				if (selected)
				{
					return selected;
				}

				const firstId = rootGetters['preferences/firstVisibleChannelId'];

				return state.collection.find((chan) => chan.id === firstId) || state.collection[0];
			},
			/** @function channels/from */
			from: (state, getters): ?From => {
				const channel: Channel = getters.current;
				if (!channel)
				{
					return null;
				}

				return channel.fromList.find((from) => from.id === state.selected.fromId) || channel.fromList[0];
			},
			/** @function channels/receiver */
			receiver: (state, getters): ?Receiver => {
				const channel: Channel = getters.current;
				if (!channel)
				{
					return null;
				}

				const selected = channel.toList.find((receiver) => receiver.address.id === state.selected.receiverAddressId);
				if (selected)
				{
					return selected;
				}

				return channel.toList[0];
			},
		};
	}

	getActions(): ActionTree<ChannelsState>
	{
		return {
			/** @function channels/actualizeState */
			actualizeState: (store, payload: ChannelsState) => {
				store.commit('actualizeState', deepFreeze(payload));
			},
			/** @function channels/setChannel */
			setChannel: (store, payload: {channelId: string}) => {
				const { channelId } = payload;
				if (!Type.isStringFilled(channelId))
				{
					this.#logger.warn('setChannel: channelId should be a string', { payload });

					return;
				}

				const channel: ?Channel = store.state.collection.find((ch) => ch.id === channelId);
				if (!channel)
				{
					this.#logger.warn('setChannel: channel not found', { payload });

					return;
				}

				store.commit('updateSelected', {
					selected: {
						channelId,
					},
				});
			},
			/** @function channels/setFrom */
			setFrom: (store, payload: {fromId: number}) => {
				const { fromId } = payload;
				if (!Type.isStringFilled(fromId))
				{
					this.#logger.warn('setFrom: fromId should be a string', { payload });

					return;
				}

				const currentChannel: Channel = store.getters.current;
				const from: ?From = currentChannel.fromList.find((fc) => fc.id === fromId);
				if (!from)
				{
					this.#logger.warn('setFrom: from not found', { payload });

					return;
				}

				store.commit('updateSelected', {
					selected: {
						fromId,
					},
				});
			},
			/** @function channels/setReceiver */
			setReceiver: (store, payload: {receiverAddressId: number}) => {
				const { receiverAddressId } = payload;
				if (!Type.isInteger(receiverAddressId))
				{
					this.#logger.warn('setReceiver: receiverAddressId should be an integer', { payload });

					return;
				}

				const currentChannel: Channel = store.getters.current;
				const receiver: ?Receiver = currentChannel.toList.find((rc) => rc.address.id === receiverAddressId);
				if (!receiver)
				{
					this.#logger.warn('setReceiver: receiver not found', { payload });

					return;
				}

				store.commit('updateSelected', {
					selected: {
						receiverAddressId,
					},
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<ChannelsState>
	{
		return {
			actualizeState: (state, payload) => {
				for (const [key, value] of Object.entries(payload))
				{
					if (key in state)
					{
						state[key] = value;
					}
				}
			},
			updateSelected: (state, payload) => {
				state.selected = { ...state.selected, ...payload.selected };
			},
		};
	}
}
