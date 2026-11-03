import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextSm } from 'ui.system.typography.vue';

import { Timeline } from 'im.v2.component.elements.player';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';

import './css/recording-panel.css';

const PLAYBACK_ICON_SIZE = 26;

// @vue/component
export const RecordingPreview = {
	name: 'VoiceRecordingPreview',
	components: { BIcon, TextSm, Timeline },
	props:
	{
		blob: {
			type: Blob,
			required: true,
		},
		durationSeconds: {
			type: Number,
			required: true,
		},
	},
	data(): Object
	{
		return {
			sourceUrl: '',
			isPlaying: false,
			isLoaded: false,
			hasPlaybackError: false,
			timeCurrent: 0,
		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		PLAYBACK_ICON_SIZE: () => PLAYBACK_ICON_SIZE,
		playbackIcon(): string
		{
			return this.isPlaying ? OutlineIcons.PAUSE_M : OutlineIcons.PLAY_M;
		},
		playbackHint(): string
		{
			return this.isPlaying
				? this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_PAUSE')
				: this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_PLAY');
		},
		metaInfo(): string
		{
			const time = this.isPlaying ? this.durationSeconds - this.timeCurrent : this.durationSeconds;

			return `${Utils.file.formatFileSize(this.blob.size)}, ${Utils.date.formatMediaDurationTime(time)}`;
		},
		playbackErrorText(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_ERROR');
		},
	},
	created()
	{
		// the record is not a message yet: it is heard from the local file and never enters the
		// playback queue of the chat
		this.sourceUrl = URL.createObjectURL(this.blob);
	},
	beforeUnmount()
	{
		URL.revokeObjectURL(this.sourceUrl);
	},
	methods:
	{
		async togglePlayback(): Promise<void>
		{
			if (this.isPlaying)
			{
				this.source().pause();

				return;
			}

			try
			{
				await this.source().play();
			}
			catch (error)
			{
				Logger.error('VoiceRecordingPreview: playback of the record failed', error);
				this.onPlaybackError();
			}
		},
		onPlaybackError()
		{
			this.hasPlaybackError = true;
		},
		onTimeUpdate()
		{
			// the recorder writes no duration into its fragment, so the length of the record is the one
			// the session counted, and the position of the element can run past it
			this.timeCurrent = Math.min(this.source().currentTime, this.durationSeconds);
		},
		onEnded()
		{
			this.source().currentTime = 0;
			this.timeCurrent = 0;
		},
		source(): HTMLAudioElement
		{
			return this.$refs.source;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-voice-recording-preview" data-testid="im-textarea-recording-preview">
			<button
				:title="playbackHint"
				:aria-label="playbackHint"
				class="bx-im-voice-round-button"
				type="button"
				tabindex="0"
				data-testid="im-textarea-recording-playback"
				@click="togglePlayback"
			>
				<BIcon :name="playbackIcon" :size="PLAYBACK_ICON_SIZE" />
			</button>
			<div class="bx-im-voice-recording-preview__track">
				<Timeline
					:loaded="isLoaded"
					:timeCurrent="timeCurrent"
					:timeTotal="durationSeconds"
					:withSeeking="false"
					stretched
				/>
				<!-- a record the browser cannot read is still sent from here, so the meta names the
					 failure instead of leaving a playback button that does nothing -->
				<TextSm
					v-if="hasPlaybackError"
					class="bx-im-voice-recording-preview__meta --error"
					data-testid="im-textarea-recording-playback-error"
				>{{ playbackErrorText }}</TextSm>
				<TextSm
					v-else
					class="bx-im-voice-recording-preview__meta"
					data-testid="im-textarea-recording-meta"
				>{{ metaInfo }}</TextSm>
			</div>
			<audio
				:src="sourceUrl"
				ref="source"
				class="bx-im-voice-recording-preview__source"
				preload="metadata"
				data-testid="im-textarea-recording-source"
				@error="onPlaybackError"
				@loadedmetadata="isLoaded = true"
				@timeupdate="onTimeUpdate"
				@play="isPlaying = true"
				@pause="isPlaying = false"
				@ended="onEnded"
			></audio>
		</div>
	`,
};
