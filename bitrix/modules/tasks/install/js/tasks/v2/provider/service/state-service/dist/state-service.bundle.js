/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_lib_apiClient,tasks_v2_const) {
	'use strict';

	class StateService {
	  async set(state) {
	    await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskStateSet, {
	      state
	    });
	  }
	}
	const stateService = new StateService();

	exports.StateService = StateService;
	exports.stateService = stateService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Lib,BX.Tasks.V2.Const));
//# sourceMappingURL=state-service.bundle.js.map
