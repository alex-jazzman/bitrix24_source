import { Type } from 'main.core';

import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessage } from 'im.v2.model';

import { Reply } from '../reply/reply.js';
import { MessageAttach } from '../attach/attach.js';
import { MessageStatus } from '../message-status/message-status.js';
import { ReactionList } from '../reaction/list.js';
import { TextContent } from '../text-content/text-content.js';
import { BuilderContent } from '../message-builder/builder-content/builder-content.js';

import './default-message-content.css';

// @vue/component
export const DefaultMessageContent = {
	name: 'DefaultMessageContent',
	components: {
		MessageStatus,
		MessageAttach,
		ReactionList,
		Reply,
		TextContent,
		BuilderContent,
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
		withMessageStatus: {
			type: Boolean,
			default: true,
		},
		withText: {
			type: Boolean,
			default: true,
		},
		withAttach: {
			type: Boolean,
			default: true,
		},
		withReply: {
			type: Boolean,
			default: true,
		},
		withBuilder: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		isReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		formattedText(): string
		{
			return Parser.decodeMessage(this.item);
		},
		canSetReactions(): boolean
		{
			return Type.isNumber(this.message.id);
		},
		isForward(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
		hasBuilderBlocks(): boolean
		{
			if (!this.withBuilder)
			{
				return false;
			}

			return this.$store.getters['messages/builder/hasBlocks'](this.message.id);
		},
	},
	template: `
		<div class="bx-im-message-default-content__container" :class="{'--no-text': !withText || hasBuilderBlocks}">
			<Reply v-if="isReply && withReply" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
			<TextContent v-if="withText && !hasBuilderBlocks" :text="formattedText" />
			<BuilderContent v-else :item="item" :dialogId="dialogId"/>
			<div v-if="withAttach && message.attach.length > 0" class="bx-im-message-default-content__attach">
				<MessageAttach :item="message" :dialogId="dialogId" />
			</div>
			<div class="bx-im-message-default-content__bottom-panel">
				<ReactionList 
					v-if="canSetReactions" 
					:messageId="message.id" 
					class="bx-im-message-default-content__reaction-list" 
				/>
				<div v-if="withMessageStatus" class="bx-im-message-default-content__status-container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</div>
	`,
};
