/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_v2_lib_notifier) {
	'use strict';

	const callMethods = {
		onBackgroundFileSizeError(...args) {
			return im_v2_lib_notifier.Notifier.call.onBackgroundFileSizeError(...args);
		},
		onBackgroundUnsupportedError(...args) {
			return im_v2_lib_notifier.Notifier.call.onBackgroundUnsupportedError(...args);
		}
	};
	const notifierMethods = {
		subscribe(...args) {
			return im_v2_lib_notifier.Notifier.subscribe(...args);
		},
		notify(...args) {
			return im_v2_lib_notifier.Notifier.notify(...args);
		},
		call: new Proxy(callMethods, {
			get(target, property) {
				if (Reflect.has(target, property)) {
					return Reflect.get(target, property);
				}
				throw new Error(`Notifier.call: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
			}
		})
	};
	const Notifier = new Proxy(notifierMethods, {
		get(target, property) {
			if (Reflect.has(target, property)) {
				return Reflect.get(target, property);
			}
			throw new Error(`Notifier: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
		}
	});

	exports.Notifier = Notifier;

})(this.BX.Call.Adapter = this.BX.Call.Adapter || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=notifier.bundle.js.map
