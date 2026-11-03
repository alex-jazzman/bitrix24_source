import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/create-chat-button-ai-assistant.css';

// @vue/component
export const AiAssistantCreateChatButton = {
	name: 'AiAssistantCreateChatButton',
	components: { BIcon, Spinner },
	props: {
		isCreating: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['newChat'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		SpinnerColor: () => SpinnerColor,
		SpinnerSize: () => SpinnerSize,
		isLegacyStyles(): boolean
		{
			return !FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
		spinnerColor(): string
		{
			return this.isLegacyStyles ? SpinnerColor.copilot : SpinnerColor.grey;
		},
	},
	methods: {
		loc(phrase: string): string
		{
			return this.$Bitrix.Loc.getMessage(phrase);
		},
		handleActivationKeydown(event: KeyboardEvent): void
		{
			if (event.target !== event.currentTarget)
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				// Synthesize the native click so keyboard and mouse share the same @click guard.
				event.preventDefault();
				this.$el.click();
			}
		},
	},
	template: `
		<div
			class="bx-im-ai-assistant-create-chat-button__scope bx-im-ai-assistant-create-chat-button"
			:class="{ '--legacy': isLegacyStyles, '--loading': !isLegacyStyles && isCreating }"
			data-testid="im-create-chat-button-ai-assistant"
			role="button"
			tabindex="0"
			:aria-label="loc('IM_LIST_CONTAINER_AI_ASSISTANT_NEW_CHAT')"
			:title="loc('IM_LIST_CONTAINER_AI_ASSISTANT_NEW_CHAT')"
			@click="!isCreating && $emit('newChat')"
			@keydown="handleActivationKeydown"
		>
			<Spinner
				v-if="isCreating"
				:size="SpinnerSize.XS"
				:color="spinnerColor"
			/>
			<BIcon
				v-else
				class="bx-im-ai-assistant-create-chat-button__icon"
				:name="OutlineIcons.PLUS_L"
			/>
		</div>
	`,
};
