import { BaseMessage } from 'im.v2.component.message.base';
import {
	MessageStatus,
	ReactionList,
	Reply,
} from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';

import './css/smile.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const SmileMessage = {
	name: 'SmileMessage',
	components: {
		BaseMessage,
		MessageStatus,
		ReactionList,
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
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.item;
		},
		isReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		isForward(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
		text(): string
		{
			return Parser.decodeSmile(this.message.text, {
				ratioConfig: {
					Default: 1,
					Big: 3,
				},
				enableBigSmile: true,
			});
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withBackground="false"
			:afterMessageWidthLimit="false"
		>
			<template v-if="isReply" #before-message>
				<Reply :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
			</template>
			<div class="bx-im-message-smile__container">
				<div class="bx-im-message-smile__content-container">
					<span class="bx-im-message-smile__text" v-html="text"></span>
					<div class="bx-im-message-smile__message-status-container">
						<MessageStatus :item="message" :isOverlay="true" />
					</div>
				</div>
			</div>
			<template #after-message>
				<div class="bx-im-message-smile__reactions-container">
					<ReactionList :messageId="message.id" class="bx-im-message-smile__reactions" />
				</div>
			</template>
		</BaseMessage>
	`,
};
