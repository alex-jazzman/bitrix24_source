/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_model_users,tasks_v2_provider_service_userService,main_core,tasks_v2_core,tasks_v2_const,tasks_v2_lib_apiClient,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService) {
	'use strict';

	function prepareCheckLists(checklist) {
	  const parentNodeIdMap = new Map();
	  checklist.forEach(item => {
	    parentNodeIdMap.set(item.id, item.nodeId);
	  });
	  return checklist.map(item => {
	    const parentNodeId = item.parentId ? parentNodeIdMap.get(item.parentId) : 0;
	    return {
	      ...item,
	      parentNodeId
	    };
	  });
	}

	// todo remove after features.isV2Enabled === true
	function prepareTitleCheckLists(checklist) {
	  return checklist.map(item => {
	    const title = prepareTitle(item);
	    return {
	      ...item,
	      title
	    };
	  });
	}
	function mapDtoToModel(checkList) {
	  var _checkList$accomplice, _checkList$auditors;
	  return {
	    id: checkList.id,
	    nodeId: checkList.nodeId,
	    title: checkList.title,
	    creator: checkList.creator ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.creator) : null,
	    toggledBy: checkList.toggledBy ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.toggledBy) : null,
	    toggledDate: checkList.toggledDate,
	    accomplices: (_checkList$accomplice = checkList.accomplices) == null ? void 0 : _checkList$accomplice.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
	    auditors: (_checkList$auditors = checkList.auditors) == null ? void 0 : _checkList$auditors.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
	    attachments: checkList.attachments,
	    isComplete: checkList.isComplete,
	    isImportant: checkList.isImportant,
	    parentId: checkList.parentId,
	    parentNodeId: checkList.parentNodeId,
	    sortIndex: checkList.sortIndex,
	    actions: checkList.actions,
	    panelIsShown: checkList.panelIsShown,
	    myFilterActive: checkList.myFilterActive,
	    collapsed: checkList.collapsed,
	    expanded: checkList.expanded,
	    localCompleteState: checkList.localCompleteState,
	    localCollapsedState: checkList.localCollapsedState,
	    areCompletedCollapsed: checkList.areCompletedCollapsed,
	    hidden: checkList.hidden,
	    groupMode: checkList.groupMode
	  };
	}
	function mapModelToSliderData(checkLists) {
	  return Object.fromEntries(checkLists.map(item => {
	    var _item$accomplices, _item$auditors, _item$attachments, _item$creator, _item$toggledBy;
	    const accomplices = (_item$accomplices = item.accomplices) == null ? void 0 : _item$accomplices.map(accomplice => ({
	      ID: accomplice.id,
	      TYPE: 'A',
	      NAME: accomplice.name,
	      IMAGE: accomplice.image,
	      IS_COLLABER: accomplice.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
	    }));
	    const auditors = (_item$auditors = item.auditors) == null ? void 0 : _item$auditors.map(auditor => ({
	      ID: auditor.id,
	      TYPE: 'U',
	      NAME: auditor.name,
	      IMAGE: auditor.image,
	      IS_COLLABER: auditor.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
	    }));
	    const attachments = Object.fromEntries((_item$attachments = item.attachments) == null ? void 0 : _item$attachments.map(key => [key, key]));
	    const members = [...accomplices, ...auditors].reduce((acc, curr) => {
	      acc[curr.ID] = curr;
	      return acc;
	    }, {});
	    const title = prepareTitle(item);
	    const node = Object.fromEntries(Object.entries({
	      NODE_ID: item.nodeId,
	      TITLE: title,
	      CREATED_BY: (_item$creator = item.creator) == null ? void 0 : _item$creator.id,
	      TOGGLED_BY: (_item$toggledBy = item.toggledBy) == null ? void 0 : _item$toggledBy.id,
	      TOGGLED_DATE: item.toggledDate,
	      MEMBERS: members,
	      NEW_FILE_IDS: attachments,
	      ATTACHMENTS: attachments,
	      IS_COMPLETE: item.isComplete,
	      IS_IMPORTANT: item.isImportant,
	      PARENT_ID: item.parentId,
	      SORT_INDEX: item.sortIndex,
	      ACTIONS: {
	        MODIFY: item.actions.modify,
	        REMOVE: item.actions.remove,
	        TOGGLE: item.actions.toggle
	      }
	    }).filter(([, value]) => value !== null && value !== undefined));
	    return [item.nodeId, node];
	  }));
	}
	function getUserIdsFromChecklists(checkLists, userType) {
	  return checkLists.flatMap(item => (item[userType] || []).map(user => user.id)).filter((id, idx, arr) => arr.indexOf(id) === idx);
	}
	function prepareTitle(item) {
	  var _item$accomplices2, _item$auditors2;
	  const names = [...((_item$accomplices2 = item.accomplices) != null ? _item$accomplices2 : []).map(member => member.name), ...((_item$auditors2 = item.auditors) != null ? _item$auditors2 : []).map(member => member.name)].join(' ');
	  if (names) {
	    return `${item.title} ${names}`;
	  }
	  return item.title;
	}

	var _getPromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPromises");
	var _completeCheckListIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("completeCheckListIds");
	var _renewCheckListIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renewCheckListIds");
	var _completePromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("completePromises");
	var _renewPromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renewPromises");
	var _completeDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("completeDebounced");
	var _renewDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renewDebounced");
	var _completeCheckLists = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("completeCheckLists");
	var _renewCheckLists = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renewCheckLists");
	var _getRootId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRootId");
	var _getById = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getById");
	var _updateTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTask");
	var _clone = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clone");
	class CheckListService {
	  constructor() {
	    Object.defineProperty(this, _clone, {
	      value: _clone2
	    });
	    Object.defineProperty(this, _updateTask, {
	      value: _updateTask2
	    });
	    Object.defineProperty(this, _getById, {
	      value: _getById2
	    });
	    Object.defineProperty(this, _getRootId, {
	      value: _getRootId2
	    });
	    Object.defineProperty(this, _renewCheckLists, {
	      value: _renewCheckLists2
	    });
	    Object.defineProperty(this, _completeCheckLists, {
	      value: _completeCheckLists2
	    });
	    Object.defineProperty(this, _getPromises, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _completeCheckListIds, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _renewCheckListIds, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _completePromises, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _renewPromises, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _completeDebounced, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _renewDebounced, {
	      writable: true,
	      value: {}
	    });
	    this.handleBeforeUnload = () => {
	      void this.forceSaveAllPending();
	    };
	    main_core.Event.bind(window, 'beforeunload', this.handleBeforeUnload);
	  }
	  async load(taskId, cloneTo) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId) && task.templateId) {
	      await this.load(tasks_v2_lib_idUtils.idUtils.boxTemplate(task.templateId), taskId);
	      return;
	    }
	    const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	    const toId = cloneTo != null ? cloneTo : taskId;
	    const urlCheckListGet = isTemplate ? 'Template.CheckList.get' : tasks_v2_const.Endpoint.CheckListGet;
	    const idKey = isTemplate ? 'templateId' : 'taskId';
	    // eslint-disable-next-line no-async-promise-executor
	    babelHelpers.classPrivateFieldLooseBase(this, _getPromises)[_getPromises][toId] = new Promise(async (resolve, reject) => {
	      try {
	        const data = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListGet, {
	          [idKey]: tasks_v2_lib_idUtils.idUtils.unbox(taskId)
	        });
	        let checkLists = data.map(it => mapDtoToModel(it));
	        if (cloneTo) {
	          checkLists = babelHelpers.classPrivateFieldLooseBase(this, _clone)[_clone](checkLists);
	        }
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists), tasks_v2_provider_service_taskService.taskService.updateStoreTask(toId, {
	          containsChecklist: checkLists.length > 0,
	          checklist: checkLists.map(({
	            id
	          }) => id)
	        })]);
	        resolve();
	      } catch (error) {
	        reject(error);
	      }
	    });
	    await babelHelpers.classPrivateFieldLooseBase(this, _getPromises)[_getPromises][toId];
	  }
	  async save(taskId, checklists, skipNotification = false) {
	    // eslint-disable-next-line no-async-promise-executor
	    return new Promise(async (resolve, reject) => {
	      try {
	        const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	        const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
	        const urlCheckListSave = isTemplate ? 'Template.CheckList.save' : tasks_v2_const.Endpoint.CheckListSave;
	        const entity = isTemplate ? 'template' : 'task';
	        const features = tasks_v2_core.Core.getParams().features;

	        // todo remove after features.isV2Enabled === true
	        const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	        const canOpenFullCard = features.isV2Enabled || main_core.Type.isArray(features.allowedGroups) && features.allowedGroups.includes(task.groupId);
	        if (!canOpenFullCard) {
	          // todo remove after features.isV2Enabled === true
	          // eslint-disable-next-line no-param-reassign
	          checklists = prepareTitleCheckLists(checklists);
	        }
	        const savedList = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListSave, {
	          [entity]: {
	            id: idPure,
	            checklist: prepareCheckLists(checklists)
	          },
	          skipNotification
	        });
	        const checkLists = savedList.map(it => mapDtoToModel(it));
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true), this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists)]);
	        await babelHelpers.classPrivateFieldLooseBase(this, _updateTask)[_updateTask](taskId, checkLists);
	        void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
	        resolve();
	      } catch (error) {
	        reject(error);
	      }
	    });
	  }
	  async collapse(taskId, checkListId) {
	    const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	    const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
	    const urlCheckListCollapse = isTemplate ? 'Template.CheckList.collapse' : tasks_v2_const.Endpoint.CheckListCollapse;
	    const entity = isTemplate ? 'template' : 'task';
	    await tasks_v2_lib_apiClient.apiClient.post(urlCheckListCollapse, {
	      [`${entity}Id`]: idPure,
	      checkListId
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: checkListId,
	      fields: {
	        collapsed: true,
	        expanded: false
	      }
	    });
	  }
	  async expand(taskId, checkListId) {
	    const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	    const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
	    const urlCheckListExpand = isTemplate ? 'Template.CheckList.expand' : tasks_v2_const.Endpoint.CheckListExpand;
	    const entity = isTemplate ? 'template' : 'task';
	    await tasks_v2_lib_apiClient.apiClient.post(urlCheckListExpand, {
	      [`${entity}Id`]: idPure,
	      checkListId
	    });
	    void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: checkListId,
	      fields: {
	        collapsed: false,
	        expanded: true
	      }
	    });
	  }
	  async complete(taskId, checkListId) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	    await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: checkListId,
	      fields: {
	        isComplete: true
	      }
	    });
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds])[taskId]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[taskId] = new Set();
	    babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds][taskId].add(checkListId);
	    (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _completePromises)[_completePromises])[taskId]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[taskId] = new Resolvable();
	    (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _completeDebounced)[_completeDebounced])[taskId]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[taskId] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _completeCheckLists)[_completeCheckLists], 1500, this);
	    babelHelpers.classPrivateFieldLooseBase(this, _completeDebounced)[_completeDebounced][taskId](taskId);
	    await babelHelpers.classPrivateFieldLooseBase(this, _completePromises)[_completePromises][taskId];
	  }
	  async renew(taskId, checkListId) {
	    var _babelHelpers$classPr7, _babelHelpers$classPr8, _babelHelpers$classPr9, _babelHelpers$classPr10, _babelHelpers$classPr11, _babelHelpers$classPr12;
	    await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: checkListId,
	      fields: {
	        isComplete: false
	      }
	    });
	    (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds])[taskId]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[taskId] = new Set();
	    babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds][taskId].add(checkListId);
	    (_babelHelpers$classPr10 = (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _renewPromises)[_renewPromises])[taskId]) != null ? _babelHelpers$classPr10 : _babelHelpers$classPr9[taskId] = new Resolvable();
	    (_babelHelpers$classPr12 = (_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _renewDebounced)[_renewDebounced])[taskId]) != null ? _babelHelpers$classPr12 : _babelHelpers$classPr11[taskId] = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _renewCheckLists)[_renewCheckLists], 1500, this);
	    babelHelpers.classPrivateFieldLooseBase(this, _renewDebounced)[_renewDebounced][taskId](taskId);
	    await babelHelpers.classPrivateFieldLooseBase(this, _renewPromises)[_renewPromises][taskId];
	  }
	  async delete(taskId, checkListId) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	    const checklists = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](task.checklist);
	    await this.save(taskId, checklists);
	  }
	  isCheckListExists(checkListId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getById)[_getById](checkListId) !== null;
	  }
	  filterItemsBelongingToCheckList(checkListId, checkListItemIds) {
	    const result = [];
	    checkListItemIds.forEach(checkListItemId => {
	      const rootId = babelHelpers.classPrivateFieldLooseBase(this, _getRootId)[_getRootId](checkListItemId);
	      if (rootId === checkListId) {
	        result.push(checkListItemId);
	      }
	    });
	    return result;
	  }
	  async forceCompletePending(taskId) {
	    var _babelHelpers$classPr13;
	    if (((_babelHelpers$classPr13 = babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds][taskId]) == null ? void 0 : _babelHelpers$classPr13.size) > 0) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _completeCheckLists)[_completeCheckLists](taskId);
	    }
	  }
	  async forceRenewPending(taskId) {
	    var _babelHelpers$classPr14;
	    if (((_babelHelpers$classPr14 = babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds][taskId]) == null ? void 0 : _babelHelpers$classPr14.size) > 0) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _renewCheckLists)[_renewCheckLists](taskId);
	    }
	  }
	  async forceSavePending(taskId) {
	    await Promise.all([this.forceCompletePending(taskId), this.forceRenewPending(taskId)]);
	  }
	  async forceSaveAllPending() {
	    const allTaskIds = new Set([...Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds]), ...Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds])]);
	    await Promise.all([...allTaskIds].map(taskId => this.forceSavePending(parseInt(taskId, 10))));
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	async function _completeCheckLists2(taskId) {
	  const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	  const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
	  const urlCheckListComplete = isTemplate ? 'Template.CheckList.complete' : tasks_v2_const.Endpoint.CheckListComplete;
	  const entity = isTemplate ? 'template' : 'task';
	  const checkListIds = babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds][taskId];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _completeCheckListIds)[_completeCheckListIds][taskId];
	  const promise = babelHelpers.classPrivateFieldLooseBase(this, _completePromises)[_completePromises][taskId];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _completePromises)[_completePromises][taskId];
	  if (!checkListIds || checkListIds.size === 0) {
	    promise == null ? void 0 : promise.resolve();
	    return;
	  }
	  try {
	    const checkLists = await Promise.all([...checkListIds].map(checkListId => {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId);
	    }));
	    await tasks_v2_lib_apiClient.apiClient.post(urlCheckListComplete, {
	      [entity]: {
	        id: idPure,
	        checklist: prepareCheckLists(checkLists)
	      }
	    });
	    promise == null ? void 0 : promise.resolve();
	  } catch {
	    promise == null ? void 0 : promise.resolve();
	  }
	}
	async function _renewCheckLists2(taskId) {
	  const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
	  const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
	  const urlCheckListRenew = isTemplate ? 'Template.CheckList.renew' : tasks_v2_const.Endpoint.CheckListRenew;
	  const entity = isTemplate ? 'template' : 'task';
	  const checkListIds = babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds][taskId];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _renewCheckListIds)[_renewCheckListIds][taskId];
	  const promise = babelHelpers.classPrivateFieldLooseBase(this, _renewPromises)[_renewPromises][taskId];
	  delete babelHelpers.classPrivateFieldLooseBase(this, _renewPromises)[_renewPromises][taskId];
	  if (!checkListIds || checkListIds.size === 0) {
	    promise == null ? void 0 : promise.resolve();
	    return;
	  }
	  try {
	    const checkLists = await Promise.all([...checkListIds].map(async checkListId => {
	      return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId);
	    }));
	    await tasks_v2_lib_apiClient.apiClient.post(urlCheckListRenew, {
	      [entity]: {
	        id: idPure,
	        checklist: prepareCheckLists(checkLists)
	      }
	    });
	    promise == null ? void 0 : promise.resolve();
	  } catch {
	    promise == null ? void 0 : promise.resolve();
	  }
	}
	function _getRootId2(checkListItemId) {
	  const item = babelHelpers.classPrivateFieldLooseBase(this, _getById)[_getById](checkListItemId);
	  if (!item) {
	    return 0;
	  }
	  if (item.parentId === 0) {
	    return item.id;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _getRootId)[_getRootId](item.parentId);
	}
	function _getById2(checkListId) {
	  var _this$$store$getters;
	  return (_this$$store$getters = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId)) != null ? _this$$store$getters : null;
	}
	async function _updateTask2(taskId, checkLists) {
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  const accomplicesIdsSet = new Set(task == null ? void 0 : task.accomplicesIds);
	  const auditorsIdsSet = new Set(task == null ? void 0 : task.auditorsIds);
	  const users = [];
	  checkLists.forEach(item => {
	    var _item$accomplices, _item$auditors;
	    (_item$accomplices = item.accomplices) == null ? void 0 : _item$accomplices.forEach(accomplice => {
	      users.push(accomplice);
	      accomplicesIdsSet.add(accomplice.id);
	    });
	    (_item$auditors = item.auditors) == null ? void 0 : _item$auditors.forEach(auditor => {
	      users.push(auditor);
	      auditorsIdsSet.add(auditor.id);
	    });
	  });
	  const accomplicesIds = [...accomplicesIdsSet];
	  const auditorsIds = [...auditorsIdsSet];
	  await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
	  await tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
	    containsChecklist: checkLists.length > 0,
	    checklist: checkLists.map(item => item.id),
	    accomplicesIds,
	    auditorsIds
	  });
	}
	function _clone2(checkLists) {
	  const {
	    idsMap,
	    nodeIdsMap
	  } = checkLists.reduce((maps, {
	    id,
	    nodeId
	  }) => {
	    maps.idsMap.set(id, main_core.Text.getRandom());
	    if (nodeId) {
	      maps.nodeIdsMap.set(nodeId, main_core.Text.getRandom());
	    }
	    return maps;
	  }, {
	    idsMap: new Map(),
	    nodeIdsMap: new Map()
	  });
	  return checkLists.map(checkList => {
	    var _nodeIdsMap$get, _idsMap$get, _nodeIdsMap$get2;
	    return {
	      ...checkList,
	      id: idsMap.get(checkList.id),
	      copiedId: checkList.id,
	      nodeId: (_nodeIdsMap$get = nodeIdsMap.get(checkList.nodeId)) != null ? _nodeIdsMap$get : main_core.Text.getRandom(),
	      parentId: (_idsMap$get = idsMap.get(checkList.parentId)) != null ? _idsMap$get : 0,
	      parentNodeId: (_nodeIdsMap$get2 = nodeIdsMap.get(checkList.parentNodeId)) != null ? _nodeIdsMap$get2 : null,
	      actions: {
	        modify: true,
	        remove: true,
	        toggle: true
	      }
	    };
	  });
	}
	const checkListService = new CheckListService();
	function Resolvable() {
	  const promise = new Promise(resolve => {
	    this.resolve = resolve;
	  });
	  promise.resolve = this.resolve;
	  return promise;
	}

	const CheckListMappers = {
	  mapModelToSliderData,
	  getUserIdsFromChecklists
	};

	exports.CheckListMappers = CheckListMappers;
	exports.checkListService = checkListService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Model,BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=check-list-service.bundle.js.map
