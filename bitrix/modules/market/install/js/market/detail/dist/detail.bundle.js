/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue3_pinia, ui_vue3, market_detailComponent, main_core) {
	'use strict';

	let vibePlusApplicationLimitPopupPromise = null;
	async function scheduleVibePlusApplicationLimitPopup(projection) {
		if (!projection) {
			return;
		}
		try {
			vibePlusApplicationLimitPopupPromise ??= main_core.Runtime.loadExtension('market.vibe-plus-application-limit-popup').catch(error => {
				vibePlusApplicationLimitPopupPromise = null;
				throw error;
			});
			const loadedExtension = await vibePlusApplicationLimitPopupPromise;
			const extension = Array.isArray(loadedExtension) ? loadedExtension[0] : loadedExtension;
			extension.scheduleVibePlusApplicationLimitPopup(projection);
		} catch {
			return;
		}
	}
	class Detail {
		constructor(options = {}) {
			this.params = options.params;
			this.result = options.result;
			ui_vue3.BitrixVue.createApp({
				name: 'Market',
				components: {
					DetailComponent: market_detailComponent.DetailComponent
				},
				data: () => {
					return {
						params: this.params,
						result: this.result
					};
				},
				computed: {},
				mounted() {
					void scheduleVibePlusApplicationLimitPopup(this.result.VIBE_PLUS_APPLICATION_LIMIT);
				},
				methods: {},
				template: `
				<DetailComponent
					:params="params"
					:result="result"
				/>
			`
			}).use(ui_vue3_pinia.createPinia()).mount('#market-wrapper-vue');
		}
	}

	exports.Detail = Detail;

})(this.BX.Market = this.BX.Market || {}, BX.Vue3.Pinia, BX.Vue3, BX.Market, BX);
