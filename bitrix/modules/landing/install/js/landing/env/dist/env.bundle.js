/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	const defaultOptions = {
		params: {
			type: 'EXTERNAL'
		}
	};

	/**
	 * Pure predicate: tells whether the URL is a supported video-service URL.
	 *
	 * The `vk` service is honored only when vkVideoAvailable is true; every other
	 * service is checked regardless of the flag. Matchers are the single source of
	 * truth from BX.Landing.Utils.Matchers.
	 *
	 * @memberOf BX.Landing
	 */
	function isSupportedVideoUrl(value, services, vkVideoAvailable) {
		const matchers = BX.Landing.Utils.Matchers;
		return services.some(service => {
			if (service === 'vk' && vkVideoAvailable !== true) {
				return false;
			}
			const matcher = matchers[service];
			return Boolean(matcher) && matcher.test(value);
		});
	}

	const optionsKey = Symbol('options');
	const mergeOptions = (baseOptions = {}, options = {}) => {
		const merge = main_core.Runtime?.merge || BX?.Runtime?.merge;
		if (typeof merge === 'function') {
			return merge(baseOptions, options);
		}
		return {
			...baseOptions,
			...options,
			params: {
				...(baseOptions.params || {}),
				...(options.params || {})
			}
		};
	};
	const getGlobalClass = name => {
		const getClass = main_core.Reflection?.getClass || BX?.Reflection?.getClass;
		return typeof getClass === 'function' ? getClass(name) : null;
	};

	/**
	 * @memberOf BX.Landing
	 */
	class Env {
		static instance = null;
		static getInstance() {
			return Env.instance || Env.createInstance();
		}
		static createInstance(options = {}) {
			Env.instance = new Env(options);
			const parentEnv = getGlobalClass('parent.BX.Landing.Env');
			if (parentEnv) {
				parentEnv.instance = Env.instance;
			}
			return Env.instance;
		}
		constructor(options = {}) {
			this[optionsKey] = Object.seal(mergeOptions(defaultOptions, options));
		}
		getOptions() {
			return {
				...this[optionsKey]
			};
		}
		setOptions(options) {
			this[optionsKey] = mergeOptions(this[optionsKey], options);
		}
		getType() {
			return this.getOptions().params.type;
		}
		setType(type) {
			this.getOptions().params.type = type;
		}
		getSpecialType() {
			return this.getOptions().specialType;
		}
		getSiteId() {
			return this.getOptions().site_id || -1;
		}
		getLandingEditorUrl(options = {}) {
			const envOptions = this.getOptions();
			const urlMask = envOptions.params.sef_url.landing_view;
			const siteId = options.site ? options.site : envOptions.site_id;
			return urlMask.replace('#site_show#', siteId).replace('#landing_edit#', options.landing);
		}
		isBlockControlsEnabled() {
			const option = this.getOptions().blockControlsEnabled;
			return typeof option === 'undefined' ? true : BX.Text.toBoolean(option);
		}
		isVkVideoAvailable() {
			const option = this.getOptions().vkVideoAvailable;
			return typeof option === 'undefined' ? true : BX.Text.toBoolean(option);
		}
	}

	exports.Env = Env;
	exports.isSupportedVideoUrl = isSupportedVideoUrl;

})(this.BX.Landing = this.BX.Landing || {}, BX);
//# sourceMappingURL=env.bundle.js.map
