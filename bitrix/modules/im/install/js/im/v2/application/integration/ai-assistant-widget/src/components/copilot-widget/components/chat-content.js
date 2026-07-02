import { CopilotContent } from 'im.v2.component.content.chat';
import { SpecialBackground } from 'im.v2.lib.theme';
import { AiAssistantWidgetChatHeader } from '../../header/header';

// @vue/component
export const CopilotWidgetChatContent = {
	name: 'CopilotWidgetChatContent',
	components: { CopilotContent, AiAssistantWidgetChatHeader },
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
	emits: ['toggleList'],
	computed: {
		SpecialBackground: () => SpecialBackground,
	},
	template: `
		<CopilotContent
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:themeId="SpecialBackground.transparent"
		>
			<template #header>
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					@toggleList="$emit('toggleList')"
				/>
			</template>
		</CopilotContent>
	`,
};
