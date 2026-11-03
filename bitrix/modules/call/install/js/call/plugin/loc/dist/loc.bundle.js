/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	const LocPlugin = {
		install(app, options) {
			if (!main_core.Type.isFunction(options.getMessage)) {
				throw new TypeError('LocPlugin: options.getMessage must be a function');
			}
			const $loc = (messageId, replacements) => {
				try {
					return options.getMessage(messageId, replacements) ?? messageId;
				} catch {
					return messageId;
				}
			};
			app.config.globalProperties.$loc = $loc;
			app.provide('loc', $loc);
			if (main_core.Type.isString(options.languageId) && options.languageId !== '') {
				app.provide('languageId', options.languageId);
				app.config.globalProperties.$languageId = options.languageId;
			}
		}
	};

	exports.LocPlugin = LocPlugin;

})(this.BX.Call.Plugin = this.BX.Call.Plugin || {}, BX);
//# sourceMappingURL=loc.bundle.js.map
