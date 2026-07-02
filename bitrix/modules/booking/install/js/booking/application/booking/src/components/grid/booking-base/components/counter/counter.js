import { Duration } from 'booking.lib.duration';
import { mapGetters } from 'ui.vue3.vuex';

import { Model, VisitStatus } from 'booking.const';
import type { BookingModel } from 'booking.model.bookings';

import { DotCounter } from './components/dot-counter/dot-counter';
import { FullCounter } from './components/full-counter/full-counter';

import './counter.css';

// @vue/component
export const Counter = {
	components: {
		DotCounter,
		FullCounter,
	},
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		nowTs: {
			type: Number,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			isWeekMode: `${Model.Interface}/isWeekMode`,
			notificationTypes: `${Model.Dictionary}/getNotifications`,
		}),
		booking(): BookingModel
		{
			return this.$store.getters[`${Model.Bookings}/getById`](this.bookingId);
		},
		showClocking(): boolean
		{
			if (this.showCounter || this.isExpiredBooking || this.hasVisitStatus || this.isNotVisited)
			{
				return false;
			}

			const notificationTypes = Object.fromEntries(
				Object.entries(this.notificationTypes).map(([type, { value }]) => [type, value]),
			);

			const confirmationSent = this.booking.messages?.some(
				({ notificationType }) => notificationType === notificationTypes.Confirmation,
			);

			return !this.booking.isConfirmed && confirmationSent;
		},
		showConfirmed(): boolean
		{
			if (this.showCounter || this.isExpiredBooking || this.isNotVisited)
			{
				return false;
			}

			return this.booking.isConfirmed;
		},
		showCounter(): boolean
		{
			return this.booking.counter > 0;
		},
		isExpiredBooking(): boolean
		{
			return this.nowTs > this.booking.dateToTs;
		},
		hasVisitStatus(): boolean
		{
			return [VisitStatus.Visited, VisitStatus.NotVisited].includes(this.booking.visitStatus);
		},
		isNotVisited(): boolean
		{
			const started = this.nowTs > this.booking.dateFromTs;
			const statusUnknown = this.booking.visitStatus === VisitStatus.Unknown;
			const statusNotVisited = this.booking.visitStatus === VisitStatus.NotVisited;

			return (started && statusUnknown) || statusNotVisited;
		},
		isMinimalMode(): boolean
		{
			const bookingDuration = this.booking.dateToTs - this.booking.dateFromTs;

			return this.isWeekMode && (bookingDuration <= Duration.getUnitDurations().H * 8);
		},
	},
	template: `
		<div class="booking-booking-booking__counter">
			<DotCounter
				v-if="isMinimalMode"
				:showConfirmed
				:showCounter
			/>
			<FullCounter
				v-else
				:showClocking
				:showConfirmed
				:showCounter
				:counterValue="booking.counter"
			/>
		</div>
	`,
};
