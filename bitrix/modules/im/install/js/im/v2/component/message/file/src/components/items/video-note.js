import { ProgressBar } from 'im.v2.component.elements.progressbar';
import { RoundVideoPlayer } from 'im.v2.component.elements.player';
import { ReactionList, MessageStatus, MessageHeader, CompactCommentsPanel } from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';

import '../../css/items/video-note.css';

import type { ImModelFile, ImModelMessage } from 'im.v2.model';

// @vue/component
export const VideoNote = {
	name: 'VideoNote',
	components: {
		ProgressBar,
		RoundVideoPlayer,
		BaseMessage,
		ReactionList,
		MessageStatus,
		MessageHeader,
		CompactCommentsPanel,
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
	},
	emits: ['cancelClick', 'openTranscription'],
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
		<BaseMessage :item="message" :dialogId="dialogId" :withBackground="false">
			<template #before-message>
				<div class="bx-im-video-note__header_container">
					<MessageHeader :item="message" :isOverlay="true" />
				</div>
			</template>
			<div class="bx-im-video-note__container">
				<ProgressBar
					:item="file"
					@cancelClick="$emit('cancelClick')"
				/>
				<RoundVideoPlayer 
					:item="file" 
					:message="message"
					:startWithSound="startWithSound"
					@openTranscription="$emit('openTranscription')"
				/>
			</div>
			<div class="bx-im-video-note__comments-panel">
				<CompactCommentsPanel :item="message" :dialogId="dialogId" />
			</div>
			<div class="bx-im-video-note__status_container">
				<MessageStatus :item="message" :isOverlay="true" />
			</div>
			<template #after-message>
				<div class="bx-im-video-note__reaction-list-container">
					<ReactionList :messageId="message.id" :contextDialogId="dialogId" />
				</div>
			</template>
		</BaseMessage>
	`,
};
