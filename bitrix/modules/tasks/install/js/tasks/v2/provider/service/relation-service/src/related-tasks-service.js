import { Loc, type AjaxResponse } from 'main.core';

import { Limit, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService, type TaskDto } from 'tasks.v2.provider.service.task-service';

import { RelationService } from './relation-service';

const limit = Limit.RelationList;

export class RelatedTasksService extends RelationService
{
	async add(taskId: TaskId, taskIds: number[], noOverride: boolean = false): Promise<?string>
	{
		let error = null;

		if (taskIds.includes(taskId))
		{
			error ??= Loc.getMessage('TASKS_V2_RELATION_SELF_CANNOT_BE_RELATED_TASK');
		}

		const ids = taskIds.filter((id: number) => id !== taskId);

		const parentError = await super.add(taskId, ids, noOverride);

		error ??= parentError;

		return error;
	}

	/** @protected */
	async requestTasks(
		taskId: TaskId,
		withIds: boolean = false,
	): Promise<{ tasks: TaskDto[], ids?: number[], statuses?: Object }>
	{
		const task = taskService.getStoreTask(taskId);
		if (withIds && !task.relatedTaskIds?.length && task.templateId)
		{
			const { tasks, ids, statuses } = await apiClient.post(Endpoint.TemplateRelationRelatedList, {
				templateId: task.templateId,
				withIds,
				withCompleted: this.showCompletedTasks,
				navigation: {
					size: limit,
				},
			});

			return { tasks, ids, statuses };
		}

		if (!idUtils.isTemplate(taskId) || !idUtils.isReal(taskId))
		{
			return super.requestTasks(taskId, withIds);
		}

		const { tasks, ids, statuses } = await apiClient.post(Endpoint.TemplateRelationRelatedList, {
			templateId: idUtils.unbox(taskId),
			withIds,
			withCompleted: this.showCompletedTasks,
			navigation: {
				size: limit,
			},
		});

		return { tasks, ids, statuses };
	}

	/** @protected */
	requestAdd(taskId: number, taskIds: number[], noOverride: boolean = false): Promise<?AjaxResponse>
	{
		if (!idUtils.isTemplate(taskId))
		{
			return super.requestAdd(taskId, taskIds, noOverride);
		}

		return this.requestUpdate(Endpoint.TemplateRelationRelatedAdd, {
			templateId: idUtils.unbox(taskId),
			taskIds,
			noOverride,
		});
	}

	/** @protected */
	requestDelete(taskId: number, taskIds: number[]): Promise<?AjaxResponse>
	{
		if (!idUtils.isTemplate(taskId))
		{
			return super.requestDelete(taskId, taskIds);
		}

		return this.requestUpdate(Endpoint.TemplateRelationRelatedDelete, {
			templateId: idUtils.unbox(taskId),
			taskIds,
		});
	}
}
