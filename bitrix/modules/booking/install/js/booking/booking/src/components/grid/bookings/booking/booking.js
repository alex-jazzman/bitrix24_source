// @vue/component

import { Event, Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { isRealId } from 'booking.lib.is-real-id';
import { bookingService } from 'booking.provider.service.booking-service';
import type {
	BookingModel,
	OverbookingMapItem,
	OverbookingResourceIntersections,
} from 'booking.model.bookings';
import type { Occupancy } from 'booking.model.interface';

import { Actions } from './actions/actions';
import { BookingBase } from './booking-base';
import './booking.css';
import {
	countBookingLeftOffset,
	countBookingWidth,
	getOverbookingFreeSpace,
	findTimeForDroppedBooking,
} from './lib';
import type {
	BookingUiDuration,
	OverlappingBookings,
} from './types';
import type { ActionsPopupOptions } from './actions/actions';

export type { BookingUiDuration };

export const Booking = {
	name: 'Booking',
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
		nowTs: {
			type: Number,
			required: true,
		},
		/**
		 * @param {BookingUiGroup[]} bookingUiGroups
		 */
		bookingUiGroups: {
			type: Array,
			default: () => [],
		},
	},
	data(): { dropArea: boolean, freeSpace: ?Occupancy }
	{
		return {
			dropArea: false,
			freeSpace: null,
		};
	},
	computed: {
		...mapGetters({
			getBookingById: `${Model.Bookings}/getById`,
			overbookingMap: `${Model.Bookings}/overbookingMap`,
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			deletingBookings: `${Model.Interface}/deletingBookings`,
			draggedBookingId: `${Model.Interface}/draggedBookingId`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
			isBookingCreatedFromEmbed: `${Model.Interface}/isBookingCreatedFromEmbed`,
		}),
		booking(): BookingModel
		{
			return this.getBookingById(this.bookingId);
		},
		deletingBookings(): number[]
		{
			return Object.values(this.$store.getters[`${Model.Interface}/deletingBookings`]);
		},
		overbooking(): OverbookingMapItem | null
		{
			return this.overbookingMap.get(this.bookingId) || null;
		},
		overbookingInResource(): OverbookingResourceIntersections | null
		{
			return this.overbooking?.items
				?.find((item) => item.resourceId === this.resourceId) || null;
		},
		hasOverbooking(): boolean
		{
			return (this.overbookingInResource?.intersections || [])
				.some(({ id }) => !this.deletingBookings.includes(id));
		},
		isShifted(): boolean
		{
			return (
				this.hasOverbooking
				&& Type.isPlainObject(this.overbookingInResource)
				&& this.overbookingInResource.shifted
			);
		},
		overlappingBookings(): OverlappingBookings
		{
			const bookingId = !this.isShifted || !this.hasOverbooking
				? this.bookingId
				: this.overbookingDependencies[0];

			return this.bookingUiGroups.find(({ bookingIds }) => bookingIds.includes((bookingId)))?.bookingIds || [];
		},
		overbookingDependencies(): number[]
		{
			return (this.overbookingInResource?.intersections || []).map(({ id }) => id);
		},
		bookingWidth(): number
		{
			if (this.hasOverbooking)
			{
				return countBookingWidth(this.overlappingBookings) / 2;
			}

			return countBookingWidth(this.overlappingBookings);
		},
		leftOffset(): number
		{
			if (this.isShifted)
			{
				const bookingId = this.overbookingDependencies[0];
				const leftOffset = countBookingLeftOffset({
					bookingId,
					bookingWidth: this.bookingWidth,
					overlappingBookings: this.overlappingBookings,
				});

				return leftOffset * 2 + this.bookingWidth;
			}

			return countBookingLeftOffset({
				bookingId: this.booking.id,
				bookingWidth: this.hasOverbooking ? this.bookingWidth * 2 : this.bookingWidth,
				overlappingBookings: this.overlappingBookings,
			});
		},
		actionsPopupOptions(): ActionsPopupOptions
		{
			return {
				overbooking: {
					disabled: this.overbooking !== null,
				},
			};
		},
		realBooking(): boolean
		{
			return Type.isNumber(this.bookingId);
		},
		hasAccent(): boolean
		{
			return this.editingBookingId === this.bookingId || this.isBookingCreatedFromEmbed(this.bookingId);
		},
	},
	methods: {
		dragMouseEnter(): void
		{
			if (this.dropArea)
			{
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

			const freeSpace = getOverbookingFreeSpace({
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
		dropBooking(): void
		{
			const id = this.draggedBookingId;
			if (!id || !this.freeSpace)
			{
				return;
			}

			const droppedBooking = this.getBookingById(id);
			const { dateFromTs, dateToTs } = findTimeForDroppedBooking(this.freeSpace, this.booking, droppedBooking);
			const overbooking = {
				id,
				dateFromTs,
				dateToTs,
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
				void this.$store.dispatch(`${Model.Bookings}/update`, { id, booking: overbooking });

				return;
			}

			void bookingService.update({
				id,
				...overbooking,
			});
		},
		startDropHandler(): void
		{
			Event.bind(this.$el, 'mousemove', this.dragMouseEnter, { capture: true });
			Event.bind(this.$el, 'mouseleave', this.dragMouseLeave, { capture: true });
			Event.bind(this.$el, 'mouseup', this.dropBooking, { capture: true });
		},
		stopDropHandler(): void
		{
			this.dropArea = false;
			this.freeSpace = null;
			Event.unbind(this.$el, 'mousemove', this.dragMouseEnter, { capture: true });
			Event.unbind(this.$el, 'mouseleave', this.dragMouseLeave, { capture: true });
			Event.unbind(this.$el, 'mouseup', this.dropBooking, { capture: true });
		},
	},
	watch: {
		draggedBookingId(draggedBookingId: number | null): void
		{
			if (draggedBookingId === this.bookingId || this.hasOverbooking)
			{
				return;
			}

			if (draggedBookingId === null)
			{
				this.stopDropHandler();
			}
			else
			{
				this.startDropHandler();
			}
		},
	},
	components: {
		BookingBase,
		Actions,
	},
	template: `
		<BookingBase
			:bookingId
			:resourceId
			:nowTs
			:leftOffset
			:bookingClass="{
				'--short': overlappingBookings.length > 1,
				'--overbooking': hasOverbooking,
				'--shifted': isShifted && !realBooking,
				'--drop-area': dropArea,
				'--accent': hasAccent,
			}"
			:width="bookingWidth"
		>
			<template #actions>
				<Actions
					:bookingId
					:resourceId
					:actionsPopupOptions
				/>
			</template>
			<div class="booking--booking-pseudo-overbooking"></div>
		</BookingBase>
	`,
};
