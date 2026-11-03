import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';
import { CallBadge } from 'call.component.ui.badge';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterFollowUpButton = defineComponent({
	name: 'CallFooterFollowUpButton',
	components: {
		CallButton,
		CallIcon,
		CallTooltip,
		CallBadge,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	props: {
		isSoon: {
			type: Boolean,
			default: false,
		},
	},
	emits: [],
	computed: {
		isActive(): boolean
		{
			return this.uiStore.isCopilotActive;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('copilot');
		},
		tooltip(): string
		{
			if (this.isActive)
			{
				return (this.loc as LocFunction)('CALL_FOOTER_FOLLOW_UP_BUTTON_TOOLTIP_RECORDING');
			}

			return (this.loc as LocFunction)('CALL_FOOTER_FOLLOW_UP_BUTTON_TOOLTIP_ENABLE');
		},
		testState(): string | null
		{
			if (this.isSoon)
			{
				return null;
			}

			if (this.isActive)
			{
				return 'active';
			}

			return 'inactive';
		},
		testMeta(): string | null
		{
			if (this.isSoon)
			{
				return 'soon';
			}

			return null;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isSoon)
			{
				return;
			}

			this.uiStore.toggleFollowUp();
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || isSoon">
			<CallButton
				test-id="call-footer-follow-up-button"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isSoon ? 'transparent' : 'copilot'"
				:size="38"
				:label="loc('CALL_FOOTER_FOLLOW_UP_BUTTON')"
				label-position="bottom"
				:square="isSoon"
				:circle="!isSoon"
				:disabled="disabled"
				:animated="!isSoon && isActive"
				@click="handleClick"
			>
				<CallIcon :icon="isSoon ? 'copilot' : 'copilot-solid'" color="white" :size="28" />
				<template v-if="isSoon" #badge>
					<CallBadge test-id="call-footer-follow-up-button-badge" :label="loc('CALL_FOOTER_FOLLOW_UP_BUTTON_BADGE_SOON')" color="blue" />
				</template>
			</CallButton>
		</CallTooltip>
	`,
});
