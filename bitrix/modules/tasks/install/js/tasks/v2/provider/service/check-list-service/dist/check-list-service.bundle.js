/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_model_users,tasks_v2_provider_service_userService,ui_vue3_vuex,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient) {
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
	function prepareTitle(item) {
	  var _item$accomplices2, _item$auditors2;
	  const names = [...((_item$accomplices2 = item.accomplices) != null ? _item$accomplices2 : []).map(member => member.name), ...((_item$auditors2 = item.auditors) != null ? _item$auditors2 : []).map(member => member.name)].join(' ');
	  if (names) {
	    return `${item.title} ${names}`;
	  }
	  return item.title;
	}

	var _getPromises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPromises");
	class CheckListService {
	  constructor() {
	    Object.defineProperty(this, _getPromises, {
	      writable: true,
	      value: {}
	    });
	  }
	  async load(taskId) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    // eslint-disable-next-line no-async-promise-executor
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getPromises)[_getPromises])[taskId]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[taskId] = new Promise(async (resolve, reject) => {
	      try {
	        const data = await new tasks_v2_lib_apiClient.ApiClient().post('CheckList.get', {
	          task: {
	            id: taskId
	          }
	        });
	        const checkLists = data.map(it => mapDtoToModel(it));
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	          id: taskId,
	          fields: {
	            containsChecklist: checkLists.length > 0,
	            checklist: checkLists.map(({
	              id
	            }) => id)
	          }
	        })]);
	        resolve();
	      } catch (error) {
	        reject(error);
	      }
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _getPromises)[_getPromises][taskId];
	  }
	  async save(taskId, checklists) {
	    // eslint-disable-next-line no-async-promise-executor
	    return new Promise(async (resolve, reject) => {
	      try {
	        const savedList = await new tasks_v2_lib_apiClient.ApiClient().post('CheckList.save', {
	          task: {
	            id: taskId,
	            checklist: prepareCheckLists(checklists)
	          }
	        });
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true), this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, savedList), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	          id: taskId,
	          fields: {
	            containsChecklist: savedList.length > 0,
	            checklist: savedList.map(item => item.id)
	          }
	        })]);
	        void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
	        resolve();
	      } catch (error) {
	        reject(error);
	      }
	    });
	  }
	  async collapse(taskId, checkListId) {
	    await new tasks_v2_lib_apiClient.ApiClient().post('CheckList.collapse', {
	      taskId,
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
	    await new tasks_v2_lib_apiClient.ApiClient().post('CheckList.expand', {
	      taskId,
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
	    await new tasks_v2_lib_apiClient.ApiClient('tasks.task.', 'data').post('checklist.complete', {
	      taskId,
	      checkListItemId: checkListId
	    });
	  }
	  async renew(taskId, checkListId) {
	    await new tasks_v2_lib_apiClient.ApiClient('tasks.task.', 'data').post('checklist.renew', {
	      taskId,
	      checkListItemId: checkListId
	    });
	  }
	  async delete(taskId, checkListId) {
	    await new tasks_v2_lib_apiClient.ApiClient('tasks.task.', 'data').post('checklist.delete', {
	      taskId,
	      checkListItemId: checkListId
	    });
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	const checkListService = new CheckListService();

	const CheckListMappers = {
	  mapModelToSliderData
	};

	exports.CheckListMappers = CheckListMappers;
	exports.checkListService = checkListService;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Model,BX.Tasks.V2.Provider.Service,BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib));
//# sourceMappingURL=check-list-service.bundle.js.map
