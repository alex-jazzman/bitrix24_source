import { Store } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { ApiClient } from 'tasks.v2.lib.api-client';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { mapDtoToModel, prepareCheckLists } from './mappers';

class CheckListService
{
	#getPromises = {};

	async load(taskId: number): Promise<void>
	{
		// eslint-disable-next-line no-async-promise-executor
		this.#getPromises[taskId] ??= new Promise(async (resolve, reject) => {
			try
			{
				const data = await (new ApiClient()).post('CheckList.get', {
					task: { id: taskId },
				});

				const checkLists = data.map((it) => mapDtoToModel(it));

				await Promise.all([
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, checkLists),
					this.$store.dispatch(`${Model.Tasks}/update`, {
						id: taskId,
						fields: {
							containsChecklist: checkLists.length > 0,
							checklist: checkLists.map(({ id }) => id),
						},
					}),
				]);

				resolve();
			}
			catch (error)
			{
				reject(error);
			}
		});

		return this.#getPromises[taskId];
	}

	async save(taskId: number, checklists: CheckListModel[]): Promise<void>
	{
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try
			{
				const savedList = await (new ApiClient()).post('CheckList.save', {
					task: {
						id: taskId,
						checklist: prepareCheckLists(checklists),
					},
				});

				await Promise.all([
					this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true),
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, savedList),
					this.$store.dispatch(`${Model.Tasks}/update`, {
						id: taskId,
						fields: {
							containsChecklist: savedList.length > 0,
							checklist: savedList.map((item) => item.id),
						},
					}),
				]);

				void this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);

				resolve();
			}
			catch (error)
			{
				reject(error);
			}
		});
	}

	async collapse(taskId: number, checkListId: number): Promise<void>
	{
		await (new ApiClient()).post('CheckList.collapse', {
			taskId,
			checkListId,
		});

		void this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: {
				collapsed: true,
				expanded: false,
			},
		});
	}

	async expand(taskId: number, checkListId: number): Promise<void>
	{
		await (new ApiClient()).post('CheckList.expand', {
			taskId,
			checkListId,
		});

		void this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: {
				collapsed: false,
				expanded: true,
			},
		});
	}

	async complete(taskId: number, checkListId: number): Promise<void>
	{
		await (new ApiClient('tasks.task.', 'data')).post('checklist.complete', {
			taskId,
			checkListItemId: checkListId,
		});
	}

	async renew(taskId: number, checkListId: number): Promise<void>
	{
		await (new ApiClient('tasks.task.', 'data')).post('checklist.renew', {
			taskId,
			checkListItemId: checkListId,
		});
	}

	async delete(taskId: number, checkListId: number): Promise<void>
	{
		await (new ApiClient('tasks.task.', 'data')).post('checklist.delete', {
			taskId,
			checkListItemId: checkListId,
		});
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const checkListService = new CheckListService();
