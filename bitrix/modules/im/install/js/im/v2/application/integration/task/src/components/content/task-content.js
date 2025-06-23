import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatTextarea } from 'im.v2.component.textarea';

import { TaskChatHeader } from './components/header';

// @vue/component
export const TaskChatContent = {
	name: 'TaskChatContent',
	components: { BaseChatContent, TaskChatHeader, ChatTextarea },
	props:
	{
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
				<TaskChatHeader :dialogId="dialogId" />
			</template>
			<template #textarea="{ onTextareaMount }">
				<ChatTextarea
					:dialogId="dialogId"
					:key="dialogId"
					:withMarket="false"
					:withAudioInput="false"
					:withAutoFocus="false"
					@mounted="onTextareaMount"
				/>
			</template>
		</BaseChatContent>
	`,
};
