/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_analytics,ui_uploader_core,tasks_v2_core,tasks_v2_const) {
	'use strict';

	var _sendData, _getTypeFromCardType;
	const analytics = new (_sendData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendData"), _getTypeFromCardType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTypeFromCardType"), class {
	  constructor() {
	    Object.defineProperty(this, _getTypeFromCardType, {
	      value: _getTypeFromCardType2
	    });
	    Object.defineProperty(this, _sendData, {
	      value: _sendData2
	    });
	  }
	  sendOpenCard(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.ClickCreate,
	      type: tasks_v2_const.Analytics.Type.TaskMini,
	      c_section: params.context,
	      c_sub_section: params.additionalContext,
	      c_element: params.element,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p2: tasks_v2_core.Core.getParams().analytics.userType,
	      ...(options.collabId ? {
	        p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
	      } : {})
	    });
	  }
	  sendOpenFullCard(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.FillTaskFormView,
	      type: tasks_v2_const.Analytics.Type.TaskMini,
	      c_section: params.context,
	      c_sub_section: tasks_v2_const.Analytics.SubSection.Full,
	      c_element: tasks_v2_const.Analytics.Element.FullFormButton,
	      status: tasks_v2_const.Analytics.Status.Success
	    });
	  }
	  sendAddTask(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.TaskCreate,
	      type: tasks_v2_const.Analytics.Type.TaskMini,
	      c_section: params.context,
	      c_sub_section: params.additionalContext,
	      c_element: params.element,
	      status: options.isSuccess ? tasks_v2_const.Analytics.Status.Success : tasks_v2_const.Analytics.Status.Error,
	      p2: tasks_v2_core.Core.getParams().analytics.userType,
	      p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
	      ...(options.collabId ? {
	        p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
	      } : {}),
	      p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
	    });
	  }
	  sendAddTaskWithCheckList(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.TaskCreateWithChecklist,
	      type: tasks_v2_const.Analytics.Type.TaskMini,
	      c_section: params.context,
	      c_sub_section: params.additionalContext,
	      c_element: params.element,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p2: tasks_v2_core.Core.getParams().analytics.userType,
	      p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
	      ...(options.collabId ? {
	        p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
	      } : {}),
	      p5: tasks_v2_const.Analytics.Params.ChecklistCount(options.checklistCount, options.checklistItemsCount)
	    });
	  }
	  sendDescription(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.DescriptionTask,
	      type: tasks_v2_const.Analytics.Type.TaskMini,
	      c_section: params.context,
	      c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p2: tasks_v2_const.Analytics.Params.HasDescription(options.hasDescription),
	      p3: tasks_v2_const.Analytics.Params.HasScroll(options.hasScroll)
	    });
	  }
	  sendAddProject(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.AddProject,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getTypeFromCardType)[_getTypeFromCardType](options.cardType),
	      c_section: params.context,
	      c_element: tasks_v2_const.Analytics.Element.ProjectButton,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
	      p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
	    });
	  }
	  sendDeadlineSet(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.DeadlineSet,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getTypeFromCardType)[_getTypeFromCardType](options.cardType),
	      c_section: params.context,
	      c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
	      c_element: options.element,
	      status: tasks_v2_const.Analytics.Status.Success
	    });
	  }
	  sendAssigneeChange(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.AssigneeChange,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getTypeFromCardType)[_getTypeFromCardType](options.cardType),
	      c_section: params.context,
	      c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
	      c_element: tasks_v2_const.Analytics.Element.ChangeButton,
	      status: tasks_v2_const.Analytics.Status.Success
	    });
	  }
	  sendAttachFile(params, options) {
	    var _FileOrigin$CLIENT$op;
	    const subSection = (_FileOrigin$CLIENT$op = {
	      [ui_uploader_core.FileOrigin.CLIENT]: tasks_v2_const.Analytics.SubSection.MyFiles
	    }[options.fileOrigin]) != null ? _FileOrigin$CLIENT$op : tasks_v2_const.Analytics.SubSection.Bitrix24Files;
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.AttachFile,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getTypeFromCardType)[_getTypeFromCardType](options.cardType),
	      c_section: params.context,
	      c_sub_section: subSection,
	      c_element: tasks_v2_const.Analytics.Element.UploadButton,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p1: tasks_v2_const.Analytics.Params.FileSize(options.fileSize),
	      p2: tasks_v2_core.Core.getParams().analytics.userType,
	      p3: tasks_v2_const.Analytics.Params.FilesCount(options.filesCount),
	      ...(options.collabId ? {
	        p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
	      } : {}),
	      p5: tasks_v2_const.Analytics.Params.FileExtension(options.fileExtension)
	    });
	  }
	  sendAddChecklist(params, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendData)[_sendData]({
	      event: tasks_v2_const.Analytics.Event.AddChecklist,
	      type: babelHelpers.classPrivateFieldLooseBase(this, _getTypeFromCardType)[_getTypeFromCardType](options.cardType),
	      c_section: params.context,
	      c_sub_section: options.isNewTask ? tasks_v2_const.Analytics.TaskState.New : tasks_v2_const.Analytics.TaskState.Existing,
	      c_element: tasks_v2_const.Analytics.Element.CheckListButton,
	      status: tasks_v2_const.Analytics.Status.Success,
	      p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
	      p4: tasks_v2_const.Analytics.Params.ChecklistPointsCount(options.checklistPointsCount),
	      p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
	    });
	  }
	})();
	function _sendData2(data) {
	  ui_analytics.sendData({
	    tool: tasks_v2_const.Analytics.Tool.Tasks,
	    category: tasks_v2_const.Analytics.Category.TaskOperations,
	    ...data
	  });
	}
	function _getTypeFromCardType2(cardType) {
	  return {
	    [tasks_v2_const.CardType.Compact]: tasks_v2_const.Analytics.Type.TaskMini,
	    [tasks_v2_const.CardType.Full]: tasks_v2_const.Analytics.Type.Task
	  }[cardType];
	}

	exports.analytics = analytics;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.UI.Analytics,BX.UI.Uploader,BX.Tasks.V2,BX.Tasks.V2.Const));
//# sourceMappingURL=analytics.bundle.js.map
