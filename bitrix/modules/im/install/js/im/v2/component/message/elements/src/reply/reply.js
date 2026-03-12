import { Type } from 'main.core';

import { Parser } from 'im.v2.lib.parser';

import type { ImModelChat, ImModelMessage, ImModelUser } from 'im.v2.model';

const NO_CONTEXT_TAG = 'none';

// @vue/component
export const Reply = {
	name: 'ReplyComponent',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		replyId: {
			type: Number,
			required: true,
		},
		isForward: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			isExpanded: false,
			isExpandable: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		replyMessage(): ?ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.replyId);
		},
		replyMessageChat(): ?ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.replyMessage?.chatId);
		},
		replyAuthor(): ?ImModelUser
		{
			return this.$store.getters['users/get'](this.replyMessage.authorId);
		},
		replyTitle(): string
		{
			return this.replyAuthor ? this.replyAuthor.name : this.loc('IM_DIALOG_CHAT_QUOTE_DEFAULT_TITLE');
		},
		replyText(): string
		{
			let text = Parser.prepareQuote(this.replyMessage);
			text = Parser.decodeText(text);

			return text;
		},
		isQuoteFromTheSameChat(): boolean
		{
			return this.replyMessage?.chatId === this.dialog.chatId;
		},
		replyContext(): string
		{
			if (!this.isQuoteFromTheSameChat)
			{
				return NO_CONTEXT_TAG;
			}

			if (!this.isForward)
			{
				return `${this.dialogId}/${this.replyId}`;
			}

			return `${this.replyMessageChat.dialogId}/${this.replyId}`;
		},
		canShowReply(): boolean
		{
			return !Type.isNil(this.replyMessage);
		},
		isActiveQuote(): boolean
		{
			return this.replyContext !== NO_CONTEXT_TAG;
		},
		quoteClasses(): Record<string, boolean>
		{
			return {
				'--expanded': this.isExpanded,
				'--collapsed': !this.isExpanded,
				'--clickable': this.isActiveQuote || this.isExpandable,
			};
		},
		toggleLabel(): string
		{
			return this.isExpanded
				? this.loc('IM_PARSER_QUOTE_COLLAPSE')
				: this.loc('IM_PARSER_QUOTE_EXPAND');
		},
	},
	watch:
	{
		replyText()
		{
			void this.updateToggleAvailability();
		},
	},
	mounted()
	{
		void this.updateToggleAvailability();
	},
	methods:
	{
		toggleExpanded()
		{
			if (!this.isExpandable)
			{
				return;
			}

			this.isExpanded = !this.isExpanded;
		},
		async updateToggleAvailability()
		{
			await this.$nextTick();

			const textNode = this.$refs.text;
			if (!textNode)
			{
				return;
			}

			const isOverflowing = textNode.scrollHeight > textNode.clientHeight + 1;
			this.isExpandable = isOverflowing;

			if (!isOverflowing)
			{
				this.isExpanded = false;
			}
		},
		hasSelectedText(): boolean
		{
			const selection = window.getSelection().toString().trim();

			return Type.isStringFilled(selection);
		},
		onQuoteClick(event: MouseEvent)
		{
			const isInteractiveClick = (
				event.target instanceof HTMLElement
				&& event.target.closest('a')
			);
			if (isInteractiveClick)
			{
				event.stopPropagation();

				return;
			}

			if (this.hasSelectedText())
			{
				event.stopPropagation();

				return;
			}

			if (this.isActiveQuote || !this.isExpandable)
			{
				return;
			}

			this.toggleExpanded();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			v-if="canShowReply"
			class="bx-im-message-quote --reply"
			:class="quoteClasses"
			:data-context="replyContext"
			@click="onQuoteClick"
		>
			<div class="bx-im-message-quote__wrap">
				<div class="bx-im-message-quote__name">
					<div class="bx-im-message-quote__name-text">{{ replyTitle }}</div>
				</div>
				<div ref="text" class="bx-im-message-quote__text" v-html="replyText"></div>
				<button
					v-if="isExpandable"
					type="button"
					class="bx-im-message-quote__toggle"
					@click.stop="toggleExpanded"
				>
					{{ toggleLabel }}
				</button>
			</div>
		</div>
	`,
};
