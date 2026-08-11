/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_lib_utils, im_v2_lib_utils) {
	'use strict';

	const createAdapterProxy = (name, methods) => {
		return new Proxy(methods, {
			get(target, property) {
				if (Reflect.has(target, property)) {
					return Reflect.get(target, property);
				}
				throw new Error(`${name}: property "${String(property)}" is not defined in the adapter. Register it explicitly.`);
			}
		});
	};
	const textMethods = {
		getFirstLetters: im_v2_lib_utils.Utils.text.getFirstLetters,
		purify: im_lib_utils.Utils.text.purify
	};
	const browserMethods = {
		isIe: im_v2_lib_utils.Utils.browser.isIe,
		isSafariBased: im_v2_lib_utils.Utils.browser.isSafariBased,
		openLink: im_v2_lib_utils.Utils.browser.openLink
	};
	const deviceMethods = {
		isMobile: im_v2_lib_utils.Utils.device.isMobile
	};
	const platformMethods = {
		isBitrixDesktop: im_v2_lib_utils.Utils.platform.isBitrixDesktop,
		getDesktopVersion: im_v2_lib_utils.Utils.platform.getDesktopVersion,
		isWindows: im_v2_lib_utils.Utils.platform.isWindows,
		isDesktopFeatureEnabled: im_v2_lib_utils.Utils.platform.isDesktopFeatureEnabled
	};
	const keyMethods = {
		isAltOrOption: im_v2_lib_utils.Utils.key.isAltOrOption
	};
	const utilsMethods = {
		text: createAdapterProxy('Utils.text', textMethods),
		browser: createAdapterProxy('Utils.browser', browserMethods),
		device: createAdapterProxy('Utils.device', deviceMethods),
		platform: createAdapterProxy('Utils.platform', platformMethods),
		key: createAdapterProxy('Utils.key', keyMethods)
	};
	const Utils = createAdapterProxy('Utils', utilsMethods);

	exports.Utils = Utils;

})(this.BX.Call.Adapter = this.BX.Call.Adapter || {}, BX.Messenger.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=utils.bundle.js.map
