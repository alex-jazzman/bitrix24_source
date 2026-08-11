/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_v2_lib_logger) {
	'use strict';

	const loggerMethods = {
		warn(...params) {
			im_v2_lib_logger.Logger.warn(...params);
		},
		error(...params) {
			im_v2_lib_logger.Logger.error(...params);
		},
		log(...params) {
			im_v2_lib_logger.Logger.log(...params);
		}
	};
	const Logger = new Proxy(loggerMethods, {
		get(target, property) {
			if (Reflect.has(target, property)) {
				return Reflect.get(target, property);
			}
			throw new Error(`Logger: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
		}
	});

	exports.Logger = Logger;

})(this.BX.Call.Adapter = this.BX.Call.Adapter || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=logger.bundle.js.map
