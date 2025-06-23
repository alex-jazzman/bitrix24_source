import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';

import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { TaskMappers } from 'tasks.v2.provider.service.task-service';
import { Core } from 'tasks.v2.core';
import { EventName } from 'tasks.v2.const';
import type { Params } from 'tasks.v2.application.task-card';

import { App } from './component/app';

export class TaskCompactCard extends EventEmitter
{
	#params: Params;
	#application: ?VueCreateAppResult = null;

	constructor(params: Params = {})
	{
		super(params);

		this.setEventNamespace('Tasks:TaskCompactCard');

		this.#params = params;

		this.#params.taskId = Type.isUndefined(this.#params.taskId) ? 0 : this.#params.taskId;
	}

	async mountCard(container: HTMLElement): Promise<HTMLElement>
	{
		await this.#mountApplication(container);

		this.#adjustPosition();
		this.#subscribe();
	}

	unmountCard(): void
	{
		this.#unmountApplication();

		this.#unsubscribe();
	}

	async #mountApplication(container: HTMLElement): Promise<void>
	{
		await Core.init();

		const application = BitrixVue.createApp(App, this.#params);

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
		EventEmitter.subscribe(`${EventName.CloseCard}:${this.#params.taskId}`, this.#closeCard);
		EventEmitter.subscribe(`${EventName.OpenFullCard}:${this.#params.taskId}`, this.#openFullCard);
		EventEmitter.subscribe(`${EventName.OpenSliderCard}:${this.#params.taskId}`, this.#openSliderCard);
		EventEmitter.subscribe(`${EventName.ShowOverlay}:${this.#params.taskId}`, this.#showOverlay);
		EventEmitter.subscribe(`${EventName.HideOverlay}:${this.#params.taskId}`, this.#hideOverlay);
		EventEmitter.subscribe(`${EventName.AdjustPosition}:${this.#params.taskId}`, this.#adjustPosition);
	}

	#unsubscribe(): void
	{
		EventEmitter.unsubscribe(`${EventName.CloseCard}:${this.#params.taskId}`, this.#closeCard);
		EventEmitter.unsubscribe(`${EventName.OpenFullCard}:${this.#params.taskId}`, this.#openFullCard);
		EventEmitter.unsubscribe(`${EventName.OpenSliderCard}:${this.#params.taskId}`, this.#openSliderCard);
		EventEmitter.unsubscribe(`${EventName.ShowOverlay}:${this.#params.taskId}`, this.#showOverlay);
		EventEmitter.unsubscribe(`${EventName.HideOverlay}:${this.#params.taskId}`, this.#hideOverlay);
		EventEmitter.unsubscribe(`${EventName.AdjustPosition}:${this.#params.taskId}`, this.#adjustPosition);
	}

	#closeCard = (): void => {
		this.emit('closeCard');
	};

	#openFullCard = (baseEvent: BaseEvent): void => {
		this.#params.taskId = baseEvent.getData();

		this.emit('openFullCard', this.#params.taskId);
	};

	#openSliderCard = (baseEvent: BaseEvent): void => {
		const task = baseEvent.getData().task;
		const checkLists = baseEvent.getData().checkLists;

		const data = TaskMappers.mapModelToSliderData(task, checkLists);

		const path = Core.getParams().paths.editPath;
		BX.SidePanel.Instance.open(path, {
			requestMethod: 'post',
			requestParams: data,
			cacheable: false,
		});

		this.#closeCard();
	};

	#showOverlay = (): void => {
		this.emit('showOverlay');
	};

	#hideOverlay = (): void => {
		this.emit('hideOverlay');
	};

	#adjustPosition = (baseEvent: BaseEvent = null): void => {
		this.emit('adjustPosition', baseEvent?.getData() ?? {});
	};
}
