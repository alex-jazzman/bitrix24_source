import { BaseChatContent } from 'im.v2.component.content.elements';

import { AiAssistantWidgetChatHeader } from './components/header';

// @vue/component
export const AiAssistantWidgetChatContent = {
	name: 'AiAssistantWidgetChatContent',
	components: { BaseChatContent, AiAssistantWidgetChatHeader },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" :withSidebar="withSidebar">
			<template #header>
				<AiAssistantWidgetChatHeader :dialogId="dialogId"/>
			</template>
		</BaseChatContent>
	`,
};
