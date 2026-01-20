import { ChatTextarea } from 'im.v2.component.textarea';

import { ReasoningButton } from './reasoning-button';

// @vue/component
export const CopilotTextarea = {
	name: 'CopilotTextarea',
	components: { ChatTextarea, ReasoningButton },
	props: {
		dialogId: {
			type: String,
			required: true,
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
			:withUploadMenu="false"
			:withSmileSelector="false"
		>
			<template #bottom-panel-buttons>
				<ReasoningButton :dialogId="dialogId" />
			</template>
		</ChatTextarea>
	`,
};
