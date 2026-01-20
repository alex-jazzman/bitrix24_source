/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	var _buildId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildId");
	class GanttLinks extends ui_vue3_vuex.BuilderEntityModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _buildId, {
	      value: _buildId2
	    });
	  }
	  getName() {
	    return tasks_v2_const.Model.GanttLinks;
	  }
	  getGetters() {
	    return {
	      /** @function gantt-links/getLink */
	      getLink: state => ganttLinkId => {
	        return state.collection[babelHelpers.classPrivateFieldLooseBase(this, _buildId)[_buildId](ganttLinkId)];
	      }
	    };
	  }
	  getMutations() {
	    return {
	      upsert: (state, ganttLink) => {
	        const id = babelHelpers.classPrivateFieldLooseBase(this, _buildId)[_buildId](ganttLink);
	        ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).upsert(state, {
	          id,
	          ...ganttLink
	        });
	      }
	    };
	  }
	}
	function _buildId2({
	  taskId,
	  dependentId
	}) {
	  return `${taskId}.${dependentId}`;
	}

	exports.GanttLinks = GanttLinks;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=gantt-links.bundle.js.map
