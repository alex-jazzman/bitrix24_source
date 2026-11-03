import { Type } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessage } from 'im.v2.model';

import { Reply } from '../reply/reply';
import {
	AiTaskIndicationLayoutKey,
	isAiTaskStatusInTimeRow,
	type AiTaskIndicationLayoutValue,
} from '../ai-task-indication/ai-task-frames';
import { AiTaskStatusRow } from '../ai-task-indication/ai-task-status-row';
import { MessageAttach } from '../attach/attach';
import { MessageStatus } from '../message-status/message-status';
import { ReactionList } from '../reaction/list';
import { TextContent } from '../text-content/text-content';
import { BuilderContent } from '../message-builder/builder-content/builder-content';

import './default-message-content.css';

// @vue/component
export const DefaultMessageContent = defineComponent({
	name: 'DefaultMessageContent',
	components: { AiTaskStatusRow, MessageStatus, MessageAttach, ReactionList, Reply, TextContent, BuilderContent } as {
		AiTaskStatusRow: typeof AiTaskStatusRow,
		MessageStatus: typeof MessageStatus,
		MessageAttach: typeof MessageAttach,
		ReactionList: typeof ReactionList,
		Reply: typeof Reply,
		TextContent: typeof TextContent,
		BuilderContent: typeof BuilderContent,
	},
	// the host of the message answers whether an AI task is running on it and in which layout
	inject: {
		aiTaskLayout: { from: AiTaskIndicationLayoutKey, default: null },
	},
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
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
		withReactions: {
			type: Boolean,
			default: true,
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
		/**
		 * The caption of a running AI task, when the host says it belongs in the time row of this
		 * message (map §3.2). The row itself decides whether this very message is the one to carry
		 * it: the operation marks a whole set of sources, and only its caption message gets one.
		 */
		aiTaskStatusLayout(): AiTaskIndicationLayoutValue | null
		{
			const layout = this.aiTaskLayout as AiTaskIndicationLayoutValue | null;

			return isAiTaskStatusInTimeRow(layout) ? layout : null;
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
					v-if="withReactions && canSetReactions"
					:messageId="message.id"
					class="bx-im-message-default-content__reaction-list"
				/>
				<AiTaskStatusRow v-if="aiTaskStatusLayout" :message="message" :layout="aiTaskStatusLayout" />
				<div v-if="withMessageStatus" class="bx-im-message-default-content__status-container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</div>
	`,
});
