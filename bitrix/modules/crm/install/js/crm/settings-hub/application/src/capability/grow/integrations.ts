import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubIntegrationsSetting } from '../../setting/comms/integrations';
import { CrmSettingsHubSmsMarketplaceSetting } from '../../setting/comms/sms-marketplace';
import { CrmSettingsHubExternalSaleLink } from '../../setting/integrations/external-sale';
import { CrmSettingsHubIntegrations1cLink } from '../../setting/integrations/integrations-1c';
import { CrmSettingsHubIntegrationsSmsLink } from '../../setting/integrations/integrations-sms';

export const CrmSettingsHubIntegrationsCapability = defineComponent({
	name: 'CrmSettingsHubIntegrationsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubIntegrations1cLink,
		CrmSettingsHubExternalSaleLink,
		CrmSettingsHubIntegrationsSmsLink,
		CrmSettingsHubIntegrationsSetting,
		CrmSettingsHubSmsMarketplaceSetting,
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
			<CrmSettingsHubIntegrations1cLink />
			<CrmSettingsHubExternalSaleLink />
			<CrmSettingsHubIntegrationsSmsLink />
			<CrmSettingsHubIntegrationsSetting />
			<CrmSettingsHubSmsMarketplaceSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
