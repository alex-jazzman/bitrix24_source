import { Duration } from 'booking.lib.duration';

import { BookingDate } from './components/booking-date/booking-date';
import { BookingTime } from './components/booking-time/booking-time';

import './booking-duration.css';

// @vue/component
export const BookingDuration = {
	components: {
		BookingDate,
		BookingTime,
	},
	props: {
		startTs: {
			type: Number,
			required: true,
		},
		endTs: {
			type: Number,
			required: true,
		},
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		durationMs(): number
		{
			return this.endTs - this.startTs;
		},
		isDateDisplay(): boolean
		{
			return this.durationMs >= Duration.getUnitDurations().d;
		},
	},
	template: `
		<div class="booking-booking-booking__duration">
			<BookingDate
				v-if="isDateDisplay"
				:startTs
				:endTs
				:bookingId
				:resourceId
			/>
			<BookingTime
				v-else
				:bookingId
				:resourceId
				:startTs
				:endTs
			/>
		</div>
	`,
};
