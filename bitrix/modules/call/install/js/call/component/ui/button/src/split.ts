import { defineComponent } from 'ui.vue3';

import './css/split.css';

export const CallButtonSplit = defineComponent({
	name: 'CallButtonSplit',
	props: {
		testId: {
			type: String,
			default: null,
		},
	},
	template: /* HTML */`
		<span class="call-button-split" :data-testid="testId">
			<slot></slot>
		</span>
	`,
});
