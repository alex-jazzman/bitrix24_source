import { defineComponent } from 'ui.vue3';

import {
	capabilityPackEmits,
	capabilityPackProps,
	CrmSettingsHubCapabilityPack,
} from '../../component/capability-pack/capability-pack';
import { CrmSettingsHubCompanyOpenedFlagSetting } from '../../setting/access/company-opened-flag';
import { CrmSettingsHubContactOpenedFlagSetting } from '../../setting/access/contact-opened-flag';
import { CrmSettingsHubDealOpenedFlagSetting } from '../../setting/access/deal-opened-flag';
import { CrmSettingsHubLeadOpenedFlagSetting } from '../../setting/access/lead-opened-flag';
import { CrmSettingsHubPermissionsSetting } from '../../setting/access/permissions';
import { CrmSettingsHubQuoteOpenedFlagSetting } from '../../setting/access/quote-opened-flag';

export const CrmSettingsHubPermissionsCapability = defineComponent({
	name: 'CrmSettingsHubPermissionsCapability',
	components: {
		CrmSettingsHubCapabilityPack,
		CrmSettingsHubLeadOpenedFlagSetting,
		CrmSettingsHubDealOpenedFlagSetting,
		CrmSettingsHubCompanyOpenedFlagSetting,
		CrmSettingsHubPermissionsSetting,
		CrmSettingsHubContactOpenedFlagSetting,
		CrmSettingsHubQuoteOpenedFlagSetting,
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
			<CrmSettingsHubLeadOpenedFlagSetting />
			<CrmSettingsHubDealOpenedFlagSetting />
			<CrmSettingsHubCompanyOpenedFlagSetting />
			<CrmSettingsHubPermissionsSetting />
			<CrmSettingsHubContactOpenedFlagSetting />
			<CrmSettingsHubQuoteOpenedFlagSetting />
		</CrmSettingsHubCapabilityPack>
	`,
});
