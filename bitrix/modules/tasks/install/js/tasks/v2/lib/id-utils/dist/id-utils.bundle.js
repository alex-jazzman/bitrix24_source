/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports) {
	'use strict';

	const idUtils = new class {
	  isReal(taskId) {
	    const id = this.isTemplate(taskId) ? this.unbox(taskId) : taskId;
	    return Number.isInteger(id) && id > 0;
	  }
	  isTemplate(id) {
	    return String(id).startsWith('template');
	  }
	  boxTemplate(id) {
	    return `template${id}`;
	  }
	  unbox(id) {
	    const idPure = String(id).replace('template', '');
	    return Number(idPure) || idPure;
	  }
	}();

	exports.idUtils = idUtils;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {})));
//# sourceMappingURL=id-utils.bundle.js.map
