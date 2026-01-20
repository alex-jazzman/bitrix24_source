import { Endpoint } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { taskService } from './task-service';
import { UpdateResult } from './types';

export const descriptionService = new class
{
	async update(task: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const endpoint = task.forceUpdateDescription
			? Endpoint.TaskDescriptionForceUpdate
			: Endpoint.TaskDescriptionUpdate
		;

		const fields = {
			description: task.description,
			descriptionChecksum: task.descriptionChecksum,
		};

		return taskService.requestUpdate(endpoint, fields, taskBefore);
	}
}();
