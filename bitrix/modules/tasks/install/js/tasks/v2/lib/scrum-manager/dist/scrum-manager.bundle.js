/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,tasks_v2_const) {
	'use strict';

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _taskStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskStatus");
	var _isParentScrumTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isParentScrumTask");
	class ScrumManager {
	  constructor(params) {
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _taskStatus, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isParentScrumTask, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  isScrum(groupType) {
	    return groupType === tasks_v2_const.GroupType.Scrum;
	  }
	  async handleDodDisplay() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4;
	    const {
	      TaskStatus
	    } = await main_core.Runtime.loadExtension('tasks.scrum.task-status');
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _taskStatus))[_taskStatus]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_taskStatus] = new TaskStatus({
	      groupId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId,
	      parentTaskId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].parentId,
	      taskId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId,
	      action: 'complete',
	      performActionOnParentTask: true
	    });
	    (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _isParentScrumTask))[_isParentScrumTask]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_isParentScrumTask] = await babelHelpers.classPrivateFieldLooseBase(this, _taskStatus)[_taskStatus].isParentScrumTask(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].parentId);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isParentScrumTask)[_isParentScrumTask]) {
	      try {
	        await babelHelpers.classPrivateFieldLooseBase(this, _taskStatus)[_taskStatus].showDod(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId);
	        return true;
	      } catch {
	        return false;
	      }
	    }
	    return true;
	  }
	  async handleParentState() {
	    var _babelHelpers$classPr5, _babelHelpers$classPr6, _babelHelpers$classPr7, _babelHelpers$classPr8;
	    const {
	      TaskStatus
	    } = await main_core.Runtime.loadExtension('tasks.scrum.task-status');
	    (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _taskStatus))[_taskStatus]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[_taskStatus] = new TaskStatus({
	      groupId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId,
	      parentTaskId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].parentId,
	      taskId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId,
	      action: 'complete',
	      performActionOnParentTask: true
	    });
	    (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _isParentScrumTask))[_isParentScrumTask]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[_isParentScrumTask] = await babelHelpers.classPrivateFieldLooseBase(this, _taskStatus)[_taskStatus].isParentScrumTask(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].parentId);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isParentScrumTask)[_isParentScrumTask]) {
	      void babelHelpers.classPrivateFieldLooseBase(this, _taskStatus)[_taskStatus].update();
	    }
	  }
	}

	exports.ScrumManager = ScrumManager;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX,BX.Tasks.V2.Const));
//# sourceMappingURL=scrum-manager.bundle.js.map
