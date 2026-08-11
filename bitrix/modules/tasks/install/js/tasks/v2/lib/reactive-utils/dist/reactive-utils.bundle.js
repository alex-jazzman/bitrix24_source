/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_vue3) {
	'use strict';

	function deepToRaw(refObj) {
		const modelIterator = data => {
			if (Array.isArray(data)) {
				return data.map(item => modelIterator(item));
			}
			if (ui_vue3.isRef(data) || ui_vue3.isReactive(data) || ui_vue3.isProxy(data)) {
				return modelIterator(ui_vue3.toRaw(data));
			}
			if (main_core.Type.isObject(data)) {
				return Object.keys(data).reduce((acc, key) => {
					acc[key] = modelIterator(data[key]);
					return acc;
				}, {});
			}
			return data;
		};
		return modelIterator(refObj);
	}

	exports.deepToRaw = deepToRaw;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Vue3);
//# sourceMappingURL=reactive-utils.bundle.js.map
