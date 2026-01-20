/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	class Placements extends ui_vue3_vuex.BuilderEntityModel {
	  getName() {
	    return tasks_v2_const.Model.Placements;
	  }
	  getElementState() {
	    return {
	      id: 0,
	      appId: 0,
	      title: '',
	      description: '',
	      type: tasks_v2_const.PlacementType.taskViewSlider
	    };
	  }
	}

	exports.Placements = Placements;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=placements.bundle.js.map
