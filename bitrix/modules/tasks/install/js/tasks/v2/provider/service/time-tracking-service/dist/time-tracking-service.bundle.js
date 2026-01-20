/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService,tasks_v2_provider_service_userService) {
	'use strict';

	function mapModelToDto(elapsedTime) {
	  return {
	    id: elapsedTime.id,
	    taskId: elapsedTime.taskId,
	    userId: elapsedTime.userId,
	    seconds: elapsedTime.seconds,
	    source: elapsedTime.source,
	    text: elapsedTime.text,
	    createdAtTs: elapsedTime.createdAtTs,
	    startTs: elapsedTime.startTs,
	    stopTs: elapsedTime.stopTs,
	    rights: elapsedTime.rights
	  };
	}
	function mapDtoToModel(elapsedTimeDto) {
	  return {
	    id: elapsedTimeDto.id,
	    taskId: elapsedTimeDto.taskId,
	    userId: elapsedTimeDto.userId,
	    seconds: elapsedTimeDto.seconds,
	    source: elapsedTimeDto.source,
	    text: elapsedTimeDto.text,
	    createdAtTs: elapsedTimeDto.createdAtTs,
	    startTs: elapsedTimeDto.startTs,
	    stopTs: elapsedTimeDto.stopTs,
	    rights: elapsedTimeDto.rights
	  };
	}

	var _state = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("state");
	class TimeTrackingService {
	  constructor() {
	    Object.defineProperty(this, _state, {
	      writable: true,
	      value: {}
	    });
	  }
	  async list(taskId, options = {}) {
	    if (!Number.isInteger(taskId)) {
	      return;
	    }
	    const requestedSize = Number.isInteger(options.size) ? Number(options.size) : undefined;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _state)[_state][taskId] || options.reset) {
	      babelHelpers.classPrivateFieldLooseBase(this, _state)[_state][taskId] = {
	        page: 0,
	        size: requestedSize != null ? requestedSize : 20,
	        isLoading: false,
	        hasMore: true
	      };
	    }
	    const state = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state][taskId];
	    if (state.isLoading || !state.hasMore) {
	      return;
	    }
	    const nextPage = state.page + 1;
	    const pageSize = requestedSize != null ? requestedSize : state.size;
	    state.isLoading = true;
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingList, {
	        taskId,
	        navigation: {
	          page: nextPage,
	          size: pageSize
	        }
	      });
	      await this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/upsertMany`, data.map(it => mapDtoToModel(it)));
	      state.page = nextPage;
	      state.size = pageSize;
	      state.hasMore = Array.isArray(data) ? data.length === pageSize : false;
	    } catch (error) {
	      console.error('ElapsedTime.list', error);
	    } finally {
	      babelHelpers.classPrivateFieldLooseBase(this, _state)[_state][taskId].isLoading = false;
	    }
	  }
	  isLoading(taskId) {
	    const state = babelHelpers.classPrivateFieldLooseBase(this, _state)[_state][taskId];
	    return state && state.isLoading;
	  }
	  async listParticipants(taskId) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingListParticipants, {
	        taskId
	      });
	      const users = data.users.map(user => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(user));
	      await this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
	      return [users, data.contribution];
	    } catch (error) {
	      console.error('ElapsedTime.listParticipants', error);
	      return [];
	    }
	  }
	  async add(taskId, elapsedTime) {
	    try {
	      const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	      void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	        numberOfElapsedTimes: task.numberOfElapsedTimes + 1,
	        timeSpent: task.timeSpent + elapsedTime.seconds
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/insert`, elapsedTime);
	      const savedElapsedTime = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingAdd, {
	        task: {
	          id: taskId,
	          elapsedTime: mapModelToDto(elapsedTime)
	        }
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/update`, {
	        id: elapsedTime.id,
	        fields: mapDtoToModel(savedElapsedTime)
	      });
	      return savedElapsedTime.id;
	    } catch (error) {
	      console.error('ElapsedTime.add', error);
	      return null;
	    }
	  }
	  async update(taskId, elapsedTime) {
	    try {
	      const currentElapsedTime = this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getById`](elapsedTime.id);
	      const timeSpentDifference = elapsedTime.seconds - currentElapsedTime.seconds;
	      const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	      void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	        timeSpent: task.timeSpent + timeSpentDifference
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/update`, {
	        id: elapsedTime.id,
	        fields: elapsedTime
	      });
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingUpdate, {
	        elapsedTime: mapModelToDto(elapsedTime)
	      });
	    } catch (error) {
	      console.error('ElapsedTime.update', error);
	    }
	  }
	  async delete(taskId, elapsedTime) {
	    try {
	      const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	      void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	        numberOfElapsedTimes: task.numberOfElapsedTimes - 1,
	        timeSpent: task.timeSpent - elapsedTime.seconds
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/delete`, elapsedTime.id);
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingDelete, {
	        elapsedTimeId: elapsedTime.id
	      });
	    } catch (error) {
	      console.error('ElapsedTime.delete', error);
	    }
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}

	const timeTrackingService = new TimeTrackingService();
	const TimeTrackingMappers = {
	  mapModelToDto,
	  mapDtoToModel
	};

	exports.timeTrackingService = timeTrackingService;
	exports.TimeTrackingMappers = TimeTrackingMappers;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=time-tracking-service.bundle.js.map
