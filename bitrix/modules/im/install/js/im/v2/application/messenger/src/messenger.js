import { Core } from 'im.v2.application.core';
import { Messenger as MessengerComponent } from 'im.v2.component.messenger';

import type { JsonObject } from 'main.core';

type RootComponentNode = string | HTMLElement;

export class MessengerApplication
{
	// assigned externally
	bitrixVue: Object = null;

	#initPromise: Promise<MessengerApplication>;
	#params: ?JsonObject = null;
	#vueInstance: Object = null;

	#applicationName = 'Messenger';

	constructor(params: JsonObject = {})
	{
		this.#params = params;
		this.#initPromise = this.#init();
	}

	ready(): Promise<MessengerApplication>
	{
		return this.#initPromise;
	}

	async initComponent(node: RootComponentNode): Promise
	{
		this.unmountComponent();

		this.#vueInstance = await Core.createVue(this, {
			name: this.#applicationName,
			el: node,
			components: { MessengerComponent },
			template: '<MessengerComponent />',
		});
	}

	unmountComponent()
	{
		if (!this.#vueInstance)
		{
			return;
		}

		this.bitrixVue.unmount();
		this.#vueInstance = null;
	}

	async #init(): Promise<MessengerApplication>
	{
		await this.#initCore();

		return this;
	}

	async #initCore(): Promise
	{
		Core.setApplicationData(this.#params);
		await Core.ready();
	}
}
