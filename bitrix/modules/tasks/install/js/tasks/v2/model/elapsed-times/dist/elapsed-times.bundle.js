/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	class ElapsedTimes extends ui_vue3_vuex.BuilderEntityModel {
	  getName() {
	    return tasks_v2_const.Model.ElapsedTimes;
	  }
	  getGetters() {
	    return {
	      /** @function elapsed-times/getIds */
	      getIds: (state, {
	        getAll
	      }) => taskId => getAll.filter(item => item.taskId === taskId).sort((a, b) => {
	        const aIsString = !main_core.Type.isNumber(a.id);
	        const bIsString = !main_core.Type.isNumber(b.id);
	        if (aIsString && !bIsString) {
	          return -1;
	        }
	        if (!aIsString && bIsString) {
	          return 1;
	        }
	        if (aIsString && bIsString) {
	          return b.id.localeCompare(a.id);
	        }
	        return b.id - a.id;
	      }).map(item => item.id)
	    };
	  }
	}

	exports.ElapsedTimes = ElapsedTimes;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX,BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=elapsed-times.bundle.js.map
