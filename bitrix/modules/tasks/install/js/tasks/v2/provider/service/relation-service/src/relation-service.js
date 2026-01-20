import type { AjaxResponse } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Limit, Model } from 'tasks.v2.const';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskDto } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import type { RelationMeta } from './types';

const limit = Limit.RelationList;

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

		const { tasks, ids } = await this.requestTasks(taskId, withIds);

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

			this.#updateStoreRelationTasks(taskId, ids);
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

	hasUnloadedIds(taskId: number): boolean
	{
		const ids = taskService.getStoreTask(taskId)[this.#meta.idsField];

		return this.getVisibleIds(ids).some((id) => !this.hasStoreTask(id));
	}

	hasStoreTask(id: number | string): boolean
	{
		const rights = taskService.getStoreTask(id)?.rights ?? {};

		return this.#meta.uniqueRight in rights;
	}

	/** @protected */
	async requestTasks(taskId: number, withIds: boolean = false): Promise<{ tasks: TaskDto[], ids?: number[] }>
	{
		if (!idUtils.isReal(taskId))
		{
			const ids = taskService.getStoreTask(taskId)[this.#meta.idsField];

			const { tasks } = await apiClient.post(`${this.#meta.controller}.listByIds`, {
				taskIds: this.getVisibleIds(ids),
			});

			return { tasks, ids };
		}

		const { tasks, ids } = await apiClient.post(`${this.#meta.controller}.list`, {
			taskId,
			withIds,
			navigation: {
				size: limit,
			},
		});

		return { tasks, ids };
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
	getVisibleIds(ids: number[]): number[]
	{
		return this.getSortedIds(ids).slice(0, limit);
	}

	getSortedIds(ids: number[]): number[]
	{
		return ids.sort((id1: number, id2: number) => this.#getTitle(id1).localeCompare(this.#getTitle(id2)));
	}

	#getTitle(id: number): string
	{
		return taskService.getStoreTask(id)?.title ?? this.$store.getters[`${Model.Tasks}/getTitle`](id) ?? '\uFFFF';
	}

	#updateStoreRelationTasks(taskId: number, taskIds: number[]): void
	{
		const meta = this.#meta;
		const relationIds = [...new Set(taskIds)];
		const contains = relationIds.length > 0;
		if (taskService.hasStoreTask(taskId, false))
		{
			void taskService.updateStoreTask(taskId, { [meta.idsField]: relationIds, [meta.containsField]: contains });
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
