import { defineComponent } from 'ui.vue3';

import './css/group.css';

export const CallButtonGroup = defineComponent({
	name: 'CallButtonGroup',
	template: /* HTML */`
		<span class="call-button-group">
			<slot></slot>
		</span>
	`,
});
