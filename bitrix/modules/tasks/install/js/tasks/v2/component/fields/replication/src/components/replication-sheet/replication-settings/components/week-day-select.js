import { DateTimeFormat } from 'main.date';

import { UiSelect, Item as SelectItem } from 'tasks.v2.component.elements.select';
import { ReplicationWeekDayIndex } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';

const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekValues = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};

// @vue/component
export const WeekDaySelect = {
	name: 'WeekDaySelect',
	components: {
		UiSelect,
	},
	props: {
		/** @description day of the week number */
		modelValue: {
			type: Number,
			default: ReplicationWeekDayIndex.Monday,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		items(): SelectItem[]
		{
			const weekIndices = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
			const weekStartIndex = weekIndices[calendar.weekStart];

			const format = 'l';
			const todayDayIndex = new Date().getDay();

			return [week.slice(weekStartIndex), week.slice(0, weekStartIndex)]
				.flat(1)
				.map((day) => {
					const dayDate = new Date();
					const dayDifference = (week.indexOf(day) - todayDayIndex) % 7;

					dayDate.setDate(dayDate.getDate() + dayDifference);

					return {
						id: weekValues[day],
						title: DateTimeFormat.format(format, dayDate),
					};
				});
		},
		item(): SelectItem
		{
			return this.items.find(({ id }) => id === this.modelValue);
		},
	},
	template: `
		<UiSelect
			:item
			:items
			:disabled
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`,
};
