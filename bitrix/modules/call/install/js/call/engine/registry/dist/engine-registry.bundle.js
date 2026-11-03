/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.EngineProviders = this.BX.Call.EngineProviders || {};
(function (exports) {
	'use strict';

	let providers = null;
	function getProviders() {
		if (providers === null) {
			throw new Error('engineRegistry: no engine provider set registered. Check config.php rel / feature flag wiring.');
		}
		return providers;
	}
	function memoize(factory) {
		let value = null;
		return () => {
			if (value === null) {
				value = factory();
			}
			return value;
		};
	}
	const engineRegistry = {
		register(engineProviders) {
			if (providers !== null) {
				throw new Error('engineRegistry: an engine provider set is already registered. Exactly one engine extension must be loaded.');
			}
			providers = {
				engine: engineProviders.engine,
				capabilities: memoize(engineProviders.capabilities),
				recentSource: memoize(engineProviders.recentSource)
			};
		},
		create(context) {
			return getProviders().engine(context);
		},
		getCapabilities() {
			return getProviders().capabilities();
		},
		getRecentCallsSource() {
			return getProviders().recentSource();
		},
		reset() {
			providers = null;
		}
	};

	exports.engineRegistry = engineRegistry;

})(this.BX.Call.EngineProviders.Registry = this.BX.Call.EngineProviders.Registry || {});
//# sourceMappingURL=engine-registry.bundle.js.map
