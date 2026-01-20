import type { Store } from 'ui.vue3.vuex';
import { type ChannelPosition } from '../editor';

const OPTIONS_CATEGORY = 'crm';
const OPTIONS_NAME = 'crm.messagesender.editor';

export class PreferencesService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
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
