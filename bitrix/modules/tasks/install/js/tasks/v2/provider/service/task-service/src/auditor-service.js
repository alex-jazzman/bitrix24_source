import { Core } from 'tasks.v2.core';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { taskService } from './task-service';
import { UpdateResult } from './types';

export const auditorService = new class
{
	async update(task: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const idsToAdd = task.auditorsIds.filter((id) => !taskBefore.auditorsIds.includes(id));
		const idsToDelete = taskBefore.auditorsIds.filter((id) => !task.auditorsIds.includes(id));

		const addResult = await this.#add(idsToAdd, taskBefore);
		const deleteResult = await this.#delete(idsToDelete, taskBefore);

		return { ...addResult, ...deleteResult };
	}

	#add(auditorsIds: number[], taskBefore: TaskModel): Promise<UpdateResult>
	{
		if (auditorsIds.length === 0)
		{
			return {};
		}

		const watch = auditorsIds.length === 1 && auditorsIds[0] === Core.getParams().currentUser.id;
		const endpoint = watch ? 'Task.Audit.watch' : 'Task.Stakeholder.Auditor.add';

		return taskService.requestUpdate(endpoint, { auditorsIds }, taskBefore);
	}

	#delete(auditorsIds: number[], taskBefore: TaskModel): Promise<UpdateResult>
	{
		if (auditorsIds.length === 0)
		{
			return {};
		}

		const unwatch = auditorsIds.length === 1 && auditorsIds[0] === Core.getParams().currentUser.id;
		const endpoint = unwatch ? 'Task.Audit.unwatch' : 'Task.Stakeholder.Auditor.delete';

		return taskService.requestUpdate(endpoint, { auditorsIds }, taskBefore);
	}
}();
