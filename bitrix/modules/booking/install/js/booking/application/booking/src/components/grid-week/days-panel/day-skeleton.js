import { BLine } from 'ui.system.skeleton.vue';

import { DayBasic } from './day-basic';

// @vue/component
export const DaySkeleton = {
	name: 'DaySkeleton',
	components: {
		BLine,
		DayBasic,
	},
	template: `
		<DayBasic>
			<template #dayOfWeek>
				<BLine
					:width="20"
					:height="9"
				/>
			</template>

			<template #date>
				<BLine
					:width="28"
					:height="28"
					:radius="28"
				/>
			</template>
		</DayBasic>
	`,
};
