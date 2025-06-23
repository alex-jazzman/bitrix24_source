import { Store } from 'ui.vue3.vuex';
import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { ApiClient } from 'tasks.v2.lib.api-client';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { prepareCheckLists } from './mappers';

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

				await Promise.all([
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, data),
					this.$store.dispatch(`${Model.Tasks}/update`, {
						id: taskId,
						fields: {
							containsChecklist: data.length > 0,
							checklist: data.map((item) => item.id),
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

				const oldIds = checklists.map((item: CheckListModel) => item.id);

				await Promise.all([
					this.$store.dispatch(`${Model.CheckList}/deleteMany`, oldIds),
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, savedList),
					this.$store.dispatch(`${Model.Tasks}/update`, {
						id: taskId,
						fields: {
							containsChecklist: true,
							checklist: savedList.map((item) => item.id),
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
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const checkListService = new CheckListService();
