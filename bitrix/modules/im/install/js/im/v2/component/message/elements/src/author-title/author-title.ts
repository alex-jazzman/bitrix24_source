import { type EventEmitter } from 'main.core.events';
import { defineComponent, type PropType } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { MessageAuthorTitle } from 'im.v2.component.elements.chat-title';
import { EventType, ChatType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage, type ImModelUser, type ImModelChat } from 'im.v2.model';

import './author-title.css';

// @vue/component
export const AuthorTitle = defineComponent({
	name: 'AuthorTitle',
	components: { MessageAuthorTitle } as { MessageAuthorTitle: typeof MessageAuthorTitle },
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.message.chatId);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.message.authorId, true);
		},
		isSystemMessage(): boolean
		{
			return this.message.authorId === 0;
		},
		isSelfMessage(): boolean
		{
			return this.message.authorId === Core.getUserId();
		},
		isUserChat(): boolean
		{
			return this.dialog.type === ChatType.user && !this.isBotWithFakeAuthorNames;
		},
		isBotWithFakeAuthorNames(): boolean
		{
			return this.isSupportBot || this.isNetworkBot;
		},
		isNetworkBot(): boolean
		{
			return this.$store.getters['users/bots/isNetwork'](this.dialog.dialogId);
		},
		isSupportBot(): boolean
		{
			return this.$store.getters['users/bots/isSupport'](this.dialog.dialogId);
		},
		showTitle(): boolean
		{
			return !this.isSystemMessage && !this.isSelfMessage && !this.isUserChat;
		},
		authorDialogId(): string
		{
			if (this.message.authorId)
			{
				return this.message.authorId.toString();
			}

			return (this as unknown as { dialogId: string }).dialogId;
		},
		isCopilot(): boolean
		{
			const authorId = Number.parseInt(this.authorDialogId, 10);

			return this.$store.getters['users/bots/isCopilot'](authorId);
		},
		canMentionByClick(): boolean
		{
			if (!this.isCopilot)
			{
				return false;
			}

			return new CopilotManager().isMentionByClickAvailable(this.dialog.dialogId, this.authorDialogId);
		},
	},
	methods: {
		onAuthorNameClick()
		{
			const authorId = Number.parseInt(this.authorDialogId, 10);
			if (!authorId || authorId === Core.getUserId())
			{
				return;
			}

			if (this.isCopilot && !this.canMentionByClick)
			{
				return;
			}

			this.getEmitter().emit(EventType.textarea.insertMention, {
				mentionText: this.user.name,
				mentionReplacement: Utils.text.getMentionBbCode(this.user.id, this.user.name),
				mentionedUserId: this.user.id,
				dialogId: this.dialog.dialogId,
				isMentionSymbol: false,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div 
			v-if="showTitle" 
			@click="onAuthorNameClick" 
			class="bx-im-message-author-title__container" 
			:class="{'--clickable': !isCopilot || canMentionByClick}"
			data-testid="im-message-author-title"
		>
			<MessageAuthorTitle
				:dialogId="authorDialogId"
				:messageId="message.id"
				:showItsYou="false"
				:withColor="true"
				:withLeftIcon="!isCopilot"
			/>
		</div>
	`,
});
