import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import { useUsersStore, useUiStore } from 'call.store';
import type { UsersStoreInstance, UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterRaiseHandButton = defineComponent({
	name: 'CallFooterRaiseHandButton',
	components: {
		CallButton,
		CallIcon,
		CallTooltip,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { usersStore: UsersStoreInstance; uiStore: UiStoreInstance }
	{
		return {
			usersStore: useUsersStore(),
			uiStore: useUiStore(),
		};
	},
	props: {
		isDesktop: {
			type: Boolean,
			default: false,
		},
	},
	emits: [],
	computed: {
		isActive(): boolean
		{
			return this.usersStore.currentUser?.floorRequestState ?? false;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('floorRequest');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			return `${this.hotkey.action} + Shift + H`;
		},
		testState(): string
		{
			return this.isActive ? 'active' : 'inactive';
		},
	},
	methods: {
		handleClick(): void
		{
			this.usersStore.toggleRaiseHand();
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-raise-hand-button"
				:test-state="testState"
				:color="isActive ? 'transparent-yellow' : 'transparent'"
				:size="38"
				:label="loc('CALL_FOOTER_RAISE_HAND_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'stop-hand-solid' : 'stop-hand'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`,
});
