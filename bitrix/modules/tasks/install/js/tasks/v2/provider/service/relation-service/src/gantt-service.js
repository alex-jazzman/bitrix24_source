import { Model } from 'tasks.v2.const';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import type { TaskDto } from 'tasks.v2.provider.service.task-service';
import type { GanttLinkModel } from 'tasks.v2.model.gantt-links';

import { mapGanttLinksToModels } from './mappers';
import { RelationService } from './relation-service';

export class GanttService extends RelationService
{
	async list(taskId: TaskId, withIds: boolean = false): Promise<TaskDto[]>
	{
		const tasks = await super.list(taskId, withIds);

		tasks.forEach((taskDto: TaskDto) => {
			const ganttLinks = mapGanttLinksToModels(taskDto.id, taskDto.ganttLinks);
			void this.$store.dispatch(`${Model.GanttLinks}/upsertMany`, ganttLinks);
		});
	}

	async checkDependence(ganttLink: GanttLinkModel): Promise<?string>
	{
		if (!idUtils.isReal(ganttLink.taskId))
		{
			return null;
		}

		const error = await this.requestUpdate('Task.Relation.Gantt.Dependence.check', { ganttLink });

		if (error)
		{
			return error.errors?.[0]?.message;
		}

		return null;
	}

	async addDependence(ganttLink: GanttLinkModel): Promise<?string>
	{
		const { taskId, dependentId } = ganttLink;

		this.addStore(taskId, [dependentId]);

		void this.$store.dispatch(`${Model.GanttLinks}/upsert`, ganttLink);

		if (!idUtils.isReal(taskId))
		{
			return null;
		}

		const error = await this.requestUpdate('Task.Relation.Gantt.Dependence.add', { ganttLink });

		if (error)
		{
			this.deleteStore(taskId, [dependentId]);

			console.error('Task.Relation.Gantt.Dependence.add error', error);

			return error.errors?.[0]?.message;
		}

		return null;
	}

	async updateDependence(ganttLink: GanttLinkModel): Promise<void>
	{
		void this.$store.dispatch(`${Model.GanttLinks}/upsert`, ganttLink);

		if (!idUtils.isReal(ganttLink.taskId))
		{
			return null;
		}

		const error = await this.requestUpdate('Task.Relation.Gantt.Dependence.update', { ganttLink });

		if (error)
		{
			console.error('Task.Relation.Gantt.Dependence.update error', error);

			return error.errors?.[0]?.message;
		}

		return null;
	}

	async delete(taskId: TaskId, taskIds: number[]): Promise<void>
	{
		const ganttLink = { taskId, dependentId: taskIds[0] };

		this.deleteStore(taskId, taskIds);

		if (!idUtils.isReal(taskId))
		{
			return;
		}

		const error = await this.requestUpdate('Task.Relation.Gantt.Dependence.delete', { ganttLink });

		if (error)
		{
			this.addStore(taskId, taskIds);

			console.error('Task.Relation.Gantt.Dependence.delete error', error);
		}
	}
}
