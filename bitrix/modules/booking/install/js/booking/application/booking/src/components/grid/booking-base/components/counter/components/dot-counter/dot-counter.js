import './dot-counter.css';

// @vue/component
export const DotCounter = {
	name: 'BookingDotCounter',
	props: {
		showConfirmed: {
			type: Boolean,
			default: false,
		},
		showCounter: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div v-if="showConfirmed || showCounter"
			class="booking-booking-booking__counter-dot" 
			:class="{
				'--confirmed': this.showConfirmed,
				'--danger': this.showCounter,
			}"
		></div>
	`,
};
