import { type Store } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { Core } from 'booking.core';
import { isRealId } from 'booking.lib.is-real-id';
import { type BookingModel } from 'booking.model.bookings';

import { MaxInteractionBookingDurationsMs } from './const';

export type BookingGridDragPolicyParams = {
	booking: BookingModel | null,
	isWeekMode: boolean,
};

export type BookingCheckListDragPolicyParams = {
	draggedBookingId: number | string | null,
	draggedBookingResourceId: ?number,
};

class DragPolicy
{
	canMoveBookingOnGrid(booking: BookingModel | null): boolean
	{
		if (!booking)
		{
			return false;
		}

		return !this.#isWeekMode && (booking.dateToTs - booking.dateFromTs <= MaxInteractionBookingDurationsMs);
	}

	canMoveBookingOnCheckList({ draggedBookingId, draggedBookingResourceId }: BookingCheckListDragPolicyParams): boolean
	{
		return Boolean(draggedBookingId)
			&& isRealId(draggedBookingId)
			&& !this.#store.getters[`${Model.Resources}/isDeleted`](draggedBookingResourceId)
		;
	}

	get #store(): Store
	{
		return Core.getStore();
	}

	get #isWeekMode(): boolean
	{
		return this.#store.getters[`${Model.Interface}/isWeekMode`];
	}
}

export const dragPolicy: DragPolicy = new DragPolicy();
