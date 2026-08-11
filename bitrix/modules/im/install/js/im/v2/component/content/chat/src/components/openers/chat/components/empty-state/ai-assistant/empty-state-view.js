import { Type } from 'main.core';

import { CopilotTextarea } from '../../../../../content/copilot/components/textarea';

import { AiAssistantSuggestion, AiAssistantSuggestionDesign } from './suggestion';

import './css/empty-state-view.css';

type SuggestionInput = string | { text: string };
type SuggestionItem = { text: string };

// @vue/component
export const AiAssistantEmptyStateView = {
	name: 'AiAssistantEmptyStateView',
	components: { AiAssistantSuggestion, CopilotTextarea },
	props: {
		suggestions: {
			type: Array,
			default: (): SuggestionInput[] => [],
		},
		dialogId: {
			type: String,
			default: '',
		},
		withTextArea: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		suggestionDesign: {
			type: String,
			default: AiAssistantSuggestionDesign.overlay,
		},
		deferredDialogPromise: {
			type: Object,
			default: null,
		},
	},
	emits: ['selectSuggestion'],
	computed:
	{
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_CONTENT_AI_ASSISTANT_EMPTY_STATE_TITLE');
		},
		normalizedSuggestions(): SuggestionItem[]
		{
			return this.suggestions
				.map((item) => (Type.isString(item) ? { text: item } : item))
				.filter((item) => item && item.text && item.text.length > 0);
		},
	},
	methods:
	{
		onChipClick(item: SuggestionItem): void
		{
			this.$emit('selectSuggestion', { text: item.text });
		},
	},
	template: `
		<div class="bx-im-ai-assistant-empty-state-view bx-im-ai-assistant-empty-state-view__scope">
			<div v-if="title" class="bx-im-ai-assistant-empty-state-view__title">{{ title }}</div>
			<div v-if="withTextArea" class="bx-im-ai-assistant-empty-state-view__textarea">
				<CopilotTextarea
					:dialogId="dialogId"
					:disabled="disabled"
					:withDraft="false"
					:deferredDialogPromise="deferredDialogPromise"
				/>
			</div>
			<div
				v-if="normalizedSuggestions.length > 0"
				class="bx-im-ai-assistant-empty-state-view__suggestions"
			>
				<AiAssistantSuggestion
					v-for="(item, index) in normalizedSuggestions"
					:key="index"
					:text="item.text"
					:design="suggestionDesign"
					@click="onChipClick(item)"
				/>
			</div>
		</div>
	`,
};
