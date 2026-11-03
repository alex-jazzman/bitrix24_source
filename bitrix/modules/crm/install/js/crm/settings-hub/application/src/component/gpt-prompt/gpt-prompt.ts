import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

export const CrmSettingsHubGptPrompt = defineComponent({
	name: 'CrmSettingsHubGptPrompt',
	components: { BIcon },
	mixins: [locMixin],
	setup(): Object
	{
		return { Outline };
	},
	computed: {
		label(): string
		{
			return this.loc('CRM_SETTINGS_HUB_GPT_LABEL');
		},
		placeholder(): string
		{
			return this.loc('CRM_SETTINGS_HUB_GPT_PLACEHOLDER');
		},
		actionText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_GPT_ASK');
		},
		hint(): string
		{
			return this.loc('CRM_SETTINGS_HUB_GPT_HINT');
		},
	},
	template: `
		<div class="crm-settings-hub-application__gpt">
			<span class="crm-settings-hub-application__gpt-label">{{ label }}</span>
			<div class="crm-settings-hub-application__gpt-field">
				<BIcon :name="Outline.AI_STARS_QUESTION" class="crm-settings-hub-application__gpt-icon"/>
				<span class="crm-settings-hub-application__gpt-placeholder">{{ placeholder }}</span>
				<span class="crm-settings-hub-application__gpt-ask" aria-disabled="true">
					<BIcon :name="Outline.MAGIC_WAND" class="crm-settings-hub-application__gpt-ask-icon"/>
					<span>{{ actionText }}</span>
				</span>
			</div>
			<span class="crm-settings-hub-application__gpt-hint">{{ hint }}</span>
		</div>
	`,
});
