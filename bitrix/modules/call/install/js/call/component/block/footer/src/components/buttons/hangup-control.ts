import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterHangupControlButton = defineComponent({
	name: 'CallFooterHangupControlButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	emits: ['click'],
	methods: {
		handleClick(event: MouseEvent): void
		{
			this.$emit('click', event);
		},
	},
	template: /* HTML */`
		<CallButton
			test-id="call-footer-hangup-control-button"
			color="none"
			:size="38"
			square
			@click="handleClick"
		>
			<CallIcon icon="more" color="white" :size="28" />
		</CallButton>
	`,
});
