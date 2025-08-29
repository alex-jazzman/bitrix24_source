import { Event } from 'main.core';
import type { Popup } from 'main.popup';
import type { Slider } from 'main.sidepanel';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import type { Params } from 'tasks.v2.application.task-card';

import { App } from './component/app';

export class TaskFullCard
{
	#params: Params;
	#slider: Slider;
	#application: ?VueCreateAppResult;

	constructor(params: Params = {})
	{
		this.#params = params;
	}

	async mountCard(slider: Slider): Promise<void>
	{
		if (!slider.isOpen())
		{
			return;
		}

		this.#slider = slider;

		this.#subscribe();

		this.#application = await this.#mountApplication(slider.getContentContainer());
	}

	unmountCard(): void
	{
		this.#unmountApplication();

		this.#unsubscribe();
	}

	async #mountApplication(container: HTMLElement): Promise<VueCreateAppResult>
	{
		await Core.init();

		const application = BitrixVue.createApp(App, {
			...this.#params,
			id: this.#params.taskId,
		});

		application.mixin(locMixin);
		application.use(Core.getStore());
		application.mount(container);

		return application;
	}

	#unmountApplication(): void
	{
		this.#application?.unmount();
	}

	#subscribe(): void
	{
		Event.EventEmitter.subscribe(EventName.CloseFullCard, this.#onClose);
		Event.EventEmitter.subscribe('BX.Main.Popup:onShow', this.#handlePopupShow);
	}

	#unsubscribe(): void
	{
		Event.EventEmitter.unsubscribe(EventName.CloseFullCard, this.#onClose);
		Event.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.#handlePopupShow);
	}

	#onClose = (): void => {
		this.#slider.close();
	};

	#handlePopupShow = (event): void => {
		const popup: Popup = event.getCompatData()[0];

		const onScroll = () => popup.adjustPosition();
		const onClose = () => {
			popup.unsubscribe('onClose', onClose);
			popup.unsubscribe('onDestroy', onClose);
			Event.unbind(document, 'scroll', onScroll, true);
		};

		popup.subscribe('onClose', onClose);
		popup.subscribe('onDestroy', onClose);
		Event.bind(document, 'scroll', onScroll, true);
	};
}
