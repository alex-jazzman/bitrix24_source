import { Duration } from 'booking.lib.duration';
import { BookingBase } from '../../../grid/booking-base/booking-base';

// @vue/component
export const BookingDay = {
	name: 'DayGridBooking',
	extends: BookingBase,
	computed: {
		realHeight(): number
		{
			return this.grid.calculateRealHeight(
				this.resizeFromTs ?? this.booking.dateFromTs,
				this.resizeToTs ?? this.booking.dateToTs,
			);
		},
		isVisibleStartBooking(): boolean
		{
			const daySelected = this.selectedDateTs;
			const nextDay = daySelected + Duration.getUnitDurations().d;

			return this.booking.dateFromTs >= daySelected && this.booking.dateToTs > nextDay;
		},
		isVisibleEndBooking(): boolean
		{
			const daySelected = this.selectedDateTs;
			const nextDay = daySelected + Duration.getUnitDurations().d;
			const { dateFromTs, dateToTs } = this.booking;
			const endsThisDay = dateToTs > daySelected && dateToTs <= nextDay;

			return dateFromTs < daySelected && endsThisDay;
		},
		isVisibleMiddleBooking(): boolean
		{
			const daySelected = this.selectedDateTs;
			const nextDay = daySelected + Duration.getUnitDurations().d;

			return this.booking.dateFromTs < daySelected && this.booking.dateToTs >= nextDay;
		},
		geometryVariables(): Object
		{
			const left = this.grid.calculateLeft(this.resourceId) + this.leftOffset * this.zoom;
			const top = this.grid.calculateTop(this.dateFromTs);
			const height = this.grid.calculateHeight(this.dateFromTs, this.dateToTs);
			const width = this.bookingWidth;

			return {
				'--left': `${left}px`,
				'--top': `${top}px`,
				'--height': `${height}px`,
				'--width': `${width}px`,
			};
		},
		shouldBeHidden(): boolean
		{
			return !this.offHoursExpanded && this.isOutOfWorkingHours;
		},
	},
};
