/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,tasks_v2_model_users,ui_vue3_vuex,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient) {
	'use strict';

	function prepareCheckLists(checklist) {
	  const parentNodeIdMap = new Map();
	  checklist.forEach(item => {
	    parentNodeIdMap.set(item.id, item.nodeId);
	  });
	  return checklist.map(item => {
	    const title = prepareTitle(item);
	    const parentNodeId = item.parentId ? parentNodeIdMap.get(item.parentId) : 0;
	    return {
	      ...item,
	      title,
	      parentNodeId
	    };
	  });
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
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, data), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	          id: taskId,
	          fields: {
	            containsChecklist: data.length > 0,
	            checklist: data.map(item => item.id)
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
	        const oldIds = checklists.map(item => item.id);
	        await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/deleteMany`, oldIds), this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, savedList), this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/update`, {
	          id: taskId,
	          fields: {
	            containsChecklist: true,
	            checklist: savedList.map(item => item.id)
	          }
	        })]);
	        resolve();
	      } catch (error) {
	        reject(error);
	      }
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

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Tasks.V2.Model,BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib));
//# sourceMappingURL=check-list-service.bundle.js.map
