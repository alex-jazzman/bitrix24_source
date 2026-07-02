import type { Store } from 'ui.vue3.vuex';

import { Core } from 'booking.core';
import { Model } from 'booking.const';

import type { Cell } from 'booking.model.interface';
import type { ResourceModel } from 'booking.model.resources';

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

		return !this.#hasSmallSlotSize(resource);
	}

	#getResourceById(resourceId: number): ResourceModel | null
	{
		return this.#store.getters[`${Model.Resources}/getById`](resourceId) || null;
	}

	#hasSmallSlotSize(resource: ResourceModel): boolean
	{
		return (resource.slotRanges[0]?.slotSize ?? 60) < MinCellStatsSlotSizeMinutes;
	}

	get #store(): Store
	{
		return Core.getStore();
	}
}

export const weekCellService: WeekCellService = new WeekCellService();
