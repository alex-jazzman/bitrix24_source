import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubDealAutomationLink } from '../../setting/automation/deal-automation';
import { CrmSettingsHubLeadAutomationLink } from '../../setting/automation/lead-automation';
import { CrmSettingsHubOrderAutomationLink } from '../../setting/automation/order-automation';

export const CrmSettingsHubDistributionCapability = defineComponent({
	name: 'CrmSettingsHubDistributionCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubLeadAutomationLink,
		CrmSettingsHubDealAutomationLink,
		CrmSettingsHubOrderAutomationLink,
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
			<CrmSettingsHubLeadAutomationLink />
			<CrmSettingsHubDealAutomationLink />
			<CrmSettingsHubOrderAutomationLink />
		</CrmSettingsHubCapabilityPack>
	`,
});
