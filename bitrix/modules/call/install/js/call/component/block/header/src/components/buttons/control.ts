import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallHeaderControlButton = defineComponent({
	name: 'CallHeaderControlButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	emits: [],
	methods: {
		handleClick(): void
		{
			// TODO: open control panel
		},
	},
	template: /* HTML */`
		<CallButton test-id="call-header-control-button" color="transparent" :label="loc('CALL_HEADER_CONTROL_BUTTON')" @click="handleClick">
			<template #prepend>
				<CallIcon icon="setting" :size="20" />
			</template>
		</CallButton>
	`,
});
