/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class Feature {
		static #constructorGuard = true;
		static #instance = null;
		#availableFeatureCodes = new Set();
		#lockedFeatureCodes = new Set();
		constructor() {
			if (Feature.#constructorGuard === true) {
				throw new Error('Feature class is a singleton and cannot be instantiated multiple times.');
			}
			this.#init();
		}
		static instance() {
			if (!this.#instance) {
				this.#constructorGuard = false;
				this.#instance = new this();
				this.#constructorGuard = true;
			}
			return this.#instance;
		}
		isAvailable(featureCode) {
			if (!main_core.Type.isStringFilled(featureCode)) {
				return false;
			}
			return this.#availableFeatureCodes.has(featureCode);
		}
		isLocked(featureCode) {
			if (!main_core.Type.isStringFilled(featureCode)) {
				return false;
			}
			return this.#lockedFeatureCodes.has(featureCode);
		}
		#init() {
			const settings = main_core.Extension.getSettings('bizprocdesigner.feature') ?? null;
			const featureCodes = settings?.featureCodes ?? [];
			const lockedFeatureCodes = settings?.lockedFeatureCodes ?? [];
			featureCodes.forEach(code => this.#availableFeatureCodes.add(code));
			lockedFeatureCodes.forEach(code => this.#lockedFeatureCodes.add(code));
		}
	}

	const FeatureCode = Object.freeze({
		aiAssistant: 'aiAssistant',
		complexNodeConnections: 'complexNodeConnections',
		debugBar: 'debugBar',
		dataTables: 'dataTables',
		externalAiAgent: 'externalAiAgent',
		expressionBuilder: 'expressionBuilder',
		readableExpressions: 'readableExpressions',
		lastRunValues: 'lastRunValues',
		versionHistory: 'versionHistory',
		pilotPublication: 'pilotPublication'
	});

	exports.Feature = Feature;
	exports.FeatureCode = FeatureCode;

})(this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {}, BX);
//# sourceMappingURL=feature.bundle.js.map
