import { Runtime } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Model, TaskStatus } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskGetExtractor } from './task-get-extractor';
import { mapModelToDto } from './mappers';
import type { TaskDto } from './types';

class TaskService
{
	async getById(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post('Task.get', { task: { id } });

			await this.#extractTask(data);
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

			await this.#extractTask(data);

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

		if (!this.#isRealId(id))
		{
			return;
		}

		try
		{
			await this.#updateScrumFields(id, fields, taskBeforeUpdate);
			await this.#updateDeadlineFields(id, fields, taskBeforeUpdate);
			await this.#updateTaskFields(id, fields, taskBeforeUpdate);
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

		if (!this.#isRealId(id))
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

	#isRealId(id: number): boolean
	{
		return Number.isInteger(id) && id > 0;
	}

	#updateFields: { [taskId: number]: TaskModel } = {};
	#updatePromises: { [taskId: number]: Resolvable } = {};
	#updateServerTaskDebounced: { [taskId: number]: Function } = {};

	async #updateTaskFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const taskFields = this.#getTaskFields(fields);
		if (!this.#hasChanges(taskBeforeUpdate, taskFields))
		{
			return;
		}

		this.#updateFields[id] = { ...this.#updateFields[id], ...taskFields };

		this.#updatePromises[id] ??= new Resolvable();
		this.#updateServerTaskDebounced[id] ??= Runtime.debounce(this.#updateServerTask, 500, this);
		this.#updateServerTaskDebounced[id](id);
		await this.#updatePromises[id];
	}

	async #updateServerTask(id: number): Promise<void>
	{
		const fields = this.#updateFields[id];
		delete this.#updateFields[id];

		const promise = this.#updatePromises[id];
		delete this.#updatePromises[id];

		const data = await apiClient.post('Task.update', { task: mapModelToDto({ id, ...fields }) });
		await this.#extractTask(data);

		promise.resolve();
	}

	async #updateScrumFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const scrumFields = this.#getFilteredFields(fields, this.#scrumFields);
		if (!this.#hasChanges(taskBeforeUpdate, scrumFields))
		{
			return;
		}

		await apiClient.post('Scrum.updateTask', { taskId: id, fields: scrumFields });
	}

	async start(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.start', TaskStatus.InProgress);
	}

	async disapprove(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.disapprove', TaskStatus.Pending);
	}

	async defer(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.defer', TaskStatus.Deferred);
	}

	async approve(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.approve', TaskStatus.Completed);
	}

	async pause(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.pause', TaskStatus.Pending);
	}

	async complete(id: number): Promise<void>
	{
		const status = this.#getStoreTask(id).needsControl ? TaskStatus.SupposedlyCompleted : TaskStatus.Completed;

		await this.#updateStatus(id, 'Task.Status.complete', status);
	}

	async renew(id: number): Promise<void>
	{
		await this.#updateStatus(id, 'Task.Status.renew', TaskStatus.Pending);
	}

	async getLegacyCommentsByTaskId(id: number): Promise<string>
	{
		try
		{
			const data = await apiClient.post('LegacyComment.get', { task: { id } });

			return (data.html) ?? '';
		}
		catch (error)
		{
			console.error('TaskService: getLegacyCommentsByTaskId error', error);

			return '';
		}
	}

	async #updateStatus(id: number, action: string, status: string): Promise<void>
	{
		const taskBeforeUpdate = this.#getStoreTask(id);

		await this.#updateStoreTask(id, { status });

		if (!this.#isRealId(id))
		{
			return;
		}

		try
		{
			const data = await apiClient.post(action, { task: { id } });

			await this.#extractTask(data);
		}
		catch (error)
		{
			await this.#updateStoreTask(id, taskBeforeUpdate);

			console.error(`TaskService: ${action} error`, error);
		}
	}

	async #updateDeadlineFields(id: number, fields: TaskModel, taskBeforeUpdate: TaskModel): Promise<void>
	{
		const deadlineFields = this.#getFilteredFields(fields, this.#deadlineFields);
		if (!this.#hasChanges(taskBeforeUpdate, deadlineFields))
		{
			return;
		}

		await apiClient.post('Task.Deadline.update', { task: mapModelToDto({ id, ...deadlineFields }) });
	}

	#getTaskFields(fields: TaskModel): TaskModel
	{
		return Object.fromEntries(Object.entries(fields).filter(([field]) => {
			const scrumField = this.#scrumFields.has(field);
			const statusField = this.#statusFields.has(field);
			const deadlineField = this.#deadlineFields.has(field);

			return !scrumField && !statusField && !deadlineField;
		}));
	}

	#getFilteredFields(fields: TaskModel, filterSet: Set): TaskModel
	{
		return Object.fromEntries(Object.entries(fields).filter(([field]) => filterSet.has(field)));
	}

	get #scrumFields(): Set
	{
		return new Set(['storyPoints', 'epicId']);
	}

	get #statusFields(): Set
	{
		return new Set(['status']);
	}

	get #deadlineFields(): Set
	{
		return new Set(['deadlineTs']);
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

	async #extractTask(data: TaskDto): Promise<void>
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

	async #deleteStoreTask(id: number): Promise<void>
	{
		await this.$store.dispatch(`${Model.Tasks}/delete`, id);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const taskService = new TaskService();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
