import { BaseMessage } from 'im.v2.component.message.base';
import { AuthorTitle, DefaultMessageContent, MessageKeyboard } from 'im.v2.component.message.elements';
import { isCopilotGenerationActive } from 'im.v2.lib.copilot';

import { BottomPanelContent } from './components/bottom-panel-content';

import './css/ai-assistant-answer.css';

import type { ImModelMessage } from 'im.v2.model';

// @vue/component
export const AiAssistantMessage = {
	name: 'AiAssistantMessage',
	components: { AuthorTitle, BaseMessage, DefaultMessageContent, BottomPanelContent, MessageKeyboard },
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
		isGenerationActive(): boolean
		{
			return isCopilotGenerationActive(this.message, this.$store);
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" :withContextMenu="!isGenerationActive" class="bx-im-message-ai-assistant-base-message__container">
			<div class="bx-im-message-default__container">
				<AuthorTitle v-if="withTitle" :item="message"/>
				<DefaultMessageContent
					:item="message"
					:dialogId="dialogId"
					:withMessageStatus="false"
					:withBuilder="true"
				/>
			</div>
			<BottomPanelContent :item="message" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="message" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`,
};
