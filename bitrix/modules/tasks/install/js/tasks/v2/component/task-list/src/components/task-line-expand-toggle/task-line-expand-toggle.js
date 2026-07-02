import { Text2Xs } from 'ui.system.typography.vue';
import { BIcon } from 'ui.icon-set.api.vue';

import './task-line-expand-toggle.css';

// @vue/component
export const TaskLineExpandToggle = {
	components: {
		Text2Xs,
		BIcon,
	},
	props: {
		text: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
		extraPadding: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div
			class="tasks-task-line-expand-toggle"
			:class="{ '--extra-padding': extraPadding }"
		>
			<Text2Xs class="tasks-task-line-expand-toggle-text">{{ text }}</Text2Xs>
			<BIcon :name="icon"/>
		</div>
	`,
};
