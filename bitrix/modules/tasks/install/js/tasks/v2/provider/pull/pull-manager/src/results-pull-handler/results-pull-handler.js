import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { resultService, ResultMappers } from 'tasks.v2.provider.service.result-service';
import type { ResultDto } from 'tasks.v2.provider.service.result-service';
import { Store } from 'ui.vue3.vuex';

import { BasePullHandler } from '../handler/base-pull-handler';

export class ResultsPullHandler extends BasePullHandler
{
	getMap(): { [command: string]: Function }
	{
		return {
			task_result_create: this.#handleResultCreate,
			task_result_update: this.#handleResultUpdate,
			task_result_delete: this.#handleResultDelete,
		};
	}

	#handleResultCreate = async (data): void => {
		const result: ResultDto = data.result;
		const { id, taskId, messageId } = result;

		if (resultService.hasStoreResult(id) || !taskService.hasStoreTask(taskId))
		{
			return;
		}

		const insertedResult = ResultMappers.mapDtoToModel(result);

		await resultService.insertStoreResult(insertedResult);
		resultService.addResultToTask(taskId, id, messageId);

		void resultService.get(id);
	};

	#handleResultUpdate = async (data): void => {
		const result: ResultDto = data.result;
		const { id, fileIds, author } = result;

		if (!resultService.hasStoreResult(id) || author.id === this.#currentUserId)
		{
			return;
		}

		const updatedResult = ResultMappers.mapDtoToModel(result);

		await resultService.updateStoreResult(id, updatedResult);

		await fileService.get(id, EntityTypes.Result).sync(fileIds);
	};

	#handleResultDelete = (data): void => {
		const result: ResultDto = data.result;
		const { id, taskId } = result;

		if (!taskService.hasStoreTask(taskId) || !resultService.hasStoreResult(taskId))
		{
			return;
		}

		resultService.deleteResultFromTask(taskId, id);
		void resultService.deleteStoreResult(id);
	};

	get #currentUserId(): number
	{
		return this.$store.getters[`${Model.Interface}/currentUserId`];
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
