import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CaptionedVideoNote } from './items/captioned-video-note';
import { VideoNote } from './items/video-note';
import { TranscribedVideoNote } from './items/transcribed-video-note';

import '../css/video-note-message.css';

import type { ImModelMessage } from 'im.v2.model';
import type { JsonObject } from 'main.core';

// @vue/component
export const VideoNoteMessage = {
	name: 'VideoNoteMessage',
	components: { CaptionedVideoNote, VideoNote, TranscribedVideoNote },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['cancelClick'],
	data(): JsonObject
	{
		return {
			isTranscriptionOpened: false,
			startWithSound: false,
		};
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		firstFileId(): number
		{
			return this.message.files[0];
		},
		hasText(): boolean
		{
			return this.message.text.trim().length > 0;
		},
		isCaptionFeatureAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isVideoNoteCaptionAvailable);
		},
		hasCaption(): boolean
		{
			return this.hasText && this.isCaptionFeatureAvailable;
		},
	},
	methods: {
		onTranscribedVideoPlayClick()
		{
			this.isTranscriptionOpened = false;
			this.startWithSound = true;
		},
		onOpenTranscription()
		{
			this.isTranscriptionOpened = true;
			this.startWithSound = false;
		},
	},
	template: `
		<transition name="fade" mode="out-in">
			<TranscribedVideoNote
				v-if="isTranscriptionOpened"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:withTitle="withTitle"
				:showCaption="hasCaption"
				@closeTranscription="isTranscriptionOpened = false"
				@clickPlay="onTranscribedVideoPlayClick"
				@cancelClick="$emit('cancelClick', $event)"
			/>
			<CaptionedVideoNote
				v-else-if="hasCaption"
				:startWithSound="startWithSound"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:showTypeLabel="isCaptionFeatureAvailable"
				@openTranscription="onOpenTranscription"
				@cancelClick="$emit('cancelClick', $event)"
			/>
			<VideoNote
				v-else
				:startWithSound="startWithSound"
				:fileId="firstFileId"
				:dialogId="dialogId"
				:item="item"
				:withTitle="withTitle"
				:showTypeLabel="isCaptionFeatureAvailable"
				@openTranscription="onOpenTranscription"
				@cancelClick="$emit('cancelClick', $event)"
			/>
		</transition>
	`,
};
