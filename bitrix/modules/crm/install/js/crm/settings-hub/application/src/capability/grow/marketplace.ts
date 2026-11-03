import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubSmsMarketplaceSetting } from '../../setting/comms/sms-marketplace';
import { CrmSettingsHubPaymentMarketplaceSetting } from '../../setting/docs/payment-marketplace';
import { CrmSettingsHubAppConfigurationSetting } from '../../setting/rest/app-configuration';
import { CrmSettingsHubMarketplaceSetting } from '../../setting/rest/marketplace';

export const CrmSettingsHubMarketplaceCapability = defineComponent({
	name: 'CrmSettingsHubMarketplaceCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubMarketplaceSetting,
		CrmSettingsHubAppConfigurationSetting,
		CrmSettingsHubSmsMarketplaceSetting,
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
			<CrmSettingsHubMarketplaceSetting />
			<CrmSettingsHubAppConfigurationSetting />
			<CrmSettingsHubSmsMarketplaceSetting />
			<CrmSettingsHubPaymentMarketplaceSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
