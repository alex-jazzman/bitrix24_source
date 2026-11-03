import { LiveAnnouncer } from 'ui.a11y';
import { TextSm } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { PlaybackTrackState } from 'im.v2.const';

const StatePhraseCodeByTrackState = {
	[PlaybackTrackState.loading]: 'IM_PLAYER_BAR_STATE_LOADING',
	[PlaybackTrackState.loadingError]: 'IM_PLAYER_BAR_STATE_LOADING_ERROR',
	[PlaybackTrackState.unsupportedFormat]: 'IM_PLAYER_BAR_STATE_UNSUPPORTED_FORMAT',
	[PlaybackTrackState.fileProcessing]: 'IM_PLAYER_BAR_STATE_FILE_PROCESSING',
	[PlaybackTrackState.accessDenied]: 'IM_PLAYER_BAR_STATE_ACCESS_DENIED',
	[PlaybackTrackState.messageDeleted]: 'IM_PLAYER_BAR_STATE_MESSAGE_DELETED',
	[PlaybackTrackState.fileDeleted]: 'IM_PLAYER_BAR_STATE_FILE_DELETED',
	default: '',
};

// @vue/component
export const TrackState = {
	name: 'PlayerBarTrackState',
	components: { TextSm, UiButton },
	props: {
		state: {
			type: String,
			required: true,
		},
		src: {
			type: String,
			default: '',
		},
	},
	emits: ['retry'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	computed:
	{
		statePhraseCode(): string
		{
			return StatePhraseCodeByTrackState[this.state] ?? StatePhraseCodeByTrackState.default;
		},
		stateText(): string
		{
			return this.statePhraseCode === '' ? '' : this.loc(this.statePhraseCode);
		},
		isRetryAvailable(): boolean
		{
			return this.state === PlaybackTrackState.loadingError;
		},
		isDownloadAvailable(): boolean
		{
			return this.state === PlaybackTrackState.unsupportedFormat && this.src !== '';
		},
	},
	mounted()
	{
		if (this.stateText === '')
		{
			return;
		}

		LiveAnnouncer.announce(this.stateText);
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			class="bx-im-player-bar__track-state"
			role="status"
			aria-live="polite"
			data-testid="im-player-bar-track-state"
		>
			<TextSm class="bx-im-player-bar__track-state_text" wrap="truncate">
				{{ stateText }}
			</TextSm>
			<UiButton
				v-if="isRetryAvailable"
				:text="loc('IM_PLAYER_BAR_ACTION_RETRY')"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:dataset="{ testid: 'im-player-bar-retry' }"
				@click="$emit('retry')"
			/>
			<UiButton
				v-if="isDownloadAvailable"
				:text="loc('IM_PLAYER_BAR_ACTION_DOWNLOAD')"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:link="src"
				:dataset="{ testid: 'im-player-bar-download' }"
			/>
		</div>
	`,
};
