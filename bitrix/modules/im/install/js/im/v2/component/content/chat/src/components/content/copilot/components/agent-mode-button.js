import { Analytics } from 'im.v2.lib.analytics';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import '../css/agent-mode-button.css';

// @vue/component
export const AgentModeButton = {
	name: 'AgentModeButton',
	components: { UiButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ButtonSize: () => ButtonSize,
		isActive(): boolean
		{
			return this.$store.getters['copilot/chats/isAgentModeEnabled'](this.dialogId);
		},
		buttonStyle(): string
		{
			return this.isActive ? AirButtonStyle.PLAIN_ACCENT : AirButtonStyle.PLAIN;
		},
	},
	methods: {
		toggleAgentMode()
		{
			this.$store.dispatch('copilot/chats/toggleAgentMode', this.dialogId);
			Analytics.getInstance().copilot.onChangeAgentMode(this.dialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-copilot-agent-mode-button__container">
			<UiButton
				:text="loc('IM_CONTENT_COPILOT_AGENT_MODE_BUTTON')"
				:leftIcon="OutlineIcons.LIST_AI_2"
				:size="ButtonSize.SMALL"
				:style="buttonStyle"
				@click="toggleAgentMode"
			/>
		</div>
	`,
};
