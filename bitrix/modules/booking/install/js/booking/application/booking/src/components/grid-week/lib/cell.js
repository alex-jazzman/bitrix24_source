import { type Store } from 'ui.vue3.vuex';

import { Core } from 'booking.core';
import { Model } from 'booking.const';

import { type Cell } from 'booking.model.interface';
import { type ResourceModel } from 'booking.model.resources';

import { MinCellStatsSlotSizeMinutes } from '../const';

class WeekCellService
{
	isCreationAvailable({ resourceId }: Pick<Cell, 'resourceId'>): boolean
	{
		const resource = this.#getResourceById(resourceId);
		if (!resource)
		{
			return false;
		}

		const slotSize = resource.slotRanges[0]?.slotSize ?? 60;

		return this.isCreationAvailableForSlotSize(slotSize);
	}

	isCreationAvailableForSlotSize(slotSize: number): boolean
	{
		return slotSize >= MinCellStatsSlotSizeMinutes;
	}

	#getResourceById(resourceId: number): ResourceModel | null
	{
		return this.#store.getters[`${Model.Resources}/getById`](resourceId) || null;
	}

	get #store(): Store
	{
		return Core.getStore();
	}
}

export const weekCellService: WeekCellService = new WeekCellService();
