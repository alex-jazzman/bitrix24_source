import { Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';

import { Model, Grid } from 'booking.const';
import type { BookingId, OverbookingMapItem, OverbookingResourceIntersections } from 'booking.model.bookings';

import type { OverlappingBookings } from '../types';

type CountOffsetProps = {
	bookingId: BookingId,
	sideSize: number,
	overlappingBookings: OverlappingBookings,
}

export const overbookingLayoutMixin = {
	computed: {
		...mapGetters({
			overbookingMap: `${Model.Bookings}/overbookingMap`,
		}),
		overbooking(): OverbookingMapItem | null
		{
			return this.overbookingMap.get(this.bookingId) || null;
		},
		overbookingInResource(): OverbookingResourceIntersections | null
		{
			return this.overbooking?.items
				?.find((item) => item.resourceId === this.resourceId) || null;
		},
		overbookingDependencies(): number[]
		{
			return (this.overbookingInResource?.intersections || []).map(({ id }) => id);
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

			return this.bookingUiGroups.find(({ bookingIds }) => bookingIds.includes(bookingId))?.bookingIds || [];
		},
		bookingWidth(): number
		{
			if (this.hasOverbooking)
			{
				return this.countWidth(this.overlappingBookings) / 2;
			}

			return this.countWidth(this.overlappingBookings);
		},
		bookingHeight(): number
		{
			if (this.hasOverbooking)
			{
				return this.countHeight(this.overlappingBookings) / 2;
			}

			return this.countHeight(this.overlappingBookings);
		},
		leftOffset(): number
		{
			return this.countSideOffset(this.bookingWidth);
		},
		topOffset(): number
		{
			return this.countSideOffset(this.bookingHeight);
		},
	},
	methods: {
		countOffset({ bookingId, sideSize, overlappingBookings }: CountOffsetProps): number
		{
			let index = overlappingBookings.indexOf(bookingId);
			if (index === -1)
			{
				index = 0;
			}

			return sideSize * index;
		},
		countWidth(overlappingBookings: OverlappingBookings): number
		{
			const count = overlappingBookings.length > 0 ? overlappingBookings.length : 1;

			return Grid.SizeElement.DayCellWidth / count;
		},
		countHeight(overlappingBookings: OverlappingBookings): number
		{
			const count = overlappingBookings.length > 0 ? overlappingBookings.length : 1;

			return Grid.SizeElement.WeekCellHeight / count;
		},
		countSideOffset(size: number): number
		{
			if (this.isShifted)
			{
				const sideOffset = this.countOffset({
					bookingId: this.overbookingDependencies[0],
					sideSize: size,
					overlappingBookings: this.overlappingBookings,
				});

				return sideOffset * 2 + size;
			}

			return this.countOffset({
				bookingId: this.booking.id,
				sideSize: this.hasOverbooking ? size * 2 : size,
				overlappingBookings: this.overlappingBookings,
			});
		},
	},
};
