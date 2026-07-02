/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_provider_service_templateService,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService,tasks_v2_lib_idUtils,main_core,tasks_v2_const) {
	'use strict';

	const limit = tasks_v2_const.Limit.RelationList;
	const UserOptions = main_core.Reflection.namespace('BX.userOptions');
	var _meta = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("meta");
	var _updatePromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePromises");
	var _addStatusesToStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addStatusesToStore");
	var _deleteStatusesFromStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteStatusesFromStore");
	var _safePromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("safePromise");
	var _filterCompleted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("filterCompleted");
	var _getTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTitle");
	var _updateStoreRelationTasks = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStoreRelationTasks");
	class RelationService {
	  constructor(_meta2) {
	    Object.defineProperty(this, _updateStoreRelationTasks, {
	      value: _updateStoreRelationTasks2
	    });
	    Object.defineProperty(this, _getTitle, {
	      value: _getTitle2
	    });
	    Object.defineProperty(this, _filterCompleted, {
	      value: _filterCompleted2
	    });
	    Object.defineProperty(this, _safePromise, {
	      value: _safePromise2
	    });
	    Object.defineProperty(this, _deleteStatusesFromStore, {
	      value: _deleteStatusesFromStore2
	    });
	    Object.defineProperty(this, _addStatusesToStore, {
	      value: _addStatusesToStore2
	    });
	    Object.defineProperty(this, _meta, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _updatePromises, {
	      writable: true,
	      value: []
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta] = _meta2;
	  }
	  async list(taskId, withIds = false) {
	    const hasUpdatePromises = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises].length > 0;
	    await Promise.all(babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises]);
	    const {
	      tasks,
	      ids,
	      statuses
	    } = await this.requestTasks(taskId, withIds);
	    if (withIds) {
	      if (!hasUpdatePromises && ids.length === 0) {
	        void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
	          id: taskId,
	          fieldName: babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].id,
	          isFilled: false
	        });
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _updateStoreRelationTasks)[_updateStoreRelationTasks](taskId, ids, false, statuses);
	    }
	    tasks.forEach(taskDto => {
	      if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskDto.id, false)) {
	        void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/addPartiallyLoaded`, taskDto.id);
	      }
	      tasks_v2_provider_service_taskService.taskService.extractTask({
	        ...taskDto,
	        [babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].relationToField]: taskId
	      });
	    });
	    return tasks;
	  }
	  async listByIds(taskId, taskIds) {
	    const tasks = await this.requestTasksByIds(taskId, taskIds);
	    const newTaskIds = tasks.map(({
	      id
	    }) => id);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreRelationTasks)[_updateStoreRelationTasks](taskId, newTaskIds, true);
	    tasks.forEach(taskDto => {
	      if (!tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskDto.id, false)) {
	        void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/addPartiallyLoaded`, taskDto.id);
	      }
	      tasks_v2_provider_service_taskService.taskService.extractTask({
	        ...taskDto,
	        [babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].relationToField]: taskId
	      });
	    });
	    return tasks;
	  }
	  async getSubTaskIds(taskId, taskIds) {
	    const tasks = await this.requestSubTaskIds(taskId, taskIds);
	    tasks.forEach(({
	      id,
	      subTaskIds
	    }) => {
	      tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
	        subTaskIds
	      });
	    });
	  }
	  async setParent(taskId, parentId) {
	    return this.add(parentId, [taskId]);
	  }
	  async add(taskId, taskIds, noOverride = false) {
	    const parentIds = Object.fromEntries(taskIds.map(id => {
	      var _taskService$getStore, _taskService$getStore2;
	      return [id, (_taskService$getStore = (_taskService$getStore2 = tasks_v2_provider_service_taskService.taskService.getStoreTask(id)) == null ? void 0 : _taskService$getStore2[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].relationToField]) != null ? _taskService$getStore : 0];
	    }));
	    this.addStore(taskId, taskIds);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId) || taskIds.length === 0) {
	      return null;
	    }
	    const error = await this.requestAdd(taskId, taskIds, noOverride);
	    if (error) {
	      var _error$errors, _error$errors$;
	      const failedIds = Object.entries(error.data).filter(([, success]) => !success).map(([id]) => Number(id));
	      this.deleteStore(taskId, failedIds);
	      failedIds.forEach(id => this.addStore(parentIds[id], [id]));
	      console.error(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.add error`, error);
	      const accessErrors = error.errors.filter(({
	        code
	      }) => code === 'Access denied');
	      if (accessErrors.length === 1) {
	        return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].addError;
	      }
	      if (accessErrors.length > 1) {
	        return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].addErrorMany;
	      }
	      const overrideErrors = error.errors.filter(({
	        code
	      }) => code === 'No override parentId');
	      if (overrideErrors.length === 1) {
	        return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].overrideError;
	      }
	      if (overrideErrors.length > 1) {
	        return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].overrideErrorMany;
	      }
	      return (_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message;
	    }
	    return null;
	  }
	  addStore(taskId, taskIds) {
	    const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreRelationTasks)[_updateStoreRelationTasks](taskId, [...((task == null ? void 0 : task[meta.idsField]) || []), ...taskIds]);
	    taskIds.forEach(it => tasks_v2_provider_service_taskService.taskService.updateStoreTask(it, {
	      [meta.relationToField]: taskId
	    }));
	    babelHelpers.classPrivateFieldLooseBase(this, _addStatusesToStore)[_addStatusesToStore](taskId, taskIds);
	  }
	  async delete(taskId, taskIds) {
	    this.deleteStore(taskId, taskIds);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId) || taskIds.length === 0) {
	      return;
	    }
	    const error = await this.requestDelete(taskId, taskIds);
	    if (error) {
	      this.addStore(taskId, taskIds);
	      console.error(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.delete error`, error);
	    }
	  }
	  unlinkStore(taskId) {
	    const relationIds = this.$store.getters[`${tasks_v2_const.Model.Tasks}/getAll`].filter(task => task[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].relationToField] === taskId).map(({
	      id
	    }) => id);
	    const relationToIds = this.$store.getters[`${tasks_v2_const.Model.Tasks}/getAll`].filter(task => {
	      var _task$babelHelpers$cl;
	      return (_task$babelHelpers$cl = task[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField]) == null ? void 0 : _task$babelHelpers$cl.includes(taskId);
	    }).map(({
	      id
	    }) => id);
	    this.deleteStore(taskId, relationIds);
	    relationToIds.forEach(id => this.deleteStore(id, [taskId]));
	  }
	  deleteStore(taskId, taskIds) {
	    const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreRelationTasks)[_updateStoreRelationTasks](taskId, task == null ? void 0 : task[meta.idsField].filter(it => !taskIds.includes(it)));
	    taskIds.forEach(it => tasks_v2_provider_service_taskService.taskService.updateStoreTask(it, {
	      [meta.relationToField]: 0
	    }));
	    babelHelpers.classPrivateFieldLooseBase(this, _deleteStatusesFromStore)[_deleteStatusesFromStore](taskId, taskIds);
	  }
	  areIdsLoaded(taskId) {
	    const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (!task) {
	      return false;
	    }
	    return !task[meta.containsField] || task[meta.idsField].length > 0;
	  }
	  hasUnloadedIds(taskId, isTemplateEntities = false) {
	    const ids = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField];
	    return this.getVisibleIds(taskId, ids, isTemplateEntities).some(id => !this.hasStoreTask(id));
	  }
	  hasStoreTask(id) {
	    var _taskService$getStore3, _taskService$getStore4;
	    const rights = (_taskService$getStore3 = (_taskService$getStore4 = tasks_v2_provider_service_taskService.taskService.getStoreTask(id)) == null ? void 0 : _taskService$getStore4.rights) != null ? _taskService$getStore3 : {};
	    return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].uniqueRight in rights;
	  }

	  /** @protected */
	  async requestTasks(taskId, withIds = false) {
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      const ids = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField];
	      const taskIds = this.getVisibleIds(taskId, ids);
	      const tasks = await this.requestTasksByIds(taskId, taskIds);
	      return {
	        tasks,
	        ids
	      };
	    }
	    const {
	      tasks,
	      ids,
	      statuses
	    } = await tasks_v2_lib_apiClient.apiClient.post(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.list`, {
	      taskId,
	      withIds,
	      withCompleted: this.showCompletedTasks,
	      withSubTasks: this.showSubTasks,
	      navigation: {
	        size: limit
	      }
	    });
	    return {
	      tasks,
	      ids,
	      statuses
	    };
	  }
	  async requestTasksByIds(taskId, taskIds) {
	    const {
	      tasks
	    } = await tasks_v2_lib_apiClient.apiClient.post(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.listByIds`, {
	      taskIds,
	      withCompleted: this.showCompletedTasks,
	      withSubTasks: this.showSubTasks
	    });
	    return tasks;
	  }

	  /** @protected */
	  async requestSubTaskIds(taskId, taskIds) {
	    const {
	      tasks
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskRelationChildGetSubTaskIds, {
	      taskIds
	    });
	    return tasks.map(it => {
	      var _it$subTaskIds;
	      return {
	        id: it.id,
	        subTaskIds: (_it$subTaskIds = it == null ? void 0 : it.subTaskIds) != null ? _it$subTaskIds : []
	      };
	    });
	  }

	  /** @protected */
	  requestAdd(taskId, taskIds, noOverride = false) {
	    return this.requestUpdate(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.add`, {
	      taskId,
	      taskIds,
	      noOverride
	    });
	  }

	  /** @protected */
	  requestDelete(taskId, taskIds) {
	    return this.requestUpdate(`${babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].controller}.delete`, {
	      taskId,
	      taskIds
	    });
	  }

	  /** @protected */
	  async requestUpdate(endpoint, data) {
	    const promise = babelHelpers.classPrivateFieldLooseBase(this, _safePromise)[_safePromise](tasks_v2_lib_apiClient.apiClient.post(endpoint, data));
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises].push(promise);
	    const error = await promise;
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises] = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises].filter(it => it !== promise);
	    return error;
	  }
	  /** @protected */
	  getVisibleIds(taskId, ids, isTemplateEntities = false) {
	    return this.getSortedIds(taskId, ids, this.showCompletedTasks, isTemplateEntities).slice(0, limit);
	  }
	  getSortedIds(taskId, ids, showCompleted = true, isTemplateEntities = false) {
	    if (isTemplateEntities) {
	      return this.getSortedTemplateIds(ids);
	    }
	    if (showCompleted) {
	      return this.getSortedTaskIds(ids);
	    }
	    return this.getSortedTaskIds(babelHelpers.classPrivateFieldLooseBase(this, _filterCompleted)[_filterCompleted](ids, taskId));
	  }
	  getSortedTemplateIds(ids) {
	    return ids.sort((id1, id2) => babelHelpers.classPrivateFieldLooseBase(this, _getTitle)[_getTitle](id1).localeCompare(babelHelpers.classPrivateFieldLooseBase(this, _getTitle)[_getTitle](id2)));
	  }
	  getSortedTaskIds(ids) {
	    const exists = task => task ? 1 : 0;
	    const activityTs = task => {
	      var _task$activityTs;
	      return (task == null ? void 0 : task.changedTs) > 0 && (task == null ? void 0 : task.activityTs) > 0 && task.changedTs > task.activityTs ? task.changedTs : (_task$activityTs = task == null ? void 0 : task.activityTs) != null ? _task$activityTs : 0;
	    };
	    return ids.sort((id1, id2) => {
	      const task1 = tasks_v2_provider_service_taskService.taskService.getStoreTask(id1);
	      const task2 = tasks_v2_provider_service_taskService.taskService.getStoreTask(id2);

	      // existing first
	      if (exists(task1) !== exists(task2)) {
	        return exists(task2) - exists(task1);
	      }

	      // by activity
	      if (activityTs(task1) !== activityTs(task2)) {
	        return activityTs(task2) > activityTs(task1) ? 1 : -1;
	      }

	      // by id
	      return id2 > id1 ? 1 : -1;
	    });
	  }
	  saveTaskListOptions(taskListOptions) {
	    void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTaskListOptions`, taskListOptions);
	    UserOptions.save('tasks', 'fullCard', 'taskListOptions', JSON.stringify(taskListOptions));
	  }
	  getTaskListOptions() {
	    return this.$store.getters[`${tasks_v2_const.Model.Interface}/taskListOptions`];
	  }
	  get showCompletedTasks() {
	    return this.getTaskListOptions()[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].showCompletedField];
	  }
	  get showSubTasks() {
	    return this.getTaskListOptions().showSubTasks;
	  }
	  get showSubTemplates() {
	    return this.getTaskListOptions().showSubTemplates;
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _addStatusesToStore2(taskId, taskIds) {
	  const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  if (meta.statusesField && task != null && task[meta.statusesField]) {
	    const statuses = {
	      ...task[meta.statusesField]
	    };
	    taskIds.forEach(id => {
	      const addedTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	      if (addedTask != null && addedTask.status) {
	        statuses[id] = addedTask.status;
	      }
	    });
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      [meta.statusesField]: statuses
	    });
	  }
	}
	function _deleteStatusesFromStore2(taskId, taskIds) {
	  const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  if (meta.statusesField && task != null && task[meta.statusesField]) {
	    const statuses = {
	      ...task[meta.statusesField]
	    };
	    taskIds.forEach(id => delete statuses[id]);
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	      [meta.statusesField]: statuses
	    });
	  }
	}
	async function _safePromise2(promise) {
	  try {
	    await promise;
	  } catch (error) {
	    return error;
	  }
	  return null;
	}
	function _filterCompleted2(ids, taskId) {
	  const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	  const parentTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  return ids.filter(id => {
	    var _parentTask$meta$stat;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (task) {
	      return task.status !== tasks_v2_const.TaskStatus.Completed;
	    }
	    const statusFromMap = parentTask == null ? void 0 : (_parentTask$meta$stat = parentTask[meta.statusesField]) == null ? void 0 : _parentTask$meta$stat[id];
	    if (statusFromMap) {
	      return statusFromMap !== tasks_v2_const.TaskStatus.Completed;
	    }
	    return true;
	  });
	}
	function _getTitle2(id) {
	  var _ref, _taskService$getStore5, _taskService$getStore6;
	  return (_ref = (_taskService$getStore5 = (_taskService$getStore6 = tasks_v2_provider_service_taskService.taskService.getStoreTask(id)) == null ? void 0 : _taskService$getStore6.title) != null ? _taskService$getStore5 : this.$store.getters[`${tasks_v2_const.Model.Tasks}/getTitle`](id)) != null ? _ref : '\uFFFF';
	}
	function _updateStoreRelationTasks2(taskId, taskIds, withPartiallyLoaded = false, statuses = null) {
	  const meta = babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta];
	  const relationIds = [...new Set(taskIds)];
	  const contains = relationIds.length > 0;
	  if (tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId, withPartiallyLoaded)) {
	    const fields = {
	      [meta.idsField]: relationIds,
	      [meta.containsField]: contains
	    };
	    if (!main_core.Type.isNil(statuses) && meta.statusesField) {
	      fields[meta.statusesField] = statuses;
	    }
	    void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, fields);
	  }
	}

	const limit$1 = tasks_v2_const.Limit.RelationList;
	var _requestParent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestParent");
	class SubTasksService extends RelationService {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _requestParent, {
	      value: _requestParent2
	    });
	  }
	  async getParent(taskId, parentId) {
	    if (tasks_v2_provider_service_taskService.taskService.hasStoreTask(parentId)) {
	      return;
	    }
	    const parent = await babelHelpers.classPrivateFieldLooseBase(this, _requestParent)[_requestParent](parentId);
	    if (!parent) {
	      void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	        parentId: 0
	      });
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
	        id: taskId,
	        fieldName: tasks_v2_const.TaskField.Parent,
	        isFilled: false
	      });
	      return;
	    }
	    tasks_v2_provider_service_taskService.taskService.extractTask(parent);
	    void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/addPartiallyLoaded`, parentId);
	  }
	  async setParent(taskId, parentId) {
	    var _taskService$getStore;
	    const currentParentId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).parentId;
	    if (currentParentId === parentId) {
	      return null;
	    }
	    if (parentId === 0 && tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      if (tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	        await tasks_v2_provider_service_templateService.templateService.update(taskId, {
	          parentId
	        });
	        return null;
	      }
	      return this.delete(currentParentId, [taskId]);
	    }
	    if (parentId === taskId) {
	      return main_core.Loc.getMessage('TASKS_V2_RELATION_PARENT_CANNOT_BE_PARENT');
	    }
	    if ((_taskService$getStore = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)) != null && _taskService$getStore.subTaskIds.includes(parentId)) {
	      return main_core.Loc.getMessage('TASKS_V2_RELATION_SUB_TASK_CANNOT_BE_PARENT');
	    }
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return this.addStore(parentId, [taskId]);
	    }
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) && !tasks_v2_lib_idUtils.idUtils.isTemplate(parentId)) {
	      await tasks_v2_provider_service_templateService.templateService.update(taskId, {
	        parentId
	      });
	      return null;
	    }
	    const error = await this.add(parentId, [taskId], false);
	    if (error) {
	      this.addStore(currentParentId, [taskId]);
	    }
	    return error;
	  }
	  async add(taskId, taskIds, noOverride = true) {
	    var _taskService$getStore2, _error3, _taskService$getStore3;
	    let error = null;
	    if (taskIds.includes(taskId)) {
	      var _error;
	      (_error = error) != null ? _error : error = main_core.Loc.getMessage('TASKS_V2_RELATION_SELF_CANNOT_BE_SUB_TASK');
	    }
	    const parentId = (_taskService$getStore2 = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)) == null ? void 0 : _taskService$getStore2.parentId;
	    if (taskIds.includes(parentId)) {
	      var _error2;
	      (_error2 = error) != null ? _error2 : error = main_core.Loc.getMessage('TASKS_V2_RELATION_PARENT_CANNOT_BE_SUB_TASK');
	    }
	    const ids = taskIds.filter(id => id !== taskId && id !== parentId);
	    const parentError = await super.add(taskId, ids, noOverride);
	    (_error3 = error) != null ? _error3 : error = parentError;
	    if ((_taskService$getStore3 = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)) != null && _taskService$getStore3.matchesSubTasksTime) {
	      void tasks_v2_provider_service_taskService.taskService.get(taskId, {}, true);
	    }
	    return error;
	  }
	  async delete(taskId, taskIds) {
	    var _taskService$getStore4;
	    await super.delete(taskId, taskIds);
	    if ((_taskService$getStore4 = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)) != null && _taskService$getStore4.matchesSubTasksTime) {
	      void tasks_v2_provider_service_taskService.taskService.get(taskId, {}, true);
	    }
	  }
	  addStore(id, ids) {
	    ids.forEach(it => {
	      var _taskService$getStore5;
	      return this.deleteStore((_taskService$getStore5 = tasks_v2_provider_service_taskService.taskService.getStoreTask(it)) == null ? void 0 : _taskService$getStore5.parentId, [it]);
	    });
	    super.addStore(id, ids);
	  }

	  /** @protected */
	  async requestTasks(taskId, withIds = false) {
	    var _task$subTaskIds;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (withIds && !((_task$subTaskIds = task.subTaskIds) != null && _task$subTaskIds.length) && task.templateId) {
	      const {
	        templates,
	        ids
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationChildList, {
	        templateId: task.templateId,
	        withIds,
	        withSubTemplates: this.showSubTemplates,
	        navigation: {
	          size: limit$1
	        }
	      });
	      const idsMap = ids.reduce((map, id) => map.set(id, `tmp.${id}`), new Map());
	      const tasks = templates.map(template => ({
	        ...tasks_v2_provider_service_templateService.TemplateMappers.mapDtoToTaskDto(template),
	        id: idsMap.get(template.id),
	        rights: {
	          read: true,
	          delegate: false,
	          changeResponsible: false,
	          detachParent: false
	        }
	      }));
	      return {
	        tasks,
	        ids: [...idsMap.values()]
	      };
	    }
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestTasks(taskId, withIds);
	    }
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      const ids = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).subTaskIds;
	      const templateIds = this.getVisibleIds(taskId, ids, true);
	      const tasks = await this.requestTasksByIds(taskId, templateIds);
	      return {
	        tasks,
	        ids
	      };
	    }
	    const {
	      templates,
	      ids
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationChildList, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      withIds,
	      withSubTemplates: this.showSubTemplates,
	      navigation: {
	        size: limit$1
	      }
	    });
	    const tasks = templates.map(it => {
	      var _it$subTemplateIds;
	      return {
	        ...it,
	        id: tasks_v2_lib_idUtils.idUtils.boxTemplate(it.id),
	        subTaskIds: tasks_v2_lib_idUtils.idUtils.boxTemplates((_it$subTemplateIds = it == null ? void 0 : it.subTemplateIds) != null ? _it$subTemplateIds : []),
	        rights: {
	          ...tasks_v2_provider_service_templateService.TemplateMappers.mapRights(it == null ? void 0 : it.rights),
	          ...(it == null ? void 0 : it.rights)
	        }
	      };
	    });
	    return {
	      tasks,
	      ids: ids == null ? void 0 : ids.map(id => tasks_v2_lib_idUtils.idUtils.boxTemplate(id))
	    };
	  }

	  /** @protected */
	  async requestTasksByIds(taskId, taskIds) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestTasksByIds(taskId, taskIds);
	    }
	    const {
	      templates
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationChildListByIds, {
	      templateIds: taskIds.map(id => tasks_v2_lib_idUtils.idUtils.unbox(id)),
	      withSubTemplates: this.showSubTemplates
	    });
	    return templates.map(it => {
	      var _it$subTemplateIds2;
	      return {
	        ...it,
	        id: tasks_v2_lib_idUtils.idUtils.boxTemplate(it.id),
	        subTaskIds: tasks_v2_lib_idUtils.idUtils.boxTemplates((_it$subTemplateIds2 = it == null ? void 0 : it.subTemplateIds) != null ? _it$subTemplateIds2 : []),
	        rights: {
	          ...tasks_v2_provider_service_templateService.TemplateMappers.mapRights(it == null ? void 0 : it.rights),
	          ...(it == null ? void 0 : it.rights)
	        }
	      };
	    });
	  }

	  /** @protected */
	  async requestSubTaskIds(taskId, taskIds) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestSubTaskIds(taskId, taskIds);
	    }
	    const {
	      templates
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationChildGetSubTemplateIds, {
	      templateIds: taskIds.map(id => tasks_v2_lib_idUtils.idUtils.unbox(id))
	    });
	    return templates.map(it => {
	      var _it$subTemplateIds3;
	      return {
	        id: tasks_v2_lib_idUtils.idUtils.boxTemplate(it.id),
	        subTaskIds: tasks_v2_lib_idUtils.idUtils.boxTemplates((_it$subTemplateIds3 = it == null ? void 0 : it.subTemplateIds) != null ? _it$subTemplateIds3 : [])
	      };
	    });
	  }

	  /** @protected */
	  requestAdd(taskId, taskIds, noOverride = false) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestAdd(taskId, taskIds, noOverride);
	    }
	    return this.requestUpdate(tasks_v2_const.Endpoint.TemplateRelationChildAdd, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      templateIds: taskIds.map(id => tasks_v2_lib_idUtils.idUtils.unbox(id)),
	      noOverride
	    });
	  }

	  /** @protected */
	  requestDelete(taskId, taskIds) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestDelete(taskId, taskIds);
	    }
	    return this.requestUpdate(tasks_v2_const.Endpoint.TemplateRelationChildDelete, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      templateIds: taskIds.map(id => tasks_v2_lib_idUtils.idUtils.unbox(id))
	    });
	  }
	}
	async function _requestParent2(taskId) {
	  if (tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	    var _parent$subTemplateId;
	    const {
	      templates
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationChildListByIds, {
	      templateIds: [tasks_v2_lib_idUtils.idUtils.unbox(taskId)]
	    });
	    const parent = templates[0];
	    return {
	      ...parent,
	      id: tasks_v2_lib_idUtils.idUtils.boxTemplate(parent.id),
	      subTaskIds: tasks_v2_lib_idUtils.idUtils.boxTemplates((_parent$subTemplateId = parent == null ? void 0 : parent.subTemplateIds) != null ? _parent$subTemplateId : []),
	      rights: {
	        ...tasks_v2_provider_service_templateService.TemplateMappers.mapRights(parent == null ? void 0 : parent.rights),
	        ...(parent == null ? void 0 : parent.rights)
	      }
	    };
	  }
	  const {
	    tasks
	  } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskRelationChildListByIds, {
	    taskIds: [taskId]
	  });
	  return tasks[0];
	}

	const limit$2 = tasks_v2_const.Limit.RelationList;
	class RelatedTasksService extends RelationService {
	  async add(taskId, taskIds, noOverride = false) {
	    var _error2;
	    let error = null;
	    if (taskIds.includes(taskId)) {
	      var _error;
	      (_error = error) != null ? _error : error = main_core.Loc.getMessage('TASKS_V2_RELATION_SELF_CANNOT_BE_RELATED_TASK');
	    }
	    const ids = taskIds.filter(id => id !== taskId);
	    const parentError = await super.add(taskId, ids, noOverride);
	    (_error2 = error) != null ? _error2 : error = parentError;
	    return error;
	  }

	  /** @protected */
	  async requestTasks(taskId, withIds = false) {
	    var _task$relatedTaskIds;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (withIds && !((_task$relatedTaskIds = task.relatedTaskIds) != null && _task$relatedTaskIds.length) && task.templateId) {
	      const {
	        tasks,
	        ids,
	        statuses
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationRelatedList, {
	        templateId: task.templateId,
	        withIds,
	        withCompleted: this.showCompletedTasks,
	        navigation: {
	          size: limit$2
	        }
	      });
	      return {
	        tasks,
	        ids,
	        statuses
	      };
	    }
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) || !tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return super.requestTasks(taskId, withIds);
	    }
	    const {
	      tasks,
	      ids,
	      statuses
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateRelationRelatedList, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      withIds,
	      withCompleted: this.showCompletedTasks,
	      navigation: {
	        size: limit$2
	      }
	    });
	    return {
	      tasks,
	      ids,
	      statuses
	    };
	  }

	  /** @protected */
	  requestAdd(taskId, taskIds, noOverride = false) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestAdd(taskId, taskIds, noOverride);
	    }
	    return this.requestUpdate(tasks_v2_const.Endpoint.TemplateRelationRelatedAdd, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      taskIds,
	      noOverride
	    });
	  }

	  /** @protected */
	  requestDelete(taskId, taskIds) {
	    if (!tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)) {
	      return super.requestDelete(taskId, taskIds);
	    }
	    return this.requestUpdate(tasks_v2_const.Endpoint.TemplateRelationRelatedDelete, {
	      templateId: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
	      taskIds
	    });
	  }
	}

	function mapGanttLinksToModels(dependentId, ganttLinks) {
	  if (!ganttLinks) {
	    return [];
	  }
	  return Object.entries(ganttLinks).map(([taskId, type]) => ({
	    taskId,
	    dependentId,
	    type
	  }));
	}

	class GanttService extends RelationService {
	  async list(taskId, withIds = false) {
	    const tasks = await super.list(taskId, withIds);
	    tasks.forEach(taskDto => {
	      const ganttLinks = mapGanttLinksToModels(taskDto.id, taskDto.ganttLinks);
	      void this.$store.dispatch(`${tasks_v2_const.Model.GanttLinks}/upsertMany`, ganttLinks);
	    });
	  }
	  async checkDependence(ganttLink) {
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(ganttLink.taskId)) {
	      return null;
	    }
	    const error = await this.requestUpdate(tasks_v2_const.Endpoint.TaskRelationGanttDependenceCheck, {
	      ganttLink
	    });
	    if (error) {
	      var _error$errors, _error$errors$;
	      return (_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message;
	    }
	    return null;
	  }
	  async addDependence(ganttLink) {
	    const {
	      taskId,
	      dependentId
	    } = ganttLink;
	    this.addStore(taskId, [dependentId]);
	    void this.$store.dispatch(`${tasks_v2_const.Model.GanttLinks}/upsert`, ganttLink);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return null;
	    }
	    const error = await this.requestUpdate(tasks_v2_const.Endpoint.TaskRelationGanttDependenceAdd, {
	      ganttLink
	    });
	    if (error) {
	      var _error$errors2, _error$errors2$;
	      this.deleteStore(taskId, [dependentId]);
	      console.error('Task.Relation.Gantt.Dependence.add error', error);
	      return (_error$errors2 = error.errors) == null ? void 0 : (_error$errors2$ = _error$errors2[0]) == null ? void 0 : _error$errors2$.message;
	    }
	    return null;
	  }
	  async updateDependence(ganttLink) {
	    void this.$store.dispatch(`${tasks_v2_const.Model.GanttLinks}/upsert`, ganttLink);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(ganttLink.taskId)) {
	      return null;
	    }
	    const error = await this.requestUpdate(tasks_v2_const.Endpoint.TaskRelationGanttDependenceUpdate, {
	      ganttLink
	    });
	    if (error) {
	      var _error$errors3, _error$errors3$;
	      console.error('Task.Relation.Gantt.Dependence.update error', error);
	      return (_error$errors3 = error.errors) == null ? void 0 : (_error$errors3$ = _error$errors3[0]) == null ? void 0 : _error$errors3$.message;
	    }
	    return null;
	  }
	  async delete(taskId, taskIds) {
	    const ganttLink = {
	      taskId,
	      dependentId: taskIds[0]
	    };
	    this.deleteStore(taskId, taskIds);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return;
	    }
	    const error = await this.requestUpdate(tasks_v2_const.Endpoint.TaskRelationGanttDependenceDelete, {
	      ganttLink
	    });
	    if (error) {
	      this.addStore(taskId, taskIds);
	      console.error('Task.Relation.Gantt.Dependence.delete error', error);
	    }
	  }
	}

	const subTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.SubTasks,
	  idsField: 'subTaskIds',
	  statusesField: 'subTaskStatuses',
	  containsField: 'containsSubTasks',
	  relationToField: 'parentId',
	  showCompletedField: 'showCompletedSubTasks',
	  controller: 'Task.Relation.Child',
	  uniqueRight: 'detachParent',
	  addError: main_core.Loc.getMessage('TASKS_V2_RELATION_SUBTASKS_NO_ACCESS'),
	  addErrorMany: main_core.Loc.getMessage('TASKS_V2_RELATION_SUBTASKS_NO_ACCESS_MANY'),
	  overrideError: main_core.Loc.getMessage('TASKS_V2_RELATION_CANNOT_OVERRIDE_PARENT'),
	  overrideErrorMany: main_core.Loc.getMessage('TASKS_V2_RELATION_CANNOT_OVERRIDE_PARENT_MANY')
	});
	const relatedTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.RelatedTasks,
	  idsField: 'relatedTaskIds',
	  statusesField: 'relatedTaskStatuses',
	  containsField: 'containsRelatedTasks',
	  relationToField: 'relatedToTaskId',
	  showCompletedField: 'showCompletedRelatedTasks',
	  controller: 'Task.Relation.Related',
	  uniqueRight: 'detachRelated',
	  addError: main_core.Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS'),
	  addErrorMany: main_core.Loc.getMessage('TASKS_V2_RELATION_RELATED_TASKS_NO_ACCESS_MANY')
	});
	const ganttMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Gantt,
	  idsField: 'ganttTaskIds',
	  statusesField: 'ganttTaskStatuses',
	  containsField: 'containsGanttLinks',
	  relationToField: 'ganttParentId',
	  showCompletedField: 'showCompletedGantt',
	  controller: 'Task.Relation.Gantt.Dependence',
	  uniqueRight: 'changeDependence'
	});

	const subTasksService = new SubTasksService(subTasksMeta);
	const relatedTasksService = new RelatedTasksService(relatedTasksMeta);
	const ganttService = new GanttService(ganttMeta);

	exports.subTasksService = subTasksService;
	exports.relatedTasksService = relatedTasksService;
	exports.ganttService = ganttService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Provider.Service,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=relation-service.bundle.js.map
