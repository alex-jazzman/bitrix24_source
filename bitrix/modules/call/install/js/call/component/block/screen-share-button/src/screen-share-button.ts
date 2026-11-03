import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import { useMediaStore, useUiStore } from 'call.store';
import type { MediaStoreInstance, UiStoreInstance } from 'call.store';

import { hotkey } from 'call.helper.hotkey';
import type { Hotkey } from 'call.helper.hotkey';

import type { LocFunction } from 'call.plugin.loc';

export const CallScreenShareButton = defineComponent({
	name: 'CallScreenShareButton',
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
		isPip: {
			type: Boolean,
			default: false,
		},
		isDesktop: {
			type: Boolean,
			default: false,
		},
	},
	emits: [],
	computed: {
		isActive(): boolean
		{
			return this.mediaStore.isScreenSharingActive;
		},
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('screen');
		},
		hotkey(): Hotkey
		{
			return hotkey;
		},
		tooltip(): string
		{
			return `${this.hotkey.action} + Shift + S`;
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
			this.mediaStore.toggleScreenSharing();
		},
	},
	template: /* HTML */`
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop || isPip">
			<CallButton
				:test-id="testId"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isActive ? 'transparent-blue' : 'transparent'"
				:size="38"
				:label="loc('CALL_BLOCK_SCREEN_SHARE_BUTTON_LABEL')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'screen-share-pause' : 'screen-share'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`,
});
