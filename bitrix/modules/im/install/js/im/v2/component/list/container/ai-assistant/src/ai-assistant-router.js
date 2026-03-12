import { CopilotListContainer } from 'im.v2.component.list.container.copilot';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import { AiAssistantListContainer } from './components/ai-assistant-container';

// @vue/component
export const AiAssistantListRouter = {
	name: 'AiAssistantListRouter',
	components: { CopilotListContainer, AiAssistantListContainer },
	computed: {
		isAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.aiAssistantChatAvailable);
		},
	},
	template: `
		<AiAssistantListContainer v-if="isAvailable" />
		<CopilotListContainer v-else />
	`,
};
