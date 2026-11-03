import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { BaseChatContent } from 'im.v2.component.content.elements';

import { CopilotChatHeader } from './components/header';
import { CopilotTextarea } from './components/textarea';

// @vue/component
export const CopilotContent = {
	name: 'CopilotContent',
	components: { BaseChatContent, CopilotChatHeader, CopilotTextarea },
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
		heightConfig: {
			/** @type {{ storageKey?: string, minHeight?: number }} */
			type: Object,
			default: undefined,
		},
		// pass-through only: this content serves both the messenger copilot chat and the embeddable widget
		withKeyboardNavigation: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		isFileUploadEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCopilotFileUploadAvailable);
		},
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
		},
		withDropArea(): boolean
		{
			return this.dialogId !== '' && !this.isTempChat && this.isFileUploadEnabled;
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" :backgroundId="backgroundId" :withDropArea="withDropArea">
			<template #header>
				<slot name="header">
					<CopilotChatHeader :dialogId="dialogId" :key="dialogId"/>
				</slot>
			</template>
			<template v-if="$slots.dialog" #dialog>
				<slot name="dialog"></slot>
			</template>
			<template #textarea>
				<CopilotTextarea
					:dialogId="dialogId"
					:isFileUploadEnabled="isFileUploadEnabled"
					:heightConfig="heightConfig"
					:withKeyboardNavigation="withKeyboardNavigation"
					:key="dialogId"
				/>
			</template>
		</BaseChatContent>
	`,
};
