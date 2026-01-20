import type { Slider } from 'main.sidepanel';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { App } from './component/app';

export type Params = {
	templateId: number | string,
};

export class TemplateHistoryGrid
{
	#application: ?VueCreateAppResult;
	#params: Params;

	constructor(params: Params = {})
	{
		this.#params = params;
	}

	async mount(slider: Slider): Promise<void>
	{
		this.#application = await this.#mountApplication(slider.getContentContainer());
	}

	unmount(): void
	{
		this.#unmountApplication();
	}

	async #mountApplication(container: HTMLElement): Promise<VueCreateAppResult>
	{
		const application = BitrixVue.createApp(App, this.#params);

		application.mixin(locMixin);
		application.mount(container);

		return application;
	}

	#unmountApplication(): void
	{
		this.#application?.unmount();
	}
}
