import './css/suggestion.css';

export const AiAssistantSuggestionDesign = Object.freeze({
	overlay: 'overlay',
	gradient: 'gradient',
});

// @vue/component
export const AiAssistantSuggestion = {
	name: 'AiAssistantSuggestion',
	props: {
		text: {
			type: String,
			required: true,
		},
		design: {
			type: String,
			default: AiAssistantSuggestionDesign.overlay,
		},
	},
	emits: ['click'],
	computed:
	{
		rootClasses(): Array<string>
		{
			return ['bx-im-ai-assistant-suggestion', `--${this.design}`];
		},
	},
	template: `
		<button
			type="button"
			:class="rootClasses"
			@click="$emit('click')"
		>
			<span class="bx-im-ai-assistant-suggestion__text">{{ text }}</span>
		</button>
	`,
};
