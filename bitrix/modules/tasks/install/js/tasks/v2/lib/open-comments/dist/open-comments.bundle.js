/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,tasks_v2_provider_service_taskService,tasks_v2_lib_sidePanelInstance) {
	'use strict';

	const openComments = async taskId => {
	  const content = await tasks_v2_provider_service_taskService.taskService.getLegacyCommentsByTaskId(taskId);
	  const sidePanelId = `tasks-task-legacy-comments-${taskId}`;
	  const maxWidth = 650;
	  const commentsElement = document.createElement('div');
	  BX.Runtime.html(commentsElement, `<div class="tasks-task-full-card-legacy-comments">${content}</div>`);
	  tasks_v2_lib_sidePanelInstance.SidePanelInstance.open(sidePanelId, {
	    customLeftBoundary: 0,
	    width: maxWidth,
	    cacheable: false,
	    customRightBoundary: 0,
	    contentCallback: () => commentsElement
	  });
	};

	exports.openComments = openComments;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib));
//# sourceMappingURL=open-comments.bundle.js.map
