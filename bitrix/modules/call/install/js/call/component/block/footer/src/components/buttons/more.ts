import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterMoreButton = defineComponent({
	name: 'CallFooterMoreButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		isOpen: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		testState(): string
		{
			return this.isOpen ? 'active' : 'inactive';
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			this.$emit('click', event);
		},
	},
	template: /* HTML */`
		<CallButton
			test-id="call-footer-more-button"
			:test-state="testState"
			:color="isOpen ? 'transparent-blue' : 'transparent'"
			:size="38"
			:label="loc('CALL_FOOTER_MORE_BUTTON')"
			label-position="bottom"
			square
			:disabled="disabled"
			@click="handleClick"
		>
			<CallIcon icon="more" color="white" :size="28" />
		</CallButton>
	`,
});
