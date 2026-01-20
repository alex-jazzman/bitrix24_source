/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,ui_vue3_vuex,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_component_fields_placements) {
	'use strict';

	function mapDtoToModel(placementDto) {
	  return {
	    id: placementDto.id,
	    appId: placementDto.appId,
	    title: placementDto.title,
	    description: placementDto.description,
	    type: placementDto.type
	  };
	}

	class PlacementService {
	  async get(taskId) {
	    const {
	      placements
	    } = await tasks_v2_lib_apiClient.apiClient.post('Task.Placement.list', {
	      taskId
	    });
	    const placementModels = placements.map(dto => mapDtoToModel(dto));
	    const placementIds = placementModels.map(({
	      id
	    }) => id);
	    await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Placements}/upsertMany`, placementModels), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	      id: taskId,
	      fields: {
	        placementIds,
	        containsPlacements: placementIds.length > 0
	      }
	    }), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
	      id: taskId,
	      fieldName: tasks_v2_component_fields_placements.placementsMeta.id,
	      isFilled: placementIds.length > 0
	    })]);
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	const placementService = new PlacementService();

	exports.placementService = placementService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Fields));
//# sourceMappingURL=placement-service.bundle.js.map
