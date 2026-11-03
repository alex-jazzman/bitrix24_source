import { Type } from 'main.core';

import { type ImModelCopilotGreeting } from 'im.v2.model';

import { CopilotTextarea } from '../../../../../content/copilot/components/textarea';

import { AiAssistantSuggestion, AiAssistantSuggestionDesign } from './suggestion';
import { GreetingSelector } from './greeting-selector';

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
		withDraft: {
			/** @type boolean | { draftDialogId: string } */
			type: [Boolean, Object],
			default: false,
		},
		withTextArea: {
			type: Boolean,
			default: false,
		},
		// pass-through only: this view serves both the messenger and the embeddable widget
		withKeyboardNavigation: {
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
		allowBeforeSendOnUninitedTemp: {
			type: Boolean,
			default: false,
		},
		isFileUploadEnabled: {
			type: Boolean,
			default: false,
		},
		heightConfig: {
			/** @type {{ storageKey?: string, minHeight?: number }} */
			type: Object,
			default: undefined,
		},
	},
	emits: ['selectSuggestion'],
	data(): { greeting: string }
	{
		return {
			greeting: '',
		};
	},
	computed:
	{
		greetingPool(): ImModelCopilotGreeting[]
		{
			return this.$store.getters['copilot/getGreetings'];
		},
		greetingWeekHolidays(): number[]
		{
			return this.$store.getters['copilot/getGreetingWeekHolidays'];
		},
		normalizedSuggestions(): SuggestionItem[]
		{
			return this.suggestions
				.map((item) => (Type.isString(item) ? { text: item } : item))
				.filter((item) => item && item.text && item.text.length > 0);
		},
	},
	created(): void
	{
		// re-selected on every mount of the empty state (local browser time)
		this.greeting = new GreetingSelector(this.greetingPool, { weekHolidays: this.greetingWeekHolidays }).select();
	},
	methods:
	{
		onChipClick(item: SuggestionItem): void
		{
			this.$emit('selectSuggestion', { text: item.text });
		},
	},
	template: `
		<div class="bx-im-ai-assistant-empty-state-view bx-im-ai-assistant-empty-state-view__scope" data-testid="im-ai-assistant-empty-state">
			<div v-if="greeting" class="bx-im-ai-assistant-empty-state-view__title" data-testid="im-ai-assistant-empty-state-greeting">{{ greeting }}</div>
			<div v-if="withTextArea" class="bx-im-ai-assistant-empty-state-view__textarea">
				<CopilotTextarea
					:dialogId="dialogId"
					:disabled="disabled"
					:withDraft="withDraft"
					:deferredDialogPromise="deferredDialogPromise"
					:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
					:isFileUploadEnabled="isFileUploadEnabled"
					:heightConfig="heightConfig"
					:withKeyboardNavigation="withKeyboardNavigation"
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
					data-testid="im-ai-assistant-empty-state-suggestion"
					@click="onChipClick(item)"
				/>
			</div>
		</div>
	`,
};
