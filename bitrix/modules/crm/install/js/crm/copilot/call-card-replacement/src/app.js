import store from './store';
import { BitrixVue } from 'ui.vue3';
import { Main } from './components/main';
import { type VueCreateAppResult } from 'ui.vue';
import { createStore } from 'ui.vue3.vuex';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

export type ReplacementOptions = {
	callId: string,
	callAssessment?: {
		id: number,
		title: string,
		prompt: string,
		isHintEnabled?: boolean,
		hasHint?: boolean,
		criteria?: Array<{ id: number, title: string, description: string, sort: number }>,
	},
	hintViewMode?: ?string,
	hasAvailableSelectorItems: boolean,
	isCallScoringV2Enabled?: boolean,
};

export class CallCardReplacementApp
{
	#application: VueCreateAppResult = null;

	constructor(options: ReplacementOptions)
	{
		this.#application = BitrixVue.createApp({
			name: 'CrmCopilotCallCardReplacementApp',
			components: { Main },
			template: `
				<Main />
			`,
		});

		const storage = createStore(store());
		storage.commit('initializeApplicationState', options);

		this.#application.use(storage);
		this.#application.mixin(locMixin);
	}

	mount(target: Element | string): void
	{
		this.#application.mount(target);
	}
}
