/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	class Results extends ui_vue3_vuex.BuilderEntityModel {
	  getName() {
	    return tasks_v2_const.Model.Results;
	  }
	  getElementState() {
	    return {
	      id: 0,
	      taskId: 0,
	      text: '',
	      author: null,
	      createdAtTs: 0,
	      updatedAtTs: 0,
	      status: 'open',
	      fileIds: [],
	      previewId: null,
	      rights: {
	        edit: true,
	        remove: true
	      },
	      files: []
	    };
	  }
	}

	exports.Results = Results;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=results.bundle.js.map
