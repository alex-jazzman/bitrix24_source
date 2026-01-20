import { Event } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EventName, Model, TaskStatus, Endpoint } from 'tasks.v2.const';
import { ScrumManager } from 'tasks.v2.lib.scrum-manager';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { resultService } from 'tasks.v2.provider.service.result-service';

export const statusService = new class
{
	async start(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusStart, TaskStatus.InProgress);
	}

	async startTimer(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Tracking.Timer.start', TaskStatus.InProgress);
	}

	async disapprove(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusDisapprove, TaskStatus.Pending);
	}

	async defer(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusDefer, TaskStatus.Deferred);
	}

	async approve(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusApprove, TaskStatus.Completed);
	}

	async pause(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusPause, TaskStatus.Pending);
	}

	async pauseTimer(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Tracking.Timer.stop', TaskStatus.Pending);
	}

	async complete(id: number): Promise<void>
	{
		const task = taskService.getStoreTask(id);
		if (!task)
		{
			return;
		}

		const currentUserId = Core.getStore().getters[`${Model.Interface}/currentUserId`];
		if (
			task.requireResult
			&& !Core.getParams().rights.user.admin
			&& currentUserId !== task.creatorId
			&& !resultService.hasOpenedResults(id)
		)
		{
			Event.EventEmitter.emit(EventName.RequiredResultsMissing, { taskId: id });

			return;
		}

		const group = Core.getStore().getters[`${Model.Groups}/getById`](task.groupId);

		const scrumManager = new ScrumManager({
			taskId: task.id,
			parentId: task.parentId,
			groupId: task.groupId,
		});

		let canComplete = true;
		if (scrumManager.isScrum(group?.type))
		{
			canComplete = await scrumManager.handleDodDisplay();
		}

		if (!canComplete)
		{
			return;
		}

		const status = task.needsControl ? TaskStatus.SupposedlyCompleted : TaskStatus.Completed;

		await this.#updateStatus(id, Endpoint.TaskStatusComplete, status);

		if (scrumManager.isScrum(group?.type))
		{
			void scrumManager?.handleParentState();
		}

		void resultService.closeResults(id);
	}

	async renew(id: number): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusRenew, TaskStatus.Pending);
	}

	async #updateStatus(id: number, action: string, status: string): Promise<void>
	{
		const taskBeforeUpdate = taskService.getStoreTask(id);

		if (!idUtils.isReal(id))
		{
			taskService.updateStoreTask(id, { status });

			return;
		}

		try
		{
			const data = await apiClient.post(action, { task: { id } });

			taskService.updateStoreTask(id, { status });

			taskService.extractTask(data);
		}
		catch (error)
		{
			taskService.updateStoreTask(id, taskBeforeUpdate);

			console.error(`StatusService: ${action} error`, error);
		}
	}
}();
