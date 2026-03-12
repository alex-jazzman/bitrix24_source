import type { TaskModel } from 'tasks.v2.model.tasks';

import { taskService } from './task-service';
import { UpdateResult } from './types';

export const crmService = new class
{
	async update(task: TaskModel, taskBefore: TaskModel): Promise<UpdateResult>
	{
		const idsToAdd = task.crmItemIds.filter((id) => !taskBefore.crmItemIds.includes(id));
		const idsToDelete = taskBefore.crmItemIds.filter((id) => !task.crmItemIds.includes(id));

		const addResult = await this.#add(idsToAdd, taskBefore);
		const deleteResult = await this.#delete(idsToDelete, taskBefore);

		return { ...addResult, ...deleteResult };
	}

	#add(crmItemIds: number[], taskBefore: TaskModel): Promise<UpdateResult>
	{
		if (crmItemIds.length === 0)
		{
			return {};
		}

		return taskService.requestUpdate('Task.CRM.Item.add', { crmItemIds }, taskBefore);
	}

	#delete(crmItemIds: number[], taskBefore: TaskModel): Promise<UpdateResult>
	{
		if (crmItemIds.length === 0)
		{
			return {};
		}

		return taskService.requestUpdate('Task.CRM.Item.delete', { crmItemIds }, taskBefore);
	}
}();
