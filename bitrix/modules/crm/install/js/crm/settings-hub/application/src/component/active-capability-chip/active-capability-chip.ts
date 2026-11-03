import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

export const CrmSettingsHubActiveCapabilityChip = defineComponent({
	name: 'CrmSettingsHubActiveCapabilityChip',
	components: { BIcon },
	mixins: [locMixin],
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	emits: ['clear'],
	setup(): Object
	{
		return { Outline };
	},
	computed: {
		prefixText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_ACTIVE_PREFIX');
		},
		clearText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_ACTIVE_CLEAR');
		},
	},
	template: `
		<div
			class="crm-settings-hub-application__active"
			data-testid="crm-settings-hub-application-active-capability"
		>
			<span class="crm-settings-hub-application__active-label">{{ prefixText }}</span>
			<span class="crm-settings-hub-application__active-title">{{ title }}</span>
			<button
				type="button"
				class="crm-settings-hub-application__active-clear"
				data-testid="crm-settings-hub-application-active-capability-clear"
				:aria-label="clearText"
				:title="clearText"
				@click="$emit('clear')"
			>
				<BIcon :name="Outline.CROSS_M" class="crm-settings-hub-application__active-clear-icon"/>
			</button>
		</div>
	`,
});
