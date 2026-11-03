import { DefaultMessageContent, MessageFooter, MessageHeader, Reply } from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';
import { type ImModelMessage } from 'im.v2.model';

import { VideoNoteCircle } from './elements/video-note-circle';

import '../../css/items/captioned-video-note.css';

// @vue/component
export const CaptionedVideoNote = {
	name: 'CaptionedVideoNote',
	components: {
		BaseMessage,
		DefaultMessageContent,
		MessageFooter,
		MessageHeader,
		Reply,
		VideoNoteCircle,
	},
	props: {
		item: {
			/** @type ImModelMessage */
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
		startWithSound: {
			type: Boolean,
			default: false,
		},
		showTypeLabel: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['cancelClick', 'openTranscription'],
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		hasReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		isForward(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
	},
	template: `
		<BaseMessage :item="message" :dialogId="dialogId" data-testid="im-message-video-note-captioned-root">
			<template #before-message>
				<Reply
					v-if="hasReply"
					class="bx-im-captioned-video-note__quote"
					:dialogId="dialogId"
					:replyId="message.replyId"
					:isForward="isForward"
				/>
				<div class="bx-im-video-note__header_container">
					<MessageHeader :item="message" :isOverlay="true" />
				</div>
				<VideoNoteCircle
					:item="message"
					:fileId="fileId"
					:startWithSound="startWithSound"
					:showTypeLabel="showTypeLabel"
					@cancelClick="$emit('cancelClick')"
					@openTranscription="$emit('openTranscription')"
				/>
			</template>
			<div class="bx-im-captioned-video-note__default-message-container">
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withReply="false" />
			</div>
			<MessageFooter :item="message" :dialogId="dialogId" />
		</BaseMessage>
	`,
};
