/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_const,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService) {
	'use strict';

	function mapDtoToModel(viewerDto) {
	  var _viewerDto$image;
	  return {
	    id: viewerDto.id,
	    name: viewerDto.name,
	    image: (_viewerDto$image = viewerDto.image) == null ? void 0 : _viewerDto$image.src,
	    type: viewerDto.type
	  };
	}
	function mapModelToDto(viewer) {
	  return {
	    id: viewer.id,
	    name: viewer.name,
	    image: {
	      src: viewer.image
	    },
	    type: viewer.type
	  };
	}

	class ViewersService {
	  setIsLoadingCount({
	    taskId,
	    isLoadingCount
	  }) {
	    // get fresh task for cases with parallel count and list refresh
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      viewers: {
	        ...task.viewers,
	        isLoadingCount
	      }
	    });
	  }
	  setIsLoadingList({
	    taskId,
	    isLoadingList
	  }) {
	    // get fresh task for cases with parallel count and list refresh
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      viewers: {
	        ...task.viewers,
	        isLoadingList
	      }
	    });
	  }
	  setCount({
	    taskId,
	    count
	  }) {
	    // get fresh task for cases with parallel count and list refresh
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      viewers: {
	        ...task.viewers,
	        count: count || 0
	      }
	    });
	  }
	  async count(taskId) {
	    let countNew = 0;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (!task) {
	      return;
	    }
	    this.setIsLoadingCount({
	      taskId,
	      isLoadingCount: true
	    });
	    try {
	      const response = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskViewUserCount, {
	        task: {
	          id: taskId
	        }
	      });
	      countNew = response == null ? void 0 : response.viewsCount;
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskViewUserCount, error);
	    }
	    this.setCount({
	      taskId,
	      count: countNew
	    });
	    this.setIsLoadingCount({
	      taskId,
	      isLoadingCount: false
	    });
	    return tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).viewers.count;
	  }
	  async list(params) {
	    const {
	      id,
	      page,
	      size
	    } = params;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (!task) {
	      return;
	    }
	    this.setIsLoadingList({
	      taskId: id,
	      isLoadingList: true
	    });
	    try {
	      const response = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskViewUserTail, {
	        task: {
	          id
	        },
	        withCount: true,
	        navigation: {
	          page,
	          size
	        }
	      });
	      if (!response || !(response != null && response.users) || (response == null ? void 0 : response.users.length) <= 0) {
	        throw new Error('Viewers list request failure or zero length list.');
	      }

	      // get fresh task for cases with parallel count and list refresh
	      const taskFresh = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	      const viewers = taskFresh.viewers;
	      const viewersOld = (viewers == null ? void 0 : viewers.list) || [];
	      const viewersResponse = (response == null ? void 0 : response.users) || [];

	      // TODO: maybe change API on backend for some of the next restructures?
	      const viewersResponseFormatted = viewersResponse.map(taskViewer => {
	        var _taskViewer$image;
	        const taskViewerName = taskViewer.name || '';
	        const taskViewerNames = taskViewerName.split(' ');
	        return {
	          ...taskViewer,
	          image: ((_taskViewer$image = taskViewer.image) == null ? void 0 : _taskViewer$image.src) || '',
	          name: taskViewerNames,
	          ts: taskViewer.viewedTs
	        };
	      });
	      const viewersResponseFormattedSorted = viewersResponseFormatted.sort((a, b) => b.ts - a.ts);
	      const viewersNew = [...viewersOld, ...viewersResponseFormattedSorted];
	      tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
	        viewers: {
	          ...viewers,
	          list: viewersNew
	        }
	      });
	    } catch (error) {
	      tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
	        viewers: {
	          ...taskFresh.viewers,
	          count: 0
	        }
	      });
	      console.error(tasks_v2_const.Endpoint.TaskViewUserTail, error);
	    }
	    this.setIsLoadingList({
	      taskId: id,
	      isLoadingList: false
	    });
	    return tasks_v2_provider_service_taskService.taskService.getStoreTask(id).viewers.list;
	  }
	}

	const viewersService = new ViewersService();
	const ViewerMappers = {
	  mapDtoToModel,
	  mapModelToDto
	};

	exports.viewersService = viewersService;
	exports.ViewerMappers = ViewerMappers;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=viewers-service.bundle.js.map
