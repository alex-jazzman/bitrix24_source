import { bookingService } from 'booking.lib.booking';
import { Duration } from 'booking.lib.duration';
import type { DatePeriodTs } from 'booking.lib.date-period';

import { BookingBase } from '../../../grid/booking-base/booking-base';

// @vue/component
export const BookingWeek = {
	name: 'WeekGridBooking',
	extends: BookingBase,
	computed: {
		visiblePeriod(): DatePeriodTs
		{
			const weekStartTs = this.grid.bookingWeekStartTs;

			return {
				fromTs: weekStartTs,
				toTs: weekStartTs + Duration.getUnitDurations().w,
			};
		},
		bookingVisiblePeriod(): DatePeriodTs
		{
			return bookingService.getVisiblePeriod(this.booking, this.visiblePeriod);
		},
		realHeight(): number
		{
			return this.grid.calculateHeight();
		},
		isVisibleStartBooking(): boolean
		{
			return this.booking.dateFromTs >= this.visiblePeriod.fromTs
				&& this.booking.dateToTs >= this.visiblePeriod.toTs;
		},
		isVisibleEndBooking(): boolean
		{
			return this.booking.dateFromTs < this.visiblePeriod.fromTs
				&& this.booking.dateToTs > this.visiblePeriod.fromTs
				&& this.booking.dateToTs <= this.visiblePeriod.toTs;
		},
		isVisibleMiddleBooking(): boolean
		{
			return this.booking.dateFromTs < this.visiblePeriod.fromTs
				&& this.booking.dateToTs >= this.visiblePeriod.toTs;
		},
		geometryVariables(): Object
		{
			const dayIndex = this.grid.getDayIndex(this.bookingVisiblePeriod.fromTs);
			const left = this.grid.calculateLeft(dayIndex, this.bookingVisiblePeriod.fromTs);
			const top = this.grid.calculateTop(this.resourceId) + this.topOffset;
			const height = this.bookingHeight;
			const width = this.grid.calculateWidth(this.bookingVisiblePeriod.fromTs, this.bookingVisiblePeriod.toTs);

			return {
				'--left': `${left}px`,
				'--top': `${top}px`,
				'--height': `${height}px`,
				'--width': `${width}px`,
			};
		},
	},
};
