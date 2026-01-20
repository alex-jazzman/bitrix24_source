import { AiAssistantWidget as AiAssistantWidgetLayout } from '../../../entities/ai-assistant';

// @vue/component
export const AiAssistantWidget = {
	name: 'AiAssistantWidget',
	components: { AiAssistantWidgetLayout },
	data(): { isConnected: boolean }
	{
		return {
			isConnected: false,
		};
	},
	methods:
	{
		onConnected(): void
		{
			this.$emit('connected');
			this.isConnected = true;
		},
	},
	template: `
		<AiAssistantWidgetLayout
			@connected="onConnected"
		/>
	`,
};
