/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient, tasks_v2_provider_service_groupService) {
	'use strict';

	function mapDtoToModel(flowDto) {
		return {
			id: flowDto.id,
			name: flowDto.name
		};
	}

	class FlowService {
		getUrl(id, userId) {
			return `/company/personal/user/${userId}/tasks/flow/?ID_numsel=exact&ID_from=${id}&ID_to=${id}&apply_filter=Y`;
		}
		async getFlow(id) {
			if (id <= 0) {
				return;
			}
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.FlowGet, {
					flow: {
						id
					}
				});
				if (!data?.id) {
					return;
				}
				const flow = mapDtoToModel(data);
				await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Flows}/insert`, flow);
				if (data.group) {
					const group = tasks_v2_provider_service_groupService.GroupMappers.mapDtoToModel(tasks_v2_provider_service_groupService.createGroupDto(data.group));
					await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/insert`, group);
				}
			} catch (error) {
				console.error('FlowService: getFlow error', error);
			}
		}
	}
	const flowService = new FlowService();

	const FlowMappers = {
		mapDtoToModel
	};

	exports.FlowMappers = FlowMappers;
	exports.flowService = flowService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=flow-service.bundle.js.map
