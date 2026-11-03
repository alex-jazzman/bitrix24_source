import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './css/recording-panel.css';

const ICON_SIZE = 20;

// @vue/component
export const LockIndicator = {
	name: 'VoiceRecordingLockIndicator',
	components: { BIcon },
	props:
	{
		isArmed: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['lock'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		lockHint(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_LOCK');
		},
	},
	created()
	{
		this.bounds = null;
	},
	methods:
	{
		readBounds()
		{
			this.bounds = this.$el.getBoundingClientRect();
		},
		containsPointer(event: PointerEvent): boolean
		{
			if (!this.bounds)
			{
				return false;
			}

			const { top, right, bottom, left } = this.bounds;

			return event.clientX >= left && event.clientX <= right
				&& event.clientY >= top && event.clientY <= bottom;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			:title="lockHint"
			:aria-label="lockHint"
			:class="{ '--armed': isArmed }"
			class="bx-im-voice-recording-lock"
			type="button"
			tabindex="0"
			data-testid="im-textarea-recording-lock"
			@click="$emit('lock')"
		>
			<BIcon :name="OutlineIcons.ARROW_TOP_M" :size="ICON_SIZE" />
			<BIcon :name="OutlineIcons.LOCK_M" :size="ICON_SIZE" />
		</button>
	`,
};
