import { Event, Tag, Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import type { VueCreateAppResult } from 'ui.vue3';

import { Core } from 'booking.core';
import { EventName, Model } from 'booking.const';
import { locMixin } from 'booking.component.mixin.loc-mixin';
import { SidePanelInstance } from 'booking.lib.side-panel-instance';
import { SkuResourcesEditorModel } from 'booking.model.sku-resources-editor';

import { App } from './components/app';
import { SkuResourcesEditorParams } from './components/types';

export class SkuResourcesEditor
{
	static #width: number = 700;

	#application: VueCreateAppResult | null = null;
	#params: SkuResourcesEditorParams;

	constructor(params: SkuResourcesEditorParams)
	{
		const options = {
			canAdd: false,
			canRemove: false,
			catalogSkuEntityOptions: null,
			...params.options,
		};
		this.#params = {
			...params,
			options,
		};
	}

	get name(): string
	{
		return 'booking:sku-resources-editor';
	}

	#mountContent(container: HTMLElement): void
	{
		const application = BitrixVue.createApp(App, {
			...Core.getParams(),
			params: this.#params,
		});

		application.mixin(locMixin);
		application.use(Core.getStore());
		application.mount(container);

		this.#application = application;
	}

	async #initCore(): Promise<void>
	{
		try
		{
			await Core.init();
			await Core.addDynamicModule(SkuResourcesEditorModel.create());
		}
		catch (error)
		{
			console.error('Init SkuResourcesEditor error', error);
		}
	}

	#makeContainer(): HTMLElement
	{
		return Tag.render`
			<div id="booking-sre-app" class="booking-sre-app"></div>
		`;
	}

	open(): void
	{
		SidePanelInstance.open(this.name, {
			width: SkuResourcesEditor.#width,
			cacheable: false,
			events: {
				onClose: this.closeSidePanel.bind(this),
			},
			contentCallback: async () => {
				await this.#initCore();
				this.subscribeEvents();

				const container = this.#makeContainer();
				this.#mountContent(container);

				return container;
			},
		});
	}

	async closeSidePanel(): Promise<void>
	{
		if (Type.isFunction(this.#params.save))
		{
			this.#params.save();
		}

		this.#application.unmount();
		this.#application = null;

		await Core.removeDynamicModule(Model.SkuResourcesEditor);

		this.unsubscribeEvents();
	}

	close(): void
	{
		SidePanelInstance.close();
	}

	subscribeEvents(): void
	{
		Event.EventEmitter.subscribe(
			EventName.CloseSkuResourcesEditor,
			this.close,
		);
	}

	unsubscribeEvents(): void
	{
		Event.EventEmitter.unsubscribe(
			EventName.CloseSkuResourcesEditor,
			this.close,
		);
	}
}
