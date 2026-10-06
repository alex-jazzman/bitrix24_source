import { Text } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { LimitFeatureId, Model } from 'booking.const';
import { Core } from 'booking.core';
import { BookingAnalytics } from 'booking.lib.analytics';
import { limit } from 'booking.lib.limit';
import { type BookingModel } from 'booking.model.bookings';
import { type ClientData } from 'booking.model.clients';
import { type Cell, type Intersections } from 'booking.model.interface';
import { type ResourceModel } from 'booking.model.resources';
import { type WaitListItemModel } from 'booking.model.wait-list';
import { bookingService } from 'booking.provider.service.booking-service';
import { waitListService } from 'booking.provider.service.wait-list-service';

type MoveBookingOnGridParams = {
	bookingId: number | string,
	resourceId: number,
	cell: Cell,
};

type CreateBookingFromWaitListItemParams = {
	waitListItemId: number,
	cell: Cell,
};

type EditingState = {
	editingBookingId: number | string,
	editingWaitListItemId: number | string,
};

class DragActions
{
	async moveBookingOnGrid({ bookingId, resourceId, cell }: MoveBookingOnGridParams): Promise<void>
	{
		const booking: BookingModel = this.#store.getters[`${Model.Bookings}/getById`](bookingId);
		if (!booking)
		{
			return;
		}

		if (cell.fromTs === booking.dateFromTs && cell.toTs === booking.dateToTs && cell.resourceId === resourceId)
		{
			return;
		}

		const resourceIds = booking.resourcesIds.includes(cell.resourceId)
			? booking.resourcesIds
			: [
				cell.resourceId,
				...booking.resourcesIds.filter((id: number) => id !== resourceId),
			]
		;

		const uniqueResourceIds = [...new Set(resourceIds)];
		const isMultiResourcesFeatureEnabled = this.#store.state[Model.Interface].enabledFeature.bookingMulti;
		if (uniqueResourceIds.length > 1 && !isMultiResourcesFeatureEnabled)
		{
			void limit.show(LimitFeatureId.MultiResources);

			return;
		}

		await bookingService.update({
			id: booking.id,
			dateFromTs: cell.fromTs,
			dateToTs: cell.toTs,
			resourcesIds: uniqueResourceIds,
			timezoneFrom: booking.timezoneFrom,
			timezoneTo: booking.timezoneTo,
		});
	}

	async moveBookingToWaitList(bookingId: number): Promise<void>
	{
		const booking: BookingModel = this.#store.getters[`${Model.Bookings}/getById`](bookingId);
		if (!booking)
		{
			return;
		}

		const editingState: EditingState = {
			editingBookingId: this.#editingBookingId,
			editingWaitListItemId: this.#editingWaitListItemId,
		};
		await this.#store.dispatch(`${Model.Interface}/addDeletingBooking`, bookingId);

		if (this.#editingBookingId === bookingId)
		{
			await this.#setEditingWaitListItemId(bookingId);
		}

		const result = await waitListService.createFromBooking(
			bookingId,
			{
				id: this.#getTemporaryItemId(),
				clients: booking.clients,
				primaryClient: booking.primaryClient,
				externalData: booking.externalData,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		);

		if (!result.success || !result.waitListItem)
		{
			await this.#rollbackMoveBookingToWaitList({
				bookingId,
				editingState,
			});

			return;
		}

		BookingAnalytics.sendAddWaitListItem();

		if (this.#editingWaitListItemId === bookingId)
		{
			await this.#setEditingWaitListItemId(result.waitListItem.id);
		}
	}

	async createBookingFromWaitListItem({ waitListItemId, cell }: CreateBookingFromWaitListItemParams): Promise<void>
	{
		const waitListItem: WaitListItemModel = this.#store.getters[`${Model.WaitList}/getById`](waitListItemId);
		if (!waitListItem)
		{
			return;
		}

		const editingState: EditingState = {
			editingBookingId: this.#editingBookingId,
			editingWaitListItemId: this.#editingWaitListItemId,
		};
		const resource: ResourceModel = this.#store.getters[`${Model.Resources}/getById`](cell.resourceId);
		const timezone: string | void = resource?.slotRanges?.[0]?.timezone;
		const clients: ClientData[] = [...waitListItem.clients];
		const intersections: Intersections = this.#store.getters[`${Model.Interface}/intersections`] ?? {};

		if (this.#editingWaitListItemId === waitListItemId)
		{
			await this.#setEditingBookingId(waitListItemId);
		}

		const result = await bookingService.createFromWaitListItem(waitListItemId, {
			id: `wl${waitListItemId}`,
			clients,
			primaryClient: clients.length > 0 ? clients[0] : undefined,
			externalData: [...waitListItem.externalData],
			name: waitListItem.name,
			note: waitListItem.note,
			resourcesIds: [
				...new Set([
					cell.resourceId,
					...(intersections[0] ?? []),
					...(intersections[cell.resourceId] ?? []),
				]),
			],
			dateFromTs: cell.fromTs,
			dateToTs: cell.toTs,
			timezoneFrom: timezone,
			timezoneTo: timezone,
		});

		if (!result.success || !result.booking)
		{
			await this.#restoreEditingState(editingState);

			return;
		}

		BookingAnalytics.sendAddBooking({ isOverbooking: false });

		if (this.#editingBookingId === waitListItemId)
		{
			await this.#setEditingBookingId(result.booking.id);
		}
	}

	async #rollbackMoveBookingToWaitList({ bookingId, editingState }: {
		bookingId: number | string,
		editingState: EditingState,
	}): Promise<void>
	{
		await Promise.all([
			this.#store.dispatch(`${Model.Interface}/removeDeletingBooking`, bookingId),
			this.#restoreEditingState(editingState),
		]);
	}

	async #restoreEditingState({ editingBookingId, editingWaitListItemId }: EditingState): Promise<void>
	{
		await Promise.all([
			this.#store.dispatch(`${Model.Interface}/setEditingBookingId`, editingBookingId),
			this.#store.dispatch(`${Model.Interface}/setEditingWaitListItemId`, editingWaitListItemId),
		]);
	}

	async #setEditingBookingId(id: number | string): Promise<void>
	{
		await Promise.all([
			this.#store.dispatch(`${Model.Interface}/setEditingBookingId`, id),
			this.#store.dispatch(`${Model.Interface}/setEditingWaitListItemId`, 0),
		]);
	}

	async #setEditingWaitListItemId(id: number | string): Promise<void>
	{
		await Promise.all([
			this.#store.dispatch(`${Model.Interface}/setEditingWaitListItemId`, id),
			this.#store.dispatch(`${Model.Interface}/setEditingBookingId`, 0),
		]);
	}

	#getTemporaryItemId(): string
	{
		return `tmp-id-${Date.now()}-${Text.getRandom(4)}`;
	}

	get #store(): Store
	{
		return Core.getStore();
	}

	get #editingBookingId(): number | string
	{
		return this.#store.getters[`${Model.Interface}/editingBookingId`];
	}

	get #editingWaitListItemId(): number | string
	{
		return this.#store.getters[`${Model.Interface}/editingWaitListItemId`];
	}
}

export const dragActions: DragActions = new DragActions();
