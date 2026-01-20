/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_lib_apiClient,tasks_v2_const) {
	'use strict';

	class OptionService {
	  async set(optionName, value) {
	    await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.OptionSet, {
	      optionName,
	      value
	    });
	  }
	  async setBool(optionName, value) {
	    await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.OptionSetBool, {
	      optionName,
	      value
	    });
	  }
	}
	const optionService = new OptionService();

	exports.OptionService = OptionService;
	exports.optionService = optionService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Lib,BX.Tasks.V2.Const));
//# sourceMappingURL=option-service.bundle.js.map
