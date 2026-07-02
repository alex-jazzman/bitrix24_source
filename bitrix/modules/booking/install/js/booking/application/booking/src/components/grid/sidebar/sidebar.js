import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';

import { Calendar } from './calendar/calendar';
import { WaitList } from './wait-list/wait-list';
import './sidebar.css';

// @vue/component
export const Sidebar = {
	components: {
		Calendar,
		WaitList,
	},
	computed: {
		...mapGetters({
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
	},
	template: `
		<div class="booking-booking-sidebar">
			<Calendar :key="isWeekMode"/>
			<WaitList/>
		</div>
	`,
};
