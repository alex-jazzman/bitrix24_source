import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallHeaderFullscreenButton = defineComponent({
	name: 'CallHeaderFullscreenButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: {
			default: (): LocFunction => (key: string): string => key,
		},
	},
	props: {
		isFullscreen: {
			type: Boolean,
			default: false,
		},
	},
	emits: [],
	methods: {
		handleClick(): void
		{
			// TODO: expand/collapse fullscreen
		},
	},
	template: /* HTML */ `
		<CallButton
			test-id="call-header-fullscreen-button"
			color="transparent"
			:label="isFullscreen ? loc('CALL_HEADER_FULLSCREEN_BUTTON_COLLAPSE') : loc('CALL_HEADER_FULLSCREEN_BUTTON_EXPAND')"
			@click="handleClick"
		>
			<template #prepend>
				<CallIcon :icon="isFullscreen ? 'collapse' : 'expand'" :size="20" />
			</template>
		</CallButton>
	`,
});
