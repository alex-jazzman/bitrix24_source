import { Runtime, Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import { type Channel, type ChannelLastUsedFrom, type ChannelPosition } from '../editor';

const OPTIONS_CATEGORY = 'messageservice.message.editor';

export class PreferencesService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
	}

	saveChannelLastUsedFrom(channel: Channel, fromId: string): void
	{
		const channelsLastUsedFrom = Runtime.clone(this.#store.state.preferences.channelsLastUsedFrom);
		const index = channelsLastUsedFrom.findIndex((item) => item.channelId === channel.id);

		if (index >= 0)
		{
			if (channelsLastUsedFrom[index].fromId === fromId)
			{
				return;
			}

			channelsLastUsedFrom[index].fromId = fromId;
		}
		else
		{
			channelsLastUsedFrom.push({
				channelId: channel.id,
				fromId,
			});
		}

		this.saveChannelsLastUsedFrom(channelsLastUsedFrom);
	}

	saveChannelsLastUsedFrom(channelsLastUsedFrom: ChannelLastUsedFrom[]): void
	{
		void this.#store.dispatch('preferences/setChannelsLastUsedFrom', { channelsLastUsedFrom });

		this.#savePreferences();
	}

	saveChannelsSort(sort: ChannelPosition[]): void
	{
		void this.#store.dispatch('preferences/setChannelsSort', { channelsSort: sort });

		this.#savePreferences();
	}

	#savePreferences(): void
	{
		const sceneId = this.#store.state.application.scene?.id;
		if (!Type.isStringFilled(sceneId))
		{
			return;
		}

		for (const [key, value] of Object.entries(this.#store.state.preferences))
		{
			BX.userOptions.save(OPTIONS_CATEGORY, sceneId, key, JSON.stringify(value));
		}
	}
}
