/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_provider_service_checkListService,main_core,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_provider_service_fileService,tasks_v2_provider_service_groupService,tasks_v2_provider_service_flowService,tasks_v2_provider_service_userService) {
	'use strict';

	function mapModelToDto(task) {
	  var _task$accomplicesIds, _task$auditorsIds;
	  return {
	    id: task.id,
	    title: prepareValue(task.title),
	    description: prepareValue(task.description, mapDescription(task.description)),
	    creator: prepareValue(task.creatorId, {
	      id: task.creatorId
	    }),
	    createdTs: prepareValue(task.createdTs, Math.floor(task.createdTs / 1000)),
	    responsible: prepareValue(task.responsibleId, {
	      id: task.responsibleId
	    }),
	    deadlineTs: prepareValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
	    needsControl: prepareValue(task.needsControl),
	    fileIds: prepareValue(task.fileIds),
	    checklist: prepareValue(task.checklist),
	    group: prepareValue(task.groupId, {
	      id: task.groupId
	    }),
	    stage: prepareValue(task.stageId, {
	      id: task.stageId
	    }),
	    flow: prepareValue(task.flowId, {
	      id: task.flowId
	    }),
	    priority: prepareValue(task.isImportant, task.isImportant ? 'high' : 'low'),
	    status: prepareValue(task.status),
	    statusChangedTs: prepareValue(task.statusChangedTs, Math.floor(task.statusChangedTs / 1000)),
	    accomplices: prepareValue(task.accomplicesIds, (_task$accomplicesIds = task.accomplicesIds) == null ? void 0 : _task$accomplicesIds.map(id => ({
	      id
	    }))),
	    auditors: prepareValue(task.auditorsIds, (_task$auditorsIds = task.auditorsIds) == null ? void 0 : _task$auditorsIds.map(id => ({
	      id
	    }))),
	    chatId: prepareValue(task.chatId),
	    parent: undefined
	  };
	}
	function mapDtoToModel(taskDto) {
	  var _taskDto$checklist, _taskDto$group, _taskDto$stage, _taskDto$flow;
	  const task = {
	    id: taskDto.id,
	    title: taskDto.title,
	    isImportant: taskDto.priority === 'high',
	    description: taskDto.description,
	    creatorId: taskDto.creator.id,
	    createdTs: taskDto.createdTs * 1000,
	    responsibleId: taskDto.responsible.id,
	    deadlineTs: taskDto.deadlineTs * 1000,
	    needsControl: taskDto.needsControl,
	    fileIds: taskDto.fileIds,
	    checklist: (_taskDto$checklist = taskDto.checklist) != null ? _taskDto$checklist : [],
	    containsChecklist: taskDto.containsChecklist,
	    groupId: (_taskDto$group = taskDto.group) == null ? void 0 : _taskDto$group.id,
	    stageId: (_taskDto$stage = taskDto.stage) == null ? void 0 : _taskDto$stage.id,
	    flowId: (_taskDto$flow = taskDto.flow) == null ? void 0 : _taskDto$flow.id,
	    status: taskDto.status,
	    statusChangedTs: taskDto.statusChangedTs * 1000,
	    accomplicesIds: taskDto.accomplices.map(({
	      id
	    }) => id),
	    auditorsIds: taskDto.auditors.map(({
	      id
	    }) => id),
	    chatId: taskDto.chatId
	  };
	  if (taskDto.rights) {
	    task.rights = taskDto.rights;
	  }
	  return task;
	}
	function mapModelToSliderData(task, checkLists) {
	  var _task$fileIds;
	  const data = {
	    TITLE: prepareValue(task.title),
	    DESCRIPTION: prepareValue(task.description, mapDescription(task.description)),
	    RESPONSIBLE_ID: prepareValue(task.responsibleId),
	    GROUP_ID: prepareValue(task.groupId),
	    DEADLINE_TS: prepareValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
	    IS_IMPORTANT: prepareValue(task.isImportant, task.isImportant ? 'Y' : null),
	    FILE_IDS: prepareValue(task.fileIds, ((_task$fileIds = task.fileIds) == null ? void 0 : _task$fileIds.length) > 0 ? task.fileIds : null),
	    CHECKLIST: tasks_v2_provider_service_checkListService.CheckListMappers.mapModelToSliderData(checkLists)
	  };
	  return Object.fromEntries(Object.entries(data).filter(([, value]) => value));
	}
	function prepareValue(value, mappedValue = value) {
	  return main_core.Type.isUndefined(value) ? undefined : mappedValue;
	}

	// TODO: Temporary. Remove when removing old full card
	function mapDescription(description) {
	  return description == null ? void 0 : description.replaceAll('[p]\n', '').replaceAll('[/p]', '');
	}

	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	class TaskGetExtractor {
	  constructor(data) {
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = data;
	  }
	  getTask() {
	    return mapDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data]);
	  }
	  getFlow() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].flow ? tasks_v2_provider_service_flowService.FlowMappers.mapDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].flow) : null;
	  }
	  getGroup() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].group ? tasks_v2_provider_service_groupService.GroupMappers.mapDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].group) : null;
	  }
	  getStages() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].stage ? [tasks_v2_provider_service_groupService.GroupMappers.mapStageDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].stage)] : [];
	  }
	  getUsers() {
	    return [babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].creator, babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].responsible, ...babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].accomplices, ...babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].auditors].map(userDto => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(userDto));
	  }
	}

	var _isRealId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRealId");
	var _updateFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFields");
	var _updatePromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePromises");
	var _updateServerTaskDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateServerTaskDebounced");
	var _updateTaskFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTaskFields");
	var _updateServerTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateServerTask");
	var _updateScrumFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateScrumFields");
	var _updateStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStatus");
	var _updateDeadlineFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateDeadlineFields");
	var _getTaskFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTaskFields");
	var _getFilteredFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilteredFields");
	var _scrumFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("scrumFields");
	var _statusFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("statusFields");
	var _deadlineFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deadlineFields");
	var _hasChanges = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasChanges");
	var _getStoreTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStoreTask");
	var _insertStoreTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("insertStoreTask");
	var _updateStoreTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStoreTask");
	var _extractTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("extractTask");
	var _deleteStoreTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteStoreTask");
	class TaskService {
	  constructor() {
	    Object.defineProperty(this, _deleteStoreTask, {
	      value: _deleteStoreTask2
	    });
	    Object.defineProperty(this, _extractTask, {
	      value: _extractTask2
	    });
	    Object.defineProperty(this, _updateStoreTask, {
	      value: _updateStoreTask2
	    });
	    Object.defineProperty(this, _insertStoreTask, {
	      value: _insertStoreTask2
	    });
	    Object.defineProperty(this, _getStoreTask, {
	      value: _getStoreTask2
	    });
	    Object.defineProperty(this, _hasChanges, {
	      value: _hasChanges2
	    });
	    Object.defineProperty(this, _deadlineFields, {
	      get: _get_deadlineFields,
	      set: void 0
	    });
	    Object.defineProperty(this, _statusFields, {
	      get: _get_statusFields,
	      set: void 0
	    });
	    Object.defineProperty(this, _scrumFields, {
	      get: _get_scrumFields,
	      set: void 0
	    });
	    Object.defineProperty(this, _getFilteredFields, {
	      value: _getFilteredFields2
	    });
	    Object.defineProperty(this, _getTaskFields, {
	      value: _getTaskFields2
	    });
	    Object.defineProperty(this, _updateDeadlineFields, {
	      value: _updateDeadlineFields2
	    });
	    Object.defineProperty(this, _updateStatus, {
	      value: _updateStatus2
	    });
	    Object.defineProperty(this, _updateScrumFields, {
	      value: _updateScrumFields2
	    });
	    Object.defineProperty(this, _updateServerTask, {
	      value: _updateServerTask2
	    });
	    Object.defineProperty(this, _updateTaskFields, {
	      value: _updateTaskFields2
	    });
	    Object.defineProperty(this, _isRealId, {
	      value: _isRealId2
	    });
	    Object.defineProperty(this, _updateFields, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _updatePromises, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _updateServerTaskDebounced, {
	      writable: true,
	      value: {}
	    });
	  }
	  async getById(id) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post('Task.get', {
	        task: {
	          id
	        }
	      });
	      await babelHelpers.classPrivateFieldLooseBase(this, _extractTask)[_extractTask](data);
	    } catch (error) {
	      console.error('TaskService: getById error', error);
	    }
	  }
	  async getRights(id) {
	    try {
	      const {
	        rights
	      } = await tasks_v2_lib_apiClient.apiClient.post('Task.Access.get', {
	        task: {
	          id
	        }
	      });
	      await babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](id, {
	        rights
	      });
	    } catch (error) {
	      console.error('TaskService: getRights error', error);
	    }
	  }
	  async add(task) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post('Task.add', {
	        task: mapModelToDto(task)
	      });
	      const id = data.id;
	      await babelHelpers.classPrivateFieldLooseBase(this, _extractTask)[_extractTask](data);
	      return [id, null];
	    } catch (error) {
	      var _error$errors, _error$errors$;
	      console.error('TaskService: add error', error);
	      return [0, new Error(error == null ? void 0 : (_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message)];
	    }
	  }
	  async update(id, fields) {
	    const taskBeforeUpdate = babelHelpers.classPrivateFieldLooseBase(this, _getStoreTask)[_getStoreTask](id);
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](id, fields);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isRealId)[_isRealId](id)) {
	      return;
	    }
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _updateScrumFields)[_updateScrumFields](id, fields, taskBeforeUpdate);
	      await babelHelpers.classPrivateFieldLooseBase(this, _updateDeadlineFields)[_updateDeadlineFields](id, fields, taskBeforeUpdate);
	      await babelHelpers.classPrivateFieldLooseBase(this, _updateTaskFields)[_updateTaskFields](id, fields, taskBeforeUpdate);
	    } catch (error) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](id, taskBeforeUpdate);
	      console.error('TaskService: update error', error);
	    }
	  }
	  async delete(id) {
	    const taskBeforeDelete = babelHelpers.classPrivateFieldLooseBase(this, _getStoreTask)[_getStoreTask](id);
	    await babelHelpers.classPrivateFieldLooseBase(this, _deleteStoreTask)[_deleteStoreTask](id);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isRealId)[_isRealId](id)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post('Task.delete', {
	        task: {
	          id
	        }
	      });
	    } catch (error) {
	      void babelHelpers.classPrivateFieldLooseBase(this, _insertStoreTask)[_insertStoreTask](taskBeforeDelete);
	      console.error('TaskService: delete error', error);
	    }
	  }
	  async start(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.start', tasks_v2_const.TaskStatus.InProgress);
	  }
	  async disapprove(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.disapprove', tasks_v2_const.TaskStatus.Pending);
	  }
	  async defer(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.defer', tasks_v2_const.TaskStatus.Deferred);
	  }
	  async approve(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.approve', tasks_v2_const.TaskStatus.Completed);
	  }
	  async pause(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.pause', tasks_v2_const.TaskStatus.Pending);
	  }
	  async complete(id) {
	    const status = babelHelpers.classPrivateFieldLooseBase(this, _getStoreTask)[_getStoreTask](id).needsControl ? tasks_v2_const.TaskStatus.SupposedlyCompleted : tasks_v2_const.TaskStatus.Completed;
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.complete', status);
	  }
	  async renew(id) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStatus)[_updateStatus](id, 'Task.Status.renew', tasks_v2_const.TaskStatus.Pending);
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _isRealId2(id) {
	  return Number.isInteger(id) && id > 0;
	}
	async function _updateTaskFields2(id, fields, taskBeforeUpdate) {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4;
	  const taskFields = babelHelpers.classPrivateFieldLooseBase(this, _getTaskFields)[_getTaskFields](fields);
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _hasChanges)[_hasChanges](taskBeforeUpdate, taskFields)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id] = {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id],
	    ...taskFields
	  };
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises])[id]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[id] = new Resolvable();
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced])[id]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[id] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _updateServerTask)[_updateServerTask], 500, this);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced][id](id);
	  await babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	}
	async function _updateServerTask2(id) {
	  const fields = babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  const promise = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  const data = await tasks_v2_lib_apiClient.apiClient.post('Task.update', {
	    task: mapModelToDto({
	      id,
	      ...fields
	    })
	  });
	  await babelHelpers.classPrivateFieldLooseBase(this, _extractTask)[_extractTask](data);
	  promise.resolve();
	}
	async function _updateScrumFields2(id, fields, taskBeforeUpdate) {
	  const scrumFields = babelHelpers.classPrivateFieldLooseBase(this, _getFilteredFields)[_getFilteredFields](fields, babelHelpers.classPrivateFieldLooseBase(this, _scrumFields)[_scrumFields]);
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _hasChanges)[_hasChanges](taskBeforeUpdate, scrumFields)) {
	    return;
	  }
	  await tasks_v2_lib_apiClient.apiClient.post('Scrum.updateTask', {
	    taskId: id,
	    fields: scrumFields
	  });
	}
	async function _updateStatus2(id, action, status) {
	  const taskBeforeUpdate = babelHelpers.classPrivateFieldLooseBase(this, _getStoreTask)[_getStoreTask](id);
	  await babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](id, {
	    status
	  });
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isRealId)[_isRealId](id)) {
	    return;
	  }
	  try {
	    const data = await tasks_v2_lib_apiClient.apiClient.post(action, {
	      task: {
	        id
	      }
	    });
	    await babelHelpers.classPrivateFieldLooseBase(this, _extractTask)[_extractTask](data);
	  } catch (error) {
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](id, taskBeforeUpdate);
	    console.error(`TaskService: ${action} error`, error);
	  }
	}
	async function _updateDeadlineFields2(id, fields, taskBeforeUpdate) {
	  const deadlineFields = babelHelpers.classPrivateFieldLooseBase(this, _getFilteredFields)[_getFilteredFields](fields, babelHelpers.classPrivateFieldLooseBase(this, _deadlineFields)[_deadlineFields]);
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _hasChanges)[_hasChanges](taskBeforeUpdate, deadlineFields)) {
	    return;
	  }
	  await tasks_v2_lib_apiClient.apiClient.post('Task.Deadline.update', {
	    task: mapModelToDto({
	      id,
	      ...deadlineFields
	    })
	  });
	}
	function _getTaskFields2(fields) {
	  return Object.fromEntries(Object.entries(fields).filter(([field]) => {
	    const scrumField = babelHelpers.classPrivateFieldLooseBase(this, _scrumFields)[_scrumFields].has(field);
	    const statusField = babelHelpers.classPrivateFieldLooseBase(this, _statusFields)[_statusFields].has(field);
	    const deadlineField = babelHelpers.classPrivateFieldLooseBase(this, _deadlineFields)[_deadlineFields].has(field);
	    return !scrumField && !statusField && !deadlineField;
	  }));
	}
	function _getFilteredFields2(fields, filterSet) {
	  return Object.fromEntries(Object.entries(fields).filter(([field]) => filterSet.has(field)));
	}
	function _get_scrumFields() {
	  return new Set(['storyPoints', 'epicId']);
	}
	function _get_statusFields() {
	  return new Set(['status']);
	}
	function _get_deadlineFields() {
	  return new Set(['deadlineTs']);
	}
	function _hasChanges2(task, fields) {
	  return Object.entries(fields).some(([field, value]) => JSON.stringify(task[field]) !== JSON.stringify(value));
	}
	function _getStoreTask2(id) {
	  return {
	    ...this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](id)
	  };
	}
	async function _insertStoreTask2(task) {
	  await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/insert`, task);
	}
	async function _updateStoreTask2(id, fields) {
	  await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	    id,
	    fields
	  });
	}
	async function _extractTask2(data) {
	  const extractor = new TaskGetExtractor(data);
	  await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/upsert`, extractor.getTask()), this.$store.dispatch(`${tasks_v2_const.Model.Flows}/upsert`, extractor.getFlow()), this.$store.dispatch(`${tasks_v2_const.Model.Groups}/insert`, extractor.getGroup()), this.$store.dispatch(`${tasks_v2_const.Model.Stages}/upsertMany`, extractor.getStages()), this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, extractor.getUsers())]);
	  await tasks_v2_provider_service_fileService.fileService.get(data.id).sync(data.fileIds);
	}
	async function _deleteStoreTask2(id) {
	  await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/delete`, id);
	}
	const taskService = new TaskService();
	function Resolvable() {
	  const promise = new Promise(resolve => {
	    this.resolve = resolve;
	  });
	  promise.resolve = this.resolve;
	  return promise;
	}

	const TaskMappers = {
	  mapModelToDto,
	  mapDtoToModel,
	  mapModelToSliderData
	};

	exports.TaskMappers = TaskMappers;
	exports.taskService = taskService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=task-service.bundle.js.map
