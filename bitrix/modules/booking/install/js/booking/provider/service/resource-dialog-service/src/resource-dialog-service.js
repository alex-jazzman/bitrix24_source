import { Type } from 'main.core';

import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { resourcesDateCache } from 'booking.lib.resources-date-cache';
import { ApiClient } from 'booking.lib.api-client';
import { ResourceMappers, type ResourceDto } from 'booking.provider.service.resources-service';
import { type ResourceModel } from 'booking.model.resources';

import { ResourceDialogDataExtractor } from './resource-dialog-data-extractor';
import { MainResourcesExtractor } from './main-resources-extractor';
import { type MainResourcesOptions, type ResourceDialogResponse } from './types';

const MainResourcesCacheKey = Object.freeze({
	All: 'all',
	ShortSlotsOnly: 'shortSlotsOnly',
});

class ResourceDialogService
{
	#queryCache = [];
	#loadByIdsPromises = {};
	#loadBySkuIdsPromises = {};
	#mainResourcesCache: Map<string, Promise<ResourceDto[]>> = new Map();

	async loadByIds(idsToLoad: number[], dateTs: number): Promise<void>
	{
		try
		{
			this.#loadByIdsPromises[dateTs] ??= {};

			const requestedIds = Object.keys(this.#loadByIdsPromises[dateTs])
				.flatMap((key) => key.split(','))
				.map((id) => Number(id))
			;

			const requestedIdsSet = new Set(requestedIds);

			const ids = idsToLoad.filter((id) => !requestedIdsSet.has(id));
			if (!Type.isArrayFilled(ids))
			{
				await Promise.all(Object.values(this.#loadByIdsPromises[dateTs]));

				return;
			}

			const idsKey = ids.join(',');

			this.#loadByIdsPromises[dateTs][idsKey] = this.#requestLoadByIds(ids, dateTs);

			const data = await this.#loadByIdsPromises[dateTs][idsKey];

			await this.#upsertResponseData(data, dateTs);
		}
		catch (error)
		{
			console.error('ResourceDialogLoadByIdsRequest: error', error);
		}
	}

	async loadBySkuIds(idsToLoad: number[], dateTs: number): Promise<void>
	{
		try
		{
			this.#loadBySkuIdsPromises[dateTs] ??= {};

			const requestedIds = Object.keys(this.#loadBySkuIdsPromises[dateTs])
				.flatMap((key) => key.split(','))
				.map((id) => Number(id))
			;

			const requestedIdsSet = new Set(requestedIds);

			const ids = idsToLoad.filter((id) => !requestedIdsSet.has(id));
			if (!Type.isArrayFilled(ids))
			{
				await Promise.all(Object.values(this.#loadBySkuIdsPromises[dateTs]));

				return;
			}

			const idsKey = ids.join(',');

			this.#loadBySkuIdsPromises[dateTs][idsKey] = this.#requestLoadBySkuIds(ids, dateTs);

			const data = await this.#loadBySkuIdsPromises[dateTs][idsKey];

			await this.#upsertResponseData(data, dateTs);
		}
		catch (error)
		{
			console.error('ResourceDialogLoadBySkuIdsRequest: error', error);
		}
	}

	async #requestLoadByIds(ids: number[], dateTs: number): Promise<void>
	{
		return new ApiClient().post('ResourceDialog.loadByIds', { ids, dateTs });
	}

	async #requestLoadBySkuIds(ids: number[], dateTs: number): Promise<void>
	{
		return new ApiClient().post('ResourceDialog.loadBySkuIds', { ids, dateTs });
	}

	async fillDialog(dateTs: number): Promise<void>
	{
		try
		{
			const data = await new ApiClient().post('ResourceDialog.fillDialog', { dateTs });

			await this.#upsertResponseData(data, dateTs);
		}
		catch (error)
		{
			console.error('ResourceDialogFillDialogRequest: error', error);
		}
	}

	async doSearch(query: string, dateTs: number, typeIds: number[]): Promise<void>
	{
		if (!Type.isStringFilled(query) && typeIds.length === 0)
		{
			return;
		}

		const fullQuery = `${query}-${typeIds.join('-')}`;
		if (this.#isQueryLoaded(fullQuery))
		{
			return;
		}

		this.#queryCache.push(fullQuery);

		try
		{
			const data = await new ApiClient().post('ResourceDialog.doSearch', { query, dateTs, typeIds });

			await this.#upsertResponseData(data, dateTs);
		}
		catch (error)
		{
			console.error('ResourceDialogDoSearchRequest: error', error);
		}
	}

	async #upsertResponseData(data: ResourceDialogResponse, dateTs: number): Promise<void>
	{
		const extractor = new ResourceDialogDataExtractor(data);

		resourcesDateCache.upsertIds(dateTs, extractor.getResources().map((it) => it.id));

		await Promise.all([
			Core.getStore().dispatch('bookings/upsertMany', extractor.getBookings()),
			Core.getStore().dispatch('clients/upsertMany', extractor.getClients()),
			Core.getStore().dispatch('resources/upsertMany', extractor.getResources()),
		]);
	}

	#isQueryLoaded(query: string): boolean
	{
		return this.#queryCache.some((it) => query.startsWith(it));
	}

	async getMainResources(options: MainResourcesOptions = {}): Promise<ResourceModel[]>
	{
		try
		{
			const cacheKey = this.#getMainResourcesCacheKey(options);
			if (!this.#mainResourcesCache.has(cacheKey))
			{
				this.#mainResourcesCache.set(cacheKey, this.#requestGetMainResources(options));
			}

			const mainResourcesPromise = this.#mainResourcesCache.get(cacheKey);
			if (!mainResourcesPromise)
			{
				return [];
			}

			const data: ResourceDto[] = await mainResourcesPromise;
			const extractor = new MainResourcesExtractor(data);

			if (options.shortSlotsOnly !== true)
			{
				const ids = extractor.getMainResourceIds();
				await Core.getStore().dispatch(`${Model.MainResources}/setMainResources`, ids);
			}

			const resources = data.map(
				(resourceDto) => ResourceMappers.mapDtoToModel(resourceDto),
			);
			await Core.getStore().dispatch(`${Model.Resources}/upsertMany`, resources);

			return resources;
		}
		catch (error)
		{
			console.error('ResourceDialogGetMainResources: error', error);

			return [];
		}
	}

	#getMainResourcesCacheKey(options: MainResourcesOptions): string
	{
		return options.shortSlotsOnly === true
			? MainResourcesCacheKey.ShortSlotsOnly
			: MainResourcesCacheKey.All;
	}

	#requestGetMainResources(options: MainResourcesOptions): Promise<ResourceDto[]>
	{
		const api = new ApiClient();

		return api.post('ResourceDialog.getMainResources', {
			shortSlotsOnly: options.shortSlotsOnly === true,
		});
	}

	clearMainResourcesCache(): void
	{
		this.#mainResourcesCache.clear();
	}
}

export const resourceDialogService = new ResourceDialogService();
