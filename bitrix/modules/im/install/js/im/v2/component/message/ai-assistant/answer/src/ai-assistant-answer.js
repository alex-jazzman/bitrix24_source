import { BaseMessage } from 'im.v2.component.message.base';
import { AuthorTitle, DefaultMessageContent, MessageStatus, MessageKeyboard } from 'im.v2.component.message.elements';

import { BottomPanelContent } from './components/bottom-panel-content';

import './css/ai-assistant-answer.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const AiAssistantMessage = {
	name: 'AiAssistantMessage',
	components: { AuthorTitle, BaseMessage, DefaultMessageContent, BottomPanelContent, MessageStatus, MessageKeyboard },
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
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" class="bx-im-message-ai-assistant-base-message__container">
			<div class="bx-im-message-default__container">
				<AuthorTitle v-if="withTitle" :item="message"/>
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withMessageStatus="false" />
			</div>
			<div class="bx-im-message-ai-assistant-answer__bottom-panel">
				<div class="bx-im-message-ai-assistant-answer__panel-content">
					<BottomPanelContent :item="message" />
				</div>
				<div class="bx-im-message-ai-assistant-answer__status-container">
					<MessageStatus :item="message"/>
				</div>
			</div>
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="message" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`,
};
