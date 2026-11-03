import { defineComponent } from 'ui.vue3';

import './pulse-animation.css';

const RING_COUNT = 3;

export const PulseAnimation = defineComponent({
	name: 'PulseAnimation',
	props: {
		showPulse: {
			type: Boolean,
			default: true,
		},
		isConference: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		rings(): number[]
		{
			if (!this.showPulse)
			{
				return [];
			}

			return Array.from({ length: RING_COUNT });
		},
	},
	template: `
		<div class="bx-call-pulse-animation__container">
			<slot />
			<div v-for="ring in rings" class="bx-call-pulse-animation__ring" :class="{'--conference': isConference}"></div>
		</div>
	`,
});
