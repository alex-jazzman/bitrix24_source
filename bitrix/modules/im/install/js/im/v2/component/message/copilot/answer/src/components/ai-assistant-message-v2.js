import { BaseMessage } from 'im.v2.component.message.base';
import { AuthorTitle, DefaultMessageContent, MessageKeyboard, MessageStatus } from 'im.v2.component.message.elements';
import { type ImModelMessage } from 'im.v2.model';

import { BottomPanel } from './bottom-panel';

import '../css/ai-assistant-message-v2.css';

// @vue/component
export const AiAssistantMessageV2 = {
	name: 'AiAssistantMessageV2',
	components: {
		AuthorTitle,
		BaseMessage,
		BottomPanel,
		MessageKeyboard,
		MessageStatus,
		DefaultMessageContent,
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
		isError(): boolean
		{
			return this.message.componentParams?.copilotError === true;
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" :withError="isError" class="bx-im-message-ai-assistant-v2-base-message__container">
			<div class="bx-im-message-default__container bx-im-message-ai-assistant-v2-answer__container" :class="{'--error': isError}">
				<AuthorTitle :item="item" />
				<div class="bx-im-message-default-content__container bx-im-message-default-content__scope">
					<DefaultMessageContent 
						:item="item" 
						:dialogId="dialogId" 
						:withAttach="false" 
						:withMessageStatus="false"
						:withBuilder="true"
					/>
					<div v-if="isError" class="bx-im-message-default-content__bottom-panel">
						<div class="bx-im-message-default-content__status-container">
							<MessageStatus :item="message" />
						</div>
					</div>
				</div>
			</div>
			<BottomPanel v-if="!isError" :message="message" :dialogId="dialogId" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="message" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`,
};
