import { Loc, type AjaxResponse } from 'main.core';

import { Limit, Model, TaskField, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService, type TaskDto } from 'tasks.v2.provider.service.task-service';
import { templateService, TemplateMappers } from 'tasks.v2.provider.service.template-service';

import { RelationService } from './relation-service';

const limit = Limit.RelationList;

export class SubTasksService extends RelationService
{
	async getParent(taskId: TaskId, parentId: number): Promise<void>
	{
		if (taskService.hasStoreTask(parentId))
		{
			return;
		}

		const parent = await this.#requestParent(parentId);
		if (!parent)
		{
			void taskService.updateStoreTask(taskId, { parentId: 0 });
			void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
				id: taskId,
				fieldName: TaskField.Parent,
				isFilled: false,
			});

			return;
		}

		taskService.extractTask(parent);
		void this.$store.dispatch(`${Model.Tasks}/addPartiallyLoaded`, parentId);
	}

	async setParent(taskId: TaskId, parentId: number): Promise<?string>
	{
		const currentParentId = taskService.getStoreTask(taskId).parentId;
		if (currentParentId === parentId)
		{
			return null;
		}

		if (parentId === 0 && idUtils.isReal(taskId))
		{
			if (idUtils.isTemplate(taskId))
			{
				await templateService.update(taskId, { parentId });

				return null;
			}

			return this.delete(currentParentId, [taskId]);
		}

		if (parentId === taskId)
		{
			return Loc.getMessage('TASKS_V2_RELATION_PARENT_CANNOT_BE_PARENT');
		}

		if (taskService.getStoreTask(taskId)?.subTaskIds.includes(parentId))
		{
			return Loc.getMessage('TASKS_V2_RELATION_SUB_TASK_CANNOT_BE_PARENT');
		}

		if (!idUtils.isReal(taskId))
		{
			return this.addStore(parentId, [taskId]);
		}

		if (idUtils.isTemplate(taskId) && !idUtils.isTemplate(parentId))
		{
			await templateService.update(taskId, { parentId });

			return null;
		}

		const error = await this.add(parentId, [taskId], false);

		if (error)
		{
			this.addStore(currentParentId, [taskId]);
		}

		return error;
	}

	async add(taskId: number, taskIds: number[], noOverride: boolean = true): Promise<?string>
	{
		let error = null;

		if (taskIds.includes(taskId))
		{
			error ??= Loc.getMessage('TASKS_V2_RELATION_SELF_CANNOT_BE_SUB_TASK');
		}

		const parentId = taskService.getStoreTask(taskId)?.parentId;
		if (taskIds.includes(parentId))
		{
			error ??= Loc.getMessage('TASKS_V2_RELATION_PARENT_CANNOT_BE_SUB_TASK');
		}

		const ids = taskIds.filter((id: number) => id !== taskId && id !== parentId);

		const parentError = await super.add(taskId, ids, noOverride);

		error ??= parentError;

		if (taskService.getStoreTask(taskId)?.matchesSubTasksTime)
		{
			void taskService.get(taskId, {}, true);
		}

		return error;
	}

	async delete(taskId: number, taskIds: number[]): Promise<void>
	{
		await super.delete(taskId, taskIds);

		if (taskService.getStoreTask(taskId)?.matchesSubTasksTime)
		{
			void taskService.get(taskId, {}, true);
		}
	}

	addStore(id: TaskId, ids: number[]): void
	{
		ids.forEach((it) => this.deleteStore(taskService.getStoreTask(it)?.parentId, [it]));

		super.addStore(id, ids);
	}

	/** @protected */
	async requestTasks(taskId: TaskId, withIds: boolean = false): Promise<{ tasks: TaskDto[], ids?: number[] }>
	{
		const task = taskService.getStoreTask(taskId);
		if (withIds && !task.subTaskIds?.length && task.templateId)
		{
			const { templates, ids } = await apiClient.post('Template.Relation.Child.list', {
				templateId: task.templateId,
				withIds,
				navigation: {
					size: limit,
				},
			});

			const idsMap = ids.reduce((map, id) => map.set(id, `tmp.${id}`), new Map());
			const tasks = templates.map((template) => ({
				...TemplateMappers.mapDtoToTaskDto(template),
				id: idsMap.get(template.id),
				rights: {
					read: true,
					delegate: false,
					changeResponsible: false,
					detachParent: false,
				},
			}));

			return { tasks, ids: [...idsMap.values()] };
		}

		if (!idUtils.isTemplate(taskId))
		{
			return super.requestTasks(taskId, withIds);
		}

		if (!idUtils.isReal(taskId))
		{
			const ids = taskService.getStoreTask(taskId).subTaskIds;

			const { templates } = await apiClient.post('Template.Relation.Child.listByIds', {
				templateIds: this.getVisibleIds(ids).map((id) => idUtils.unbox(id)),
			});

			const tasks = templates.map((it) => ({ ...it, id: idUtils.boxTemplate(it.id) }));

			return { tasks, ids };
		}

		const { templates, ids } = await apiClient.post('Template.Relation.Child.list', {
			templateId: idUtils.unbox(taskId),
			withIds,
			navigation: {
				size: limit,
			},
		});

		const tasks = templates.map((it) => ({ ...it, id: idUtils.boxTemplate(it.id) }));

		return { tasks, ids: ids?.map((id) => idUtils.boxTemplate(id)) };
	}

	/** @protected */
	requestAdd(taskId: number, taskIds: number[], noOverride: boolean = false): Promise<?AjaxResponse>
	{
		if (!idUtils.isTemplate(taskId))
		{
			return super.requestAdd(taskId, taskIds, noOverride);
		}

		return this.requestUpdate('Template.Relation.Child.add', {
			templateId: idUtils.unbox(taskId),
			templateIds: taskIds.map((id) => idUtils.unbox(id)),
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

		return this.requestUpdate('Template.Relation.Child.delete', {
			templateId: idUtils.unbox(taskId),
			templateIds: taskIds.map((id) => idUtils.unbox(id)),
		});
	}

	async #requestParent(taskId: number): Promise<?TaskDto>
	{
		if (idUtils.isTemplate(taskId))
		{
			const { templates } = await apiClient.post('Template.Relation.Child.listByIds', {
				templateIds: [idUtils.unbox(taskId)],
			});

			const parent = templates[0];
			if (parent)
			{
				parent.id = idUtils.boxTemplate(parent.id);
			}

			return parent;
		}

		const { tasks } = await apiClient.post(Endpoint.TaskRelationChildListByIds, {
			taskIds: [taskId],
		});

		return tasks[0];
	}
}
