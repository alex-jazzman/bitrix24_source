import { Store } from 'ui.vue3.vuex';

import { SilentModeService } from 'imopenlines.v2.provider.service';

export class SilentModeManager
{
	#store: Store;
	#service: SilentModeService;

	constructor(store: Store, service: SilentModeService)
	{
		this.#store = store;
		this.#service = service;
	}

	getStatus(dialogId: string): string
	{
		return this.#store.getters['openLines/currentSession/getSilentModeByDialogId'](dialogId);
	}

	async toggle(dialogId: string): Promise<void>
	{
		const currentStatus = this.getStatus(dialogId);
		await this.#service.set(dialogId, !currentStatus);
	}
}
