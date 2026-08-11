import { CopilotContent } from 'im.v2.component.content.chat';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { SpecialBackground } from 'im.v2.lib.theme';

import { AiAssistantWidgetChatHeader } from '../../header/header';
import { WidgetEmptyState } from './empty-state';

import '../css/chat-content.css';

// @vue/component
export const CopilotWidgetChatContent = {
	name: 'CopilotWidgetChatContent',
	components: { CopilotContent, ChatDialog, AiAssistantWidgetChatHeader, WidgetEmptyState },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
		isCreatingChat: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleList', 'createChat', 'selectSuggestion'],
	computed: {
		SpecialBackground: () => SpecialBackground,
		isChatEmpty(): boolean
		{
			if (!this.dialogId)
			{
				return false;
			}

			const dialog = this.$store.getters['chats/get'](this.dialogId);
			if (!dialog?.chatId || !dialog.inited)
			{
				return false;
			}

			const messages = this.$store.getters['messages/getByChatId'](dialog.chatId);

			return messages.length === 0;
		},
	},
	template: `
		<CopilotContent
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:backgroundId="SpecialBackground.transparent"
		>
			<template #header>
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					:isCreating="isCreatingChat"
					@toggleList="$emit('toggleList')"
					@createChat="$emit('createChat')"
				/>
			</template>
			<template #dialog>
				<WidgetEmptyState v-if="isChatEmpty" :dialogId="dialogId" @selectSuggestion="$emit('selectSuggestion', $event)" />
				<div v-else class="bx-im-ai-assistant-widget-dialog-context --ui-context-content-light">
					<ChatDialog :dialogId="dialogId" :key="dialogId"/>
				</div>
			</template>
		</CopilotContent>
	`,
};
