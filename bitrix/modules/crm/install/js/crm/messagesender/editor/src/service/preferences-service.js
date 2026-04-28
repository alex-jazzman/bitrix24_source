import type { Store } from 'ui.vue3.vuex';
import type { Channel } from '../editor';
import { type ChannelPosition, type ChannelLastUsedFrom } from '../editor';

const OPTIONS_CATEGORY = 'crm';
const OPTIONS_NAME = 'crm.messagesender.editor';

export class PreferencesService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
	}

	saveChannelLastUsedFrom(channel: Channel, fromId: string): void
	{
		const channelsLastUsedFrom = this.#store.getters['preferences/channelsLastUsedFrom']
		const index = channelsLastUsedFrom.findIndex(item => item.channelId === channel.id);

		if (index >= 0)
		{
			if (channelsLastUsedFrom[index].fromId === fromId)
			{
				return;
			}

			channelsLastUsedFrom[index].fromId = fromId;
		}
		else {
			channelsLastUsedFrom.push({
				channelId: channel.id,
				fromId: fromId,
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
		const scene = this.#store.state.application.scene;

		BX.userOptions.save(OPTIONS_CATEGORY, OPTIONS_NAME, scene.id, JSON.stringify(this.#store.state.preferences));
	}
}
