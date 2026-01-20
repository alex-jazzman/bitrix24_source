/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient) {
	'use strict';

	class DeadlineService {
	  async updateDeadlineChangeCount(taskId) {
	    const deadlineChangeCount = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskDeadlineGetDeadlineChangeCount, {
	      taskId
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateDeadlineChangeCount`, deadlineChangeCount);
	  }
	  cleanChangeLog(taskId) {
	    tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskDeadlineCleanChangeLog, {
	      taskId
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateDeadlineChangeCount`, 0);
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	const deadlineService = new DeadlineService();

	exports.DeadlineService = DeadlineService;
	exports.deadlineService = deadlineService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib));
//# sourceMappingURL=deadline-service.bundle.js.map
