import { mapGetters } from 'ui.vue3.vuex';
import { Event } from 'main.core';

import { Model, DraggedElementKind, EventName, LimitFeatureId } from 'booking.const';
import { BookingAnalytics } from 'booking.lib.analytics';
import { dragPolicy, MaxInteractionBookingDurationsMs } from 'booking.lib.drag';
import { isRealId } from 'booking.lib.is-real-id';
import { limit } from 'booking.lib.limit';
import { type BookingModel } from 'booking.model.bookings';
import { type Occupancy } from 'booking.model.interface';
import { bookingService } from 'booking.provider.service.booking-service';

import { OverbookingTimeCalculator } from '../lib/overbooking-time-calculator';

export const dropHandlerMixin = {
	data(): { dropArea: boolean, freeSpace: ?Occupancy }
	{
		return {
			dropArea: false,
			freeSpace: null,
		};
	},
	computed: {
		...mapGetters({
			draggedDataTransfer: `${Model.Interface}/draggedDataTransfer`,
			draggedBookingId: `${Model.Interface}/draggedBookingId`,
			getWaitListItemById: `${Model.WaitList}/getById`,
			getBookingById: `${Model.Bookings}/getById`,
		}),
	},
	watch: {
		draggedDataTransfer: {
			handler(draggedDataTransfer): void
			{
				if (this.hasOverbooking)
				{
					return;
				}

				if (!draggedDataTransfer || !draggedDataTransfer.kind || !draggedDataTransfer.id)
				{
					this.stopDropHandler();

					return;
				}

				const mayOverbooking = this.isWeekMode
					? this.bookingDurationMs < MaxInteractionBookingDurationsMs
					: this.bookingDurationMs > MaxInteractionBookingDurationsMs
				;

				if (mayOverbooking)
				{
					return;
				}

				if (draggedDataTransfer.kind === DraggedElementKind.Booking)
				{
					if (draggedDataTransfer.id === this.bookingId)
					{
						return;
					}

					const draggedBooking = this.getBookingById(draggedDataTransfer.id);

					if (!dragPolicy.canMoveBookingOnGrid(draggedBooking))
					{
						this.stopDropHandler();

						return;
					}
				}

				this.startDropHandler();
			},
			deep: true,
		},
	},
	methods: {
		dragMouseEnter(): void
		{
			if (this.isDeletedResource)
			{
				this.dropArea = false;

				return;
			}

			if (this.dropArea || !this.draggedDataTransfer.id)
			{
				return;
			}

			if (this.draggedDataTransfer.kind === DraggedElementKind.WaitListItem)
			{
				this.freeSpace = {
					fromTs: this.booking.dateFromTs,
					toTs: this.booking.dateToTs,
					resourcesIds: this.booking.resourcesIds,
				};
				this.dropArea = true;

				return;
			}

			const draggedBookingId = this.draggedBookingId;
			if (draggedBookingId === null)
			{
				return;
			}

			const draggedBooking = this.getBookingById(draggedBookingId);
			const bookingDuration = this.booking.dateToTs - this.booking.dateFromTs;
			const draggedBookingDuration = draggedBooking.dateToTs - draggedBooking.dateFromTs;

			if (bookingDuration >= draggedBookingDuration && draggedBooking.resourcesIds.length <= 1)
			{
				this.freeSpace = {
					fromTs: this.booking.dateFromTs,
					toTs: this.booking.dateToTs,
					resourcesIds: this.booking.resourcesIds,
				};
				this.dropArea = true;

				return;
			}

			const excludeBookingFn = (booking: BookingModel): boolean => {
				if (booking.id === this.draggedBookingId)
				{
					return true;
				}

				const overbooking = this.overbookingMap.get(booking.id);
				const resourceId = this.resourceId;

				return !overbooking || overbooking.items.some((item) => item.resourceId === resourceId);
			};

			const colliding = this.$store.getters[`${Model.Interface}/getColliding`](
				this.resourceId,
				excludeBookingFn,
			);

			if (colliding.length === 0)
			{
				this.freeSpace = {
					fromTs: this.booking.dateFromTs,
					toTs: this.booking.dateToTs,
					resourcesIds: this.booking.resourcesIds,
				};
				this.dropArea = true;

				return;
			}

			const freeSpace = OverbookingTimeCalculator.calcFreeSpace({
				booking: this.booking,
				colliding,
				selectedDateTs: this.selectedDateTs,
				draggedBookingResourcesIds: draggedBooking.resourcesIds,
			});
			this.freeSpace = freeSpace;
			this.dropArea = freeSpace && (freeSpace.toTs - freeSpace.fromTs) >= draggedBookingDuration;
		},
		dragMouseLeave(): void
		{
			this.dropArea = false;
			this.freeSpace = null;
		},
		async dropElement(): void
		{
			const id = this.draggedDataTransfer.id;
			if (!id || !this.freeSpace)
			{
				return;
			}

			if (this.draggedDataTransfer.kind === DraggedElementKind.Booking)
			{
				await this.dropBooking(id);
			}
			else if (this.draggedDataTransfer.kind === DraggedElementKind.WaitListItem)
			{
				await this.dropWaitListItem(id);
			}
		},
		async dropBooking(id: number | string): Promise<void>
		{
			if (!this.enabledFeature.bookingOverbooking)
			{
				Event.EventEmitter.emit(
					EventName.StartLockedBookingAnimation,
					{
						bookingId: this.draggedDataTransfer.id,
						featureId: LimitFeatureId.Overbooking,
					},
				);

				return;
			}

			const droppedBooking = this.getBookingById(id);
			const { fromTs, toTs } = OverbookingTimeCalculator.calcTimeForDroppedBooking({
				freeSpace: this.freeSpace,
				booking: this.booking,
				droppedBooking,
			});

			const overbooking = {
				id,
				dateFromTs: fromTs,
				dateToTs: toTs,
				timezoneFrom: droppedBooking.timezoneFrom,
				timezoneTo: droppedBooking.timezoneTo,
				resourcesIds: [
					...new Set([
						this.resourceId,
						...droppedBooking.resourcesIds.slice(1, droppedBooking.resourcesIds.length),
					]),
				],
			};

			if (!isRealId(id))
			{
				await this.$store.dispatch(`${Model.Bookings}/update`, { id, booking: overbooking });

				return;
			}

			await bookingService.update({
				id,
				...overbooking,
			});
		},
		async dropWaitListItem(id: number): Promise<void>
		{
			if (!this.enabledFeature.bookingOverbooking)
			{
				void limit.show(LimitFeatureId.Overbooking);

				return;
			}

			const droppedWaitListItem = this.getWaitListItemById(id);
			const clients = [...droppedWaitListItem.clients];
			const resource = this.getResourceById(this.resourceId);
			const timezone = resource?.slotRanges?.[0]?.timezone;

			const overbooking: BookingModel = {
				id: `wl${id}`,
				resourcesIds: [this.resourceId],
				name: droppedWaitListItem.name,
				note: droppedWaitListItem.note,
				clients,
				primaryClient: clients.length > 0 ? clients[0] : undefined,
				externalData: [...droppedWaitListItem.externalData],
				dateFromTs: this.booking.dateFromTs,
				dateToTs: this.booking.dateToTs,
				timezoneFrom: timezone,
				timezoneTo: timezone,
			};
			const result = await bookingService.createFromWaitListItem(id, overbooking);

			if (result.success && result.booking)
			{
				BookingAnalytics.sendAddBooking({ isOverbooking: true });
			}
		},
		startDropHandler(): void
		{
			Event.bind(this.$el, 'mousemove', this.dragMouseEnter, { capture: true });
			Event.bind(this.$el, 'mouseleave', this.dragMouseLeave, { capture: true });
			Event.bind(this.$el, 'mouseup', this.dropElement, { capture: true });
		},
		stopDropHandler(): void
		{
			this.dropArea = false;
			this.freeSpace = null;
			Event.unbind(this.$el, 'mousemove', this.dragMouseEnter, { capture: true });
			Event.unbind(this.$el, 'mouseleave', this.dragMouseLeave, { capture: true });
			Event.unbind(this.$el, 'mouseup', this.dropElement, { capture: true });
		},
	},
};
