/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,ui_vue3_vuex,tasks_v2_const,tasks_v2_lib_calendar,tasks_v2_lib_timezone) {
	'use strict';

	/* eslint-disable no-param-reassign */
	class Interface extends ui_vue3_vuex.BuilderModel {
	  static createWithVariables(params) {
	    var _params$userOptions$f, _params$userOptions$f2;
	    updateSkeleton((_params$userOptions$f = params.userOptions.fullCard) == null ? void 0 : _params$userOptions$f.cardWidth);
	    return Interface.create().setVariables({
	      currentUserId: params.currentUser.id,
	      stateFlags: params.stateFlags,
	      deadlineUserOption: params.deadlineUserOption,
	      taskUserFieldScheme: params.taskUserFieldScheme,
	      templateUserFieldScheme: params.templateUserFieldScheme,
	      fullCardWidth: (_params$userOptions$f2 = params.userOptions.fullCard) == null ? void 0 : _params$userOptions$f2.cardWidth
	    });
	  }
	  getName() {
	    return tasks_v2_const.Model.Interface;
	  }
	  getState() {
	    return {
	      currentUserId: this.getVariable('currentUserId', 0),
	      deadlineChangeCount: 0,
	      titleFieldOffsetHeight: null,
	      stateFlags: this.getVariable('stateFlags', {
	        needsControl: false,
	        matchesWorkTime: false
	      }),
	      deadlineUserOption: this.getVariable('deadlineUserOption', {
	        defaultDeadlineInSeconds: 0,
	        defaultDeadlineDate: ''
	      }),
	      fullCardWidth: this.getVariable('fullCardWidth', null),
	      deletingCheckListIds: {},
	      disableCheckListAnimations: false,
	      checkListCompletionCallbacks: {},
	      draggedCheckListId: null,
	      taskUserFieldScheme: this.getVariable('taskUserFieldScheme', []),
	      templateUserFieldScheme: this.getVariable('templateUserFieldScheme', [])
	    };
	  }
	  getGetters() {
	    return {
	      /** @function interface/currentUserId */
	      currentUserId: state => state.currentUserId,
	      /** @function interface/fullCardWidth */
	      fullCardWidth: state => state.fullCardWidth,
	      /** @function interface/deadlineChangeCount */
	      deadlineChangeCount: state => state.deadlineChangeCount,
	      /** @function interface/titleFieldOffsetHeight */
	      titleFieldOffsetHeight: state => state.titleFieldOffsetHeight,
	      /** @function interface/stateFlags */
	      stateFlags: state => state.stateFlags,
	      /** @function interface/deadlineUserOption */
	      deadlineUserOption: state => state.deadlineUserOption,
	      /** @function interface/defaultDeadlineTs */
	      defaultDeadlineTs: state => {
	        if (state.deadlineUserOption && state.deadlineUserOption.isExactDeadlineTime) {
	          const worktimeTs = tasks_v2_lib_calendar.calendar.clampWorkDateTime(Date.now());
	          const durationTs = state.deadlineUserOption.defaultDeadlineInSeconds * 1000;
	          const deadlineTs = tasks_v2_lib_calendar.calendar.calculateEndTs(worktimeTs, null, durationTs);
	          const fiveMinutes = 5 * 60 * 1000;
	          return Math.ceil(deadlineTs / fiveMinutes) * fiveMinutes;
	        }
	        if (state.deadlineUserOption && state.deadlineUserOption.defaultDeadlineDate) {
	          const deadlineTs = new Date(state.deadlineUserOption.defaultDeadlineDate).getTime();
	          return deadlineTs - tasks_v2_lib_timezone.timezone.getOffset(deadlineTs);
	        }
	        return null;
	      },
	      /** @function interface/deletingCheckListIds */
	      deletingCheckListIds: state => state.deletingCheckListIds,
	      /** @function interface/disableCheckListAnimations */
	      disableCheckListAnimations: state => state.disableCheckListAnimations,
	      /** @function interface/draggedCheckListId */
	      draggedCheckListId: state => state.draggedCheckListId,
	      /** @function interface/taskUserFieldScheme */
	      taskUserFieldScheme: state => state.taskUserFieldScheme,
	      /** @function interface/templateUserFieldScheme */
	      templateUserFieldScheme: state => state.templateUserFieldScheme
	    };
	  }
	  getActions() {
	    return {
	      /** @function interface/updateFullCardWidth */
	      updateFullCardWidth: (store, fullCardWidth) => {
	        store.commit('setFullCardWidth', fullCardWidth);
	        updateSkeleton(fullCardWidth);
	      },
	      /** @function interface/updateDeadlineChangeCount */
	      updateDeadlineChangeCount: (store, deadlineChangeCount) => {
	        store.commit('setDeadlineChangeCount', deadlineChangeCount);
	      },
	      /** @function interface/updateTitleFieldOffsetHeight */
	      updateTitleFieldOffsetHeight: (store, titleFieldOffsetHeight) => {
	        store.commit('setTitleFieldOffsetHeight', titleFieldOffsetHeight);
	      },
	      /** @function interface/updateStateFlags */
	      updateStateFlags: (store, stateFlags) => {
	        store.commit('setStateFlags', stateFlags);
	      },
	      /** @function interface/updateDeadlineUserOption */
	      updateDeadlineUserOption: (store, deadlineUserOption) => {
	        store.commit('setDeadlineUserOption', deadlineUserOption);
	      },
	      /** @function interface/addCheckListItemToDeleting */
	      addCheckListItemToDeleting: (store, itemId) => {
	        store.commit('addCheckListItemToDeleting', itemId);
	      },
	      /** @function interface/removeCheckListItemFromDeleting */
	      removeCheckListItemFromDeleting: (store, itemId) => {
	        store.commit('removeCheckListItemFromDeleting', itemId);
	      },
	      /** @function interface/addCheckListCompletionCallback */
	      addCheckListCompletionCallback: (store, {
	        id,
	        callback
	      }) => {
	        store.commit('addCheckListCompletionCallback', {
	          id,
	          callback
	        });
	      },
	      /** @function interface/executeCheckListCompletionCallbacks */
	      executeCheckListCompletionCallbacks: store => {
	        store.commit('executeCheckListCompletionCallbacks');
	      },
	      /** @function interface/setDisableCheckListAnimations */
	      setDisableCheckListAnimations: (store, disableCheckListAnimations) => {
	        store.commit('setDisableCheckListAnimations', disableCheckListAnimations);
	      },
	      /** @function interface/setDraggedCheckListId */
	      setDraggedCheckListId: (store, id) => {
	        store.commit('setDraggedCheckListId', id);
	      },
	      /** @function interface/updateTaskUserFieldScheme */
	      updateTaskUserFieldScheme: (store, taskUserFieldScheme) => {
	        store.commit('setTaskUserFieldScheme', taskUserFieldScheme);
	      },
	      /** @function interface/updateTemplateUserFieldScheme */
	      updateTemplateUserFieldScheme: (store, templateUserFieldScheme) => {
	        store.commit('setTemplateUserFieldScheme', templateUserFieldScheme);
	      }
	    };
	  }
	  getMutations() {
	    return {
	      setFullCardWidth: (state, fullCardWidth) => {
	        state.fullCardWidth = fullCardWidth;
	      },
	      setDeadlineChangeCount: (state, deadlineChangeCount) => {
	        state.deadlineChangeCount = deadlineChangeCount;
	      },
	      setTitleFieldOffsetHeight: (state, titleFieldOffsetHeight) => {
	        state.titleFieldOffsetHeight = titleFieldOffsetHeight;
	      },
	      setStateFlags: (state, stateFlags) => {
	        state.stateFlags = {
	          ...state.stateFlags,
	          ...stateFlags
	        };
	      },
	      setDeadlineUserOption: (state, deadlineUserOption) => {
	        state.deadlineUserOption = {
	          ...state.deadlineUserOption,
	          ...deadlineUserOption
	        };
	      },
	      addCheckListItemToDeleting: (state, itemId) => {
	        state.deletingCheckListIds[itemId] = itemId;
	      },
	      removeCheckListItemFromDeleting: (state, itemId) => {
	        delete state.deletingCheckListIds[itemId];
	      },
	      addCheckListCompletionCallback: (state, {
	        id,
	        callback
	      }) => {
	        state.checkListCompletionCallbacks[id] = callback;
	      },
	      executeCheckListCompletionCallbacks: state => {
	        Object.values(state.checkListCompletionCallbacks).forEach(cb => cb());
	        state.checkListCompletionCallbacks = {};
	      },
	      setDisableCheckListAnimations: (state, disableCheckListAnimations) => {
	        state.disableCheckListAnimations = disableCheckListAnimations === true;
	      },
	      setDraggedCheckListId: (state, id) => {
	        state.draggedCheckListId = id;
	      },
	      setTaskUserFieldScheme: (state, taskUserFieldScheme) => {
	        state.taskUserFieldScheme = taskUserFieldScheme;
	      },
	      setTemplateUserFieldScheme: (state, templateUserFieldScheme) => {
	        state.templateUserFieldScheme = templateUserFieldScheme;
	      }
	    };
	  }
	}
	const updateSkeleton = width => {
	  const style = width ? `style="width: ${width}px;"` : '';
	  main_core.localStorage.set('tasks-skeleton-width', style, 315360000);
	};

	exports.Interface = Interface;

}((this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}),BX,BX.Vue3.Vuex,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=interface.bundle.js.map
