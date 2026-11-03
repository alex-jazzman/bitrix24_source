import { defineComponent } from 'ui.vue3';

import './text-content.css';

// @vue/component
export const TextContent = defineComponent({
	name: 'TextContent',
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="bx-im-message-text-content__container" data-testid="im-message-text-content">
			<slot>
				<span v-html="text"></span>
			</slot>
		</div>
	`,
});
