import { Runtime } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskGetExtractor } from './task-get-extractor';
import { mapModelToDto } from './mappers';
import type { TaskDto } from './types';

const separateFields = {
	scrumFields: new Set(['storyPoints', 'epicId']),
	deadlineFields: new Set(['deadlineTs']),
	datePlanFields: new Set(['startPlanTs', 'endPlanTs', 'matchesWorkTime', 'matchesSubTasksTime']),
};

export const taskService = new class
{
	async getById(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post('Task.get', { task: { id } });

			await this.extractTask(data);
		}
		catch (error)
		{
			console.error('TaskService: getById error', error);
		}
	}

	async getRights(id: number): Promise<void>
	{
		try
		{
			const { rights } = await apiClient.post('Task.Access.get', { task: { id } });

			await this.#updateStoreTask(id, { rights });
		}
		catch (error)
		{
			console.error('TaskService: getRights error', error);
		}
	}

	async add(task: TaskModel): Promise<[number, Error | null]>
	{
		try
		{
			const data = await apiClient.post('Task.add', { task: mapModelToDto(task) });
			const id = data.id;

			await this.extractTask(data);

			return [id, null];
		}
		catch (error)
		{
			console.error('TaskService: add error', error);

			return [0, new Error(error?.errors?.[0]?.message)];
		}
	}

	async update(id: number, fields: TaskModel): Promise<void>
	{
		const taskBeforeUpdate = this.#getStoreTask(id);

		await this.#updateStoreTask(id, fields);

		if (!this.isRealId(id))
		{
			return;
		}

		try
		{
			await this.#updateTaskDebounced(id, fields, taskBeforeUpdate);
		}
		catch (error)
		{
			await this.#updateStoreTask(id, taskBeforeUpdate);

			console.error('TaskService: update error', error);
		}
	}

	async delete(id: number): Promise<void>
	{
		const taskBeforeDelete = this.#getStoreTask(id);

		await this.#deleteStoreTask(id);

		if (!this.isRealId(id))
		{
			return;
		}

		try
		{
			await apiClient.post('Task.delete', { task: { id } });
		}
		catch (error)
		{
			void this.#insertStoreTask(taskBeforeDelete);

			console.error('TaskService: delete error', error);
		}
	}

	async extractTask(data: TaskDto): Promise<void>
	{
		const extractor = new TaskGetExtractor(data);

		await Promise.all([
			this.$store.dispatch(`${Model.Tasks}/upsert`, extractor.getTask()),
			this.$store.dispatch(`${Model.Flows}/upsert`, extractor.getFlow()),
			this.$store.dispatch(`${Model.Groups}/insert`, extractor.getGroup()),
			this.$store.dispatch(`${Model.Stages}/upsertMany`, extractor.getStages()),
			this.$store.dispatch(`${Model.Users}/upsertMany`, extractor.getUsers()),
		]);

		await fileService.get(data.id).sync(data.fileIds);
	}

	isRealId(id: number): boolean
	{
		return Number.isInteger(id) && id > 0;
	}

	#updateFields: { [taskId: number]: TaskModel } = {};
	#updateTaskBefore: { [taskId: number]: TaskModel } = {};
	#updatePromises: { [taskId: number]: Resolvable } = {};
	#updateServerTaskDebounced: { [taskId: number]: Function } = {};

	async #updateTaskDebounced(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		this.#updateFields[id] = { ...this.#updateFields[id], ...fields };
		this.#updateTaskBefore[id] ??= taskBeforeUpdate;
		this.#updatePromises[id] ??= new Resolvable();
		this.#updateServerTaskDebounced[id] ??= Runtime.debounce(this.#updateTask, 500, this);
		this.#updateServerTaskDebounced[id](id);
		await this.#updatePromises[id];
	}

	async #updateTask(id: number): Promise<void>
	{
		const fields = this.#updateFields[id];
		delete this.#updateFields[id];

		const taskBeforeUpdate = this.#updateTaskBefore[id];
		delete this.#updateTaskBefore[id];

		const promise = this.#updatePromises[id];
		delete this.#updatePromises[id];

		await this.#updateTaskFields(id, fields, taskBeforeUpdate);
		await this.#updateScrumFields(id, fields, taskBeforeUpdate);
		await this.#updateDeadlineFields(id, fields, taskBeforeUpdate);
		await this.#updateDatePlanFields(id, fields, taskBeforeUpdate);

		promise.resolve();
	}

	async #updateTaskFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const taskFields = this.#getTaskFields(fields);
		if (this.#hasChanges(taskBeforeUpdate, taskFields))
		{
			const data = await apiClient.post('Task.update', { task: mapModelToDto({ id, ...taskFields }) });
			await this.extractTask(data);
		}
	}

	async #updateScrumFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const scrumFields = this.#getFilteredFields(fields, separateFields.scrumFields);
		if (this.#hasChanges(taskBeforeUpdate, scrumFields))
		{
			await apiClient.post('Scrum.updateTask', { taskId: id, fields: scrumFields });
		}
	}

	async #updateDeadlineFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const deadlineFields = this.#getFilteredFields(fields, separateFields.deadlineFields);
		if (this.#hasChanges(taskBeforeUpdate, deadlineFields))
		{
			await apiClient.post('Task.Deadline.update', { task: mapModelToDto({ id, ...deadlineFields }) });
		}
	}

	async #updateDatePlanFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const datePlanFields = this.#getFilteredFields(fields, separateFields.datePlanFields);
		if (this.#hasChanges(taskBeforeUpdate, datePlanFields))
		{
			await apiClient.post('Task.Plan.update', { task: mapModelToDto({ id, ...datePlanFields }) });
		}
	}

	#getTaskFields(task: TaskModel): TaskModel
	{
		return Object.fromEntries(Object.entries(task).filter(([field]) => {
			return Object.values(separateFields).every((set) => !set.has(field));
		}));
	}

	#getFilteredFields(fields: TaskModel, filterSet: Set): TaskModel
	{
		return Object.fromEntries(Object.entries(fields).filter(([field]) => filterSet.has(field)));
	}

	#hasChanges(task: TaskModel, fields: TaskModel): boolean
	{
		return Object.entries(fields).some(([field, value]) => JSON.stringify(task[field]) !== JSON.stringify(value));
	}

	#getStoreTask(id: number): TaskModel
	{
		return { ...this.$store.getters[`${Model.Tasks}/getById`](id) };
	}

	async #insertStoreTask(task: TaskModel): Promise<void>
	{
		await this.$store.dispatch(`${Model.Tasks}/insert`, task);
	}

	async #updateStoreTask(id: number, fields: TaskModel): Promise<void>
	{
		await this.$store.dispatch(`${Model.Tasks}/update`, { id, fields });
	}

	async #deleteStoreTask(id: number): Promise<void>
	{
		await this.$store.dispatch(`${Model.Tasks}/delete`, id);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
