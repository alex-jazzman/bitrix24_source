import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubRestEnableReqUfCheckSetting } from '../../setting/rest/rest-enable-req-uf-check';
import { CrmSettingsHubUserFieldsLink } from '../../setting/sales/user-fields';

export const CrmSettingsHubUserFieldsCapability = defineComponent({
	name: 'CrmSettingsHubUserFieldsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubUserFieldsLink,
		CrmSettingsHubRestEnableReqUfCheckSetting,
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
			<CrmSettingsHubUserFieldsLink />
			<CrmSettingsHubRestEnableReqUfCheckSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
