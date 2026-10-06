import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import 'ui.design-tokens.air';

import { Master } from './master';
import type { Recipient, Settings } from './types';

import './call-assessment-summary.css';

type Params = {
	settings: Settings;
	recipients?: Recipient[];
};

export class CallAssessmentSummary
{
	#container: HTMLElement;
	#app: ReturnType<typeof BitrixVue.createApp> | null = null;

	constructor(containerId: string, params: Params)
	{
		const container = document.getElementById(containerId);
		if (!Type.isDomNode(container))
		{
			throw new Error(`CallAssessmentSummary: container "${containerId}" not found`);
		}

		this.#container = container;
		this.#app = BitrixVue.createApp(Master, {
			initialSettings: params.settings,
			initialRecipients: Array.isArray(params.recipients) ? params.recipients : [],
		});
		this.#app.mount(this.#container);
	}
}
