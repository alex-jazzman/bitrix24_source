import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatTextarea } from 'im.v2.component.textarea';

import { McpIntegration } from './components/mcp-integration';

export const AiAssistantBotContent = {
	name: 'AiAssistantBotContent',
	components: { BaseChatContent, ChatTextarea, McpIntegration },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
		// pass-through only: this content serves both the messenger and the embeddable widget
		withKeyboardNavigation: {
			type: Boolean,
			default: false,
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" :withSidebar="withSidebar" :withDropArea="false">
			<template #header v-if="$slots['header']">
				<slot name="header"></slot>
			</template>
			<template #textarea>
				<ChatTextarea
					:dialogId="dialogId"
					:key="dialogId"
					:placeholder="loc('IM_CONTENT_AIASSISTANT_TEXTAREA_PLACEHOLDER_MSGVER_1')"
					:withMarket="false"
					:withEdit="false"
					:withUploadMenu="false"
					:withSmileSelector="false"
					:withKeyboardNavigation="withKeyboardNavigation"
				>
					<template #bottom-panel-buttons>
						<McpIntegration />
					</template>
				</ChatTextarea>
			</template>
		</BaseChatContent>
	`,
};
