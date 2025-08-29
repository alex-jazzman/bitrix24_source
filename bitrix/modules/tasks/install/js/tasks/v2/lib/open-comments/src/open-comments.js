import { taskService } from 'tasks.v2.provider.service.task-service';
import { SidePanelInstance } from 'tasks.v2.lib.side-panel-instance';

import './open-comments.css';

export const openComments = async (taskId: number): Promise<void> => {
	const content = await taskService.getLegacyCommentsByTaskId(taskId);
	const sidePanelId = `tasks-task-legacy-comments-${taskId}`;
	const maxWidth = 650;

	const commentsElement = document.createElement('div');
	BX.Runtime.html(commentsElement, `<div class="tasks-task-full-card-legacy-comments">${content}</div>`);

	SidePanelInstance.open(sidePanelId, {
		customLeftBoundary: 0,
		width: maxWidth,
		cacheable: false,
		customRightBoundary: 0,
		contentCallback: () => commentsElement,
	});
};
