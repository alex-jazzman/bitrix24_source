import { Event, Tag } from 'main.core';
import type { Popup } from 'main.popup';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import { SidePanelInstance } from 'tasks.v2.lib.side-panel-instance';
import type { Params } from 'tasks.v2.application.task-card';

import { App } from './component/app';

export class TaskFullCard
{
	#application: ?VueCreateAppResult = null;

	#params: Params;
	#container: HTMLElement;

	constructor(params: Params = {})
	{
		this.#params = params;
	}

	async showCard(): Promise<void>
	{
		return new Promise((resolve, reject) => {
			this.#showSidePanel(resolve)
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	async mountCard(): Promise<HTMLElement>
	{
		this.#subscribe();

		this.#container = this.#renderContainer();

		await this.#mountApplication(this.#container);

		return this.#container;
	}

	unmountCard(): void
	{
		this.#unmountApplication();

		this.#unsubscribe();
	}

	async #showSidePanel(): Promise<void>
	{
		const sidePanelId = `tasks-task-full-card-${this.#params.taskId ?? 0}`;
		const maxWidth = 1510;

		const card = await this.mountCard();

		return new Promise((resolve) => {
			SidePanelInstance.open(sidePanelId, {
				customLeftBoundary: 0,
				width: maxWidth,
				cacheable: false,
				contentClassName: 'tasks-full-card-slider-content',
				customRightBoundary: 0,
				events: {
					onOpen: resolve,
					onClose: this.#onSidePanelClose,
				},
				contentCallback: () => card,
			});
		});
	}

	#onSidePanelClose = (): void => {
		this.unmountCard();
	};

	#renderContainer(): HTMLElement
	{
		return Tag.render`
			<div class="tasks-full-card-container"></div>
		`;
	}

	async #mountApplication(container: HTMLElement): Promise<void>
	{
		await Core.init();

		const application = BitrixVue.createApp(App, {
			...this.#params,
			id: this.#params.taskId,
		});

		application.mixin(locMixin);
		application.use(Core.getStore());
		application.mount(container);

		this.#application = application;
	}

	#unmountApplication(): void
	{
		this.#application.unmount();
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
		SidePanelInstance.close();
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
