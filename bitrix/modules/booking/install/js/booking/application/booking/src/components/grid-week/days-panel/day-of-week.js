import { DayBasic } from './day-basic';

// @vue/component
export const DayOfWeek = {
	name: 'DayOfWeek',
	components: {
		DayBasic,
	},
	props: {
		date: {
			type: Number,
			required: true,
		},
		dayOfWeek: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<DayBasic :isActive>
			<template #dayOfWeek>
				{{ dayOfWeek }}
			</template>

			<template #date>
				{{ date }}
			</template>
		</DayBasic>
	`,
};
