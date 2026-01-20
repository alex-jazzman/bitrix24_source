import { Runtime, Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';
import { type Channel, type ChannelPosition, type Preferences } from '../editor';
import { type Logger } from '../service/logger';

type PreferencesState = Preferences;

export class PreferencesModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'preferences';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): PreferencesState
	{
		return {
			channelsSort: Runtime.clone(this.getVariable('channelsSort', null)),
		};
	}

	getGetters(): GetterTree<PreferencesState>
	{
		return {
			/** @function preferences/channelsSortOrDefault */
			channelsSortOrDefault: (state, getters, rootState): ChannelPosition[] => {
				const savedSort = Runtime.clone(state.channelsSort ?? []);

				for (const channel: Channel of rootState.channels.collection)
				{
					if (!savedSort.some((x: ChannelPosition) => x.channelId === channel.id))
					{
						savedSort.unshift({
							channelId: channel.id,
							isHidden: false,
						});
					}
				}

				return savedSort;
			},
			firstVisibleChannelId: (state, getters): ?string => {
				const sort: ChannelPosition[] = getters.channelsSortOrDefault;

				const visible: ChannelPosition[] = sort.filter((position) => !position.isHidden);
				if (Type.isArrayFilled(visible))
				{
					return visible[0].channelId;
				}

				return null;
			},
		};
	}

	getActions(): ActionTree<PreferencesState>
	{
		return {
			/** @function preferences/actualizeState */
			actualizeState: (store, payload: PreferencesState) => {
				store.commit('actualizeState', Runtime.clone(payload));
			},
			/** @function preferences/setChannelsSort */
			setChannelsSort: (store, payload: { channelsSort: ChannelPosition[] }) => {
				const { channelsSort } = payload;
				if (!Type.isArray(channelsSort))
				{
					this.#logger.warn('setChannelsSort: channelsSort should be an array', { payload });

					return;
				}

				const normalized = channelsSort
					.filter((position) => Type.isPlainObject(position))
					.map((position) => Runtime.clone(position))
				;
				if (!Type.isArrayFilled(normalized))
				{
					this.#logger.warn(
						'setChannelsSort: channelsSort should contain at least one position',
						{ payload },
					);

					return;
				}

				store.commit('setChannelsSort', {
					channelsSort: normalized,
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<PreferencesState>
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
			setChannelsSort: (state, { channelsSort }) => {
				state.channelsSort = channelsSort;
			},
		};
	}
}
