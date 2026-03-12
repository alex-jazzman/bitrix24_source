/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,main_core,tasks_v2_core,tasks_v2_const,tasks_v2_lib_analytics,tasks_v2_lib_scrumManager,tasks_v2_lib_apiClient,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,tasks_v2_provider_service_resultService) {
	'use strict';

	var _updateStatus;
	const statusService = new (_updateStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStatus"), class {
	  constructor() {
	    Object.defineProperty(this, _updateStatus, {
	      value: _updateStatus2
	    });
	  }
	  async start(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusStart, tasks_v2_const.TaskStatus.InProgress);
	  }
	  async take(id, analyticsParams = {}) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusTake, tasks_v2_const.TaskStatus.InProgress);
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (task.allowsTimeTracking) {
	      tasks_v2_lib_analytics.analytics.sendAutoTimeTracking(analyticsParams, {
	        taskId: id
	      });
	    }
	  }
	  async startTimer(id, analyticsParams = {}) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskTrackingTimerStart, tasks_v2_const.TaskStatus.InProgress);
	    tasks_v2_lib_analytics.analytics.sendAutoTimeTracking(analyticsParams, {
	      taskId: id
	    });
	  }
	  async disapprove(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusDisapprove, tasks_v2_const.TaskStatus.Pending);
	  }
	  async defer(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusDefer, tasks_v2_const.TaskStatus.Deferred);
	  }
	  async approve(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusApprove, tasks_v2_const.TaskStatus.Completed);
	  }
	  async pause(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusPause, tasks_v2_const.TaskStatus.Pending);
	  }
	  async pauseTimer(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskTrackingTimerStop, tasks_v2_const.TaskStatus.Pending);
	  }
	  async complete(id, analyticsParams = {}) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (!task) {
	      return;
	    }
	    const currentUserId = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
	    if (task.requireResult && !tasks_v2_core.Core.getParams().rights.user.admin && currentUserId !== task.creatorId && !tasks_v2_provider_service_resultService.resultService.hasOpenedResults(id)) {
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.RequiredResultsMissing, {
	        taskId: id
	      });
	      return;
	    }
	    const group = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Groups}/getById`](task.groupId);
	    const scrumManager = new tasks_v2_lib_scrumManager.ScrumManager({
	      taskId: task.id,
	      parentId: task.parentId,
	      groupId: task.groupId
	    });
	    let canComplete = true;
	    if (scrumManager.isScrum(group == null ? void 0 : group.type)) {
	      canComplete = await scrumManager.handleDodDisplay();
	    }
	    if (!canComplete) {
	      return;
	    }
	    const status = task.needsControl ? tasks_v2_const.TaskStatus.SupposedlyCompleted : tasks_v2_const.TaskStatus.Completed;
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusComplete, status);
	    if (scrumManager.isScrum(group == null ? void 0 : group.type)) {
	      void (scrumManager == null ? void 0 : scrumManager.handleParentState());
	    }
	    tasks_v2_lib_analytics.analytics.sendTaskComplete(analyticsParams, {
	      taskId: task.id
	    });
	    void tasks_v2_provider_service_resultService.resultService.closeResults(id);
	  }
	  async renew(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, tasks_v2_const.Endpoint.TaskStatusRenew, tasks_v2_const.TaskStatus.Pending);
	  }
	})();
	async function _updateStatus2(id, action, status) {
	  const taskBeforeUpdate = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	  if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
	      status
	    });
	    return;
	  }
	  try {
	    const data = await tasks_v2_lib_apiClient.apiClient.post(action, {
	      task: {
	        id
	      }
	    });
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
	      status
	    });
	    tasks_v2_provider_service_taskService.taskService.extractTask(data);
	  } catch (error) {
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, taskBeforeUpdate);
	    console.error(`StatusService: ${action} error`, error);
	  }
	}

	exports.statusService = statusService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=status-service.bundle.js.map
