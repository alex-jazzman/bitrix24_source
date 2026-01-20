/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_provider_service_userService,main_core,tasks_v2_core,tasks_v2_const,tasks_v2_lib_idUtils,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService,tasks_v2_provider_service_fileService,tasks_v2_component_entityText) {
	'use strict';

	function mapDtoToModel(resultDto) {
	  return {
	    id: resultDto.id,
	    taskId: resultDto.taskId,
	    text: main_core.Text.decode(resultDto.text),
	    author: resultDto.author ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(resultDto.author) : null,
	    createdAtTs: resultDto.createdAtTs * 1000,
	    updatedAtTs: resultDto.updatedAtTs * 1000,
	    status: resultDto.status,
	    fileIds: resultDto.fileIds,
	    previewId: resultDto.previewId,
	    rights: resultDto.rights,
	    files: resultDto.files
	  };
	}
	function mapModelToDto(result) {
	  return {
	    id: result.id,
	    taskId: result.taskId,
	    text: result.text,
	    author: result.author.id,
	    status: result.status,
	    fileIds: result.fileIds,
	    previewId: result.previewId
	  };
	}

	const limit = tasks_v2_const.Limit.Results;
	var _handleResultAfterAdd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResultAfterAdd");
	var _addResultToStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addResultToStore");
	var _updateStoreTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateStoreTask");
	class ResultService {
	  constructor() {
	    Object.defineProperty(this, _updateStoreTask, {
	      value: _updateStoreTask2
	    });
	    Object.defineProperty(this, _addResultToStore, {
	      value: _addResultToStore2
	    });
	    Object.defineProperty(this, _handleResultAfterAdd, {
	      value: _handleResultAfterAdd2
	    });
	  }
	  async get(id) {
	    const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultGet, {
	      result: {
	        id
	      }
	    });
	    await babelHelpers.classPrivateFieldLooseBase(this, _addResultToStore)[_addResultToStore](data);
	  }
	  async tail(taskId, withMap = true) {
	    const size = limit;
	    const page = 1;
	    const {
	      results,
	      map
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultTail, {
	      taskId,
	      withMap,
	      navigation: {
	        size,
	        page
	      }
	    });
	    for (const result of results) {
	      // eslint-disable-next-line no-await-in-loop
	      await babelHelpers.classPrivateFieldLooseBase(this, _addResultToStore)[_addResultToStore](result);
	    }
	    if (withMap) {
	      const ids = Object.keys(map).map(it => parseInt(it, 10)).reverse();
	      void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	        results: ids,
	        resultsMessageMap: map
	      });
	    }
	  }
	  async getAll(taskId) {
	    const {
	      results
	    } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultGetAll, {
	      taskId,
	      withMap: false
	    });
	    for (const result of results) {
	      // eslint-disable-next-line no-await-in-loop
	      await babelHelpers.classPrivateFieldLooseBase(this, _addResultToStore)[_addResultToStore](result);
	    }
	  }
	  async save(taskId, results, skipNotification = false) {
	    const resultsToAdd = results.map(result => {
	      return mapModelToDto({
	        ...result,
	        taskId
	      });
	    });
	    const tempIds = resultsToAdd.map(result => result.id);
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultAdd, {
	        results: resultsToAdd,
	        skipNotification
	      });
	      for (const result of data) {
	        const index = data.indexOf(result);
	        const tempId = tempIds[index];

	        // eslint-disable-next-line no-await-in-loop
	        await babelHelpers.classPrivateFieldLooseBase(this, _handleResultAfterAdd)[_handleResultAfterAdd](taskId, tempId, result);
	      }
	    } catch (error) {
	      console.error('ResultService.save error', error);
	      tempIds.forEach(tempId => {
	        this.deleteResultFromTask(taskId, tempId);
	        void this.deleteStoreResult(tempId);
	      });
	    }
	  }
	  async add(taskId, result) {
	    const tempId = result.id;
	    try {
	      await this.updateStoreResult(tempId, result);
	      this.addResultToTask(taskId, tempId);
	      if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	        return;
	      }
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultAdd, {
	        results: [mapModelToDto(result)]
	      });
	      await babelHelpers.classPrivateFieldLooseBase(this, _handleResultAfterAdd)[_handleResultAfterAdd](taskId, tempId, data[0]);
	    } catch (error) {
	      console.error('ResultService.add error', error);
	      this.deleteResultFromTask(taskId, tempId);
	      await this.deleteStoreResult(tempId);
	    }
	  }
	  async update(id, fields) {
	    const resultBeforeUpdate = this.getStoreResult(id);
	    const taskId = resultBeforeUpdate == null ? void 0 : resultBeforeUpdate.taskId;
	    const result = {
	      ...resultBeforeUpdate,
	      ...fields
	    };
	    await this.updateStoreResult(id, fields);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultUpdate, {
	        result: mapModelToDto(result)
	      });
	    } catch (error) {
	      await this.updateStoreResult(id, resultBeforeUpdate);
	      console.error('ResultService.update error', error);
	    }
	  }
	  async delete(id) {
	    const resultBeforeDelete = this.getStoreResult(id);
	    const taskId = resultBeforeDelete == null ? void 0 : resultBeforeDelete.taskId;
	    this.deleteResultFromTask(taskId, id);
	    await this.deleteStoreResult(id);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultDelete, {
	        result: {
	          id
	        }
	      });
	    } catch (error) {
	      console.error('ResultService.delete error', error);
	      await this.insertStoreResult(resultBeforeDelete);
	      this.addResultToTask(taskId, id);
	    }
	  }
	  async addResultFromMessage(taskId, messageId, result) {
	    const tempId = result.id;
	    try {
	      await babelHelpers.classPrivateFieldLooseBase(this, _addResultToStore)[_addResultToStore](result);
	      this.addResultToTask(taskId, tempId, messageId);
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultMessageAdd, {
	        message: {
	          id: messageId
	        }
	      });
	      await babelHelpers.classPrivateFieldLooseBase(this, _handleResultAfterAdd)[_handleResultAfterAdd](taskId, tempId, data);
	    } catch (error) {
	      console.error('ResultService.addResultFromMessage error', error);
	      this.deleteResultFromTask(taskId, tempId);
	      await this.deleteStoreResult(tempId);
	    }
	  }
	  hasOpenedResults(taskId) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (!(task != null && task.results.length) > 0) {
	      return false;
	    }
	    for (const resultId of task.results) {
	      const result = this.getStoreResult(resultId);
	      if (result && result.status === tasks_v2_const.ResultStatus.Open) {
	        return true;
	      }
	    }
	    return false;
	  }
	  async closeResults(taskId) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (!(task != null && task.results.length) > 0) {
	      return;
	    }
	    for (const resultId of task.results) {
	      const result = this.getStoreResult(resultId);
	      if (result && result.status === tasks_v2_const.ResultStatus.Open) {
	        // eslint-disable-next-line no-await-in-loop
	        await this.updateStoreResult(resultId, {
	          status: tasks_v2_const.ResultStatus.Closed
	        });
	      }
	    }
	  }
	  getStoreResult(id) {
	    return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](id) || null;
	  }
	  hasStoreResult(id) {
	    return Boolean(this.getStoreResult(id));
	  }
	  async insertStoreResult(result) {
	    await this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, result);
	  }
	  async updateStoreResult(id, fields) {
	    await this.$store.dispatch(`${tasks_v2_const.Model.Results}/update`, {
	      id,
	      fields
	    });
	  }
	  async deleteStoreResult(id) {
	    await this.$store.dispatch(`${tasks_v2_const.Model.Results}/delete`, id);
	  }
	  addResultToTask(taskId, resultId, messageId = null) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    const results = [resultId, ...((task == null ? void 0 : task.results) || [])];
	    const resultsMessageMap = {
	      ...(task == null ? void 0 : task.resultsMessageMap),
	      [resultId]: messageId
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](taskId, results, resultsMessageMap);
	  }
	  deleteResultFromTask(taskId, resultId) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    const results = ((task == null ? void 0 : task.results) || []).filter(it => it !== resultId);
	    const resultsMessageMap = {
	      ...(task == null ? void 0 : task.resultsMessageMap)
	    };
	    delete resultsMessageMap[resultId];
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](taskId, results, resultsMessageMap);
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	async function _handleResultAfterAdd2(taskId, tempId, data) {
	  const {
	    id
	  } = data;
	  tasks_v2_provider_service_fileService.fileService.replace(tempId, id, tasks_v2_provider_service_fileService.EntityTypes.Result);
	  tasks_v2_component_entityText.entityTextEditor.replace(tempId, id, tasks_v2_component_entityText.EntityTextTypes.Result);
	  await babelHelpers.classPrivateFieldLooseBase(this, _addResultToStore)[_addResultToStore](data);
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  const hasResultInTask = ((task == null ? void 0 : task.results) || []).includes(tempId);
	  if (hasResultInTask) {
	    const results = ((task == null ? void 0 : task.results) || []).map(resultId => resultId === tempId ? id : resultId);
	    const resultsMessageMap = {
	      ...(task == null ? void 0 : task.resultsMessageMap)
	    };
	    resultsMessageMap[id] = resultsMessageMap[tempId];
	    delete resultsMessageMap[tempId];
	    babelHelpers.classPrivateFieldLooseBase(this, _updateStoreTask)[_updateStoreTask](taskId, results, resultsMessageMap);
	  } else {
	    this.addResultToTask(taskId, id);
	  }
	  await this.deleteStoreResult(tempId);
	}
	async function _addResultToStore2(result) {
	  const mappedResult = mapDtoToModel(result);
	  await this.insertStoreResult(mappedResult);
	  if (main_core.Type.isArrayFilled(mappedResult.files)) {
	    tasks_v2_provider_service_fileService.fileService.get(mappedResult.id, tasks_v2_provider_service_fileService.EntityTypes.Result).loadFilesFromData(mappedResult.files);
	  }
	  tasks_v2_component_entityText.entityTextEditor.get(mappedResult.id, tasks_v2_component_entityText.EntityTextTypes.Result, {
	    content: mappedResult.text,
	    blockSpaceInline: 'var(--ui-space-stack-xl)'
	  });
	}
	function _updateStoreTask2(taskId, results, resultsMessageMap) {
	  const containsResults = results.length > 0;
	  void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	    results,
	    resultsMessageMap,
	    containsResults
	  });
	}
	const resultService = new ResultService();

	const ResultMappers = {
	  mapModelToDto,
	  mapDtoToModel
	};

	exports.ResultMappers = ResultMappers;
	exports.resultService = resultService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component));
//# sourceMappingURL=result-service.bundle.js.map
