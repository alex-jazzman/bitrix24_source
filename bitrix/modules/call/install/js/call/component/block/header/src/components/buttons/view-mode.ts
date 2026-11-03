import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallHeaderViewModeButton = defineComponent({
	name: 'CallHeaderViewModeButton',
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
		mode: {
			type: String,
			default: 'speaker',
		},
	},
	methods: {
		handleClick(): void
		{
			// TODO: change view mode
		},
	},
	template: /* HTML */ `
		<CallButton
			test-id="call-header-view-mode-button"
			color="transparent"
			:label="mode === 'speaker' ? loc('CALL_HEADER_VIEW_MODE_BUTTON_GRID') : loc('CALL_HEADER_VIEW_MODE_BUTTON_SPEAKER')"
			@click="handleClick"
		>
			<template #prepend>
				<CallIcon :icon="mode === 'speaker' ? 'apps' : 'person-speak'" :size="20" />
			</template>
		</CallButton>
	`,
});
