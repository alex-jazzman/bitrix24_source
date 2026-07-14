import { CopilotContent } from 'im.v2.component.content.chat';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { SpecialBackground } from 'im.v2.lib.theme';
import { AiAssistantWidgetChatHeader } from '../../header/header';

import '../css/chat-content.css';

// @vue/component
export const CopilotWidgetChatContent = {
	name: 'CopilotWidgetChatContent',
	components: { CopilotContent, ChatDialog, AiAssistantWidgetChatHeader },
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
	emits: ['toggleList', 'createChat'],
	computed: {
		SpecialBackground: () => SpecialBackground,
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
				<div class="bx-im-ai-assistant-widget-dialog-context --ui-context-content-light">
					<ChatDialog :dialogId="dialogId" :key="dialogId"/>
				</div>
			</template>
		</CopilotContent>
	`,
};
