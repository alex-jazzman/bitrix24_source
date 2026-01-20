import { Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Endpoint, Limit, Model, ResultStatus } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { entityTextEditor, EntityTextTypes } from 'tasks.v2.component.entity-text';
import type { ResultModel } from 'tasks.v2.model.results';

import { mapDtoToModel, mapModelToDto } from './mappers';
import type { ResultDto } from './types';

const limit = Limit.Results;

class ResultService
{
	async get(id: number): Promise<void>
	{
		const data = await apiClient.post(Endpoint.TaskResultGet, { result: { id } });

		await this.#addResultToStore(data);
	}

	async tail(taskId: number, withMap: boolean = true): Promise<void>
	{
		const size = limit;
		const page = 1;

		const { results, map } = await apiClient.post(Endpoint.TaskResultTail, {
			taskId,
			withMap,
			navigation: { size, page },
		});

		for (const result of results)
		{
			// eslint-disable-next-line no-await-in-loop
			await this.#addResultToStore(result);
		}

		if (withMap)
		{
			const ids = Object.keys(map).map((it) => parseInt(it, 10)).reverse();

			void taskService.updateStoreTask(taskId, {
				results: ids,
				resultsMessageMap: map,
			});
		}
	}

	async getAll(taskId: number): Promise<void>
	{
		const { results } = await apiClient.post(Endpoint.TaskResultGetAll, {
			taskId,
			withMap: false,
		});

		for (const result of results)
		{
			// eslint-disable-next-line no-await-in-loop
			await this.#addResultToStore(result);
		}
	}

	async save(taskId: number, results: ResultModel[], skipNotification: boolean = false): Promise<void>
	{
		const resultsToAdd = results.map((result) => {
			return mapModelToDto({ ...result, taskId });
		});

		const tempIds = resultsToAdd.map((result) => result.id);

		try
		{
			const data = await apiClient.post(Endpoint.TaskResultAdd, { results: resultsToAdd, skipNotification });

			for (const result of data)
			{
				const index = data.indexOf(result);
				const tempId = tempIds[index];

				// eslint-disable-next-line no-await-in-loop
				await this.#handleResultAfterAdd(taskId, tempId, result);
			}
		}
		catch (error)
		{
			console.error('ResultService.save error', error);

			tempIds.forEach((tempId) => {
				this.deleteResultFromTask(taskId, tempId);
				void this.deleteStoreResult(tempId);
			});
		}
	}

	async add(taskId: number | string, result: ResultModel): Promise<void>
	{
		const tempId = result.id;

		try
		{
			await this.updateStoreResult(tempId, result);

			this.addResultToTask(taskId, tempId);

			if (!idUtils.isReal(taskId))
			{
				return;
			}

			const data = await apiClient.post(Endpoint.TaskResultAdd, { results: [mapModelToDto(result)] });

			await this.#handleResultAfterAdd(taskId, tempId, data[0]);
		}
		catch (error)
		{
			console.error('ResultService.add error', error);

			this.deleteResultFromTask(taskId, tempId);

			await this.deleteStoreResult(tempId);
		}
	}

	async update(id: number, fields: ResultModel): Promise<void>
	{
		const resultBeforeUpdate = this.getStoreResult(id);
		const taskId = resultBeforeUpdate?.taskId;

		const result = { ...resultBeforeUpdate, ...fields };

		await this.updateStoreResult(id, fields);

		if (!idUtils.isReal(taskId))
		{
			return;
		}

		try
		{
			await apiClient.post(Endpoint.TaskResultUpdate, { result: mapModelToDto(result) });
		}
		catch (error)
		{
			await this.updateStoreResult(id, resultBeforeUpdate);

			console.error('ResultService.update error', error);
		}
	}

	async delete(id: number): Promise<void>
	{
		const resultBeforeDelete = this.getStoreResult(id);
		const taskId = resultBeforeDelete?.taskId;

		this.deleteResultFromTask(taskId, id);

		await this.deleteStoreResult(id);

		if (!idUtils.isReal(taskId))
		{
			return;
		}

		try
		{
			await apiClient.post(Endpoint.TaskResultDelete, { result: { id } });
		}
		catch (error)
		{
			console.error('ResultService.delete error', error);

			await this.insertStoreResult(resultBeforeDelete);

			this.addResultToTask(taskId, id);
		}
	}

	async addResultFromMessage(taskId: number, messageId: number, result: ResultModel): Promise<void>
	{
		const tempId = result.id;

		try
		{
			await this.#addResultToStore(result);

			this.addResultToTask(taskId, tempId, messageId);

			const data = await apiClient.post(Endpoint.TaskResultMessageAdd, { message: { id: messageId } });

			await this.#handleResultAfterAdd(taskId, tempId, data);
		}
		catch (error)
		{
			console.error('ResultService.addResultFromMessage error', error);

			this.deleteResultFromTask(taskId, tempId);

			await this.deleteStoreResult(tempId);
		}
	}

	hasOpenedResults(taskId: number): boolean
	{
		const task = taskService.getStoreTask(taskId);
		if (!task?.results.length > 0)
		{
			return false;
		}

		for (const resultId of task.results)
		{
			const result = this.getStoreResult(resultId);

			if (result && result.status === ResultStatus.Open)
			{
				return true;
			}
		}

		return false;
	}

	async closeResults(taskId: number): void
	{
		const task = taskService.getStoreTask(taskId);
		if (!task?.results.length > 0)
		{
			return;
		}

		for (const resultId of task.results)
		{
			const result = this.getStoreResult(resultId);

			if (result && result.status === ResultStatus.Open)
			{
				// eslint-disable-next-line no-await-in-loop
				await this.updateStoreResult(resultId, { status: ResultStatus.Closed });
			}
		}
	}

	async #handleResultAfterAdd(taskId: number | string, tempId: string, data: ResultDto): Promise<ResultDto>
	{
		const { id } = data;

		fileService.replace(tempId, id, EntityTypes.Result);
		entityTextEditor.replace(tempId, id, EntityTextTypes.Result);

		await this.#addResultToStore(data);

		const task = taskService.getStoreTask(taskId);
		const hasResultInTask = (task?.results || []).includes(tempId);

		if (hasResultInTask)
		{
			const results = (task?.results || []).map((resultId) => (resultId === tempId ? id : resultId));

			const resultsMessageMap = { ...(task?.resultsMessageMap) };
			resultsMessageMap[id] = resultsMessageMap[tempId];
			delete resultsMessageMap[tempId];

			this.#updateStoreTask(taskId, results, resultsMessageMap);
		}
		else
		{
			this.addResultToTask(taskId, id);
		}

		await this.deleteStoreResult(tempId);
	}

	getStoreResult(id: number): ?ResultModel
	{
		return this.$store.getters[`${Model.Results}/getById`](id) || null;
	}

	hasStoreResult(id: number): boolean
	{
		return Boolean(this.getStoreResult(id));
	}

	async insertStoreResult(result: ResultModel): Promise<void>
	{
		await this.$store.dispatch(`${Model.Results}/insert`, result);
	}

	async updateStoreResult(id: number, fields: ResultModel): Promise<void>
	{
		await this.$store.dispatch(`${Model.Results}/update`, { id, fields });
	}

	async deleteStoreResult(id: number): Promise<void>
	{
		await this.$store.dispatch(`${Model.Results}/delete`, id);
	}

	async #addResultToStore(result: ResultDto): void
	{
		const mappedResult = mapDtoToModel(result);

		await this.insertStoreResult(mappedResult);

		if (Type.isArrayFilled(mappedResult.files))
		{
			fileService.get(mappedResult.id, EntityTypes.Result).loadFilesFromData(mappedResult.files);
		}

		entityTextEditor.get(
			mappedResult.id,
			EntityTextTypes.Result,
			{
				content: mappedResult.text,
				blockSpaceInline: 'var(--ui-space-stack-xl)',
			},
		);
	}

	addResultToTask(taskId: number, resultId: number, messageId: number | null = null): void
	{
		const task = taskService.getStoreTask(taskId);

		const results = [resultId, ...(task?.results || [])];

		const resultsMessageMap = { ...(task?.resultsMessageMap), [resultId]: messageId };

		this.#updateStoreTask(taskId, results, resultsMessageMap);
	}

	deleteResultFromTask(taskId: number, resultId: number): void
	{
		const task = taskService.getStoreTask(taskId);

		const results = (task?.results || []).filter((it) => it !== resultId);

		const resultsMessageMap = { ...(task?.resultsMessageMap) };
		delete resultsMessageMap[resultId];

		this.#updateStoreTask(taskId, results, resultsMessageMap);
	}

	#updateStoreTask(taskId: number, results: number[], resultsMessageMap: {}): void
	{
		const containsResults = results.length > 0;

		void taskService.updateStoreTask(taskId, {
			results,
			resultsMessageMap,
			containsResults,
		});
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const resultService = new ResultService();
