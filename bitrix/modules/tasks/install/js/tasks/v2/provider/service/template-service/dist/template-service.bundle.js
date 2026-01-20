/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,main_core,main_core_events,tasks_v2_core,tasks_v2_const,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService,tasks_v2_lib_idUtils,tasks_v2_provider_service_checkListService,tasks_v2_provider_service_relationService,tasks_v2_component_fields_userFields) {
	'use strict';

	var _grantUser, _userGranted, _buildUser;
	const permissionBuilder = new (_grantUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("grantUser"), _userGranted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userGranted"), _buildUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildUser"), class {
	  constructor() {
	    Object.defineProperty(this, _buildUser, {
	      value: _buildUser2
	    });
	    Object.defineProperty(this, _userGranted, {
	      value: _userGranted2
	    });
	    Object.defineProperty(this, _grantUser, {
	      value: _grantUser2
	    });
	  }
	  getPermissions(task) {
	    var _task$permissions;
	    const currentUserId = tasks_v2_core.Core.getParams().currentUser.id;
	    const permissions = (_task$permissions = task.permissions) != null ? _task$permissions : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _grantUser)[_grantUser](currentUserId, permissions);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(task.id) && task.creatorId !== currentUserId) {
	      babelHelpers.classPrivateFieldLooseBase(this, _grantUser)[_grantUser](task.creatorId, permissions);
	    }
	    return permissions;
	  }
	  buildFromItem(item) {
	    const entityId = item.getId();
	    let entityType = item.getEntityId();
	    if ([tasks_v2_const.EntitySelectorEntity.Group, tasks_v2_const.EntitySelectorEntity.Project].includes(entityType)) {
	      entityType = tasks_v2_const.EntitySelectorEntity.Group;
	    }
	    return {
	      id: this.buildId(entityType, entityId),
	      entityType,
	      entityId,
	      title: item.getTitle(),
	      image: item.getAvatar(),
	      permission: tasks_v2_const.PermissionType.Full
	    };
	  }
	  buildItemId(permission) {
	    const mainDepartmentId = tasks_v2_core.Core.getParams().mainDepartmentUfId;
	    let type = permission.entityType;
	    let id = permission.entityId;
	    if (type === tasks_v2_const.EntitySelectorEntity.Group) {
	      type = tasks_v2_const.EntitySelectorEntity.Project;
	    }
	    if (type === tasks_v2_const.EntitySelectorEntity.Department && permission.entityId === mainDepartmentId) {
	      type = tasks_v2_const.EntitySelectorEntity.MetaUser;
	      id = tasks_v2_const.EntitySelectorEntity.AllUser;
	    }
	    return [type, id];
	  }
	  buildId(entityType, entityId) {
	    return `${entityType}:${entityId}`;
	  }
	})();
	function _grantUser2(userId, permissions) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _userGranted)[_userGranted](userId, permissions)) {
	    permissions.push(babelHelpers.classPrivateFieldLooseBase(this, _buildUser)[_buildUser](userId));
	  }
	  return permissions;
	}
	function _userGranted2(userId, permissions) {
	  return permissions.find(it => it.entityType === tasks_v2_const.EntitySelectorEntity.User && it.entityId === userId);
	}
	function _buildUser2(userId) {
	  const user = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Users}/getById`](userId);
	  return {
	    id: this.buildId(tasks_v2_const.EntitySelectorEntity.User, user.id),
	    entityType: tasks_v2_const.EntitySelectorEntity.User,
	    entityId: user.id,
	    title: user.name,
	    image: user.image,
	    permission: tasks_v2_const.PermissionType.Full
	  };
	}

	const mapPermissionDtoToModel = dto => {
	  var _dto$accessEntity, _dto$accessEntity$ima;
	  return {
	    id: permissionBuilder.buildId(dto.accessEntity.type, dto.accessEntity.id),
	    entityId: dto.accessEntity.id,
	    entityType: dto.accessEntity.type,
	    title: dto.accessEntity.name,
	    image: (_dto$accessEntity = dto.accessEntity) == null ? void 0 : (_dto$accessEntity$ima = _dto$accessEntity.image) == null ? void 0 : _dto$accessEntity$ima.src,
	    permission: dto.permissionId
	  };
	};
	const mapPermissionModelToDto = permission => ({
	  accessEntity: {
	    id: permission.entityId,
	    type: permission.entityType
	  },
	  permissionId: permission.permission
	});
	const mapRights = ({
	  read,
	  edit,
	  remove,
	  create
	}) => ({
	  read,
	  edit,
	  remove,
	  create,
	  complete: edit,
	  approve: edit,
	  disapprove: edit,
	  start: edit,
	  take: edit,
	  delegate: edit,
	  defer: edit,
	  renew: edit,
	  deadline: edit,
	  datePlan: edit,
	  changeDirector: edit,
	  changeResponsible: edit,
	  changeAccomplices: edit,
	  pause: edit,
	  timeTracking: edit,
	  rate: edit,
	  changeStatus: edit,
	  reminder: edit,
	  addAuditors: edit,
	  elapsedTime: edit,
	  favorite: edit,
	  checklistAdd: edit,
	  checklistEdit: edit,
	  checklistSave: edit,
	  checklistToggle: edit,
	  automate: edit,
	  resultEdit: edit,
	  completeResult: edit,
	  removeResult: edit,
	  resultRead: edit,
	  admin: edit,
	  watch: edit,
	  mute: edit,
	  createSubtask: edit,
	  copy: edit,
	  createFromTemplate: edit,
	  saveAsTemplate: edit,
	  attachFile: edit,
	  detachFile: edit,
	  detachParent: edit,
	  detachRelated: edit,
	  changeDependence: edit,
	  createGanttDependence: edit,
	  sort: edit
	});
	const mapDtoToTaskDto = templateDto => ({
	  title: templateDto.title,
	  responsibleCollection: templateDto.responsibleCollection,
	  deadlineTs: mapValue(templateDto.deadlineAfter, ceilTs(Date.now() + templateDto.deadlineAfter * 1000) / 1000)
	});
	const step = 60 * 1000;
	const ceilTs = timestamp => Math.ceil(timestamp / step) * step;
	const mapValue = (value, mapped) => main_core.Type.isNil(value) ? value : mapped;

	var _updateFields, _updateTaskBefore, _updatePromises, _updateServerTaskDebounced, _updateDebounced, _requestUpdate;
	const templateService = new (_updateFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFields"), _updateTaskBefore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTaskBefore"), _updatePromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePromises"), _updateServerTaskDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateServerTaskDebounced"), _updateDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateDebounced"), _requestUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestUpdate"), class {
	  constructor() {
	    Object.defineProperty(this, _requestUpdate, {
	      value: _requestUpdate2
	    });
	    Object.defineProperty(this, _updateDebounced, {
	      value: _updateDebounced2
	    });
	    Object.defineProperty(this, _updateFields, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _updateTaskBefore, {
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
	    main_core.Event.bind(window, 'beforeunload', () => {
	      setTimeout(() => {
	        const pendingIds = Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises]);
	        pendingIds.forEach(id => babelHelpers.classPrivateFieldLooseBase(this, _requestUpdate)[_requestUpdate](id));
	      });
	    });
	  }
	  async get(id) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateGet, {
	        templateId: tasks_v2_lib_idUtils.idUtils.unbox(id)
	      });
	      data.id = id;
	      tasks_v2_provider_service_taskService.taskService.extractTask({
	        ...data,
	        rights: mapRights(data.rights)
	      }, false);
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TemplateGet, error);
	    }
	    return tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	  }
	  async getCopy(id, tmpId) {
	    var _template$checklist;
	    const template = await this.get(id);
	    if (((_template$checklist = template.checklist) == null ? void 0 : _template$checklist.length) > 0) {
	      await tasks_v2_provider_service_checkListService.checkListService.load(id, tmpId);
	    }
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(tmpId, {
	      title: template.title,
	      description: template.description,
	      creatorId: tasks_v2_core.Core.getParams().currentUser.id,
	      responsibleIds: template.responsibleIds,
	      deadlineAfter: template.deadlineAfter,
	      needsControl: template.needsControl,
	      startDatePlanAfter: template.startDatePlanAfter,
	      endDatePlanAfter: template.endDatePlanAfter,
	      fileIds: template.fileIds,
	      groupId: template.groupId,
	      isImportant: template.isImportant,
	      accomplicesIds: template.accomplicesIds,
	      auditorsIds: template.auditorsIds,
	      parentId: template.parentId,
	      allowsChangeDeadline: template.allowsChangeDeadline,
	      matchesWorkTime: template.matchesWorkTime,
	      tags: template.tags,
	      crmItemIds: template.crmItemIds,
	      containsRelatedTasks: template.containsRelatedTasks,
	      relatedTaskIds: template.relatedTaskIds,
	      allowsTimeTracking: template.allowsTimeTracking,
	      estimatedTime: template.estimatedTime,
	      permissions: template.estimatedTime
	    });
	  }
	  async add(template) {
	    try {
	      var _template$checklist2;
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateAdd, {
	        template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto(template)
	      });
	      data.id = tasks_v2_lib_idUtils.idUtils.boxTemplate(data.id);
	      tasks_v2_provider_service_taskService.taskService.updateStoreTask(template.id, {
	        id: data.id
	      });
	      tasks_v2_provider_service_taskService.taskService.extractTask({
	        ...data,
	        rights: mapRights(data.rights)
	      });
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateAdded, {
	        template: tasks_v2_provider_service_taskService.taskService.getStoreTask(data.id),
	        initialTemplate: template
	      });
	      if (template.parentId) {
	        tasks_v2_provider_service_relationService.subTasksService.addStore(template.parentId, [data.id]);
	      }
	      if (((_template$checklist2 = template.checklist) == null ? void 0 : _template$checklist2.length) > 0) {
	        void tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](template.checklist));
	      }
	      return [data.id, null];
	    } catch (error) {
	      var _error$errors, _error$errors$;
	      console.error(tasks_v2_const.Endpoint.TemplateAdd, error);
	      return [0, new Error((_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message)];
	    }
	  }
	  async copy(template) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateAdd, {
	        template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto({
	          ...template,
	          id: template.copiedFromId
	        })
	      });
	      data.id = tasks_v2_lib_idUtils.idUtils.boxTemplate(data.id);
	      tasks_v2_provider_service_taskService.taskService.updateStoreTask(template.id, {
	        id: data.id
	      });
	      tasks_v2_provider_service_taskService.taskService.extractTask({
	        ...data,
	        rights: mapRights(data.rights)
	      });
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateAdded, {
	        template: tasks_v2_provider_service_taskService.taskService.getStoreTask(data.id),
	        initialTemplate: template
	      });
	      if (template.checklist.length > 0) {
	        void tasks_v2_provider_service_checkListService.checkListService.load(data.id);
	      }
	      return [data.id, null];
	    } catch (error) {
	      var _error$errors2, _error$errors2$;
	      console.error(tasks_v2_const.Endpoint.TemplateCopy, error);
	      return [0, new Error((_error$errors2 = error.errors) == null ? void 0 : (_error$errors2$ = _error$errors2[0]) == null ? void 0 : _error$errors2$.message)];
	    }
	  }
	  async getTask(templateId, taskId) {
	    try {
	      var _data$responsible, _data$group, _data$stage, _data$checklist;
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskFromTemplateGet, {
	        templateId
	      });
	      data.id = taskId;
	      data.templateId = templateId;
	      const isAdmin = tasks_v2_core.Core.getParams().rights.user.admin;
	      if (!isAdmin && (((_data$responsible = data.responsible) == null ? void 0 : _data$responsible.id) !== tasks_v2_core.Core.getParams().currentUser.id || main_core.Type.isArrayFilled(data.multiResponsibles))) {
	        data.creator = tasks_v2_core.Core.getParams().currentUser;
	      }
	      (_data$group = data.group) != null ? _data$group : data.group = {
	        id: 0
	      };
	      (_data$stage = data.stage) != null ? _data$stage : data.stage = {
	        id: 0
	      };
	      const tmpTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	      if (tmpTask.flowId) {
	        data.creator = tasks_v2_core.Core.getParams().currentUser;
	        data.responsible = tasks_v2_core.Core.getParams().currentUser;
	        data.description = tmpTask.description + data.description;
	        delete data.multiResponsibles;
	        delete data.deadlineTs;
	        delete data.group;
	      }
	      if (main_core.Type.isArrayFilled(tmpTask.crmItemIds)) {
	        const uniqueCrmItemIds = new Set([...(tmpTask.crmItemIds || []), ...(data.crmItemIds || [])]);
	        data.crmItemIds = [...uniqueCrmItemIds];
	        const uniqueTags = new Set();
	        [...(tmpTask.tags || []), ...(data.tags || [])].forEach(tag => {
	          if (main_core.Type.isString(tag)) {
	            uniqueTags.add(tag);
	            return;
	          }
	          uniqueTags.add(tag.name);
	        });
	        data.tags = [...uniqueTags].map(tag => ({
	          name: tag
	        }));
	      }
	      if (main_core.Type.isArrayFilled(data.userFields)) {
	        data.userFields = tasks_v2_component_fields_userFields.userFieldsManager.prepareUserFieldsForTaskFromTemplate(data.userFields, tasks_v2_core.Core.getParams().taskUserFieldScheme);
	      }
	      tasks_v2_provider_service_taskService.taskService.extractTask(data, false);
	      if (((_data$checklist = data.checklist) == null ? void 0 : _data$checklist.length) > 0) {
	        await tasks_v2_provider_service_checkListService.checkListService.load(taskId);
	      }
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskFromTemplateGet, error);
	    }
	  }
	  async addTask(templateId, task, withSubTasks) {
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskFromTemplateAdd, {
	        template: {
	          id: templateId
	        },
	        task: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto(task),
	        withSubTasks
	      });
	      data.templateId = 0;
	      if (task.responsibleIds.length > 1) {
	        const multiResponsibleIds = task.responsibleIds.filter(id => id !== tasks_v2_core.Core.getParams().currentUser.id);
	        await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskMultiTaskAdd, {
	          taskId: data.id,
	          userIds: multiResponsibleIds
	        });
	        tasks_v2_provider_service_relationService.subTasksService.addStore(task.id, multiResponsibleIds.map(id => `userTask${id}`));
	      }
	      tasks_v2_provider_service_taskService.taskService.onAfterTaskAdded(task, data);
	      return [data.id, null];
	    } catch (error) {
	      var _error$errors3, _error$errors3$;
	      console.error(tasks_v2_const.Endpoint.TaskFromTemplateAdd, error);
	      return [0, new Error((_error$errors3 = error.errors) == null ? void 0 : (_error$errors3$ = _error$errors3[0]) == null ? void 0 : _error$errors3$.message)];
	    }
	  }
	  async update(id, fields) {
	    const templateBefore = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (!tasks_v2_provider_service_taskService.taskService.hasChanges(templateBefore, fields)) {
	      return;
	    }
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, fields);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	      return;
	    }
	    main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateBeforeUpdate, {
	      template: tasks_v2_provider_service_taskService.taskService.getStoreTask(id),
	      fields: {
	        id,
	        ...fields
	      }
	    });
	    await babelHelpers.classPrivateFieldLooseBase(this, _updateDebounced)[_updateDebounced](id, fields, templateBefore);
	  }
	  async delete(id) {
	    const templateBeforeDelete = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    await tasks_v2_provider_service_taskService.taskService.deleteStore(id);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	      return;
	    }
	    const templateId = tasks_v2_lib_idUtils.idUtils.unbox(id);
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateDelete, {
	        templateId
	      });
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TemplateDeleted, {
	        id: templateId
	      });
	    } catch (error) {
	      await tasks_v2_provider_service_taskService.taskService.insertStoreTask(templateBeforeDelete);
	      console.error(tasks_v2_const.Endpoint.TemplateDelete, error);
	    }
	  }
	  async insertStoreTask(task) {
	    await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/insert`, {
	      ...task,
	      permissions: []
	    });
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	})();
	function _updateDebounced2(id, fields, templateBefore) {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	  babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id] = {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id],
	    ...fields
	  };
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore])[id]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[id] = templateBefore;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises])[id]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[id] = new Resolvable();
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced])[id]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[id] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _requestUpdate)[_requestUpdate], 500, this);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced][id](id);
	  return babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	}
	async function _requestUpdate2(id) {
	  const fields = babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  const templateBefore = babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore][id];
	  const promise = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  const templateId = tasks_v2_lib_idUtils.idUtils.unbox(id);
	  try {
	    await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateUpdate, {
	      template: tasks_v2_provider_service_taskService.TaskMappers.mapModelToDto({
	        id: templateId,
	        ...fields
	      })
	    });
	  } catch (error) {
	    tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, templateBefore);
	    console.error(tasks_v2_const.Endpoint.TemplateUpdate, error);
	  }
	  promise.resolve();
	}
	function Resolvable() {
	  const promise = new Promise(resolve => {
	    this.resolve = resolve;
	  });
	  promise.resolve = this.resolve;
	  return promise;
	}

	const TemplateMappers = {
	  mapPermissionDtoToModel,
	  mapPermissionModelToDto,
	  mapDtoToTaskDto,
	  mapRights
	};

	exports.TemplateMappers = TemplateMappers;
	exports.templateService = templateService;
	exports.permissionBuilder = permissionBuilder;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX,BX.Event,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields));
//# sourceMappingURL=template-service.bundle.js.map
