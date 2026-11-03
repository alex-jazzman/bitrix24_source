import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubPaymentMarketplaceSetting } from '../../setting/docs/payment-marketplace';
import { CrmSettingsHubPaymentSystemsLink } from '../../setting/docs/payment-systems';

export const CrmSettingsHubPaymentsCapability = defineComponent({
	name: 'CrmSettingsHubPaymentsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubPaymentSystemsLink,
		CrmSettingsHubPaymentMarketplaceSetting,
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
			<CrmSettingsHubPaymentSystemsLink />
			<CrmSettingsHubPaymentMarketplaceSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
