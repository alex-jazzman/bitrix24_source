import {createPinia} from 'ui.vue3.pinia';
import {BitrixVue} from "ui.vue3";
import {DetailComponent} from "market.detail-component";
import { Runtime } from 'main.core';

let vibePlusApplicationLimitPopupPromise = null;

async function scheduleVibePlusApplicationLimitPopup(projection)
{
	if (!projection)
	{
		return;
	}

	try
	{
		vibePlusApplicationLimitPopupPromise ??= Runtime.loadExtension(
			'market.vibe-plus-application-limit-popup',
		).catch((error) => {
			vibePlusApplicationLimitPopupPromise = null;
			throw error;
		});
		const loadedExtension = await vibePlusApplicationLimitPopupPromise;
		const extension = Array.isArray(loadedExtension)
			? loadedExtension[0]
			: loadedExtension;

		extension.scheduleVibePlusApplicationLimitPopup(projection);
	}
	catch
	{
		return;
	}
}

export class Detail
{
	constructor(options = {})
	{
		this.params = options.params;
		this.result = options.result;

		(BitrixVue.createApp({
			name: 'Market',
			components: {
				DetailComponent,
			},
			data: () => {
				return {
					params: this.params,
					result: this.result,
				};
			},
			computed: {

			},
			mounted() {
				void scheduleVibePlusApplicationLimitPopup(this.result.VIBE_PLUS_APPLICATION_LIMIT);
			},
			methods: {

			},
			template: `
				<DetailComponent
					:params="params"
					:result="result"
				/>
			`,
		})).use(createPinia()).mount('#market-wrapper-vue');
	}
}
