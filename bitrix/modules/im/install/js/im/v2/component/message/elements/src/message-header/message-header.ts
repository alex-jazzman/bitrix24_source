import { Text, Loc, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { EventType, Color } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessage } from 'im.v2.model';

import { AuthorTitle } from '../author-title/author-title';

import './message-header.css';

const FORWARD_ICON_SIZE = 20;

// @vue/component
export const MessageHeader = defineComponent({
	name: 'MessageHeader',
	components: { AuthorTitle, BIcon } as { AuthorTitle: typeof AuthorTitle, BIcon: typeof BIcon },
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
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
		OutlineIcons(): typeof OutlineIcons
		{
			return OutlineIcons;
		},
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
		/**
		 * By parentChatId, not by chatType: a thread and the comments of a channel share the type
		 * 'comment', so branching by type would swap the two captions.
		 */
		isDiscussionForward(): boolean
		{
			return Text.toNumber(this.message.forward.parentChatId) > 0;
		},
		isCommentsForwardParent(): boolean
		{
			return ChannelManager.channelTypes.has(this.message.forward.parentChatType);
		},
		/** Unlike forwardChatName, an absent name stays absent instead of becoming a closed channel. */
		forwardParentName(): string | null
		{
			return Type.isStringFilled(this.message.forward.chatTitle) ? this.message.forward.chatTitle : null;
		},
		forwardAuthorName(): string
		{
			const copilotManager = new CopilotManager();
			if (copilotManager.isCopilotBot(this.forwardAuthorId))
			{
				const forwardMessageId = this.forwardContextId.split('/')[1];

				return copilotManager.getNameWithRole(forwardMessageId);
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
		isSystemAuthor(): boolean
		{
			return this.message.authorId === 0;
		},
		shouldShowAuthorTitle(): boolean
		{
			return this.withTitle && !this.isSystemAuthor && !this.isForwarded;
		},
		forwardAuthorTitle(): string
		{
			return Loc.getMessage('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_CHAT', {
				'[user_name]': '<span class="bx-im-message-header__author-name">',
				'#USER_NAME#': Text.encode(this.forwardAuthorName),
				'[/user_name]': '</span>',
			}) ?? '';
		},
		/**
		 * Without the name the caption still speaks the language of its source. A parent of an unknown
		 * kind - a deleted chat, an answer of a server that does not send the type - has no language of
		 * its own and keeps the generic caption.
		 */
		forwardDiscussionNoNamePhraseCode(): string
		{
			if (!Type.isStringFilled(this.message.forward.parentChatType))
			{
				return 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_DISCUSSION';
			}

			return this.isCommentsForwardParent
				? 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_COMMENTS_NO_NAME'
				: 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_THREAD_NO_NAME';
		},
		forwardDiscussionTitle(): string
		{
			// markers first, values last: a name carrying a literal marker then stays a literal
			const authorMarkers = {
				'[user_name]': '<span class="bx-im-message-header__author-name">',
				'[/user_name]': '</span>',
			};
			const authorName = { '#USER_NAME#': Text.encode(this.forwardAuthorName) };

			if (this.forwardParentName === null)
			{
				return Loc.getMessage(
					this.forwardDiscussionNoNamePhraseCode,
					{ ...authorMarkers, ...authorName },
				) ?? '';
			}

			const phraseCode = this.isCommentsForwardParent
				? 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_COMMENTS'
				: 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_THREAD';

			return Loc.getMessage(phraseCode, {
				...authorMarkers,
				'[chat_name]': '<span class="bx-im-message-header__author-name">',
				'[/chat_name]': '</span>',
				...authorName,
				'#CHAT_NAME#': Text.encode(this.forwardParentName),
			}) ?? '';
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
			}) ?? '';
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
			data-testid="im-message-header-forward-root"
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
			<span
				v-else-if="isDiscussionForward"
				v-html="forwardDiscussionTitle"
				class="--ellipsis"
				data-testid="im-message-header-forward-discussion"
			></span>
			<span v-else-if="isChannelForward" v-html="forwardChannelTitle" class="--ellipsis"></span>
			<span v-else v-html="forwardAuthorTitle" class="--ellipsis"></span>
		</div>
		<AuthorTitle v-else-if="shouldShowAuthorTitle" :item="item" />
	`,
});
