/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3_vuex, tasks_v2_const, main_core) {
	'use strict';

	function mapDtoToModel(groupDto) {
		const stagesIds = (main_core.Type.isArray(groupDto.stages) ? groupDto.stages : []).map(stage => Number(stage.id) || 0).filter(id => id > 0);
		return {
			id: groupDto.id,
			name: groupDto.name,
			image: groupDto.image?.src,
			type: groupDto.type,
			isRestrictedView: groupDto.isRestrictedView,
			stagesIds
		};
	}
	function mapStageDtoToModel(stageDto) {
		const stage = {
			id: stageDto.id,
			title: stageDto.title,
			color: stageDto.color,
			systemType: stageDto.systemType,
			sort: stageDto.sort
		};
		return Object.fromEntries(Object.entries(stage).filter(([, value]) => !main_core.Type.isNil(value)));
	}

	class Groups extends ui_vue3_vuex.BuilderEntityModel {
		static createWithGroups(groups) {
			return Groups.create().setVariables({
				groups: groups.map(groupDto => mapDtoToModel(groupDto))
			});
		}
		getName() {
			return tasks_v2_const.Model.Groups;
		}
		getState() {
			const groups = this.getVariable('groups', []);
			return {
				collection: Object.fromEntries(groups.map(group => [group.id, group]))
			};
		}
		getElementState() {
			return {
				id: 0,
				name: '',
				image: '',
				url: '',
				type: '',
				stagesIds: [],
				isRestrictedView: false
			};
		}
	}

	exports.Groups = Groups;
	exports.mapDtoToModel = mapDtoToModel;
	exports.mapStageDtoToModel = mapStageDtoToModel;

})(this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}, BX.Vue3.Vuex, BX.Tasks.V2.Const, BX);
//# sourceMappingURL=groups.bundle.js.map
