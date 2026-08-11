// @flow

import { BitrixVue } from 'ui.vue3';
import { Screen as CallScreen } from '../components/screen';

/**
 * Manages the Vue application lifecycle for the call view.
 * Responsible exclusively for mount/unmount — does NOT implement CallView.
 */
export class CallVueApplication
{
	#pinia = null;
	#providers = {};
	#bitrixVue = null;

	constructor({ pinia }: { pinia: any })
	{
		this.#pinia = pinia;
	}

	/**
	 * Registers a value to be provided to the Vue component tree via inject.
	 *
	 * @param {string} key
	 * @param {any} value
	 */
	provide(key: string, value: any): void
	{
		this.#providers[key] = value;
	}

	/**
	 * Mounts the Vue application into the given container.
	 *
	 * @param {HTMLElement} container
	 */
	mount(container: HTMLElement): void
	{
		this.unmount();

		this.#bitrixVue = BitrixVue.createApp({
			name: 'CallApplication',
			components: { CallScreen },
			template: /* HTML */`
				<CallScreen />
			`,
		});

		this.#bitrixVue.use(this.#pinia);

		Object.entries(this.#providers).forEach(([key, value]) => {
			this.#bitrixVue.provide(key, value);
		});

		this.#bitrixVue.mount(container);
	}

	/**
	 * Unmounts the Vue application.
	 */
	unmount(): void
	{
		if (this.#bitrixVue === null)
		{
			return;
		}

		this.#bitrixVue.unmount();
		this.#bitrixVue = null;
	}

	/**
	 * Destroys the application and releases all resources.
	 */
	destroy(): void
	{
		this.unmount();
		this.#pinia = null;
		this.#providers = {};
	}
}
