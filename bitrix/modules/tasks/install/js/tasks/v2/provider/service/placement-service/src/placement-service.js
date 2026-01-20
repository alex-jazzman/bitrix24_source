import { Store } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { placementsMeta } from 'tasks.v2.component.fields.placements';
import type { PlacementModel } from 'tasks.v2.model.placements';

import { mapDtoToModel } from './mappers';
import type { PlacementDto } from './types';

class PlacementService
{
	async get(taskId: number): Promise<void>
	{
		const { placements } = await apiClient.post('Task.Placement.list', { taskId });
		const placementModels = placements.map((dto: PlacementDto): PlacementModel => mapDtoToModel(dto));
		const placementIds = placementModels.map(({ id }: PlacementModel) => id);

		await Promise.all([
			this.$store.dispatch(`${Model.Placements}/upsertMany`, placementModels),
			this.$store.dispatch(`${Model.Tasks}/update`, {
				id: taskId,
				fields: {
					placementIds,
					containsPlacements: placementIds.length > 0,
				},
			}),
			this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
				id: taskId,
				fieldName: placementsMeta.id,
				isFilled: placementIds.length > 0,
			}),
		]);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const placementService = new PlacementService();
