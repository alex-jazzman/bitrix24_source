/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core) {
	'use strict';

	class Limit {
		static instances = {};
		#featureId;
		#code;
		#bindElement;
		#limitAnalyticsLabels = {};
		constructor(params) {
			this.#featureId = params.featureId;
			this.#code = main_core.Type.isStringFilled(params.code) ? params.code : `limit_${this.#featureId}`;
			this.#bindElement = main_core.Type.isElementNode(params.bindElement) ? params.bindElement : null;
			if (main_core.Type.isPlainObject(params.limitAnalyticsLabels)) {
				this.#limitAnalyticsLabels = {
					module: 'tasks',
					...params.limitAnalyticsLabels
				};
			}
		}
		static showInstance(params) {
			if (!main_core.Type.isStringFilled(params.featureId)) {
				throw new Error('BX.Tasks.Limit: featureId is required');
			}
			return new this(params).show();
		}
		show() {
			return new Promise((resolve, reject) => {
				main_core.Runtime.loadExtension('ui.info-helper').then(({
					FeaturePromotersRegistry
				}) => {
					if (FeaturePromotersRegistry) {
						FeaturePromotersRegistry.getPromoter({
							featureId: this.#featureId,
							code: this.#code,
							bindElement: this.#bindElement
						}).show();
					} else {
						BX.UI.InfoHelper.show(this.#code, {
							isLimit: true,
							limitAnalyticsLabels: this.#limitAnalyticsLabels
						});
					}
					resolve();
				}).catch(error => {
					reject(error);
				});
			});
		}
	}

	exports.Limit = Limit;

})(this.BX.Tasks.Limit = this.BX.Tasks.Limit || {}, BX);
//# sourceMappingURL=limit.bundle.js.map
