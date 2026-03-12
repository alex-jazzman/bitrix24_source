/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_component_fields_replication,main_core,main_core_events,tasks_v2_lib_idUtils,tasks_v2_lib_apiClient,tasks_v2_provider_service_templateService,tasks_v2_provider_service_fileService,tasks_v2_provider_service_relationService,tasks_v2_provider_service_checkListService,tasks_v2_provider_service_remindersService,tasks_v2_provider_service_resultService,tasks_v2_component_fields_userFields,tasks_v2_core,tasks_v2_provider_service_groupService,tasks_v2_provider_service_flowService,tasks_v2_provider_service_userService,tasks_v2_const) {
	'use strict';

	function mapModelToDto(task) {
	  var _responsibleIds$, _task$accomplicesIds, _task$auditorsIds, _task$tags, _task$reminders, _task$permissions;
	  const user = tasks_v2_core.Core.getParams().currentUser;
	  const parentId = task.parentId;
	  const responsibleIds = task.responsibleIds;
	  return {
	    id: task.id,
	    title: task.title,
	    description: mapValue(task.description, mapDescription(task.description)),
	    descriptionChecksum: task.descriptionChecksum,
	    creator: mapValue(task.creatorId, {
	      id: task.creatorId
	    }),
	    createdTs: mapValue(task.createdTs, Math.floor(task.createdTs / 1000)),
	    responsible: mapValue(responsibleIds, (responsibleIds == null ? void 0 : responsibleIds.length) < 2 ? {
	      id: (_responsibleIds$ = responsibleIds == null ? void 0 : responsibleIds[0]) != null ? _responsibleIds$ : 0
	    } : user),
	    responsibleCollection: mapValue(responsibleIds, responsibleIds == null ? void 0 : responsibleIds.map(id => ({
	      id
	    }))),
	    isMultitask: (responsibleIds == null ? void 0 : responsibleIds.length) > 1,
	    deadlineTs: mapValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
	    deadlineAfter: mapValue(task.deadlineAfter, Math.floor(task.deadlineAfter / 1000)),
	    needsControl: tasks_v2_core.Core.getParams().restrictions.control.available ? task.needsControl : false,
	    startPlanTs: mapValue(task.startPlanTs, Math.floor(task.startPlanTs / 1000)),
	    endPlanTs: mapValue(task.endPlanTs, Math.floor(task.endPlanTs / 1000)),
	    startDatePlanAfter: mapValue(task.startDatePlanAfter, Math.floor(task.startDatePlanAfter / 1000)),
	    endDatePlanAfter: mapValue(task.endDatePlanAfter, Math.floor(task.endDatePlanAfter / 1000)),
	    fileIds: task.fileIds,
	    checklist: task.checklist,
	    parent: mapValue(parentId, tasks_v2_lib_idUtils.idUtils.isTemplate(parentId) ? null : {
	      id: parentId
	    }),
	    base: mapValue(parentId, tasks_v2_lib_idUtils.idUtils.isTemplate(parentId) ? {
	      id: tasks_v2_lib_idUtils.idUtils.unbox(parentId)
	    } : null),
	    dependsOn: task.relatedTaskIds,
	    ganttLinks: mapValue(task.ganttTaskIds, mapGanttLinks(task.id, task.ganttTaskIds)),
	    group: mapValue(task.groupId, {
	      id: task.groupId
	    }),
	    stage: mapValue(task.stageId, {
	      id: task.stageId
	    }),
	    epicId: task.epicId,
	    storyPoints: task.storyPoints,
	    flow: mapValue(task.flowId, {
	      id: task.flowId
	    }),
	    priority: mapValue(task.isImportant, task.isImportant ? 'high' : 'low'),
	    status: task.status,
	    statusChangedTs: mapValue(task.statusChangedTs, Math.floor(task.statusChangedTs / 1000)),
	    accomplices: mapValue(task.accomplicesIds, (_task$accomplicesIds = task.accomplicesIds) == null ? void 0 : _task$accomplicesIds.map(id => ({
	      id
	    }))),
	    auditors: mapValue(task.auditorsIds, (_task$auditorsIds = task.auditorsIds) == null ? void 0 : _task$auditorsIds.map(id => ({
	      id
	    }))),
	    tags: mapValue(task.tags, (_task$tags = task.tags) == null ? void 0 : _task$tags.map(name => ({
	      name
	    }))),
	    chatId: task.chatId,
	    crmItemIds: task.crmItemIds,
	    email: task.email,
	    allowsChangeDeadline: task.allowsChangeDeadline,
	    allowsChangeDatePlan: task.allowsChangeDatePlan,
	    allowsTimeTracking: task.allowsTimeTracking,
	    estimatedTime: task.estimatedTime,
	    matchesWorkTime: tasks_v2_core.Core.getParams().restrictions.skipWeekends.available ? task.matchesWorkTime : false,
	    matchesSubTasksTime: tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available ? task.matchesSubTasksTime : false,
	    autocompleteSubTasks: tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available ? task.autocompleteSubTasks : false,
	    source: task.source,
	    templateId: task.templateId,
	    requireResult: task.requireResult,
	    reminders: mapValue(task.reminders, (_task$reminders = task.reminders) == null ? void 0 : _task$reminders.map(it => tasks_v2_provider_service_remindersService.RemindersMappers.mapModelToDto(it))),
	    maxDeadlineChangeDate: task.maxDeadlineChangeDate,
	    maxDeadlineChanges: task.maxDeadlineChanges,
	    requireDeadlineChangeReason: task.requireDeadlineChangeReason,
	    deadlineChangeReason: task.deadlineChangeReason,
	    containsSubTasks: task.containsSubTasks,
	    userFields: task.userFields,
	    type: mapValue(task.isForNewUser, task.isForNewUser ? tasks_v2_const.TemplateType.NewUsers : tasks_v2_const.TemplateType.Usual),
	    permissions: mapValue(task.permissions, (_task$permissions = task.permissions) == null ? void 0 : _task$permissions.map(it => tasks_v2_provider_service_templateService.TemplateMappers.mapPermissionModelToDto(it))),
	    mark: task.mark,
	    replicate: task.replicate && main_core.Type.isObject(task.replicateParams),
	    replicateParams: mapReplicateParamsToDto(task)
	  };
	}
	function mapDtoToModel(taskDto) {
	  var _taskDto$creator, _taskDto$parent$id, _taskDto$parent, _taskDto$base, _taskDto$containsSubT, _taskDto$group, _taskDto$stage, _taskDto$flow, _taskDto$accomplices, _taskDto$auditors, _taskDto$tags, _taskDto$inFavorite, _taskDto$inMute, _taskDto$userFields, _taskDto$permissions;
	  const allowedNullFields = new Set(['maxDeadlineChangeDate', 'maxDeadlineChanges']);
	  const task = {
	    id: taskDto.id,
	    title: taskDto.title,
	    isImportant: mapValue(taskDto.priority, taskDto.priority === 'high'),
	    description: mapValue(taskDto.description, main_core.Text.decode(taskDto.description)),
	    descriptionChecksum: taskDto.descriptionChecksum,
	    creatorId: (_taskDto$creator = taskDto.creator) == null ? void 0 : _taskDto$creator.id,
	    createdTs: mapValue(taskDto.createdTs, taskDto.createdTs * 1000),
	    responsibleIds: mapTaskDtoToResponsibleIds(taskDto),
	    deadlineTs: mapValue(taskDto.deadlineTs, taskDto.deadlineTs * 1000),
	    deadlineAfter: mapValue(taskDto.deadlineAfter, taskDto.deadlineAfter * 1000),
	    needsControl: taskDto.needsControl,
	    startPlanTs: mapValue(taskDto.startPlanTs, taskDto.startPlanTs * 1000),
	    endPlanTs: mapValue(taskDto.endPlanTs, taskDto.endPlanTs * 1000),
	    startDatePlanAfter: mapValue(taskDto.startDatePlanAfter, taskDto.startDatePlanAfter * 1000),
	    endDatePlanAfter: mapValue(taskDto.endDatePlanAfter, taskDto.endDatePlanAfter * 1000),
	    fileIds: taskDto.fileIds,
	    checklist: taskDto.checklist,
	    containsChecklist: taskDto.containsChecklist,
	    parentId: (_taskDto$parent$id = (_taskDto$parent = taskDto.parent) == null ? void 0 : _taskDto$parent.id) != null ? _taskDto$parent$id : mapValue(taskDto.base, tasks_v2_lib_idUtils.idUtils.boxTemplate((_taskDto$base = taskDto.base) == null ? void 0 : _taskDto$base.id)),
	    containsSubTasks: (_taskDto$containsSubT = taskDto.containsSubTasks) != null ? _taskDto$containsSubT : taskDto.containsSubTemplates,
	    containsRelatedTasks: taskDto.containsRelatedTasks,
	    containsGanttLinks: taskDto.containsGanttLinks,
	    containsPlacements: taskDto.containsPlacements,
	    containsCommentFiles: taskDto.containsCommentFiles,
	    requireResult: taskDto.requireResult,
	    containsResults: taskDto.containsResults,
	    numberOfReminders: taskDto.numberOfReminders,
	    groupId: (_taskDto$group = taskDto.group) == null ? void 0 : _taskDto$group.id,
	    stageId: (_taskDto$stage = taskDto.stage) == null ? void 0 : _taskDto$stage.id,
	    flowId: (_taskDto$flow = taskDto.flow) == null ? void 0 : _taskDto$flow.id,
	    status: taskDto.status,
	    statusChangedTs: mapValue(taskDto.statusChangedTs, taskDto.statusChangedTs * 1000),
	    accomplicesIds: mapValue(taskDto.accomplices, (_taskDto$accomplices = taskDto.accomplices) == null ? void 0 : _taskDto$accomplices.map(({
	      id
	    }) => id)),
	    auditorsIds: mapValue(taskDto.auditors, (_taskDto$auditors = taskDto.auditors) == null ? void 0 : _taskDto$auditors.map(({
	      id
	    }) => id)),
	    chatId: taskDto.chatId,
	    crmItemIds: taskDto.crmItemIds,
	    allowsChangeDeadline: taskDto.allowsChangeDeadline,
	    allowsChangeDatePlan: taskDto.allowsChangeDatePlan,
	    allowsTimeTracking: taskDto.allowsTimeTracking,
	    timers: taskDto.timers,
	    timeSpent: taskDto.timeSpent,
	    estimatedTime: taskDto.estimatedTime,
	    numberOfElapsedTimes: taskDto.numberOfElapsedTimes,
	    matchesWorkTime: taskDto.matchesWorkTime,
	    matchesSubTasksTime: taskDto.matchesSubTasksTime,
	    autocompleteSubTasks: taskDto.autocompleteSubTasks,
	    templateId: taskDto.templateId,
	    rights: taskDto.rights,
	    tags: mapValue(taskDto.tags, (_taskDto$tags = taskDto.tags) == null ? void 0 : _taskDto$tags.map(({
	      name
	    }) => name)),
	    isFavorite: mapValue(taskDto.inFavorite, (_taskDto$inFavorite = taskDto.inFavorite) == null ? void 0 : _taskDto$inFavorite.includes(tasks_v2_core.Core.getParams().currentUser.id)),
	    isMuted: mapValue(taskDto.inMute, (_taskDto$inMute = taskDto.inMute) == null ? void 0 : _taskDto$inMute.includes(tasks_v2_core.Core.getParams().currentUser.id)),
	    archiveLink: taskDto.archiveLink,
	    maxDeadlineChangeDate: taskDto.maxDeadlineChangeDate,
	    maxDeadlineChanges: taskDto.maxDeadlineChanges,
	    requireDeadlineChangeReason: taskDto.requireDeadlineChangeReason,
	    deadlineChangeReason: taskDto.deadlineChangeReason,
	    email: mapValue(taskDto.email, taskDto.email ? {
	      ...taskDto.email,
	      dateTs: taskDto.email.dateTs * 1000
	    } : null),
	    userFields: mapValue(taskDto.userFields, mapUserFields(taskDto.id, (_taskDto$userFields = taskDto.userFields) != null ? _taskDto$userFields : [])),
	    isForNewUser: mapValue(taskDto.type, taskDto.type === tasks_v2_const.TemplateType.NewUsers),
	    permissions: mapValue(taskDto.permissions, (_taskDto$permissions = taskDto.permissions) == null ? void 0 : _taskDto$permissions.map(it => tasks_v2_provider_service_templateService.TemplateMappers.mapPermissionDtoToModel(it))),
	    replicate: taskDto.replicate,
	    mark: taskDto.mark,
	    replicateParams: mapReplicateParamsToModel(taskDto)
	  };
	  return Object.fromEntries(Object.entries(task).filter(([key, value]) => {
	    if (allowedNullFields.has(key)) {
	      return !main_core.Type.isUndefined(value);
	    }
	    return !main_core.Type.isNil(value);
	  }));
	}
	function mapModelToSliderData(task, checkLists) {
	  var _task$fileIds;
	  const accomplices = tasks_v2_provider_service_checkListService.CheckListMappers.getUserIdsFromChecklists(checkLists, 'accomplices');
	  const auditors = tasks_v2_provider_service_checkListService.CheckListMappers.getUserIdsFromChecklists(checkLists, 'auditors');
	  const data = {
	    TITLE: task.title,
	    DESCRIPTION: mapValue(task.description, mapDescription(task.description)),
	    RESPONSIBLE_ID: task.responsibleIds[0],
	    GROUP_ID: task.groupId,
	    DEADLINE_TS: mapValue(task.deadlineTs, Math.floor(task.deadlineTs / 1000)),
	    IS_IMPORTANT: mapValue(task.isImportant, task.isImportant ? 'Y' : null),
	    FILE_IDS: mapValue(task.fileIds, ((_task$fileIds = task.fileIds) == null ? void 0 : _task$fileIds.length) > 0 ? task.fileIds : null),
	    CHECKLIST: tasks_v2_provider_service_checkListService.CheckListMappers.mapModelToSliderData(checkLists),
	    ACCOMPLICES: mapValue(accomplices, accomplices.length > 0 ? accomplices : null),
	    AUDITORS: mapValue(auditors, auditors.length > 0 ? auditors : null)
	  };
	  return Object.fromEntries(Object.entries(data).filter(([, value]) => !main_core.Type.isNil(value)));
	}
	function mapSliderDataToModel(data) {
	  const task = {
	    title: data.TITLE ? decodeURIComponent(data.TITLE) : null,
	    description: main_core.Text.decode(data.DESCRIPTION),
	    fileIds: data.UF_TASK_WEBDAV_FILES,
	    parentId: Number(data.PARENT_ID) || mapValue(data.BASE_TEMPLATE, tasks_v2_lib_idUtils.idUtils.boxTemplate(data.BASE_TEMPLATE)),
	    crmItemIds: data.UF_CRM_TASK ? data.UF_CRM_TASK.split(';').filter(id => id.trim()) : undefined,
	    email: data.UF_MAIL_MESSAGE ? mapEmail(data) : undefined,
	    tags: data.TAGS ? data.TAGS.split(',').map(tag => tag.trim()) : undefined,
	    groupId: Number(data.GROUP_ID) || undefined,
	    flowId: Number(data.FLOW_ID) || undefined,
	    templateId: Number(data.TEMPLATE) || undefined,
	    copiedFromId: Number(data.COPY) || undefined,
	    source: mapValue(data.IM_MESSAGE_ID, {
	      type: 'chat',
	      entityId: Number(data.IM_CHAT_ID),
	      subEntityId: Number(data.IM_MESSAGE_ID)
	    }),
	    context: data.context || undefined
	  };
	  return Object.fromEntries(Object.entries(task).filter(([, value]) => !main_core.Type.isNil(value)));
	}
	function mapValue(value, mappedValue) {
	  return main_core.Type.isNil(value) ? value : mappedValue;
	}

	// TODO: Temporary. Remove when removing old full card
	function mapDescription(description) {
	  return description == null ? void 0 : description.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
	}
	function mapGanttLinks(taskId, taskIds) {
	  if (!taskIds) {
	    return null;
	  }
	  return Object.fromEntries(taskIds.map(dependentId => [dependentId, tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.GanttLinks}/getLink`]({
	    taskId,
	    dependentId
	  }).type]));
	}
	function mapEmail(data) {
	  const id = Number(data.UF_MAIL_MESSAGE);
	  const title = decodeURIComponent(data.MAIL_SUBJECT);
	  const from = decodeURIComponent(data.MAIL_FROM);
	  const dateTs = data.MAIL_DATE ? parseInt(data.MAIL_DATE, 10) * 1000 : null;
	  return {
	    id,
	    title,
	    from,
	    dateTs,
	    link: `/mail/message/${id}`
	  };
	}
	function mapUserFields(taskId, userFields) {
	  if (main_core.Type.isArrayFilled(userFields)) {
	    return userFields;
	  }
	  const task = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Tasks}/getById`](taskId);
	  return task && main_core.Type.isArray(task.userFields) ? task.userFields : [];
	}
	function mapTaskDtoToResponsibleIds(taskDto) {
	  var _taskDto$responsible;
	  const responsibleIds = new Set();
	  if (main_core.Type.isArray(taskDto.responsibleCollection)) {
	    taskDto.responsibleCollection.forEach(({
	      id
	    }) => responsibleIds.add(id));
	  }
	  if (main_core.Type.isArray(taskDto.multiResponsibles)) {
	    taskDto.multiResponsibles.forEach(({
	      id
	    }) => responsibleIds.add(id));
	  }
	  if (main_core.Type.isNumber((_taskDto$responsible = taskDto.responsible) == null ? void 0 : _taskDto$responsible.id)) {
	    responsibleIds.add(taskDto.responsible.id);
	  }
	  if (responsibleIds.size > 0) {
	    return [...responsibleIds];
	  }
	  return undefined;
	}
	function mapReplicateParamsToModel({
	  replicateParams
	}) {
	  if (!main_core.Type.isObject(replicateParams)) {
	    return null;
	  }
	  const startDate = tasks_v2_component_fields_replication.DateStringConverter.parseServerDate(replicateParams.startDate);
	  const startTime = tasks_v2_component_fields_replication.TimeStringConverter.parseServerTime(replicateParams.time);
	  const startTs = tasks_v2_component_fields_replication.DateStringConverter.convertServerDateToTs(startDate, startTime);
	  let endTs = null;
	  if (!main_core.Type.isNil(replicateParams.endDate)) {
	    const endDate = tasks_v2_component_fields_replication.DateStringConverter.parseServerDate(replicateParams.endDate);
	    endTs = tasks_v2_component_fields_replication.DateStringConverter.convertServerDateToTs(endDate);
	  }
	  return {
	    ...replicateParams,
	    startTs,
	    endTs,
	    yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 + 1),
	    yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 + 1),
	    yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay + 1)
	  };
	}
	function mapReplicateParamsToDto({
	  replicateParams
	}) {
	  if (!main_core.Type.isObject(replicateParams)) {
	    return undefined;
	  }
	  const startDate = tasks_v2_component_fields_replication.DateStringConverter.convertTsToServerDateString(replicateParams.startTs);
	  const time = tasks_v2_component_fields_replication.TimeStringConverter.convertTsToServerTimeString(replicateParams.startTs);
	  const endDate = main_core.Type.isNil(replicateParams.endTs) ? null : tasks_v2_component_fields_replication.DateStringConverter.convertTsToServerDateString(replicateParams.endTs);
	  return {
	    ...replicateParams,
	    startDate,
	    time,
	    endDate,
	    yearlyMonth1: mapValue(replicateParams.yearlyMonth1, replicateParams.yearlyMonth1 - 1),
	    yearlyMonth2: mapValue(replicateParams.yearlyMonth2, replicateParams.yearlyMonth2 - 1),
	    yearlyWeekDay: mapValue(replicateParams.yearlyWeekDay, replicateParams.yearlyWeekDay - 1)
	  };
	}

	var _add, _delete;
	const auditorService = new (_add = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("add"), _delete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("delete"), class {
	  constructor() {
	    Object.defineProperty(this, _delete, {
	      value: _delete2
	    });
	    Object.defineProperty(this, _add, {
	      value: _add2
	    });
	  }
	  async update(task, taskBefore) {
	    const idsToAdd = task.auditorsIds.filter(id => !taskBefore.auditorsIds.includes(id));
	    const idsToDelete = taskBefore.auditorsIds.filter(id => !task.auditorsIds.includes(id));
	    const addResult = await babelHelpers.classPrivateFieldLooseBase(this, _add)[_add](idsToAdd, taskBefore);
	    const deleteResult = await babelHelpers.classPrivateFieldLooseBase(this, _delete)[_delete](idsToDelete, taskBefore);
	    return {
	      ...addResult,
	      ...deleteResult
	    };
	  }
	})();
	function _add2(auditorsIds, taskBefore) {
	  if (auditorsIds.length === 0) {
	    return {};
	  }
	  const watch = auditorsIds.length === 1 && auditorsIds[0] === tasks_v2_core.Core.getParams().currentUser.id;
	  const endpoint = watch ? 'Task.Audit.watch' : 'Task.Stakeholder.Auditor.add';
	  return taskService.requestUpdate(endpoint, {
	    auditorsIds
	  }, taskBefore);
	}
	function _delete2(auditorsIds, taskBefore) {
	  if (auditorsIds.length === 0) {
	    return {};
	  }
	  const unwatch = auditorsIds.length === 1 && auditorsIds[0] === tasks_v2_core.Core.getParams().currentUser.id;
	  const endpoint = unwatch ? 'Task.Audit.unwatch' : 'Task.Stakeholder.Auditor.delete';
	  return taskService.requestUpdate(endpoint, {
	    auditorsIds
	  }, taskBefore);
	}

	const creatorService = new class {
	  update(task, taskBefore) {
	    const currentUserId = tasks_v2_core.Core.getParams().currentUser.id;
	    const isAdmin = tasks_v2_core.Core.getParams().rights.user.admin;
	    const fields = {
	      creatorId: task.creatorId,
	      responsibleIds: isAdmin ? taskBefore.responsibleIds : [currentUserId]
	    };
	    return taskService.requestUpdate('Task.Stakeholder.Creator.update', fields, taskBefore);
	  }
	}();

	const descriptionService = new class {
	  async update(task, taskBefore) {
	    const endpoint = task.forceUpdateDescription ? tasks_v2_const.Endpoint.TaskDescriptionForceUpdate : tasks_v2_const.Endpoint.TaskDescriptionUpdate;
	    const fields = {
	      description: task.description,
	      descriptionChecksum: task.descriptionChecksum
	    };
	    return taskService.requestUpdate(endpoint, fields, taskBefore);
	  }
	}();

	var _add$1, _delete$1;
	const crmService = new (_add$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("add"), _delete$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("delete"), class {
	  constructor() {
	    Object.defineProperty(this, _delete$1, {
	      value: _delete2$1
	    });
	    Object.defineProperty(this, _add$1, {
	      value: _add2$1
	    });
	  }
	  async update(task, taskBefore) {
	    const idsToAdd = task.crmItemIds.filter(id => !taskBefore.crmItemIds.includes(id));
	    const idsToDelete = taskBefore.crmItemIds.filter(id => !task.crmItemIds.includes(id));
	    const addResult = await babelHelpers.classPrivateFieldLooseBase(this, _add$1)[_add$1](idsToAdd, taskBefore);
	    const deleteResult = await babelHelpers.classPrivateFieldLooseBase(this, _delete$1)[_delete$1](idsToDelete, taskBefore);
	    return {
	      ...addResult,
	      ...deleteResult
	    };
	  }
	})();
	function _add2$1(crmItemIds, taskBefore) {
	  if (crmItemIds.length === 0) {
	    return {};
	  }
	  return taskService.requestUpdate('Task.CRM.Item.add', {
	    crmItemIds
	  }, taskBefore);
	}
	function _delete2$1(crmItemIds, taskBefore) {
	  if (crmItemIds.length === 0) {
	    return {};
	  }
	  return taskService.requestUpdate('Task.CRM.Item.delete', {
	    crmItemIds
	  }, taskBefore);
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
	    var _babelHelpers$classPr;
	    return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].group) != null && _babelHelpers$classPr.id ? tasks_v2_provider_service_groupService.GroupMappers.mapDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].group) : null;
	  }
	  getStages() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].stage ? [tasks_v2_provider_service_groupService.GroupMappers.mapStageDtoToModel(babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].stage)] : [];
	  }
	  getUsers() {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6, _babelHelpers$classPr7, _babelHelpers$classPr8, _babelHelpers$classPr9, _babelHelpers$classPr10;
	    return [(_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].creator) != null ? _babelHelpers$classPr2 : [], (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].responsible) != null ? _babelHelpers$classPr3 : [], ...((_babelHelpers$classPr4 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data]) == null ? void 0 : _babelHelpers$classPr5.responsibleCollection) != null ? _babelHelpers$classPr4 : []), ...((_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data].multiResponsibles) != null ? _babelHelpers$classPr6 : []), ...((_babelHelpers$classPr7 = (_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data]) == null ? void 0 : _babelHelpers$classPr8.accomplices) != null ? _babelHelpers$classPr7 : []), ...((_babelHelpers$classPr9 = (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _data)[_data]) == null ? void 0 : _babelHelpers$classPr10.auditors) != null ? _babelHelpers$classPr9 : [])].map(userDto => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(userDto));
	  }
	}

	var _silentErrorMode, _updateFields, _updateTaskBefore, _updatePromises, _updateServerTaskDebounced, _updateTaskDebounced, _updateTask, _updateTaskFields, _updateSeparateFields, _getTaskFields, _getFilteredFields;
	const separateFields = [{
	  fields: new Set(['storyPoints', 'epicId']),
	  endpoint: tasks_v2_const.Endpoint.ScrumUpdateTask
	}, {
	  fields: new Set(['requireResult']),
	  endpoint: 'Task.Result.require'
	}, {
	  fields: new Set(['deadlineTs', 'deadlineChangeReason']),
	  endpoint: tasks_v2_const.Endpoint.TaskDeadlineUpdate
	}, {
	  fields: new Set(['startPlanTs', 'endPlanTs', 'matchesWorkTime', 'matchesSubTasksTime']),
	  endpoint: tasks_v2_const.Endpoint.TaskPlanUpdate
	}, {
	  fields: new Set(['responsibleIds']),
	  endpoint: tasks_v2_const.Endpoint.TaskStakeholderResponsibleDelegate
	}, {
	  fields: new Set(['accomplicesIds']),
	  endpoint: 'Task.Stakeholder.Accomplice.set'
	}, {
	  fields: new Set(['creatorId']),
	  service: creatorService
	}, {
	  fields: new Set(['auditorsIds']),
	  service: auditorService
	}, {
	  fields: new Set(['description', 'forceUpdateDescription']),
	  service: descriptionService
	}, {
	  fields: new Set(['crmItemIds']),
	  service: crmService
	}];
	const taskService = new (_silentErrorMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("silentErrorMode"), _updateFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFields"), _updateTaskBefore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTaskBefore"), _updatePromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePromises"), _updateServerTaskDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateServerTaskDebounced"), _updateTaskDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTaskDebounced"), _updateTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTask"), _updateTaskFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTaskFields"), _updateSeparateFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateSeparateFields"), _getTaskFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTaskFields"), _getFilteredFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilteredFields"), class {
	  constructor() {
	    Object.defineProperty(this, _getFilteredFields, {
	      value: _getFilteredFields2
	    });
	    Object.defineProperty(this, _getTaskFields, {
	      value: _getTaskFields2
	    });
	    Object.defineProperty(this, _updateSeparateFields, {
	      value: _updateSeparateFields2
	    });
	    Object.defineProperty(this, _updateTaskFields, {
	      value: _updateTaskFields2
	    });
	    Object.defineProperty(this, _updateTask, {
	      value: _updateTask2
	    });
	    Object.defineProperty(this, _updateTaskDebounced, {
	      value: _updateTaskDebounced2
	    });
	    Object.defineProperty(this, _silentErrorMode, {
	      writable: true,
	      value: false
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
	        pendingIds.forEach(id => babelHelpers.classPrivateFieldLooseBase(this, _updateTask)[_updateTask](id));
	      });
	    });
	  }
	  async get(id, taskSelect, ignoreContains = false) {
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(id)) {
	      await tasks_v2_provider_service_templateService.templateService.get(id);
	      await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/removePartiallyLoaded`, id);
	      return this.getStoreTask(id);
	    }
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskGet, {
	        task: {
	          id
	        },
	        taskSelect
	      });
	      this.extractTask(data, ignoreContains);
	      await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/removePartiallyLoaded`, id);
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskGet, error);
	    }
	    return this.getStoreTask(id);
	  }
	  async getCopy(id, tmpId) {
	    var _task$checklist;
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(tmpId)) {
	      await tasks_v2_provider_service_templateService.templateService.getCopy(tasks_v2_lib_idUtils.idUtils.boxTemplate(id), tmpId);
	      return;
	    }
	    const task = await this.get(id);
	    if (((_task$checklist = task.checklist) == null ? void 0 : _task$checklist.length) > 0) {
	      await tasks_v2_provider_service_checkListService.checkListService.load(id, tmpId);
	    }
	    const fields = {
	      title: task.title,
	      description: task.description,
	      creatorId: tasks_v2_core.Core.getParams().currentUser.id,
	      responsibleIds: task.responsibleIds,
	      deadlineTs: task.deadlineTs,
	      needsControl: task.needsControl,
	      startPlanTs: task.startPlanTs,
	      endPlanTs: task.endPlanTs,
	      fileIds: task.fileIds,
	      containsSubTasks: task.containsSubTasks,
	      groupId: task.groupId,
	      flowId: task.flowId,
	      isImportant: task.isImportant,
	      accomplicesIds: task.accomplicesIds,
	      auditorsIds: task.auditorsIds,
	      parentId: task.parentId,
	      allowsChangeDeadline: task.allowsChangeDeadline,
	      matchesWorkTime: task.matchesWorkTime,
	      tags: task.tags,
	      crmItemIds: task.crmItemIds,
	      requireResult: task.requireResult,
	      containsRelatedTasks: task.containsRelatedTasks,
	      relatedTaskIds: task.relatedTaskIds,
	      reminders: task.reminders,
	      numberOfReminders: task.numberOfReminders,
	      allowsTimeTracking: task.allowsTimeTracking,
	      estimatedTime: task.estimatedTime,
	      userFields: task.userFields,
	      epicId: task.epicId,
	      storyPoints: task.storyPoints
	    };
	    if (main_core.Type.isArrayFilled(fields.userFields)) {
	      fields.userFields = tasks_v2_component_fields_userFields.userFieldsManager.prepareUserFieldsForTaskFromTemplate(fields.userFields, tasks_v2_core.Core.getParams().taskUserFieldScheme);
	    }
	    this.updateStoreTask(tmpId, fields);
	  }
	  async getRights(id) {
	    try {
	      var _this$getStoreTask;
	      const {
	        rights
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskAccessGet, {
	        task: {
	          id
	        }
	      });
	      this.updateStoreTask(id, {
	        rights: {
	          ...((_this$getStoreTask = this.getStoreTask(id)) == null ? void 0 : _this$getStoreTask.rights),
	          ...rights
	        }
	      });
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskAccessGet, error);
	    }
	  }
	  async add(task) {
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(task.id)) {
	      return tasks_v2_provider_service_templateService.templateService.add(task);
	    }
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskAdd, {
	        task: mapModelToDto(task)
	      });
	      await this.onAfterTaskAdded(task, data);
	      return [data.id, null];
	    } catch (error) {
	      var _error$errors, _error$errors$;
	      console.error(tasks_v2_const.Endpoint.TaskAdd, error);
	      return [0, new Error((_error$errors = error.errors) == null ? void 0 : (_error$errors$ = _error$errors[0]) == null ? void 0 : _error$errors$.message)];
	    }
	  }
	  async onAfterTaskAdded(initialTask, data) {
	    var _initialTask$checklis, _initialTask$results;
	    this.insertStoreTask({
	      ...initialTask,
	      id: data.id
	    });
	    this.extractTask(data);
	    if (((_initialTask$checklis = initialTask.checklist) == null ? void 0 : _initialTask$checklis.length) > 0) {
	      await tasks_v2_provider_service_checkListService.checkListService.save(data.id, this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](initialTask.checklist), true);
	    }
	    const remindersIds = this.$store.getters[`${tasks_v2_const.Model.Reminders}/getIds`](initialTask.id, tasks_v2_core.Core.getParams().currentUser.id);
	    if (remindersIds.length > 0) {
	      await tasks_v2_provider_service_remindersService.remindersService.set(data.id, remindersIds.map(id => this.$store.getters[`${tasks_v2_const.Model.Reminders}/getById`](id)));
	    }
	    if (initialTask.responsibleIds.length > 1) {
	      const userIds = await this.addMultiTask(data.id, initialTask.responsibleIds);
	      tasks_v2_provider_service_relationService.subTasksService.addStore(initialTask.id, userIds.map(id => `userTask${id}`));
	    }
	    if (((_initialTask$results = initialTask.results) == null ? void 0 : _initialTask$results.length) > 0) {
	      await tasks_v2_provider_service_resultService.resultService.save(data.id, this.$store.getters[`${tasks_v2_const.Model.Results}/getByIds`](initialTask.results), true);
	    }
	    if (initialTask.relatedToTaskId) {
	      void tasks_v2_provider_service_relationService.relatedTasksService.add(initialTask.relatedToTaskId, [data.id]);
	    }
	    main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskAdded, {
	      task: this.getStoreTask(data.id),
	      initialTask
	    });
	    initialTask = this.getStoreTask(initialTask.id);
	    const subTaskIds = initialTask.subTaskIds;
	    const relatedTaskIds = initialTask.relatedTaskIds;
	    const ganttTaskIds = initialTask.ganttTaskIds;
	    subTaskIds.forEach(id => {
	      if (/^tmp\..+/.test(id)) {
	        this.deleteStore(id);
	      }
	    });
	    if (initialTask.containsSubTasks) {
	      tasks_v2_provider_service_relationService.subTasksService.addStore(data.id, subTaskIds);
	      void tasks_v2_provider_service_relationService.subTasksService.list(data.id, true);
	    }
	    if (initialTask.containsRelatedTasks) {
	      tasks_v2_provider_service_relationService.relatedTasksService.addStore(data.id, relatedTaskIds);
	      void tasks_v2_provider_service_relationService.relatedTasksService.list(data.id, true);
	    }
	    if (initialTask.containsGanttLinks) {
	      tasks_v2_provider_service_relationService.ganttService.addStore(data.id, ganttTaskIds);
	      void tasks_v2_provider_service_relationService.ganttService.list(data.id, true);
	    }
	    if (initialTask.parentId) {
	      tasks_v2_provider_service_relationService.subTasksService.addStore(initialTask.parentId, [data.id]);
	    }
	    this.deleteStore(initialTask.id);
	  }
	  async copy(task, withSubTasks) {
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(task.id)) {
	      return tasks_v2_provider_service_templateService.templateService.copy(task);
	    }
	    try {
	      const checkLists = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](task.checklist);
	      const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskCopy, {
	        task: mapModelToDto({
	          ...task,
	          id: task.copiedFromId,
	          checklist: checkLists
	        }),
	        withSubTasks
	      });
	      if (task.responsibleIds.length > 1) {
	        const userIds = await this.addMultiTask(data.id, task.responsibleIds);
	        tasks_v2_provider_service_relationService.subTasksService.addStore(task.id, userIds.map(id => `userTask${id}`));
	      }
	      this.updateStoreTask(task.id, {
	        id: data.id
	      });
	      this.extractTask(data);
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskAdded, {
	        task: this.getStoreTask(data.id),
	        initialTask: task
	      });
	      if (task.checklist.length > 0) {
	        void tasks_v2_provider_service_checkListService.checkListService.load(data.id);
	      }
	      return [data.id, null];
	    } catch (error) {
	      var _error$errors2, _error$errors2$;
	      console.error(tasks_v2_const.Endpoint.TaskCopy, error);
	      return [0, new Error((_error$errors2 = error.errors) == null ? void 0 : (_error$errors2$ = _error$errors2[0]) == null ? void 0 : _error$errors2$.message)];
	    }
	  }
	  async addMultiTask(taskId, responsibleIds) {
	    try {
	      const userIds = responsibleIds.filter(id => id !== tasks_v2_core.Core.getParams().currentUser.id);
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskMultiTaskAdd, {
	        taskId,
	        userIds
	      });
	      return userIds;
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskMultiTaskAdd, error);
	      return [];
	    }
	  }
	  async update(id, fields) {
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(id)) {
	      return tasks_v2_provider_service_templateService.templateService.update(id, fields);
	    }
	    const taskBeforeUpdate = this.getStoreTask(id);
	    this.updateStoreTask(id, fields);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	      return {};
	    }
	    if (this.hasChanges(taskBeforeUpdate, fields)) {
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskBeforeUpdate, {
	        task: this.getStoreTask(id),
	        fields: {
	          id,
	          ...fields
	        }
	      });
	    }
	    const result = await babelHelpers.classPrivateFieldLooseBase(this, _updateTaskDebounced)[_updateTaskDebounced](id, fields, taskBeforeUpdate);
	    main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskAfterUpdate, {
	      task: this.getStoreTask(id)
	    });
	    return result;
	  }
	  async setFavorite(taskId, isFavorite) {
	    this.updateStoreTask(taskId, {
	      isFavorite
	    });
	    const endpoint = isFavorite ? tasks_v2_const.Endpoint.TaskFavoriteAdd : tasks_v2_const.Endpoint.TaskFavoriteDelete;
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(endpoint, {
	        taskId
	      });
	      return true;
	    } catch (error) {
	      this.updateStoreTask(taskId, {
	        isFavorite: !isFavorite
	      });
	      console.error(endpoint, error);
	      return false;
	    }
	  }
	  async setStage(taskId, stageId) {
	    this.updateStoreTask(taskId, {
	      stageId
	    });
	    try {
	      await tasks_v2_lib_apiClient.apiClient.postComponent('bitrix:tasks.task', 'moveStage', {
	        taskId,
	        stageId
	      });
	      return true;
	    } catch (error) {
	      console.error('bitrix:tasks.task.moveStage', error);
	      return false;
	    }
	  }
	  async setMark(taskId, mark) {
	    this.updateStoreTask(taskId, {
	      mark
	    });
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskMarkSet, {
	        task: {
	          id: taskId,
	          mark
	        }
	      });
	      return true;
	    } catch (error) {
	      console.error(tasks_v2_const.Endpoint.TaskMarkSet, error);
	      return false;
	    }
	  }
	  async setMute(taskId, isMuted) {
	    this.updateStoreTask(taskId, {
	      isMuted
	    });
	    const endpoint = isMuted ? tasks_v2_const.Endpoint.TaskAttentionMute : tasks_v2_const.Endpoint.TaskAttentionUnmute;
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(endpoint, {
	        taskId
	      });
	      return true;
	    } catch (error) {
	      this.updateStoreTask(taskId, {
	        isMuted: !isMuted
	      });
	      console.error(endpoint, error);
	      return false;
	    }
	  }
	  async delete(id) {
	    const taskBeforeDelete = this.getStoreTask(id);
	    this.deleteStore(id);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(id)) {
	      return;
	    }
	    try {
	      await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskDelete, {
	        task: {
	          id
	        }
	      });
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TaskDeleted, {
	        id
	      });
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.LegacyTasksTaskEvent, new main_core_events.BaseEvent({
	        data: id,
	        compatData: ['DELETE', {
	          task: {
	            ID: id
	          },
	          taskUgly: {
	            id
	          },
	          options: {}
	        }]
	      }));
	    } catch (error) {
	      void this.insertStoreTask(taskBeforeDelete);
	      console.error(tasks_v2_const.Endpoint.TaskDelete, error);
	    }
	  }
	  extractTask(data, ignoreContains = true) {
	    var _data$rights, _this$getStoreTask2;
	    if (!data) {
	      return;
	    }
	    if ((data == null ? void 0 : (_data$rights = data.rights) == null ? void 0 : _data$rights.read) === false) {
	      this.deleteStore(data.id);
	      return;
	    }
	    const extractor = new TaskGetExtractor(data);
	    const task = extractor.getTask();
	    task.rights = {
	      ...((_this$getStoreTask2 = this.getStoreTask(task.id)) == null ? void 0 : _this$getStoreTask2.rights),
	      ...task.rights
	    };
	    if (ignoreContains) {
	      ['containsSubTasks', 'containsRelatedTasks', 'containsGanttLinks', 'containsPlacements'].forEach(prop => delete task[prop]);
	    }
	    void Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/upsert`, task), this.$store.dispatch(`${tasks_v2_const.Model.Flows}/upsert`, extractor.getFlow()), this.$store.dispatch(`${tasks_v2_const.Model.Groups}/insert`, extractor.getGroup()), this.$store.dispatch(`${tasks_v2_const.Model.Stages}/upsertMany`, extractor.getStages()), this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, extractor.getUsers())]);
	    void tasks_v2_provider_service_fileService.fileService.get(data.id).list(data.fileIds);
	  }
	  deleteStore(id) {
	    tasks_v2_provider_service_relationService.subTasksService.unlinkStore(id);
	    tasks_v2_provider_service_relationService.relatedTasksService.unlinkStore(id);
	    tasks_v2_provider_service_relationService.ganttService.unlinkStore(id);
	    void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/delete`, id);
	  }
	  async requestUpdate(endpoint, fields, taskBefore) {
	    const id = taskBefore.id;
	    const task = mapModelToDto({
	      id,
	      ...fields
	    });
	    if (JSON.stringify(task) === JSON.stringify({
	      id
	    })) {
	      return {};
	    }
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post(endpoint, {
	        task
	      });
	      this.extractTask(data);
	      return {};
	    } catch (error) {
	      this.updateStoreTask(id, taskBefore);
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _silentErrorMode)[_silentErrorMode]) {
	        console.error(endpoint, error);
	      }
	      return {
	        [endpoint]: error.errors
	      };
	    }
	  }
	  hasChanges(task, fields) {
	    return Object.entries(fields).some(([field, value]) => JSON.stringify(task[field]) !== JSON.stringify(value));
	  }
	  async insertStoreTask(task) {
	    if (tasks_v2_lib_idUtils.idUtils.isTemplate(task.id)) {
	      await tasks_v2_provider_service_templateService.templateService.insertStoreTask(task);
	      return;
	    }
	    await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/insert`, task);
	  }
	  updateStoreTask(id, fields) {
	    if (this.hasStoreTask(id)) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	        id,
	        fields
	      });
	    }
	  }
	  hasStoreTask(id, withPartiallyLoaded = true) {
	    const isPartiallyLoaded = this.$store.getters[`${tasks_v2_const.Model.Tasks}/isPartiallyLoaded`](id);
	    return this.getStoreTask(id) !== null && (withPartiallyLoaded || !isPartiallyLoaded);
	  }
	  getStoreTask(id) {
	    const task = this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](id);
	    return task ? {
	      ...task
	    } : null;
	  }
	  setSilentErrorMode(silentErrorMode) {
	    babelHelpers.classPrivateFieldLooseBase(this, _silentErrorMode)[_silentErrorMode] = silentErrorMode;
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	})();
	function _updateTaskDebounced2(id, fields, taskBeforeUpdate) {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	  babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id] = {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id],
	    ...fields
	  };
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore])[id]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[id] = taskBeforeUpdate;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises])[id]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[id] = new Resolvable();
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced])[id]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[id] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _updateTask)[_updateTask], 500, this);
	  babelHelpers.classPrivateFieldLooseBase(this, _updateServerTaskDebounced)[_updateServerTaskDebounced][id](id);
	  return babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	}
	async function _updateTask2(id) {
	  const fields = babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updateFields)[_updateFields][id];
	  const taskBefore = babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updateTaskBefore)[_updateTaskBefore][id];
	  const promise = babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _updatePromises)[_updatePromises][id];
	  const task = {
	    id,
	    ...fields
	  };
	  const result = await babelHelpers.classPrivateFieldLooseBase(this, _updateTaskFields)[_updateTaskFields](task, taskBefore);
	  const results = await Promise.all(separateFields.map(meta => babelHelpers.classPrivateFieldLooseBase(this, _updateSeparateFields)[_updateSeparateFields](task, taskBefore, meta)));
	  promise.resolve({
	    ...result,
	    ...Object.assign({}, ...results)
	  });
	}
	function _updateTaskFields2(task, taskBefore) {
	  const fields = babelHelpers.classPrivateFieldLooseBase(this, _getTaskFields)[_getTaskFields](task);
	  if (!this.hasChanges(taskBefore, fields)) {
	    return {};
	  }
	  return this.requestUpdate(tasks_v2_const.Endpoint.TaskUpdate, fields, taskBefore);
	}
	function _updateSeparateFields2(task, taskBefore, meta) {
	  const fields = babelHelpers.classPrivateFieldLooseBase(this, _getFilteredFields)[_getFilteredFields](task, meta.fields);
	  if (!this.hasChanges(taskBefore, fields)) {
	    return {};
	  }
	  if (meta.service) {
	    return meta.service.update(task, taskBefore);
	  }
	  return this.requestUpdate(meta.endpoint, fields, taskBefore);
	}
	function _getTaskFields2(task) {
	  return Object.fromEntries(Object.entries(task).filter(([field]) => {
	    return Object.values(separateFields).every(({
	      fields
	    }) => !fields.has(field));
	  }));
	}
	function _getFilteredFields2(fields, filterSet) {
	  return Object.fromEntries(Object.entries(fields).filter(([field]) => filterSet.has(field)));
	}
	function Resolvable() {
	  const promise = new Promise(resolve => {
	    this.resolve = resolve;
	  });
	  promise.resolve = this.resolve;
	  return promise;
	}

	class ReplicateCreator {
	  static createEmptyReplicateParams() {
	    return {
	      period: tasks_v2_const.ReplicationPeriod.Daily,
	      time: null,
	      startDate: null,
	      repeatTill: tasks_v2_const.ReplicationRepeatTill.Endless,
	      endDate: null,
	      times: null,
	      nextExecutionTime: null,
	      deadlineOffset: null,
	      ...ReplicateCreator.createReplicateParamsDaily(),
	      ...ReplicateCreator.createReplicateParamsWeekly(),
	      ...ReplicateCreator.createReplicateParamsMonthly(),
	      ...ReplicateCreator.createReplicateParamsYearly()
	    };
	  }
	  static createReplicateParamsDaily(data = {}) {
	    return {
	      dailyMonthInterval: null,
	      ...data
	    };
	  }
	  static createDefaultReplicationParamsDaily() {
	    return ReplicateCreator.createReplicateParamsDaily({});
	  }
	  static createReplicateParamsWeekly(data = {}) {
	    return {
	      everyWeek: null,
	      weekDays: [],
	      ...data
	    };
	  }
	  static createDefaultReplicationParamsWeekly() {
	    return ReplicateCreator.createReplicateParamsWeekly({});
	  }
	  static createReplicateParamsMonthly(data = {}) {
	    return {
	      monthlyData: null,
	      monthlyDataNum: null,
	      monthlyMonthNum1: null,
	      monthlyMonthNum2: null,
	      monthlyWeekDay: null,
	      monthlyWeekDayNum: null,
	      ...data
	    };
	  }
	  static createDefaultReplicationParamsMonthly() {
	    return ReplicateCreator.createReplicateParamsMonthly({
	      monthlyType: tasks_v2_const.ReplicationMonthlyType.Absolute,
	      monthlyDayNum: 1
	    });
	  }
	  static createReplicateParamsYearly(data = {}) {
	    return {
	      yearlyData: null,
	      yearlyDayNum: null,
	      yearlyMonth1: null,
	      yearlyMonth2: null,
	      yearlyWeekDay: null,
	      yearlyWeekDayNum: null,
	      ...data
	    };
	  }
	  static createDefaultReplicationParamsYearly() {
	    return ReplicateCreator.createReplicateParamsYearly({
	      yearlyType: tasks_v2_const.ReplicationYearlyType.Absolute,
	      yearlyDayNum: 1,
	      yearlyMonth1: 1
	    });
	  }
	}

	const TaskMappers = {
	  mapModelToDto,
	  mapDtoToModel,
	  mapModelToSliderData,
	  mapSliderDataToModel
	};

	exports.TaskMappers = TaskMappers;
	exports.taskService = taskService;
	exports.ReplicateCreator = ReplicateCreator;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Component.Fields,BX,BX.Event,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields,BX.Tasks.V2,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Const));
//# sourceMappingURL=task-service.bundle.js.map
