import { ajax } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { BitrixVue } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { ConsultationAha } from './consultation-aha';

const PROMOTION_ID = 'tasks_consultation_button';
const BIND_ELEMENT_ID = 'tasks-feedback-button';

export class ConsultationButton
{
	#application = null;

	static show(): void
	{
		new this().showTooltip();
	}

	showTooltip(): void
	{
		const bindElement = document.getElementById(BIND_ELEMENT_ID);
		if (!bindElement)
		{
			return;
		}

		BannerDispatcher.normal.toQueue((onDone) => {
			const container = document.createElement('div');

			this.#application = BitrixVue.createApp(ConsultationAha, {
				bindElement,
				close: () => this.#destroy(onDone),
			});
			this.#application.mixin(locMixin);
			this.#application.mount(container);

			this.setViewed();
		});
	}

	#destroy(onDone: () => void): void
	{
		if (this.#application)
		{
			this.#application.unmount();
			this.#application = null;
			onDone();
		}
	}

	setViewed(): void
	{
		void ajax.runAction('tasks.promotion.setViewed', {
			data: {
				promotion: PROMOTION_ID,
			},
		});
	}
}
