import { DefaultMessageContent, MessageHeader, MessageFooter } from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';
import { TranscribedVideoPlayer } from 'im.v2.component.elements.player';

import '../../css/items/transcribed-video-note.css';

import type { ImModelFile, ImModelMessage } from 'im.v2.model';

// @vue/component
export const TranscribedVideoNote = {
	name: 'TranscribedVideoNote',
	components: {
		BaseMessage,
		DefaultMessageContent,
		MessageHeader,
		MessageFooter,
		TranscribedVideoPlayer,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		fileId: {
			type: [String, Number],
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
	computed: {
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.fileId, true);
		},
		message(): ImModelMessage
		{
			return this.item;
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<div class="bx-im-transcribed-video-note-note__container">
				<MessageHeader 
					:withTitle="withTitle" 
					:item="message" 
					class="bx-im-transcribed-video-note__header" 
				/>
				<TranscribedVideoPlayer
					:item="file"
					:message="message"
					@closeTranscription="$emit('closeTranscription')"
					@clickPlay="$emit('clickPlay')"
				/>
			</div>
			<div class="bx-im-transcribed-video-note__default-message-container">
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withText="false" />
			</div>
			<MessageFooter :item="message" :dialogId="dialogId" />
		</BaseMessage>
	`,
};
