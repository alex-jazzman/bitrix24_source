import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { Grid, Model } from 'booking.const';
import { Duration } from 'booking.lib.duration';

import { WeekGridCell } from './cell/cell';
import './row.css';

const { mapGetters: mapInterfaceGetters } = createNamespacedHelpers(Model.Interface);

// @vue/component
export const Row = {
	name: 'WeekGridRow',
	components: {
		WeekGridCell,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		...mapInterfaceGetters({
			selectedFirstDayPeriodTs: 'selectedFirstDayPeriodTs',
			offset: 'offset',
		}),
		weekStartTs(): number
		{
			const weekStartTs = this.selectedFirstDayPeriodTs + this.offset;
			const weekStartDate = new Date(weekStartTs);

			return new Date(
				weekStartDate.getFullYear(),
				weekStartDate.getMonth(),
				weekStartDate.getDate(),
			).getTime() - this.offset;
		},
		week(): []
		{
			const dayMs = Duration.getUnitDurations().d;
			const weekData = [];

			for (let dayIndex = 0; dayIndex < Grid.Duration.Week; dayIndex++)
			{
				weekData.push({
					id: `${this.resourceId} - ${dayIndex}`,
					dayStartTs: this.weekStartTs + dayIndex * dayMs,
				});
			}

			return weekData;
		},
	},
	template: `
		<div
			class="booking-booking__booking__week-grid_row"
			:data-id="resourceId"
		>
			<template v-for="day of week" key="day.id">
				<WeekGridCell
					:resourceId
					:dayStartTs="day.dayStartTs"
				/>
			</template>
		</div>
	`,
};
