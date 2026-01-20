import type { Slider } from 'main.sidepanel';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { App } from './component/app';

export type Params = {
	taskId: number,
};

export class HistoryGrid
{
	#application: ?VueCreateAppResult;
	#params: Params;

	constructor(params: Params = {})
	{
		this.#params = params;
	}

	static openHistoryGrid(params: Params): void
	{
		let historyGrid = null;
		BX.SidePanel.Instance.open('tasks-history-grid', {
			contentCallback: (slider: Slider): HTMLElement => {
				historyGrid = new this(params);

				return historyGrid.mount(slider);
			},
			events: {
				onClose: (): void => historyGrid?.unmount(),
			},
			cacheable: false,
			width: 1200,
		});
	}

	mount(slider: Slider): void
	{
		this.#application = this.#mountApplication(slider.getContentContainer());
	}

	unmount(): void
	{
		this.#unmountApplication();
	}

	#mountApplication(container: HTMLElement): VueCreateAppResult
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
