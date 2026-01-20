/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	class Reminders extends ui_vue3_vuex.BuilderEntityModel {
	  getName() {
	    return tasks_v2_const.Model.Reminders;
	  }
	  getGetters() {
	    return {
	      /** @function reminders/getIds */
	      getIds: (state, {
	        getAll
	      }) => (taskId, userId) => getAll.filter(item => item.taskId === taskId && item.userId === userId).map(item => item.id)
	    };
	  }
	}

	exports.Reminders = Reminders;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=reminders.bundle.js.map
