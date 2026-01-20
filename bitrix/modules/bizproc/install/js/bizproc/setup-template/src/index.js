import { Tag } from 'main.core';
import { PULL } from 'pull.client';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';
import { ActivatorAppComponent } from './component/app';
import type { SetupActivityPushData } from './types';

type SetupTemplateOptions = {
	container: HTMLElement,
	pushData: SetupActivityPushData,
};

export { ActivatorAppComponent } from './component/app';
export { FormElement } from './component/item';

export class SetupTemplate
{
	#pushData: SetupActivityPushData;
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

	static createLayout(params: SetupActivityPushData): HTMLElement
	{
		const container = Tag.render`<div class="ui-sidepanel-layout"></div>`;
		const app = new SetupTemplate({
			container,
			pushData: params,
		});
		app.mount();

		return container;
	}

	static showSidePanel(params: SetupActivityPushData): void
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
			callback: (pushData: SetupActivityPushData): void => {
				SetupTemplate.showSidePanel(pushData);
			},
		});
	}
}
