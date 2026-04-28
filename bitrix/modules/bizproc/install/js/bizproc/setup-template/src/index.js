import { Tag } from 'main.core';
import { PULL } from 'pull.client';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';
import { ActivatorAppComponent } from './component/app';
import type { SetupTemplateData } from './types';

type SetupTemplateOptions = {
	container: HTMLElement,
	pushData: SetupTemplateData,
};

export { ActivatorAppComponent } from './component/app';
export { FormElement } from './component/item';
export type { SetupTemplateData } from './types';

export class SetupTemplate
{
	#pushData: SetupTemplateData;
	#container: HTMLElement;
	#application: ?VueCreateAppResult;
	constructor(options: SetupTemplateOptions)
	{
		this.#container = options.container;
		this.#pushData = options.pushData;
	}

	mount(): void
	{
		this.#application = BitrixVue.createApp(ActivatorAppComponent, {
			templateId: this.#pushData.templateId,
			templateName: this.#pushData.templateName,
			templateDescription: this.#pushData.templateDescription,
			instanceId: this.#pushData.instanceId,
			blocks: this.#pushData.blocks,
		});
		this.#application.mount(this.#container);
	}

	unmount(): void
	{
		if (this.#application)
		{
			this.#application.unmount();
		}
	}

	static createLayout(params: SetupTemplateData): HTMLElement
	{
		const container = Tag.render`<div class="ui-sidepanel-layout"></div>`;
		const app = new SetupTemplate({
			container,
			pushData: params,
		});
		app.mount();

		return container;
	}

	static showSidePanel(params: SetupTemplateData): void
	{
		BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
			width: 700,
			cacheable: false,
			contentCallback: () => SetupTemplate.createLayout(params),
		});
	}

	static subscribeOnPull(): void
	{
		PULL.subscribe({
			moduleId: 'bizproc',
			command: 'setupTemplateActivityBlocks',
			callback: (pushData: SetupTemplateData): void => {
				SetupTemplate.showSidePanel(pushData);
			},
		});
	}
}
