/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3_vuex, tasks_v2_const) {
	'use strict';

	function buildGanttLinkId({
		taskId,
		dependentId
	}) {
		return `${taskId}.${dependentId}`;
	}
	class GanttLinks extends ui_vue3_vuex.BuilderEntityModel {
		getName() {
			return tasks_v2_const.Model.GanttLinks;
		}
		getGetters() {
			return {
				/** @function gantt-links/getLink */
				getLink: state => ganttLinkId => {
					return state.collection[buildGanttLinkId(ganttLinkId)];
				}
			};
		}
		getMutations() {
			return {
				upsert: (state, ganttLink) => {
					const id = buildGanttLinkId(ganttLink);
					ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).upsert(state, {
						id,
						...ganttLink
					});
				}
			};
		}
	}

	exports.GanttLinks = GanttLinks;

})(this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}, BX.Vue3.Vuex, BX.Tasks.V2.Const);
//# sourceMappingURL=gantt-links.bundle.js.map
