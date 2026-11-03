import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import { useMediaStore, useUiStore } from 'call.store';
import type { MediaStoreInstance, UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallCameraButton = defineComponent({
	name: 'CallCameraButton',
	components: {
		CallButton,
		CallIcon,
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
			return this.mediaStore.isCameraOn;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('camera');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			return `${this.hotkey.action} + Shift + V`;
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
			this.mediaStore.toggleCamera();
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
				:label="loc('CALL_BLOCK_CAMERA_BUTTON_LABEL')"
				label-position="bottom"
				square
				:corner="!isPip"
				:disabled="disabled"
				@click="handleClick"
				@corner-click="handleCornerClick"
			>
				<CallIcon :icon="isActive ? 'video' : 'video-off'" :color="isActive ? 'white' : 'red'" :size="28" />
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
