import { AiAssistantEmptyStateView, AiAssistantSuggestionDesign } from 'im.v2.component.content.chat';

import '../css/empty-state.css';

// @vue/component
export const WidgetEmptyState = {
	name: 'WidgetEmptyState',
	components: { AiAssistantEmptyStateView },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	emits: ['selectSuggestion'],
	computed: {
		AiAssistantSuggestionDesign: () => AiAssistantSuggestionDesign,
		suggestions(): string[]
		{
			return this.$store.getters['copilot/getSuggests'];
		},
	},
	methods: {
		onSuggestionSelect({ text }: { text: string }): void
		{
			this.$emit('selectSuggestion', text);
		},
	},
	template: `
		<div class="bx-im-ai-assistant-widget-empty-state --ui-context-content-light">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="dialogId"
				:withTextArea="false"
				:suggestionDesign="AiAssistantSuggestionDesign.gradient"
				@selectSuggestion="onSuggestionSelect"
			/>
		</div>
	`,
};
