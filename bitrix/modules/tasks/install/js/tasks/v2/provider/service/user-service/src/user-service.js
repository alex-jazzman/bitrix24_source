import { Extension } from 'main.core';

import type { Store } from 'ui.vue3.vuex';

import { Endpoint, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import type { UserModel } from 'tasks.v2.model.users';

import { mapDtoToModel } from './mappers';
import type { UserDto } from './types';

class UserService
{
	#loadingPromises: Map<number, Promise<void>> = new Map();

	getUrl(id: number): string
	{
		const settings = Extension.getSettings('tasks.v2.application.task-card');
		const urlTemplate = settings.userDetailUrlTemplate;

		if (!urlTemplate)
		{
			return `/company/personal/user/${id}/`;
		}

		return urlTemplate.replace('#USER_ID#', String(id));
	}

	async list(ids: number[]): Promise<void>
	{
		const unloadedIds = this.#getUnloadedIds(ids);
		const loadingPromises: Set<Promise<void>> = new Set();
		const idsToLoad = unloadedIds.filter((id) => {
			const loadingPromise = this.#loadingPromises.get(id);
			if (loadingPromise)
			{
				loadingPromises.add(loadingPromise);

				return false;
			}

			return true;
		});

		if (idsToLoad.length > 0)
		{
			const loadingPromise = this.#load(idsToLoad);
			idsToLoad.forEach((id) => this.#loadingPromises.set(id, loadingPromise));
			void loadingPromise.finally(() => {
				idsToLoad.forEach((id) => {
					if (this.#loadingPromises.get(id) === loadingPromise)
					{
						this.#loadingPromises.delete(id);
					}
				});
			});
			loadingPromises.add(loadingPromise);
		}

		await Promise.all(loadingPromises);
	}

	async #load(ids: number[]): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.UserList, { ids });

			const users = data.map((user: UserDto) => mapDtoToModel(user));

			await this.$store.dispatch(`${Model.Users}/upsertMany`, users);
		}
		catch (error)
		{
			console.error('UserService: list error', error);
		}
	}

	hasUsers(ids: number[]): boolean
	{
		return this.#getUnloadedIds(ids).length === 0;
	}

	#getUnloadedIds(ids: number[]): number[]
	{
		const loadedUsers: UserModel[] = this.$store.getters[`${Model.Users}/getByIds`](ids);
		const loadedIds = new Set(loadedUsers.map(({ id }) => id));

		return ids.filter((id: number) => !loadedIds.has(id));
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const userService = new UserService();
