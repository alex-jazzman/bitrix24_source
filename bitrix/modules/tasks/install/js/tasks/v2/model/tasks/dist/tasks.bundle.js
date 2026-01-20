/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_vuex,tasks_v2_const) {
	'use strict';

	/* eslint-disable no-param-reassign */
	const aliasFields = {
	  [tasks_v2_const.TaskField.DatePlan]: new Set(['startPlanTs', 'endPlanTs', 'matchesSubTasksTime', 'startDatePlanAfter', 'endDatePlanAfter']),
	  [tasks_v2_const.TaskField.SubTasks]: new Set(['containsSubTasks']),
	  [tasks_v2_const.TaskField.RelatedTasks]: new Set(['containsRelatedTasks']),
	  [tasks_v2_const.TaskField.Gantt]: new Set(['containsGanttLinks']),
	  [tasks_v2_const.TaskField.Placements]: new Set(['containsPlacements']),
	  [tasks_v2_const.TaskField.Results]: new Set(['containsResults']),
	  [tasks_v2_const.TaskField.Reminders]: new Set(['numberOfReminders']),
	  [tasks_v2_const.TaskField.Replication]: new Set(['replicate'])
	};
	var _setFieldsFilled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setFieldsFilled");
	var _getAliasField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAliasField");
	class Tasks extends ui_vue3_vuex.BuilderEntityModel {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getAliasField, {
	      value: _getAliasField2
	    });
	    Object.defineProperty(this, _setFieldsFilled, {
	      value: _setFieldsFilled2
	    });
	  }
	  static createWithVariables(params) {
	    return Tasks.create().setVariables({
	      stateFlags: params.stateFlags,
	      deadlineUserOption: params.deadlineUserOption
	    });
	  }
	  getName() {
	    return tasks_v2_const.Model.Tasks;
	  }
	  getState() {
	    return {
	      titles: {},
	      partiallyLoadedIds: new Set()
	    };
	  }
	  getElementState() {
	    const stateFlags = this.getVariable('stateFlags', {
	      needsControl: false,
	      matchesWorkTime: false
	    });
	    const deadlineUserOption = this.getVariable('deadlineUserOption', {
	      canChangeDeadline: false,
	      maxDeadlineChangeDate: null,
	      maxDeadlineChanges: null,
	      requireDeadlineChangeReason: false
	    });
	    return {
	      id: 0,
	      title: '',
	      isImportant: false,
	      description: '',
	      descriptionChecksum: '',
	      forceUpdateDescription: false,
	      creatorId: 0,
	      createdTs: Date.now(),
	      responsibleIds: [],
	      isForNewUser: false,
	      deadlineTs: 0,
	      deadlineAfter: null,
	      startPlanTs: null,
	      endPlanTs: null,
	      fileIds: [],
	      checklist: [],
	      containsChecklist: false,
	      storyPoints: '',
	      epicId: 0,
	      accomplicesIds: [],
	      auditorsIds: [],
	      tags: [],
	      status: 'pending',
	      statusChangedTs: Date.now(),
	      needsControl: stateFlags.needsControl,
	      matchesWorkTime: stateFlags.matchesWorkTime,
	      filledFields: {},
	      parentId: 0,
	      subTaskIds: [],
	      containsSubTasks: false,
	      relatedTaskIds: [],
	      containsRelatedTasks: false,
	      ganttTaskIds: [],
	      containsGanttLinks: false,
	      placementIds: null,
	      containsPlacements: false,
	      results: [],
	      resultsMessageMap: {},
	      containsResults: false,
	      allowsChangeDeadline: deadlineUserOption.canChangeDeadline,
	      requireDeadlineChangeReason: deadlineUserOption.requireDeadlineChangeReason,
	      maxDeadlineChangeDate: deadlineUserOption.maxDeadlineChangeDate,
	      maxDeadlineChanges: deadlineUserOption.maxDeadlineChanges,
	      deadlineChangeReason: '',
	      allowsChangeDatePlan: false,
	      numberOfReminders: 0,
	      rights: {
	        edit: true,
	        deadline: true,
	        datePlan: true,
	        delegate: true,
	        addAuditors: true,
	        changeAccomplices: true,
	        checklistAdd: true,
	        createGanttDependence: true,
	        resultRead: true,
	        reminder: true,
	        elapsedTime: true
	      },
	      isFavorite: false,
	      isMuted: false,
	      requireResult: false,
	      userFields: [],
	      permissions: null
	    };
	  }
	  getGetters() {
	    return {
	      /** @function tasks/getTitle */
	      getTitle: state => id => state.titles[id],
	      /** @function tasks/isPartiallyLoaded */
	      isPartiallyLoaded: state => id => {
	        return state.partiallyLoadedIds.has(id);
	      }
	    };
	  }
	  getActions() {
	    return {
	      /** @function tasks/setTitles */
	      setTitles: (store, titles) => {
	        titles.forEach(({
	          id,
	          title
	        }) => store.commit('setTitle', {
	          id,
	          title
	        }));
	      },
	      /** @function tasks/setFieldFilled */
	      setFieldFilled: (store, fieldFilledPayload) => {
	        store.commit('setFieldFilled', fieldFilledPayload);
	      },
	      /** @function tasks/clearFieldsFilled */
	      clearFieldsFilled: (store, id) => {
	        store.commit('clearFieldsFilled', id);
	      },
	      /** @function tasks/addPartiallyLoaded */
	      addPartiallyLoaded: (store, id) => {
	        store.commit('addPartiallyLoaded', id);
	      },
	      /** @function tasks/removePartiallyLoaded */
	      removePartiallyLoaded: (store, id) => {
	        store.commit('removePartiallyLoaded', id);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      upsert: (state, task) => {
	        ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).upsert(state, task);
	        babelHelpers.classPrivateFieldLooseBase(this, _setFieldsFilled)[_setFieldsFilled](state, task.id);
	      },
	      update: (state, {
	        id,
	        fields
	      }) => {
	        var _fields$id;
	        ui_vue3_vuex.BuilderEntityModel.defaultModel.getMutations(this).update(state, {
	          id,
	          fields
	        });
	        babelHelpers.classPrivateFieldLooseBase(this, _setFieldsFilled)[_setFieldsFilled](state, (_fields$id = fields.id) != null ? _fields$id : id);
	      },
	      setTitle: (state, {
	        id,
	        title
	      }) => {
	        state.titles[id] = title;
	      },
	      setFieldFilled: (state, {
	        id,
	        fieldName,
	        isFilled
	      }) => {
	        var _state$collection$id, _state$collection$id$;
	        ((_state$collection$id$ = (_state$collection$id = state.collection[id]).filledFields) != null ? _state$collection$id$ : _state$collection$id.filledFields = {})[fieldName] = isFilled != null ? isFilled : true;
	      },
	      clearFieldsFilled: (state, id) => {
	        if (!state.collection[id]) {
	          return;
	        }
	        state.collection[id].filledFields = {};
	        babelHelpers.classPrivateFieldLooseBase(this, _setFieldsFilled)[_setFieldsFilled](state, id);
	      },
	      addPartiallyLoaded: (state, id) => {
	        state.partiallyLoadedIds.add(id);
	      },
	      removePartiallyLoaded: (state, id) => {
	        state.partiallyLoadedIds.delete(id);
	      }
	    };
	  }
	}
	function _setFieldsFilled2(state, id) {
	  var _task$rights, _task$filledFields;
	  const task = state.collection[id];
	  const canEdit = task == null ? void 0 : (_task$rights = task.rights) == null ? void 0 : _task$rights.edit;
	  (_task$filledFields = task.filledFields) != null ? _task$filledFields : task.filledFields = {};
	  Object.entries(task).forEach(([fieldName, value]) => {
	    const isFilled = Boolean(value) && (!Array.isArray(value) || value.length > 0);
	    if (isFilled) {
	      var _babelHelpers$classPr;
	      task.filledFields[(_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getAliasField)[_getAliasField](fieldName)) != null ? _babelHelpers$classPr : fieldName] = true;
	    }
	    if (!isFilled && !canEdit) {
	      task.filledFields[fieldName] = false;
	    }
	  });
	}
	function _getAliasField2(fieldName) {
	  var _Object$entries$find;
	  return (_Object$entries$find = Object.entries(aliasFields).find(([, alias]) => alias.has(fieldName))) == null ? void 0 : _Object$entries$find[0];
	}

	exports.Tasks = Tasks;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX.Vue3.Vuex,BX.Tasks.V2.Const));
//# sourceMappingURL=tasks.bundle.js.map
