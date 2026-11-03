import { defineComponent } from 'ui.vue3';

export const CrmSettingsHubDependentSetting = defineComponent({
	name: 'CrmSettingsHubDependentSetting',
	props: {
		visible: {
			type: Boolean,
			required: true,
		},
	},
	template: `
		<div class="crm-settings-hub-application__setting-field-divider" :hidden="!visible"></div>
		<div class="crm-settings-hub-application__setting-field-value" :hidden="!visible">
			<div class="crm-settings-hub-application__dependent">
				<slot/>
			</div>
		</div>
	`,
});
