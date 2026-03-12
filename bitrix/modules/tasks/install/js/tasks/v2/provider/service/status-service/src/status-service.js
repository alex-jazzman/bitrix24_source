import { Event } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EventName, Model, TaskStatus, Endpoint } from 'tasks.v2.const';
import { analytics } from 'tasks.v2.lib.analytics';
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

	async take(id: number, analyticsParams: Object = {}): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskStatusTake, TaskStatus.InProgress);

		const task = taskService.getStoreTask(id);

		if (task.allowsTimeTracking)
		{
			analytics.sendAutoTimeTracking(analyticsParams, {
				taskId: id,
			});
		}
	}

	async startTimer(id: number, analyticsParams: Object = {}): Promise<void>
	{
		await this.#updateStatus(id, Endpoint.TaskTrackingTimerStart, TaskStatus.InProgress);

		analytics.sendAutoTimeTracking(analyticsParams, {
			taskId: id,
		});
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
		await this.#updateStatus(id, Endpoint.TaskTrackingTimerStop, TaskStatus.Pending);
	}

	async complete(id: number, analyticsParams: Object = {}): Promise<void>
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

		analytics.sendTaskComplete(analyticsParams, {
			taskId: task.id,
		});

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
