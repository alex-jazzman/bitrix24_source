import { Event, Tag } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import type { VueCreateAppResult } from 'ui.vue3';

import { Core } from 'booking.core';
import { EventName, Model } from 'booking.const';
import { locMixin } from 'booking.component.mixin.loc-mixin';
import { SidePanelInstance } from 'booking.lib.side-panel-instance';
import { YandexIntegrationWizardModel } from 'booking.model.yandex-integration-wizard';

import { App } from './components/app';

export class YandexIntegrationWizard
{
	static #width: number = 730;

	#application: VueCreateAppResult | null = null;

	get name(): string
	{
		return 'booking:yandex-integration-wizard';
	}

	#mountContent(container: HTMLElement): void
	{
		const application = BitrixVue.createApp(App, Core.getParams());

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
			await Core.addDynamicModule(YandexIntegrationWizardModel.create());
		}
		catch (error)
		{
			console.error('Init Yandex integration wizard error', error);
		}
	}

	#makeContainer(): HTMLElement
	{
		return Tag.render`
			<div id="booking--yandex-integration-wizard--app" class="booking--yandex-integration-wizard--app"></div>
		`;
	}

	open(): void
	{
		SidePanelInstance.open(this.name, {
			width: YandexIntegrationWizard.#width,
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

	closeSidePanel(): Promise<void>
	{
		this.#application.unmount();
		this.#application = null;
		this.unsubscribeEvents();
	}

	subscribeEvents(): void
	{
		Event.EventEmitter.subscribe(
			EventName.CloseYandexIntegrationWizard,
			this.close,
		);
	}

	unsubscribeEvents(): void
	{
		Event.EventEmitter.unsubscribe(
			EventName.CloseYandexIntegrationWizard,
			this.close,
		);
	}

	close(): void
	{
		SidePanelInstance.close();
	}
}
