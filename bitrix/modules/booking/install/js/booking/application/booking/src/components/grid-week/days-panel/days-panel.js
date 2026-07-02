import { mapGetters } from 'ui.vue3.vuex';

import { DateTimeFormat } from 'main.date';
import { getNextDate, createDate } from 'ui.date-picker';

import { Model, Grid } from 'booking.const';

import { DayOfWeek } from './day-of-week';
import { DaySkeleton } from './day-skeleton';

import './days-panel.css';

// @vue/component
export const DaysPanel = {
	name: 'DaysPanel',
	components: {
		DayOfWeek,
		DaySkeleton,
	},
	setup(): { Grid: typeof Grid }
	{
		return {
			Grid,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
		}),
		selectedFirstDayPeriodTs(): number | null
		{
			const selectedFirstDayPeriodTs = this.$store.getters[`${Model.Interface}/selectedFirstDayPeriodTs`];

			return selectedFirstDayPeriodTs ? selectedFirstDayPeriodTs + this.offset : null;
		},
		week(): []
		{
			const weekData = [];
			const firstDayOfWeek = createDate(this.selectedFirstDayPeriodTs);

			for (let i = 0; i < Grid.Duration.Week; i++)
			{
				const todayDate = getNextDate(firstDayOfWeek, 'day', i);

				weekData.push({
					id: DateTimeFormat.format('z', todayDate / 1000),
					date: todayDate.getDate(),
					dayOfWeek: DateTimeFormat.format('D', todayDate / 1000),
					isActive: this.isActiveDay(todayDate),
				});
			}

			return weekData;
		},
	},
	methods: {
		isActiveDay(date: Date): boolean
		{
			const today = new Date();
			const compareDate = new Date(date);

			today.setHours(0, 0, 0, 0);
			compareDate.setHours(0, 0, 0, 0);

			return today.getTime() === compareDate.getTime();
		},
	},
	template: `
		<div class="booking-booking__grid-day-panel_container">
			<template v-if="!selectedFirstDayPeriodTs">
				<template v-for="n in Grid.Duration.Week" :key="n">
					<DaySkeleton />
				</template>
			</template>

			<template v-else>
				<template v-for="day of week" :key="day.id">
					<DayOfWeek :date="day.date" :dayOfWeek="day.dayOfWeek" :isActive="day.isActive"/>
				</template>
			</template>
		</div>
	`,
};
