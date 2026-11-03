import {
	ReactionList,
	MessageStatus,
	MessageHeader,
	CompactCommentsPanel,
	Reply,
} from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';

import { VideoNoteCircle } from './elements/video-note-circle';

import '../../css/items/video-note.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const VideoNote = {
	name: 'VideoNote',
	components: {
		BaseMessage,
		ReactionList,
		MessageStatus,
		MessageHeader,
		CompactCommentsPanel,
		Reply,
		VideoNoteCircle,
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
		<BaseMessage
			:item="message"
			:dialogId="dialogId"
			:withBackground="false"
			data-testid="im-message-video-note-root"
		>
			<template #before-message>
				<div class="bx-im-video-note__header_container">
					<MessageHeader :item="message" :isOverlay="true" />
				</div>
			</template>
			<Reply
				v-if="hasReply"
				class="bx-im-video-note__reply"
				:dialogId="dialogId"
				:replyId="message.replyId"
				:isForward="isForward"
			/>
			<div class="bx-im-video-note__frame">
				<VideoNoteCircle
					:item="message"
					:fileId="fileId"
					:startWithSound="startWithSound"
					:showTypeLabel="showTypeLabel"
					@cancelClick="$emit('cancelClick')"
					@openTranscription="$emit('openTranscription')"
				/>
				<div class="bx-im-video-note__comments-panel">
					<CompactCommentsPanel :item="message" :dialogId="dialogId" />
				</div>
				<div class="bx-im-video-note__status_container">
					<MessageStatus :item="message" :isOverlay="true" />
				</div>
			</div>
			<template #after-message>
				<div class="bx-im-video-note__reaction-list-container">
					<ReactionList :messageId="message.id" :contextDialogId="dialogId" />
				</div>
			</template>
		</BaseMessage>
	`,
};
