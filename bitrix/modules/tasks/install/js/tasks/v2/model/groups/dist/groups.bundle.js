/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const,tasks_v2_provider_service_groupService) {
	'use strict';

	class Groups extends ui_vue3_vuex.BuilderEntityModel {
	  static createWithGroups(groups) {
	    return Groups.create().setVariables({
	      groups: groups.map(groupDto => tasks_v2_provider_service_groupService.GroupMappers.mapDtoToModel(groupDto))
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
	      stagesIds: []
	    };
	  }
	}

	exports.Groups = Groups;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=groups.bundle.js.map
