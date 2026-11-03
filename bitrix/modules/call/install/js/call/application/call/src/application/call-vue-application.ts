import { Loc } from 'main.core';

// @ts-ignore — BitrixVue is declared as namespace in .d.ts, not as export
import { BitrixVue } from 'ui.vue3';
import type { App } from 'ui.vue3';
import { CallLayout } from 'call.component.view.call';

import { LocPlugin } from 'call.plugin.loc';
import type { Pinia } from 'ui.vue3.pinia';

import '../css/call.css';

/**
 * Manages the Vue application lifecycle for the call view.
 * Responsible exclusively for mount/unmount — does NOT implement CallView.
 */
export class CallVueApplication
{
	#pinia: Pinia | null;
	#providers: Record<string, unknown> = {};
	#application: App | null = null;

	constructor({ pinia }: { pinia: Pinia })
	{
		this.#pinia = pinia;
	}

	provide(key: string, value: unknown): void
	{
		this.#providers[key] = value;
	}

	mount(container: HTMLElement): void
	{
		this.unmount();

		const app: App = BitrixVue.createApp({
			name: 'CallApplication',
			components: { CallLayout },
			template: /* HTML */` <CallLayout /> `,
		});

		app.use(LocPlugin, {
			getMessage: (id: string, replacements?: Record<string, string>): string => Loc.getMessage(id, replacements) ?? id,
			languageId: Loc.getMessage('LANGUAGE_ID') ?? 'en',
		});

		app.use(this.#pinia!);

		Object.entries(this.#providers).forEach(([key, value]) =>
		{
			app.provide(key, value);
		});

		app.mount(container);
		this.#application = app;
	}

	unmount(): void
	{
		if (this.#application === null)
		{
			return;
		}

		this.#application.unmount();
		this.#application = null;
	}

	destroy(): void
	{
		this.unmount();
		this.#pinia = null;
		this.#providers = {};
	}
}
