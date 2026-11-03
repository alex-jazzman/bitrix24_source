import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon, CallIconLevel } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import { useMediaStore, useUiStore } from 'call.store';
import type { MediaStoreInstance, UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallMicrophoneButton = defineComponent({
	name: 'CallMicrophoneButton',
	components: {
		CallButton,
		CallIcon,
		CallIconLevel,
		CallTooltip,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { mediaStore: MediaStoreInstance; uiStore: UiStoreInstance }
	{
		return {
			mediaStore: useMediaStore(),
			uiStore: useUiStore(),
		};
	},
	props: {
		testId: {
			type: String,
			default: null,
			required: true,
		},
		isPopupOpen: {
			type: Boolean,
			default: false,
		},
		micLevel: {
			type: Number,
			default: 0,
		},
		isPip: {
			type: Boolean,
			default: false,
		},
		isDesktop: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['corner-click'],
	computed: {
		isActive(): boolean
		{
			return !this.mediaStore.isMicrophoneMuted;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('microphone');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			const keys = `${this.hotkey.action} + Shift + A`;

			if (this.isActive)
			{
				return keys;
			}

			return `${(this.loc as LocFunction)('CALL_BLOCK_MICROPHONE_BUTTON_SPACE')} \n ${keys}`;
		},
		testState(): string
		{
			return this.isActive ? 'active' : 'inactive';
		},
		testMeta(): string | null
		{
			return this.isPip ? 'pip' : null;
		},
	},
	methods: {
		handleClick(): void
		{
			this.mediaStore.toggleMicrophone();
		},
		handleCornerClick(event: MouseEvent): void
		{
			this.$emit('corner-click', event);
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop || isPip">
			<CallButton
				:test-id="testId"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isActive ? 'transparent' : 'transparent-red'"
				:size="38"
				:label="loc('CALL_BLOCK_MICROPHONE_BUTTON_LABEL')"
				label-position="bottom"
				square
				:corner="!isPip"
				:disabled="disabled"
				@click="handleClick"
				@corner-click="handleCornerClick"
			>
				<CallIconLevel
					v-if="isActive && !disabled"
					icon="microphone"
					color="white"
					fill-color="green"
					:size="28"
					:level="micLevel"
				/>
				<CallIcon v-else :icon="isActive ? 'microphone' : 'microphone-off'" :color="isActive ? 'white' : 'red'" :size="28" />
				<template v-if="!isPip" #corner>
					<CallIcon
						animated
						:style="{ transform: isPopupOpen ? 'rotate(180deg)' : null }"
						icon="chevron-down"
						:size="16"
					/>
				</template>
			</CallButton>
		</CallTooltip>
	`,
});
