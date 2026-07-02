import { AddClient as BookingCardAddClient } from 'booking.component.booking-card';

import './add-client.css';

// @vue/component
export const WaitListItemAddClient = {
	name: 'WaitListItemAddClient',
	components: {
		BookingCardAddClient,
	},
	props: {
		/** @type{ WaitListCardDataService } */
		cardDataService: {
			type: Object,
			required: true,
		},
	},
	computed: {
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-add-client-button');
		},
	},
	template: `
		<BookingCardAddClient
			:dataAttributes
			:popupOffsetLeft="-300"
			@add="(clients) => cardDataService.addClients(clients)"
		/>
	`,
};
