import { ajax } from 'main.core';

import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { ApiClient } from 'booking.lib.api-client';
import { ResourceTypeMappers } from 'booking.provider.service.resources-type-service';
import { ResourceMappers } from 'booking.provider.service.resources-service';
import type { CrmFormResourceModel } from 'booking.model.crm-form';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';
import type { ResourceSkuRelationsModel } from 'booking.model.resources';
import type { ResourceTypeDto } from 'booking.provider.service.resources-type-service';

import { mapDtoToModel } from './mapper';
import { ResourceDto, ResourceSkuRelationsData } from './types';

class CrmFormService
{
	#getResourcesRequest: ?Promise<ResourceDto[]>;
	#getResourcesTypesRequest: ?Promise<ResourceTypeDto[]>;
	#getCatalogSkuEntityOptionsRequest: ?Promise<{ data: CatalogSkuEntityOptions }>;
	#getDefaultResourceSkuRelations: ?Promise<ResourceSkuRelationsData>;

	async getResources(ids: number[]): Promise<CrmFormResourceModel[]>
	{
		try
		{
			this.#getResourcesRequest ??= this.#fetchGetResources;
			const { data } = await this.#getResourcesRequest(ids);

			return data.map((resourceDto) => mapDtoToModel(resourceDto));
		}
		catch (error)
		{
			console.error('CrmFormService: get resources error', error);

			return [];
		}
	}

	#fetchGetResources(ids: number[]): Promise<ResourceDto[]>
	{
		const action: string = new ApiClient().buildUrl('CrmForm.PublicForm.getResources');

		return ajax.runAction(action, {
			data: {
				ids,
			},
		});
	}

	async getCatalogSkuEntityOptions(): Promise<?CatalogSkuEntityOptions>
	{
		try
		{
			this.#getCatalogSkuEntityOptionsRequest ??= this.#requestCatalogSkuEntityOptions;
			const response = await this.#getCatalogSkuEntityOptionsRequest();

			return response.data;
		}
		catch (error)
		{
			console.error('CrmFormService: get CatalogSkuEntityOptions error', error);

			return null;
		}
	}

	#requestCatalogSkuEntityOptions(): Promise<{ data: CatalogSkuEntityOptions }>
	{
		return ajax.runAction(new ApiClient().buildUrl('CrmForm.SettingsForm.getCatalogSkuEntityOptions'), {
			json: {},
		});
	}

	async getResourceTypeList(): Promise<void>
	{
		try
		{
			this.#getResourcesTypesRequest ??= this.#requestResourcesTypeList;
			const response = await this.#getResourcesTypesRequest();
			const resourceTypes = response.data.map((dto) => ResourceTypeMappers.mapDtoToModel(dto));

			await Core.getStore().dispatch(`${Model.ResourceTypes}/upsertMany`, resourceTypes);
		}
		catch (e)
		{
			console.error('CrmFormService: get resource types error', e);
		}
	}

	#requestResourcesTypeList(): Promise<{ data: ResourceTypeDto[] }>
	{
		return ajax.runAction(new ApiClient().buildUrl('ResourceType.list'), {
			json: {},
		});
	}

	getResourceSkuRelations(resources: { id: number, skus: number[] }[] = []): Promise<ResourceSkuRelationsModel[]>
	{
		if (resources.length === 0)
		{
			return this.getDefaultResourceSkuRelations();
		}

		return this.getFormSpecificResourceSkuRelations(resources);
	}

	async getDefaultResourceSkuRelations(): Promise<ResourceSkuRelationsModel[]>
	{
		try
		{
			this.#getDefaultResourceSkuRelations ??= this.#requestDefaultResourceSkuRelations;

			const response: ResourceSkuRelationsData = await this.#getDefaultResourceSkuRelations();

			return response.resources.map(
				(dto) => ResourceMappers.mapResourceSkuRelationsDtoToModel(dto),
			);
		}
		catch (error)
		{
			console.error('CrmFormService: get default resource skus relations error', error);

			return [];
		}
	}

	async #requestDefaultResourceSkuRelations(): Promise<ResourceSkuRelationsData>
	{
		const action = new ApiClient().buildUrl('CrmForm.SettingsForm.getDefaultResourceSkuRelations');
		const { data } = await ajax.runAction(action, {
			json: {},
		});

		return data;
	}

	async getFormSpecificResourceSkuRelations(resources: {
		id: number,
		skus: number[]
	}[]): Promise<ResourceSkuRelationsModel[]>
	{
		try
		{
			const action = new ApiClient().buildUrl('CrmForm.SettingsForm.getFormSpecificResourceSkuRelations');
			const { data }: { data: ResourceSkuRelationsData } = await ajax.runAction(action, {
				json: {
					resources,
				},
			});

			return data.resources.map(
				(dto) => ResourceMappers.mapResourceSkuRelationsDtoToModel(dto),
			);
		}
		catch (error)
		{
			console.log('CrmFormService: get default resource skus relations error', error);

			return [];
		}
	}
}

export const crmFormService = new CrmFormService();
