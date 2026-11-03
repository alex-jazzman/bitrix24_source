/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core_events, tasks_v2_const, tasks_v2_lib_apiClient) {
	'use strict';

	class ResultMessageService {
		async add(taskId, messageId) {
			const result = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultMessageAdd, {
				message: {
					id: messageId
				}
			});
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ResultFromMessageAdded, {
				taskId
			});
			return result;
		}
		async delete(taskId, resultId) {
			await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultDelete, {
				result: {
					id: resultId
				}
			});
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ResultSuccessfulDeleted, {
				taskId
			});
		}
		getCurrentUserMap(taskId) {
			return tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultMessageGetCurrentUserMap, {
				taskId
			});
		}
	}
	const resultMessageService = new ResultMessageService();

	exports.ResultMessageService = ResultMessageService;
	exports.resultMessageService = resultMessageService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Event, BX.Tasks.V2.Const, BX.Tasks.V2.Lib);
//# sourceMappingURL=result-message-service.bundle.js.map
