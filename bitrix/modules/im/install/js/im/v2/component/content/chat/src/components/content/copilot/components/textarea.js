import { ChatTextarea } from 'im.v2.component.textarea';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { ReasoningButton } from './textarea-toolbar/components/reasoning-button';
import { ToolbarButtons } from './textarea-toolbar/toolbar-buttons';

// @vue/component
export const CopilotTextarea = {
	name: 'CopilotTextarea',
	components: { ChatTextarea, ToolbarButtons, ReasoningButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isFileUploadEnabled: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		isToolbarButtonsEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ChatTextarea
			:dialogId="dialogId"
			:placeholder="loc('IM_CONTENT_COPILOT_TEXTAREA_PLACEHOLDER')"
			:withMarket="false"
			:withEdit="false"
			:withUploadMenu="isFileUploadEnabled"
			:withSmileSelector="false"
		>
			<template #bottom-panel-buttons>
				<ToolbarButtons
					v-if="isToolbarButtonsEnabled"
					:dialogId="dialogId"
				/>
				<ReasoningButton
					v-else
					:dialogId="dialogId"
				/>
			</template>
		</ChatTextarea>
	`,
};
