import { mapGetters } from 'ui.vue3.vuex';

import { TimeScale } from '../time-scale/time-scale';
import { OffHours } from './off-hours/off-hours';
import { QuickFilter } from './quick-filter/quick-filter';
import './left-panel.css';

export const LeftPanel = {
	computed: {
		...mapGetters({
			offHoursExpanded: 'interface/offHoursExpanded',
			fromHour: 'interface/fromHour',
			toHour: 'interface/toHour',
		}),
	},
	components: {
		TimeScale,
		OffHours,
		QuickFilter,
	},
	template: `
		<div class="booking-booking-grid-left-panel-container">
			<div class="booking-booking-grid-left-panel">
				<OffHours/>
				<OffHours :bottom="true"/>
				<TimeScale
					:fromHour="fromHour"
					:toHour="toHour"
					:offHoursExpanded="offHoursExpanded"
				>
					<template #row="{ hour }">
						<QuickFilter :hour="hour.value"/>
					</template>
				</TimeScale>
			</div>
		</div>
	`,
};
