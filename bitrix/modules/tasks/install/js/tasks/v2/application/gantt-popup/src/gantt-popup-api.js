import { Popup, PopupManager } from 'main.popup';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Core } from 'tasks.v2.core';
import { GanttPopupContent } from './gantt-popup-content';

type Params = {
	taskId: number,
};

const popupId = 'tasks-gantt-popup';

export class GanttPopupApi
{
	#params: Params;
	#popup: Popup;
	#application: ?VueCreateAppResult;
	#onUpdate: Function | null = null;

	constructor(params: Params = {})
	{
		this.#params = params;
	}

	onUpdate(callback: Function): void
	{
		this.#onUpdate = callback;
	}

	async showTo(bindElement: HTMLElement, targetContainer: HTMLElement): Promise<void>
	{
		if (PopupManager.getPopupById(popupId))
		{
			return;
		}

		const content = document.createElement('div');

		await this.#mountApplication(content);

		this.#popup = new Popup({
			id: popupId,
			content,
			bindElement,
			targetContainer,
			padding: 14,
			width: 470,
			offsetTop: 4,
			cacheable: false,
			autoHide: true,
			closeByEsc: true,
			animation: 'fading',
			bindOptions: {
				forceBindPosition: true,
			},
			events: {
				onAfterClose: (): void => this.#unmountApplication(),
			},
		});

		this.#popup.show();
	}

	destroy(): void
	{
		PopupManager.getPopupById(popupId)?.destroy();
	}

	async #mountApplication(container: HTMLElement): Promise<void>
	{
		await Core.init();

		const application = BitrixVue.createApp(GanttPopupContent, {
			...this.#params,
			close: () => this.#popup.close(),
			freeze: () => {
				this.#popup.setAutoHide(false);
				this.#popup.setClosingByEsc(false);
			},
			unfreeze: () => {
				this.#popup.setAutoHide(true);
				this.#popup.setClosingByEsc(true);
			},
			updated: this.#onUpdate,
		});

		application.mixin(locMixin);
		application.mount(container);

		this.#application = application;
	}

	#unmountApplication(): void
	{
		this.#application.unmount();
	}
}
