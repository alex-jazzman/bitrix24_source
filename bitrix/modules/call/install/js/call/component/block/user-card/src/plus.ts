import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';

import './css/user-card.css';

export const CallUserCardPlus = defineComponent({
	name: 'CallUserCardPlus',
	components: {
		CallIcon,
	},
	template: /* HTML */ `
		<div class="call-user-card --plus">
			<div class="call-user-card__content">
				<CallIcon icon="plus" :size="26"></CallIcon>
			</div>
		</div>
	`,
});
