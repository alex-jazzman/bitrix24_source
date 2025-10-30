import { AiAssistantBotContent } from 'im.v2.component.content.chat';

import { AiAssistantWidgetChatHeader } from './components/header';

// @vue/component
export const AiAssistantWidgetChatContent = {
	name: 'AiAssistantWidgetChatContent',
	components: { AiAssistantWidgetChatHeader, AiAssistantBotContent },
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
		<AiAssistantBotContent :dialogId="dialogId" :withSidebar="withSidebar">
			<template #header>
				<AiAssistantWidgetChatHeader :dialogId="dialogId"/>
			</template>
		</AiAssistantBotContent>
	`,
};
