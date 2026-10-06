import { Type } from 'main.core';
import { type App as VueApp, BitrixVue } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { App } from './components/app/app';
import { type CallAssessmentV2Events, type CallAssessmentV2Settings, type ScriptData } from './types';
import 'ui.design-tokens';
import 'ui.icon-set.outline';

type CallAssessmentV2Params = {
	data: ScriptData,
	config?: Partial<CallAssessmentV2Settings>,
	events?: CallAssessmentV2Events,
};

export class CallAssessmentV2
{
	readonly #container: HTMLElement;
	#app: VueApp | null = null;

	constructor(containerId: string, params: CallAssessmentV2Params)
	{
		const container = document.getElementById(containerId);
		if (!Type.isDomNode(container))
		{
			throw new Error(`CallAssessmentV2: container "${containerId}" not found`);
		}

		this.#container = container;
		this.#mount(params);
	}

	#mount(params: CallAssessmentV2Params): void
	{
		const settings: CallAssessmentV2Settings = {
			readOnly: params.config?.readOnly ?? true,
			isEnabled: params.config?.isEnabled ?? true,
			isCopy: params.config?.isCopy ?? false,
			isNewScript: params.config?.isNewScript ?? false,
			isPendingGeneration: params.config?.isPendingGeneration ?? false,
		};

		this.#app = BitrixVue.createApp(App, {
			initialData: params.data,
			settings,
			events: params.events ?? {},
		});
		this.#app.mixin(locMixin);
		this.#app.mount(this.#container);
	}

	destroy(): void
	{
		this.#app?.unmount();
		this.#app = null;
	}
}
