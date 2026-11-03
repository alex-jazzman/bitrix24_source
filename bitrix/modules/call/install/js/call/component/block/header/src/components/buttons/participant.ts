import { defineComponent } from 'ui.vue3';

import { CallButton, CallButtonSplit } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

export const CallHeaderParticipantButton = defineComponent({
	name: 'CallHeaderParticipantButton',
	components: {
		CallButton,
		CallButtonSplit,
		CallIcon,
	},
	inject: {
		loc: {
			default: (): LocFunction => (key: string): string => key,
		},
	},
	props: {
		isConference: {
			type: Boolean,
			default: false,
		},
		count: {
			type: Number,
			default: 0,
		}
	},
	emits: [],
	methods: {
		handleClick(): void
		{
			// TODO: invite user
		},
	},
	template: /* HTML */ `
		<CallButtonSplit v-if="!isConference">
			<CallButton test-id="call-header-participant-button" readonly>
				<CallIcon icon="persons" :size="20" />
				{{ count }}
			</CallButton>
			<CallButton
				test-id="call-button-participants-add"
				:label="loc('CALL_HEADER_PARTICIPANT_BUTTON')"
				@click="handleClick"
			>
				<template #append>
					<CallIcon icon="plus" :size="16" />
				</template>
			</CallButton>
		</CallButtonSplit>
		<CallButton v-else test-id="call-header-participant-button" readonly>
			<CallIcon icon="persons" :size="20" />
			{{ count }}
		</CallButton>
	`,
});
