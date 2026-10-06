import { Type } from 'main.core';

import {
	MessageStatus,
	ReactionList,
	DefaultMessageContent,
	MessageHeader,
	MessageFooter,
	Reply,
} from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';
import { ChatType } from 'im.v2.const';

import { MediaContent } from './media-content';

import '../css/media-message.css';

import type { JsonObject } from 'main.core';
import type { ImModelMessage, ImModelChat } from 'im.v2.model';

const MAX_GALLERY_WIDTH = 460;
const MAX_SINGLE_MEDIA_WIDTH = 460;

// @vue/component
export const MediaMessage = {
	name: 'MediaMessage',
	components: {
		ReactionList,
		BaseMessage,
		MessageStatus,
		DefaultMessageContent,
		MessageHeader,
		MessageFooter,
		MediaContent,
		Reply,
	},
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
		containerHeight: {
			type: [Number, null],
			default: 0,
		},
	},
	emits: ['cancelClick'],
	computed:
	{
		message(): ImModelMessage
		{
			return this.item;
		},
		fileIds(): number[]
		{
			return this.message.files;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId);
		},
		hasText(): boolean
		{
			return this.message.text.length > 0;
		},
		hasAttach(): boolean
		{
			return this.message.attach.length > 0;
		},
		hasReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		hasError(): boolean
		{
			return this.message.error;
		},
		showContextMenu(): boolean
		{
			return this.onlyImage;
		},
		showBottomContainer(): boolean
		{
			return this.hasText || this.hasAttach;
		},
		isForward(): boolean
		{
			return Type.isStringFilled(this.message.forward.id);
		},
		needBackground(): boolean
		{
			// A reply with media (image/gallery) renders without the common bubble — like a sticker reply:
			// the quote is a self-contained chip above the media, the media sits below with no background.
			// The bubble is still needed for a caption/attach (showBottomContainer), a channel post or a forward.
			return this.showBottomContainer || this.isChannelPost || this.isForward;
		},
		isChannelPost(): boolean
		{
			return [ChatType.channel, ChatType.openChannel].includes(this.dialog.type);
		},
		imageContainerStyles(): JsonObject
		{
			let maxWidth = MAX_SINGLE_MEDIA_WIDTH;
			if (this.fileIds.length > 1 || this.hasText)
			{
				maxWidth = MAX_GALLERY_WIDTH;
			}

			return { 'max-width': `${maxWidth}px` };
		},
	},
	methods: {
		onCancel(event)
		{
			this.$emit('cancelClick', event);
		},
	},
	template: `
		<BaseMessage
			:item="item"
			:dialogId="dialogId"
			:withBackground="needBackground"
		>
			<template v-if="hasReply && !isForward" #before-message>
				<Reply
					class="bx-im-message-image__quote"
					:dialogId="dialogId"
					:replyId="message.replyId"
					:isForward="isForward"
				/>
			</template>
			<div
				class="bx-im-message-image__container"
				:class="{
					'--has-text': hasText,
				}"
				:style="imageContainerStyles"
			>
				<MessageHeader :withTitle="false" :item="item" class="bx-im-message-image__header" />
				<Reply v-if="hasReply && isForward" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<MediaContent
					:item="message"
					:containerHeight="containerHeight"
					@cancelClick="onCancel"
				/>
				<div v-if="showBottomContainer" class="bx-im-message-image__bottom-container">
					<DefaultMessageContent
						:item="item"
						:dialogId="dialogId"
						:withText="hasText"
						:withAttach="hasAttach"
						:withReply="false"
					/>
				</div>
				<MessageFooter :item="item" :dialogId="dialogId" />
			</div>
			<template #after-message>
				<div v-if="!showBottomContainer" class="bx-im-message-image__reaction-list-container">
					<ReactionList :messageId="message.id" />
				</div>
			</template>
		</BaseMessage>
	`,
};
