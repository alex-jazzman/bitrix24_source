import { Reflection, Type, type AjaxResponse } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Endpoint, Limit, Model, TaskStatus } from 'tasks.v2.const';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService, type TaskDto } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { type TaskListOptions } from 'tasks.v2.model.interface';

import { type RelationMeta } from './types';

const limit = Limit.RelationList;

const UserOptions = Reflection.namespace('BX.userOptions');

export class RelationService
{
	#meta: RelationMeta;
	#updatePromises: Promise[] = [];

	constructor(meta: RelationMeta)
	{
		this.#meta = meta;
	}

	async list(taskId: TaskId, withIds: boolean = false): Promise<TaskDto[]>
	{
		const hasUpdatePromises = this.#updatePromises.length > 0;

		await Promise.all(this.#updatePromises);

		const { tasks, ids, statuses } = await this.requestTasks(taskId, withIds);

		if (withIds)
		{
			if (!hasUpdatePromises && ids.length === 0)
			{
				void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
					id: taskId,
					fieldName: this.#meta.id,
					isFilled: false,
				});
			}

			this.#updateStoreRelationTasks(taskId, ids, false, statuses);
		}

		tasks.forEach((taskDto: TaskDto): void => {
			if (!taskService.hasStoreTask(taskDto.id, false))
			{
				void this.$store.dispatch(`${Model.Tasks}/addPartiallyLoaded`, taskDto.id);
			}

			taskService.extractTask({ ...taskDto, [this.#meta.relationToField]: taskId });
		});

		return tasks;
	}

	async listByIds(taskId: TaskId, taskIds: number[]): Promise<TaskDto[]>
	{
		const tasks = await this.requestTasksByIds(taskId, taskIds);

		const newTaskIds = tasks.map(({ id }) => id);
		this.#updateStoreRelationTasks(taskId, newTaskIds, true);

		tasks.forEach((taskDto: TaskDto): void => {
			if (!taskService.hasStoreTask(taskDto.id, false))
			{
				void this.$store.dispatch(`${Model.Tasks}/addPartiallyLoaded`, taskDto.id);
			}

			taskService.extractTask({ ...taskDto, [this.#meta.relationToField]: taskId });
		});

		return tasks;
	}

	async getSubTaskIds(taskId: TaskId, taskIds: number[]): Promise<void>
	{
		const tasks = await this.requestSubTaskIds(taskId, taskIds);

		tasks.forEach(({ id, subTaskIds }: { id: number, subTaskIds: number[] }): void => {
			taskService.updateStoreTask(id, { subTaskIds });
		});
	}

	async setParent(taskId: number, parentId: number): Promise<?string>
	{
		return this.add(parentId, [taskId]);
	}

	async add(taskId: number, taskIds: number[], noOverride: boolean = false): Promise<?string>
	{
		const parentIds = Object.fromEntries(taskIds.map((id: number) => {
			return [id, taskService.getStoreTask(id)?.[this.#meta.relationToField] ?? 0];
		}));

		this.addStore(taskId, taskIds);

		if (!idUtils.isReal(taskId) || taskIds.length === 0)
		{
			return null;
		}

		const error = await this.requestAdd(taskId, taskIds, noOverride);

		if (error)
		{
			const failedIds = Object.entries(error.data)
				.filter(([, success]) => !success)
				.map(([id]) => Number(id))
			;

			this.deleteStore(taskId, failedIds);
			failedIds.forEach((id: number) => this.addStore(parentIds[id], [id]));

			console.error(`${this.#meta.controller}.add error`, error);

			const accessErrors = error.errors.filter(({ code }) => code === 'Access denied');
			if (accessErrors.length === 1)
			{
				return this.#meta.addError;
			}

			if (accessErrors.length > 1)
			{
				return this.#meta.addErrorMany;
			}

			const overrideErrors = error.errors.filter(({ code }) => code === 'No override parentId');
			if (overrideErrors.length === 1)
			{
				return this.#meta.overrideError;
			}

			if (overrideErrors.length > 1)
			{
				return this.#meta.overrideErrorMany;
			}

			return error.errors?.[0]?.message;
		}

		return null;
	}

	addStore(taskId: number, taskIds: number[]): void
	{
		const meta = this.#meta;
		const task = taskService.getStoreTask(taskId);
		this.#updateStoreRelationTasks(taskId, [...(task?.[meta.idsField] || []), ...taskIds]);
		taskIds.forEach((it) => taskService.updateStoreTask(it, { [meta.relationToField]: taskId }));

		this.#addStatusesToStore(taskId, taskIds);
	}

	#addStatusesToStore(taskId: number, taskIds: number[]): void
	{
		const meta = this.#meta;
		const task = taskService.getStoreTask(taskId);

		if (meta.statusesField && task?.[meta.statusesField])
		{
			const statuses = { ...task[meta.statusesField] };
			taskIds.forEach((id) => {
				const addedTask = taskService.getStoreTask(id);
				if (addedTask?.status)
				{
					statuses[id] = addedTask.status;
				}
			});
			taskService.updateStoreTask(taskId, { [meta.statusesField]: statuses });
		}
	}

	async delete(taskId: number, taskIds: number[]): Promise<void>
	{
		this.deleteStore(taskId, taskIds);

		if (!idUtils.isReal(taskId) || taskIds.length === 0)
		{
			return;
		}

		const error = await this.requestDelete(taskId, taskIds);

		if (error)
		{
			this.addStore(taskId, taskIds);

			console.error(`${this.#meta.controller}.delete error`, error);
		}
	}

	unlinkStore(taskId: number): void
	{
		const relationIds = this.$store.getters[`${Model.Tasks}/getAll`]
			.filter((task: TaskModel) => task[this.#meta.relationToField] === taskId)
			.map(({ id }) => id)
		;

		const relationToIds = this.$store.getters[`${Model.Tasks}/getAll`]
			.filter((task: TaskModel) => task[this.#meta.idsField]?.includes(taskId))
			.map(({ id }) => id)
		;

		this.deleteStore(taskId, relationIds);
		relationToIds.forEach((id: number) => this.deleteStore(id, [taskId]));
	}

	deleteStore(taskId: number, taskIds: number[]): void
	{
		const meta = this.#meta;
		const task = taskService.getStoreTask(taskId);
		this.#updateStoreRelationTasks(taskId, task?.[meta.idsField].filter((it) => !taskIds.includes(it)));
		taskIds.forEach((it) => taskService.updateStoreTask(it, { [meta.relationToField]: 0 }));

		this.#deleteStatusesFromStore(taskId, taskIds);
	}

	#deleteStatusesFromStore(taskId: number, taskIds: number[]): void
	{
		const meta = this.#meta;
		const task = taskService.getStoreTask(taskId);

		if (meta.statusesField && task?.[meta.statusesField])
		{
			const statuses = { ...task[meta.statusesField] };
			taskIds.forEach((id) => delete statuses[id]);
			taskService.updateStoreTask(taskId, { [meta.statusesField]: statuses });
		}
	}

	areIdsLoaded(taskId: number): boolean
	{
		const meta = this.#meta;
		const task = taskService.getStoreTask(taskId);
		if (!task)
		{
			return false;
		}

		return !task[meta.containsField] || task[meta.idsField].length > 0;
	}

	hasUnloadedIds(taskId: TaskId, isTemplateEntities: boolean = false): boolean
	{
		const ids = taskService.getStoreTask(taskId)[this.#meta.idsField];

		return this.getVisibleIds(taskId, ids, isTemplateEntities).some((id) => !this.hasStoreTask(id));
	}

	hasStoreTask(id: TaskId): boolean
	{
		const rights = taskService.getStoreTask(id)?.rights ?? {};

		return this.#meta.uniqueRight in rights;
	}

	/** @protected */
	async requestTasks(
		taskId: TaskId,
		withIds: boolean = false,
	): Promise<{ tasks: TaskDto[], ids?: number[], statuses?: Object }>
	{
		if (!idUtils.isReal(taskId))
		{
			const ids = taskService.getStoreTask(taskId)[this.#meta.idsField];
			const taskIds = this.getVisibleIds(taskId, ids);
			const tasks = await this.requestTasksByIds(taskId, taskIds);

			return { tasks, ids };
		}

		const { tasks, ids, statuses } = await apiClient.post(`${this.#meta.controller}.list`, {
			taskId,
			withIds,
			withCompleted: this.showCompletedTasks,
			withSubTasks: this.showSubTasks,
			navigation: {
				size: limit,
			},
		});

		return { tasks, ids, statuses };
	}

	async requestTasksByIds(taskId: TaskId, taskIds: number[]): Promise<TaskDto[]>
	{
		const { tasks } = await apiClient.post(`${this.#meta.controller}.listByIds`, {
			taskIds,
			withCompleted: this.showCompletedTasks,
			withSubTasks: this.showSubTasks,
		});

		return tasks;
	}

	/** @protected */
	async requestSubTaskIds(taskId: TaskId, taskIds: number[]): Promise<TaskDto[]>
	{
		const { tasks } = await apiClient.post(Endpoint.TaskRelationChildGetSubTaskIds, {
			taskIds,
		});

		return tasks.map((it) => ({
			id: it.id,
			subTaskIds: it?.subTaskIds ?? [],
		}));
	}

	/** @protected */
	requestAdd(taskId: number, taskIds: number[], noOverride: boolean = false): Promise<?AjaxResponse>
	{
		return this.requestUpdate(`${this.#meta.controller}.add`, { taskId, taskIds, noOverride });
	}

	/** @protected */
	requestDelete(taskId: number, taskIds: number[]): Promise<?AjaxResponse>
	{
		return this.requestUpdate(`${this.#meta.controller}.delete`, { taskId, taskIds });
	}

	/** @protected */
	async requestUpdate(endpoint: string, data: Object): Promise<?AjaxResponse>
	{
		const promise = this.#safePromise(apiClient.post(endpoint, data));
		this.#updatePromises.push(promise);
		const error = await promise;
		this.#updatePromises = this.#updatePromises.filter((it) => it !== promise);

		return error;
	}

	async #safePromise(promise: Promise): Promise<?AjaxResponse>
	{
		try
		{
			await promise;
		}
		catch (error)
		{
			return error;
		}

		return null;
	}

	/** @protected */
	getVisibleIds(taskId: TaskId, ids: number[], isTemplateEntities = false): number[]
	{
		return this.getSortedIds(taskId, ids, this.showCompletedTasks, isTemplateEntities).slice(0, limit);
	}

	getSortedIds(taskId: TaskId, ids: number[], showCompleted = true, isTemplateEntities = false): number[]
	{
		if (isTemplateEntities)
		{
			return this.getSortedTemplateIds(ids);
		}

		if (showCompleted)
		{
			return this.getSortedTaskIds(ids);
		}

		return this.getSortedTaskIds(this.#filterCompleted(ids, taskId));
	}

	getSortedTemplateIds(ids: number[]): number[]
	{
		return ids.sort((id1: number, id2: number) => this.#getTitle(id1).localeCompare(this.#getTitle(id2)));
	}

	getSortedTaskIds(ids: number[]): number[]
	{
		const exists = (task: ?TaskModel) => (task ? 1 : 0);
		const activityTs = (task: ?TaskModel) => (
			(task?.changedTs > 0 && task?.activityTs > 0 && task.changedTs > task.activityTs)
				? task.changedTs
				: task?.activityTs ?? 0
		);

		return ids.sort((id1: number, id2: number) => {
			const task1 = taskService.getStoreTask(id1);
			const task2 = taskService.getStoreTask(id2);

			// existing first
			if (exists(task1) !== exists(task2))
			{
				return exists(task2) - exists(task1);
			}

			// by activity
			if (activityTs(task1) !== activityTs(task2))
			{
				return activityTs(task2) > activityTs(task1) ? 1 : -1;
			}

			// by id
			return id2 > id1 ? 1 : -1;
		});
	}

	#filterCompleted(ids: number[], taskId: number): number[]
	{
		const meta = this.#meta;
		const parentTask = taskService.getStoreTask(taskId);

		return ids.filter((id: number) => {
			const task = taskService.getStoreTask(id);
			if (task)
			{
				return task.status !== TaskStatus.Completed;
			}

			const statusFromMap = parentTask?.[meta.statusesField]?.[id];
			if (statusFromMap)
			{
				return statusFromMap !== TaskStatus.Completed;
			}

			return true;
		});
	}

	#getTitle(id: number): string
	{
		return taskService.getStoreTask(id)?.title ?? this.$store.getters[`${Model.Tasks}/getTitle`](id) ?? '\uFFFF';
	}

	#updateStoreRelationTasks(
		taskId: number,
		taskIds: number[],
		withPartiallyLoaded: boolean = false,
		statuses: ?Object = null,
	): void
	{
		const meta = this.#meta;
		const relationIds = [...new Set(taskIds)];

		const contains = relationIds.length > 0;

		if (taskService.hasStoreTask(taskId, withPartiallyLoaded))
		{
			const fields = { [meta.idsField]: relationIds, [meta.containsField]: contains };

			if (!Type.isNil(statuses) && meta.statusesField)
			{
				fields[meta.statusesField] = statuses;
			}

			void taskService.updateStoreTask(taskId, fields);
		}
	}

	saveTaskListOptions(taskListOptions: TaskListOptions): void
	{
		void this.$store.dispatch(`${Model.Interface}/updateTaskListOptions`, taskListOptions);

		UserOptions.save('tasks', 'fullCard', 'taskListOptions', JSON.stringify(taskListOptions));
	}

	getTaskListOptions(): TaskListOptions
	{
		return this.$store.getters[`${Model.Interface}/taskListOptions`];
	}

	get showCompletedTasks(): boolean
	{
		return this.getTaskListOptions()[this.#meta.showCompletedField];
	}

	get showSubTasks(): boolean
	{
		return this.getTaskListOptions().showSubTasks;
	}

	get showSubTemplates(): boolean
	{
		return this.getTaskListOptions().showSubTemplates;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
