import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallHeaderRateButton = defineComponent({
	name: 'CallHeaderRateButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: {
			default: (): LocFunction => (key: string): string => key,
		},
	},
	methods: {
		handleClick(): void
		{
			// TODO: rate
		},
	},
	template: /* HTML */ `
		<CallButton test-id="call-header-rate-button" color="transparent" :label="loc('CALL_HEADER_RATE_BUTTON')" @click="handleClick">
			<template #prepend>
				<CallIcon icon="feedback" :size="20" />
			</template>
		</CallButton>
	`,
});
