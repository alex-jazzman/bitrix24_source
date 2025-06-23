import { BaseChatContent } from 'im.v2.component.content.elements';

import { CopilotChatHeader } from './chat-header';
import { CopilotTextarea } from './textarea';

// @vue/component
export const CopilotInternalContent = {
	name: 'CopilotInternalContent',
	components: { BaseChatContent, CopilotChatHeader, CopilotTextarea },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<CopilotChatHeader :dialogId="dialogId" :key="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<CopilotTextarea :dialogId="dialogId" :key="dialogId" @mounted="onTextareaMount" />
			</template>
		</BaseChatContent>
	`,
};
