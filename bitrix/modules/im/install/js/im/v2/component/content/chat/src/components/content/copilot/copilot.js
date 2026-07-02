import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { BaseChatContent } from 'im.v2.component.content.elements';

import { CopilotChatHeader } from './components/header';
import { CopilotTextarea } from './components/textarea';
import { CopilotDisclaimer } from './components/disclaimer/copilot-disclaimer';

// @vue/component
export const CopilotContent = {
	name: 'CopilotContent',
	components: { BaseChatContent, CopilotChatHeader, CopilotTextarea, CopilotDisclaimer },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		backgroundId: {
			type: String,
			default: null,
		},
	},
	computed: {
		isFileUploadEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCopilotFileUploadAvailable);
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" :backgroundId="backgroundId" :withDropArea="false">
			<template #header>
				<slot name="header">
					<CopilotChatHeader :dialogId="dialogId" :key="dialogId"/>
				</slot>
			</template>
			<template #after-textarea>
				<CopilotDisclaimer/>
			</template>
			<template #textarea="{ onTextareaMount }">
				<CopilotTextarea
					:dialogId="dialogId"
					:isFileUploadEnabled="isFileUploadEnabled"
					:key="dialogId"
					@mounted="onTextareaMount"
				/>
			</template>
		</BaseChatContent>
	`,
};
