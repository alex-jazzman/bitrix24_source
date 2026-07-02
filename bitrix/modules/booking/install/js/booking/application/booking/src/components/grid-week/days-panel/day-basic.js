// @vue/component
export const DayBasic = {
	name: 'DayBasic',
	props: {
		isActive: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div class="booking-booking__grid-day-panel_day">
			<span class="booking-booking__grid-day-panel_day-name">
				<slot name="dayOfWeek"></slot>
			</span>
			<span
				class="booking-booking__grid-day-panel_day-number"
				:class="{ '--active': isActive }"
			>
				<slot name="date"></slot>
			</span>
		</div>
	`,
};
