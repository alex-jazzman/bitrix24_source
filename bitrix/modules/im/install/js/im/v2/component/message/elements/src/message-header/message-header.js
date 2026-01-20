import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Text, Loc } from 'main.core';

import { EventType, Color } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';
import { CopilotManager } from 'im.v2.lib.copilot';
import { ChannelManager } from 'im.v2.lib.channel';

import { AuthorTitle } from '../author-title/author-title';

import './message-header.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelMessage } from 'im.v2.model';

const FORWARD_ICON_SIZE = 20;

// @vue/component
export const MessageHeader = {
	name: 'MessageHeader',
	components: { AuthorTitle, BIcon },
	props: {
		item: {
			type: Object,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: false,
		},
		isOverlay: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		Color: () => Color,
		FORWARD_ICON_SIZE: () => FORWARD_ICON_SIZE,
		message(): ImModelMessage
		{
			return this.item;
		},
		forwardAuthorId(): number
		{
			return this.message.forward.userId;
		},
		forwardContextId(): string
		{
			return this.message.forward.id;
		},
		isForwarded(): boolean
		{
			return this.$store.getters['messages/isForward'](this.message.id);
		},
		isChannelForward(): boolean
		{
			return ChannelManager.channelTypes.has(this.message.forward.chatType);
		},
		forwardAuthorName(): string
		{
			const copilotManager = new CopilotManager();
			if (copilotManager.isCopilotBot(this.forwardAuthorId))
			{
				const forwardMessageId = this.forwardContextId.split('/')[1];

				return copilotManager.getName({
					dialogId: this.forwardAuthorId,
					messageId: forwardMessageId,
				});
			}

			return this.$store.getters['users/get'](this.forwardAuthorId, true).name;
		},
		forwardChatName(): string
		{
			return this.message.forward.chatTitle ?? this.loc('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_CLOSED_CHANNEL');
		},
		isSystemMessage(): boolean
		{
			return this.message.forward.userId === 0;
		},
		forwardAuthorTitle(): string
		{
			return Loc.getMessage('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_CHAT', {
				'[user_name]': '<span class="bx-im-message-header__author-name">',
				'#USER_NAME#': Text.encode(this.forwardAuthorName),
				'[/user_name]': '</span>',
			});
		},
		forwardChannelTitle(): string
		{
			return Loc.getMessage('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_CHANNEL', {
				'[user_name]': '<span class="bx-im-message-header__author-name">',
				'#USER_NAME#': Text.encode(this.forwardAuthorName),
				'[/user_name]': '</span>',
				'[channel_name]': '<span class="bx-im-message-header__author-name">',
				'#CHANNEL_NAME#': Text.encode(this.forwardChatName),
				'[/channel_name]': '</span>',
			});
		},
		iconColor(): string
		{
			return this.isOverlay ? Color.white : Color.blue60;
		},
	},
	methods: {
		onForwardClick()
		{
			const contextCode = Parser.getContextCodeFromForwardId(this.forwardContextId);
			if (contextCode.length === 0)
			{
				return;
			}

			const [dialogId, messageId] = contextCode.split('/');

			this.getEmitter().emit(EventType.dialog.goToMessageContext, {
				messageId: Number.parseInt(messageId, 10),
				dialogId: dialogId.toString(),
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div 
			v-if="isForwarded" 
			:class="{'--overlay': isOverlay}"
			class="bx-im-message-header__container" 
			@click="onForwardClick"
		>
			<BIcon
				:name="OutlineIcons.FORWARD"
				:color="iconColor"
				:size="FORWARD_ICON_SIZE"
			/>
			<span v-if="isSystemMessage" class="--ellipsis">
				{{ loc('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_SYSTEM')}}
			</span>
			<span v-else-if="isChannelForward" v-html="forwardChannelTitle" class="--ellipsis"></span>
			<span v-else v-html="forwardAuthorTitle" class="--ellipsis"></span>
		</div>
		<AuthorTitle v-else-if="withTitle" :item="item" />
	`,
};
