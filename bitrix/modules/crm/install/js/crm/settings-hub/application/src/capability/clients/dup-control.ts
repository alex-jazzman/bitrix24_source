import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubDupCtrlCompanySetting } from '../../setting/clients/dup-ctrl-company';
import { CrmSettingsHubDupCtrlContactSetting } from '../../setting/clients/dup-ctrl-contact';
import { CrmSettingsHubDupCtrlLeadSetting } from '../../setting/clients/dup-ctrl-lead';

export const CrmSettingsHubDupControlCapability = defineComponent({
	name: 'CrmSettingsHubDupControlCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubDupCtrlLeadSetting,
		CrmSettingsHubDupCtrlContactSetting,
		CrmSettingsHubDupCtrlCompanySetting,
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
			<CrmSettingsHubDupCtrlLeadSetting />
			<CrmSettingsHubDupCtrlContactSetting />
			<CrmSettingsHubDupCtrlCompanySetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
