import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatTextarea } from 'im.v2.component.textarea';

import { AiAssistantChatHeader } from './components/header';

import type { ImModelChat } from 'im.v2.model';

export const AiAssistantChatContent = {
	name: 'AiAssistantChatContent',
	components: { BaseChatContent, ChatTextarea, AiAssistantChatHeader },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		isAiAssistantMultiUserChat(): boolean
		{
			const dialog: ImModelChat = this.$store.getters['chats/get'](this.dialogId, true);

			return dialog.userCounter > 2;
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<AiAssistantChatHeader :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<ChatTextarea
					:dialogId="dialogId"
					:key="dialogId"
					:placeholder="loc('IM_CONTENT_AIASSISTANT_TEXTAREA_PLACEHOLDER')"
					:withMarket="false"
					:withEdit="false"
					:withUploadMenu="false"
					:withSmileSelector="false"
					:withMention="isAiAssistantMultiUserChat"
					@mounted="onTextareaMount"
				/>
			</template>
		</BaseChatContent>
	`,
};
