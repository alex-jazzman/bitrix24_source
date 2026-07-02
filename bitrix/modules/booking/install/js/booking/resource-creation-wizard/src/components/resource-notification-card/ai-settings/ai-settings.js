import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.core';

import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
import { aiAgentLauncherService } from 'booking.provider.service.ai-agent-launcher-service';
import 'ui.buttons';
import './ai-settings.css';

// @vue/component
export const AiSettings = {
	name: 'AiSettings',
	components: {
		UiResourceWizardItem,
		UiButton,
	},
	setup(): {
		ButtonSize: typeof ButtonSize,
		ButtonColor: typeof ButtonColor,
		Outline: typeof Outline,
	}
	{
		return {
			ButtonSize,
			ButtonColor,
			Outline,
		};
	},
	data(): { isLoading: boolean }
	{
		return {
			isLoading: false,
		};
	},
	methods: {
		async launchAiAgent(): Promise<void>
		{
			this.isLoading = true;
			try
			{
				await aiAgentLauncherService.launch();
			}
			finally
			{
				this.isLoading = false;
			}
		},
	},
	template: `
		<UiResourceWizardItem
			:title="loc('BRCW_METHODS_COMMUNICATION_AI_SETTINGS_TITLE')"
			:iconType="Outline.BITRIX_GPT"
		>
			<div class="resource-notification-card-ai-settings-card" >
				<div class="resource-notification-card-ai-settings-card-title">
					{{ loc('BRCW_METHODS_COMMUNICATION_AI_SETTINGS_SUBTITLE') }}
				</div>
				<div class="resource-notification-card-ai-settings-card-description">
					{{ loc('BRCW_METHODS_COMMUNICATION_AI_SETTINGS_DESCRIPTION') }}
				</div>
				<UiButton
					:text="loc('BRCW_METHODS_COMMUNICATION_AI_SETTINGS_BTN')"
					:size="ButtonSize.SMALL"
					:color="ButtonColor.PRIMARY"
					:loading="isLoading"
					@click="launchAiAgent"
				/>
			</div>
		</UiResourceWizardItem>
	`,
};
