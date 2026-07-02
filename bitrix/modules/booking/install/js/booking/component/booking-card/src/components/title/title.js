import './title.css';

// @vue/component
export const Title = {
	name: 'BookingCardTitle',
	inject: {
		/** @type{ AbstractCardDataService } */
		cardDataService: {},
	},
	computed: {
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-title');
		},
	},
	template: `
		<div
			class="booking-booking-card__title"
			:title="this.cardDataService.title"
			v-bind="dataAttributes"
		>
			{{ this.cardDataService.title }}
		</div>
	`,
};
