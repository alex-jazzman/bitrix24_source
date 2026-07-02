import { Dom, Type } from 'main.core';

import { BaseMessage } from 'im.v2.component.message.base';
import { ReactionList, MessageStatus, AuthorTitle, TextContent } from 'im.v2.component.message.elements';
import { CopilotManager } from 'im.v2.lib.copilot';
import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';
import { Notifier } from 'im.v2.lib.notifier';
import { Parser } from 'im.v2.lib.parser';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

import './css/copilot-answer.css';

// @vue/component
export const CopilotMessage = {
	name: 'CopilotMessage',
	components: { AuthorTitle, BaseMessage, ReactionList, MessageStatus, TextContent },
	props:
	{
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
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		formattedText(): string
		{
			return Parser.decodeMessage(this.item);
		},
		canSetReactions(): boolean
		{
			return Type.isNumber(this.message.id);
		},
		isReply(): boolean
		{
			return this.message.replyId !== 0;
		},
		isError(): boolean
		{
			return this.message.componentParams?.copilotError === true;
		},
		warningText(): string
		{
			return this.loc(
				'IM_MESSAGE_COPILOT_ANSWER_WARNING_MSGVER_1',
				{
					'#LINK_START#': '<a class="bx-im-message-copilot-answer__warning_more">',
					'#LINK_END#': '</a>',
					'#COPILOT_NAME#': this.copilotManager.getName(),
				},
			);
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	methods:
	{
		async onCopyClick()
		{
			await Utils.text.copyToClipboard(this.message.text);
			Notifier.onCopyTextComplete();
		},
		onWarningDetailsClick(event: PointerEvent)
		{
			if (!Dom.hasClass(event.target, 'bx-im-message-copilot-answer__warning_more'))
			{
				return;
			}

			const ARTICLE_CODE = '20412666';
			openHelpdeskArticle(ARTICLE_CODE);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" class="bx-im-message-copilot-base-message__container">
			<div class="bx-im-message-default__container bx-im-message-copilot-answer__container" :class="{'--error': isError}">
				<AuthorTitle v-if="withTitle" :item="item" />
				<div class="bx-im-message-default-content__container">
					<TextContent :text="formattedText" />
					<ReactionList
						v-if="canSetReactions"
						:messageId="message.id"
						class="bx-im-message-default-content__reaction-list"
					/>
					<div v-if="isError" class="bx-im-message-default-content__bottom-panel">
						<div class="bx-im-message-default-content__status-container">
							<MessageStatus :item="message" />
						</div>
					</div>
				</div>
			</div>
			<div v-if="!isError" class="bx-im-message-copilot-answer__bottom-panel">
				<div class="bx-im-message-copilot-answer__panel-content">
					<button
						:title="loc('IM_MESSAGE_COPILOT_ANSWER_ACTION_COPY')"
						@click="onCopyClick"
						class="bx-im-message-copilot-answer__copy_icon"
					></button>
					<span 
						v-html="warningText"
						@click="onWarningDetailsClick"
						class="bx-im-message-copilot-answer__warning"
					></span>
				</div>
				<div class="bx-im-message-default-content__status-container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</BaseMessage>
	`,
};
