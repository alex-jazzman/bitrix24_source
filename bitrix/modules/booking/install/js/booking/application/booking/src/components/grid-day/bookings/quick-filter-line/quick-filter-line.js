import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { GridFactory, gridTokens, GridTokenKey, type GridBase } from 'booking.lib.grid';

import './quick-filter-line.css';

export const QuickFilterLine = {
	props: {
		hour: {
			type: Number,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			resourcesIds: `${Model.Interface}/resourcesIds`,
		}),
		grid(): GridBase
		{
			return GridFactory.getGrid();
		},
		top(): number
		{
			return this.grid.calculateTop(this.fromTs);
		},
		width(): number
		{
			return this.resourcesIds.length * gridTokens.get(GridTokenKey.DayCellWidth);
		},
		fromTs(): number
		{
			return new Date(this.selectedDateTs).setHours(this.hour);
		},
	},
	template: `
		<div
			class="booking-booking-quick-filter-line"
			:style="{
				'--top': top + 'px',
				'--width': width + 'px',
			}"
		></div>
	`,
};
