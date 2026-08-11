import { Loc } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

export class AlertService
{
	#store: Store;

	constructor(params: { store: Store })
	{
		this.#store = params.store;
	}

	showError(message: ?string = null): void
	{
		void this.#store.dispatch('application/setAlert', {
			error: message || Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_GENERIC_ERROR'),
		});
	}
}
