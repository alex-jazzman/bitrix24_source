import { Type } from 'main.core';

import {
	MessageStatus,
	ReactionList,
	DefaultMessageContent,
	MessageHeader,
	MessageFooter,
} from 'im.v2.component.message.elements';
import { BaseMessage } from 'im.v2.component.message.base';
import { ChatType } from 'im.v2.const';

import { MediaContent } from './media-content';

import '../css/media-message.css';

import type { JsonObject } from 'main.core';
import type { ImModelMessage, ImModelChat } from 'im.v2.model';

const MAX_GALLERY_WIDTH = 305;
const MAX_SINGLE_MEDIA_WIDTH = 488;
const MAX_SINGLE_MEDIA_WITH_TEXT_WIDTH = 305;

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
			return this.hasText || this.hasAttach || this.hasReply;
		},
		isForward(): boolean
		{
			return Type.isStringFilled(this.message.forward.id);
		},
		needBackground(): boolean
		{
			return this.showBottomContainer || this.isChannelPost || this.isForward;
		},
		isChannelPost(): boolean
		{
			return [ChatType.channel, ChatType.openChannel].includes(this.dialog.type);
		},
		imageContainerStyles(): JsonObject
		{
			let maxWidth = MAX_SINGLE_MEDIA_WIDTH;
			if (this.fileIds.length > 1)
			{
				maxWidth = MAX_GALLERY_WIDTH;
			}

			if (this.hasText)
			{
				maxWidth = MAX_SINGLE_MEDIA_WITH_TEXT_WIDTH;

				return {
					'max-width': `${maxWidth}px`,
					'min-width': `${maxWidth}px`,
				};
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
			<div 
				class="bx-im-message-image__container"
				:class="{
					'--has-text': hasText,
				}"
				:style="imageContainerStyles"
			>
				<MessageHeader :withTitle="false" :item="item" class="bx-im-message-image__header" />
				<MediaContent 
					:item="message"
					@cancelClick="onCancel"
				/>
				<div v-if="showBottomContainer" class="bx-im-message-image__bottom-container">
					<DefaultMessageContent
						:item="item"
						:dialogId="dialogId"
						:withText="hasText"
						:withAttach="hasAttach"
					/>
				</div>
				<MessageFooter :item="item" :dialogId="dialogId" />
			</div>
			<template #after-message>
				<div v-if="!showBottomContainer" class="bx-im-message-image__reaction-list-container">
					<ReactionList :messageId="message.id" :contextDialogId="dialogId" />
				</div>
			</template>
		</BaseMessage>
	`,
};
