import { Type } from 'main.core';

import { BaseMessage } from 'im.v2.component.message.base';
import { AudioItem, DefaultMessageContent, MessageHeader, MessageFooter, Reply } from 'im.v2.component.message.elements';
import { FileType } from 'im.v2.const';
import { type ImModelMessage, type ImModelFile } from 'im.v2.model';

import '../css/audio-message.css';

// @vue/component
export const AudioMessage = {
	name: 'AudioMessage',
	components: {
		BaseMessage,
		MessageHeader,
		MessageFooter,
		DefaultMessageContent,
		AudioItem,
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
			default: false,
		},
	},
	emits: ['cancelClick'],
	computed:
	{
		FileType: () => FileType,
		message(): ImModelMessage
		{
			return this.item;
		},
		messageFile(): ImModelFile
		{
			const firstFileId = this.message.files[0];

			return this.$store.getters['files/get'](firstFileId, true);
		},
		canSetReactions(): boolean
		{
			return Type.isNumber(this.message.id);
		},
		isReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		isForward(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
	},
	methods:
	{
		onCancel(event)
		{
			this.$emit('cancelClick', event);
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId">
			<div class="bx-im-message-audio__container">
				<MessageHeader :withTitle="withTitle" :item="item" class="bx-im-message-audio__header"/>
				<Reply v-if="isReply" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
				<AudioItem
					:key="messageFile.id"
					:item="messageFile"
					:messageId="message.id"
					@cancelClick="onCancel"
				/>
			</div>
			<div class="bx-im-message-audio__default-message-container">
				<DefaultMessageContent :item="item" :dialogId="dialogId" :withReply="false" />
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
		</BaseMessage>
	`,
};
