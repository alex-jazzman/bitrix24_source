import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CopilotMessageLegacy } from './components/copilot-message';
import { AiAssistantMessageV2 } from './components/ai-assistant-message-v2';

// @vue/component
export const CopilotMessage = {
	name: 'CopilotMessage',
	components: { CopilotMessageLegacy, AiAssistantMessageV2 },
	props:
	{
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	computed:
	{
		isCopilot2026Enabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
	},
	template: `
		<AiAssistantMessageV2
			v-if="isCopilot2026Enabled"
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
		/>
		<CopilotMessageLegacy
			v-else
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
		/>
	`,
};
