import { Core } from 'tasks.v2.core';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { taskService } from './task-service';
import { UpdateResult } from './types';

export const creatorService = new class
{
	update(task: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const currentUserId = Core.getParams().currentUser.id;
		const isAdmin = Core.getParams().rights.user.admin;

		const fields = {
			creatorId: task.creatorId,
			responsibleIds: isAdmin ? taskBefore.responsibleIds : [currentUserId],
		};

		return taskService.requestUpdate('Task.Stakeholder.Creator.update', fields, taskBefore);
	}
}();
