import { mapGetters } from 'ui.vue3.vuex';

import { AhaMoment, Model } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';
import { isRealId } from 'booking.lib.is-real-id';
import { AddClient as BookingCardAddClient } from 'booking.component.booking-card';

import './add-client.css';

// @vue/component
export const BookingAddClient = {
	name: 'BookingAddClient',
	components: {
		BookingCardAddClient,
	},
	props: {
		/** @type{ BookingCardDataService } */
		cardDataService: {
			type: Object,
			required: true,
		},
		expired: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		...mapGetters({
			getBookingById: `${Model.Bookings}/getById`,
		}),
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-add-client-button');
		},
	},
	mounted(): void
	{
		if (isRealId(this.bookingId))
		{
			ahaMoments.setBookingForAhaMoment(this.bookingId);
		}

		if (ahaMoments.shouldShow(AhaMoment.AddClient, { bookingId: this.bookingId }))
		{
			void this.showAhaMoment();
		}
	},
	methods: {
		async showAhaMoment(): Promise<void>
		{
			await ahaMoments.show({
				id: 'booking-add-client',
				title: this.loc('BOOKING_AHA_ADD_CLIENT_TITLE'),
				text: this.loc('BOOKING_AHA_ADD_CLIENT_TEXT_MSGVER_1'),
				target: this.$refs.addClientContainer?.$refs?.button,
				isPulsarTransparent: true,
			});

			ahaMoments.setShown(AhaMoment.AddClient);
		},
	},
	template: `
		<BookingCardAddClient
			buttonClass="booking-booking-card__booking-add-client"
			ref="addClientContainer"
			:expired
			:dataAttributes
			@add="(clients) => this.cardDataService.addClients(clients)"
		/>
	`,
};
