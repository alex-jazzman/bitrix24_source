import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import { useRecordingStore, useUiStore } from 'call.store';
import type { RecordingStoreInstance, UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterRecordButton = defineComponent({
	name: 'CallFooterRecordButton',
	components: {
		CallButton,
		CallIcon,
		CallTooltip,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { recordingStore: RecordingStoreInstance; uiStore: UiStoreInstance }
	{
		return {
			recordingStore: useRecordingStore(),
			uiStore: useUiStore(),
		};
	},
	props: {
		isDesktop: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		isActive(): boolean
		{
			return this.recordingStore.isActive;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('record');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			return `${this.hotkey.action} + Shift + R`;
		},
		testState(): string
		{
			return this.isActive ? 'active' : 'inactive';
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			this.$emit('click', event);
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-record-button"
				:test-state="testState"
				:color="isActive ? 'transparent-red' : 'transparent'"
				:size="38"
				:label="loc('CALL_FOOTER_RECORD_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'record-solid' : 'record'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`,
});
