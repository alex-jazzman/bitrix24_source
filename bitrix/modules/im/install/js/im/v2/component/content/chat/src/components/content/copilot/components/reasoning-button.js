import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';
import { hint } from 'ui.vue3.directives.hint';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

// @vue/component
export const ReasoningButton = {
	name: 'ReasoningButton',
	directives: { hint },
	components: { Chip },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		isActive(): boolean
		{
			return this.$store.getters['copilot/chats/isReasoningEnabled'](this.dialogId);
		},
		modelCode(): ?string
		{
			return this.$store.getters['copilot/chats/getAIModel'](this.dialogId)?.code;
		},
		isReasoningAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCopilotReasoningAvailable);
		},
		isReasoningAvailableInModel(): boolean
		{
			return this.$store.getters['copilot/isReasoningAvailableInModel'](this.modelCode);
		},
		design(): string
		{
			if (!this.isReasoningAvailableInModel)
			{
				return ChipDesign.Disabled;
			}

			if (this.isActive)
			{
				return ChipDesign.OutlineCopilot;
			}

			return ChipDesign.Outline;
		},
		hint(): { text: string } | null
		{
			if (this.isReasoningAvailableInModel)
			{
				return null;
			}

			return {
				text: this.loc('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON_HINT_NOT_AVAILABLE'),
			};
		},
	},
	watch: {
		isReasoningAvailableInModel(isAvailable: boolean)
		{
			if (!isAvailable && this.isActive)
			{
				this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
			}
		},
	},
	methods: {
		toggle()
		{
			if (!this.isReasoningAvailableInModel)
			{
				return;
			}

			this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
			Analytics.getInstance().copilot.onToggleReasoning(this.dialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Chip
			v-if="isReasoningAvailable"
			v-hint="hint"
			:text="loc('IM_CONTENT_COPILOT_TEXTAREA_REASONING_BUTTON')"
			:rounded="true"
			:size="ChipSize.Sm"
			:icon="OutlineIcons.AI_STARS"
			:design="design"
			@click="toggle"
		/>
	`,
};
