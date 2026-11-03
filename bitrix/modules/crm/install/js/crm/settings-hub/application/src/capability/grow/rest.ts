import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubAppConfigurationSetting } from '../../setting/rest/app-configuration';
import { CrmSettingsHubRestEnableReqUfCheckSetting } from '../../setting/rest/rest-enable-req-uf-check';

export const CrmSettingsHubRestCapability = defineComponent({
	name: 'CrmSettingsHubRestCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubRestEnableReqUfCheckSetting,
		CrmSettingsHubAppConfigurationSetting,
	},
	props: capabilityPackProps,
	emits: capabilityPackEmits,
	template: `
		<CrmSettingsHubCapabilityPack
			:capability="capability"
			:active-capability-id="activeCapabilityId"
			:selected-section-id="selectedSectionId"
			:query="query"
			@select-capability="$emit('select-capability', $event)"
			@content-sections-change="$emit('content-sections-change', $event)"
			@activate="$emit('activate', $event)"
		>
			<CrmSettingsHubRestEnableReqUfCheckSetting />
			<CrmSettingsHubAppConfigurationSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
