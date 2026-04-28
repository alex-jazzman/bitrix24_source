import type { AjaxResponse } from 'main.core';

import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { ApiClient } from 'booking.lib.api-client';
import type { ResourceModelWithFile, ResourceModel, ResourceSkuRelationsModel } from 'booking.model.resources';
import type { ResourceSkuRelationsDto } from './types';

import {
	mapModelToDto,
	mapDtoToModel,
	mapResourceSkuRelationsDtoToModel,
	mapResourceSkuRelationsModelToDto,
} from './mappers';

class ResourceService
{
	async add(resource: ResourceModelWithFile): Promise<AjaxResponse>
	{
		try
		{
			const resourceDto = await mapModelToDto(resource);
			const data = await (new ApiClient()).post('Resource.add', { resource: resourceDto });
			const createdResource = mapDtoToModel(data);

			Core.getStore().commit('resources/upsert', createdResource);

			if (createdResource.isMain)
			{
				await Core.getStore().dispatch(`${Model.Favorites}/add`, createdResource.id);
			}

			if (Core.getStore().getters[`${Model.Interface}/canTurnOnTrial`])
			{
				void this.#turnOnTrial();
			}

			this.#updateResourcesFromFavorites();

			return data;
		}
		catch (error)
		{
			console.error('ResourceService: add error', error);

			return error;
		}
	}

	async update(resource: ResourceModelWithFile): Promise<AjaxResponse>
	{
		const id = resource.id;
		const resourceBeforeUpdate = { ...Core.getStore().getters['resources/getById'](id) };

		try
		{
			const resourceDto = await mapModelToDto(resource);
			const data = await (new ApiClient()).post('Resource.update', { resource: resourceDto });
			const updatedResource = mapDtoToModel(data);

			Core.getStore().commit('resources/upsert', updatedResource);

			if (resourceBeforeUpdate.isMain && !updatedResource.isMain)
			{
				await Core.getStore().dispatch(`${Model.Favorites}/delete`, id);
			}

			this.#updateResourcesFromFavorites();

			return data;
		}
		catch (error)
		{
			console.error('ResourceService: update error', error);

			return error;
		}
	}

	#updateResourcesFromFavorites(): void
	{
		const isFilterMode = Core.getStore().getters[`${Model.Filter}/isFilterMode`];
		if (isFilterMode)
		{
			return;
		}

		const favorites = Core.getStore().getters[`${Model.Favorites}/get`];

		void Core.getStore().dispatch(`${Model.Interface}/setResourcesIds`, favorites);
	}

	async delete(resourceId: number, withFutureBookings: boolean = false): Promise<void>
	{
		try
		{
			const action = withFutureBookings ? 'Resource.forceDelete' : 'Resource.delete';
			const { removedBookingIds } = await (new ApiClient()).post(action, { id: resourceId });

			const $store = Core.getStore();
			const updateStoreActions = [
				$store.dispatch(`${Model.Resources}/delete`, resourceId),
				$store.dispatch(`${Model.Favorites}/delete`, resourceId),
				$store.dispatch(`${Model.Interface}/deleteResourceId`, resourceId),
				$store.dispatch(`${Model.Interface}/removeDeletingResource`, resourceId),
			];

			if (removedBookingIds)
			{
				updateStoreActions.push(
					$store.dispatch(`${Model.Bookings}/deleteMany`, removedBookingIds),
				);
			}

			await Promise.all(updateStoreActions);
		}
		catch (error)
		{
			console.error('ResourceService: delete error', error);
		}
	}

	async hasFutureBookings(resourceId: number): Promise<?boolean>
	{
		try
		{
			return (new ApiClient()).post('Resource.hasFutureBookings', { resourceId });
		}
		catch (error)
		{
			console.error('ResourceService: hasFutureBookings error', error);
		}

		return Promise.resolve();
	}

	async #turnOnTrial(): Promise<void>
	{
		await Promise.all([
			Core.getStore().dispatch(`${Model.Interface}/setCanTurnOnTrial`, false),
			Core.getStore().dispatch(`${Model.Interface}/setIsFeatureEnabled`, true),
		]);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		await Core.getStore().dispatch(`${Model.Interface}/setIsShownTrialPopup`, true);
	}

	async loadResourceSkuRelations(): Promise<void>
	{
		try
		{
			const { resources } = await new ApiClient().get('ResourceSkuRelations.get');

			const resourcesSkuRelationsModel = resources.map(
				(resourceSkuRelationsDto: ResourceSkuRelationsDto): ResourceSkuRelationsModel => {
					return mapResourceSkuRelationsDtoToModel(resourceSkuRelationsDto);
				},
			);

			await Promise.all([
				Core.getStore().dispatch(`${Model.Resources}/setResourcesSkuRelations`, resourcesSkuRelationsModel),
			]);
		}
		catch (error)
		{
			console.error('BookingLoadResourceSkuRelations: error', error);
		}
	}

	async updateResourceSkuRelations(resources: (ResourceSkuRelationsModel | ResourceModel)[]): Promise<void>
	{
		try
		{
			const resourcesSkuRelationsDto = resources.map(
				(resourceSkuRelationsModel: ResourceSkuRelationsModel | ResourceModel): ResourceSkuRelationsModel => {
					return mapResourceSkuRelationsModelToDto(resourceSkuRelationsModel);
				},
			);

			await (new ApiClient()).post(
				'ResourceSkuRelations.save',
				{ resources: resourcesSkuRelationsDto },
			);

			await Promise.all([
				Core.getStore().dispatch(`${Model.Sku}/setReloadRelations`, true),
			]);
		}
		catch (error)
		{
			console.error('ResourceService updateResourceSkuRelations API error:', error);
		}
	}
}

export const resourceService = new ResourceService();
