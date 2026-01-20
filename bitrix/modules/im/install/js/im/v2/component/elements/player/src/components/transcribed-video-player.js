import { Utils } from 'im.v2.lib.utils';

import { Timeline } from './elements/timeline/timeline';
import { TranscriptionButton } from './elements/transcription-button/transcription-button';
import { TranscriptionText } from './elements/transcription-text/transcription-text';

import './css/transcribed-video-player.css';

import type { JsonObject } from 'main.core';
import type { ImModelFile } from 'im.v2.model';

// @vue/component
export const TranscribedVideoPlayer = {
	name: 'TranscribedVideoPlayer',
	components: { TranscriptionText, TranscriptionButton, Timeline },
	props: {
		item: {
			type: Object,
			required: true,
		},
		message: {
			type: Object,
			required: true,
		},
	},
	emits: ['closeTranscription', 'clickPlay'],
	data(): JsonObject
	{
		return {
			duration: 0,
		};
	},
	computed:
	{
		file(): ImModelFile
		{
			return this.item;
		},
		playButtonStyles(): JsonObject
		{
			return {
				backgroundImage: `url(${this.file.urlPreview})`,
			};
		},
		formattedTime(): string
		{
			if (this.duration === 0)
			{
				return '--:--';
			}

			return Utils.date.formatMediaDurationTime(this.duration);
		},
	},
	methods:
	{
		handleLoadedMetaData()
		{
			this.duration = this.$refs.videoElement.duration;
		},
	},
	template: `
		<div class="bx-im-transcribed-video-player__container">
			<div class="bx-im-transcribed-video-player__video">
				<div
					:style="playButtonStyles"
					class="bx-im-transcribed-video-player__play"
					@click="$emit('clickPlay')"
				>
					<div class="bx-im-transcribed-video-player__play-button-overlay"></div>
					<div class="bx-im-transcribed-video-player__play-icon"></div>
				</div>
				<div class="bx-im-transcribed-video-player__content">
					<div class="bx-im-transcribed-video-player__timeline-container">
						<Timeline
							:loaded="duration > 0"
							:timeCurrent="duration"
							:timeTotal="duration"
							:withSeeking="false"
						/>
						<div class="bx-im-transcribed-video-player__metainfo">{{ formattedTime }}</div>
					</div>
					<div class="bx-im-transcribed-video-player__transcription-button">
						<TranscriptionButton
							:file="file"
							:isOpened="true"
							:messageId="message.id"
							@transcriptionToggle="$emit('closeTranscription')"
						/>
					</div>
				</div>
				<video
					:src="file.urlDownload"
					class="bx-im-transcribed-video-player__video-source"
					ref="videoElement"
					preload="metadata"
					@loadedmetadata="handleLoadedMetaData"
				></video>
			</div>
			<TranscriptionText
				:file="file"
				:isOpened="true"
				:messageId="message.id"
				class="bx-im-transcribed-video-player__transcription-text"
			/>
		</div>
	`,
};
